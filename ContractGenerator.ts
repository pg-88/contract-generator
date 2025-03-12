import { jsPDF, TextOptionsLight } from "jspdf";
import autotable from "jspdf-autotable";
import { promises as fs } from 'fs';
import * as path from 'path';

export interface IPartiContratto {
  fornitore: { denominazione: string; codiceFiscale: string; indirizzoCompleto: string; };
  cliente: { denominazione: string; codiceFiscale: string; indirizzoCompleto: string; };
}

export interface DocumentParams {
  parti?: IPartiContratto;
  tipOutput?: 'f' | 'd' | 'u';
  dynamicFields?: { [key: string]: string };
  dynamicElements?: { [placeholder: string]: DynamicElement };
}

export type DynamicElement = {
  type: 'table' | 'text';
  config: {
    head?: string[];
    body: string[][];
    options?: any;
    styles?: any;
  };
};

interface DocumentFont {
  /**
   * internal name used to refer to a particular configuration
   */
  id: string;
  /**
   * name of the font
   */
  nome: string;
  /**
   * size of the font
   */
  dimensione: number;

  colore: string;
  /**
   * path in the system to the installation file of the font
   */
  installPath?: string;
  /**
   * not every font has all the styles
   */
  style?: 'bold' | 'italic' | 'normal' | 'bolditalic'
}

interface PageSettings {
  /**
   * the fontDefault is assumed when no other formatting rules is given
   */
  fontDefault: DocumentFont;
  fonts: DocumentFont[];
  // fontAlternative?: DocumentFont;
  margini: { sx: number; dx: number; alto: number; basso: number; },
  staccoriga: number;
  interlinea: number;
  rientro: number;
  box: { 
    background: string; 
    raggio: number; 
    padding: number;
    lineWidth: number;
    lineColor: string;
  };
}

interface ImageParams {
  path: string; posizione: [number, number]; dimensioni?: [number, number]; coeffDim?: number;
}
interface Content {
  // titolo: string;
  // sottotitolo: string;
  testo: string;
  Punti: Array<{ titolo: string; Sottopunti: Array<{ titolo: string; contenuto: string; }>; }>;
  immagini: ImageParams;
};

interface DocumentConfig {
  versione: string;
  impostazioniPagina: PageSettings;
  contenuti: Partial<Content>[];
  /**
   * move table style inside the definition of a table becouse there could be multiple tables with different styles
   */
  tableStyle?: { lineColor?: string; lineWidth?: number; font?: string; fontSize?: number; cellPadding?: number; fillColor?: string; };
}
interface FormattedText {
  content: string;
  fontId?: string;
  hAlign?: HAlign;
  vAlign?: VAlign;
}

interface SectionsText {
  text: string;
  type: 'bold' | 'normal';
  start: number;
  end: number;
}

type HAlign = "center" | "left" | "right" | "justify";

type VAlign = "top" | "bottom" | "middle";

async function loadImageAsBase64(imagePath: string): Promise<string> {
  const absolutePath = path.resolve(imagePath);
  const buffer = await fs.readFile(absolutePath);
  const ext = path.extname(imagePath).slice(1).toLowerCase();
  const base64 = buffer.toString('base64');
  return `data:image/${ext};base64,${base64}`;
}

export class DocumentGenerator {
  private template!: DocumentConfig;
  private config!: PageSettings;
  private contenuti!: Partial<Content>[];
  private doc!: jsPDF;
  private curX: number = 0;
  private curY: number = 0;
  private configLoaded: boolean = false;

  constructor(private configPath?: string) { }

  public setConfig(config: DocumentConfig) {
    this.config = config.impostazioniPagina;
    this.configLoaded = true;
  }


  //#region setter
  private set yCursor(yPosition: number) {
    const maxY = this.doc.internal.pageSize.getHeight() - this.config.margini.basso;
    if (
      yPosition >= this.config.margini.alto &&
      yPosition <= maxY
    ) {
      this.curY = yPosition;
    } else if (yPosition > maxY) {
      console.log("adding new page ");
      this.doc.addPage();
      this.curY = this.config.margini.alto;
      this.curX = this.config.margini.sx;
    } else throw new Error(`${yPosition} is not a valid position`);
  }

  private set xCursor(xPosition: number) {
    const maxX = this.doc.internal.pageSize.getWidth() - this.config.margini.dx;
    if (
      xPosition >= this.config.margini.sx &&
      xPosition <= maxX
    ) {
      this.curX = xPosition;
    } else if (xPosition > maxX) {
      console.log("new line");
      this.yCursor = this.curY + (this.doc.getFontSize() * this.config.interlinea / 72) * 25.4;
      this.curX = this.config.margini.sx;
    } else throw new Error(`${xPosition} is not a valid position`);
  }
  //#endregion


  /**
   * # applyTemplate
   * 
   * Replaces tag `$content$` with dynamic field that has the same key
   * @param template 
   * @param dynamicFields 
   * @returns 
   */
  private applyTemplate(template: string, dynamicFields?: { [key: string]: string }): string {
    if (!dynamicFields) return template;
    return template.replace(/\$(\w+)\$/g, (match, key) =>
      dynamicFields[key] !== undefined ? dynamicFields[key] : match
    );
  }

  private applyPartiPlaceholders(text: string, parti: IPartiContratto): string {
    return text.replace(/\$(fornitore|cliente):(\w+)\$/g, (match, party, field) =>
      (parti[party] && (parti[party] as any)[field]) ? (parti[party] as any)[field] : match
    );
  }

  private async loadConfig(): Promise<void> {
    if (this.configLoaded) return;
    if (!this.configPath) throw new Error("No configuration provided.");
    try {
      const data = await fs.readFile(this.configPath, 'utf8');
      this.template = JSON.parse(data) as DocumentConfig;
      this.config = this.template.impostazioniPagina;
      this.contenuti = this.template.contenuti;
      this.configLoaded = true;
    } catch (error) {
      throw new Error(`Error reading configuration file: ${error}`);
    }
  }
  //#region initDoc
  /**
   * # initDoc
   * 
   * initialize the jsPDF object, set the margins and the cursor, installs the fonts
   */
  private async initDoc(): Promise<void> {
    try {
      this.doc = new jsPDF();

      const margins = this.template.impostazioniPagina.margini;
      this.curX = margins.sx;
      this.curY = margins.alto;
      const fontList = this.doc.getFontList();
      for (const font of this.config.fonts) {
        // console.log("Font List: ", fontList, " Font selected ", font.nome)
        if (!fontList[font.nome]) {
          console.log("Installing font ", font.nome);
          if (font.installPath) {
            console.log("Path ", font.installPath);
            await this.installFont(font.installPath, font.nome, font.style ? font.style : undefined);
          }
        }
      }
      console.log("updated font list ", this.doc.getFontList());
      /// debug
      console.log("debug: righe margini");
      const color = this.doc.getDrawColor();
      this.doc.setDrawColor("green");
      //hzo alto
      this.doc.line(
        this.config.margini.sx,
        this.config.margini.alto,
        this.doc.internal.pageSize.getWidth() - this.config.margini.dx,
        this.config.margini.alto,
      );
      // vert sx
      this.doc.line(
        this.config.margini.sx,
        this.config.margini.alto,
        this.config.margini.sx,
        this.doc.internal.pageSize.getHeight() - this.config.margini.basso,
      );
      // vert dx
      this.doc.line(
        this.doc.internal.pageSize.getWidth() - this.config.margini.dx,
        this.config.margini.alto,
        this.doc.internal.pageSize.getWidth() - this.config.margini.dx,
        this.doc.internal.pageSize.getHeight() - this.config.margini.basso,
      );
      // hzo basso
      this.doc.line(
        this.config.margini.sx,
        this.doc.internal.pageSize.getHeight() - this.config.margini.basso,
        this.doc.internal.pageSize.getWidth() - this.config.margini.dx,
        this.doc.internal.pageSize.getHeight() - this.config.margini.basso,
      );
      this.doc.setDrawColor(color);
      //////////////////////////////////////////////////////////////////////////
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  //#region setupText
  private setupText(fontId: string = 'default'): void {
    const font = this.config.fonts.find(font => font.id === fontId);
    if (!font) throw new Error(`no font found with the id ${fontId}`);
    // console.log("Il font definito in config", font);
    this.doc.setFont(font.nome, font.style ? font.style : undefined);
    this.doc.setFontSize(font.dimensione);
    this.doc.setTextColor(font.colore ? font.colore : undefined);
  }

  private extractPlaceholder(text: string): string | null {
    const match = text.match(/^\$(\w+)\$$/);
    return match ? match[1] : null;
  }

  private async installFont(fontPath: string, fontName: string, style: string = 'normal'): Promise<void> {
    const absolutePath = path.resolve(fontPath);
    const buffer = await fs.readFile(absolutePath);
    const base64Font = buffer.toString('base64');
    // console.log(`Installing font ${fontName} from ${absolutePath}`);
    this.doc.addFileToVFS(`${fontName}.ttf`, base64Font);
    this.doc.addFont(`${fontName}.ttf`, fontName, style);
    // this.doc.addFont(`${fontName}.ttf`, fontName, 'bold');
    // this.doc.addFont(`${fontName}.ttf`, fontName, 'italic');
    this.doc.setFont(fontName);
  }


  // // Writes wrapped text, handling inline bold segments.
  // private async writeWrappedTextCore(
  // 	font: DocumentFont,
  // 	fontSize: number,
  // 	color: string,
  // 	text: string,
  // 	x: number,
  // 	y: number,
  // 	maxWidth: number,
  // 	lineSpacingFactor: number = 1.15
  // ): Promise<number> {
  // 	this.doc.setFont(font.nome);
  // 	this.doc.setFontSize(fontSize);
  // 	this.doc.setTextColor(color);
  // 	const lines = this.doc.splitTextToSize(text, maxWidth);
  // 	const lineHeight = (fontSize * lineSpacingFactor / 72) * 25.4;
  // 	for (const line of lines) {
  // 		if (y + lineHeight > (this.doc.internal.pageSize.getHeight() - this.config.margini.basso)) {
  // 			this.doc.addPage();
  // 			y = this.config.margini.alto;
  // 		}
  // 		// If the line contains inline bold markers, process them.
  // 		if (line.includes("**")) {
  // 			y = await this.writeLineWithInlineBold(line, x, y, font, fontSize, color, maxWidth, lineSpacingFactor);
  // 		} else {
  // 			this.doc.text(line, x, y);
  // 			y += lineHeight;
  // 		}
  // 	}
  // 	return y;
  // }

  // Writes a single line with inline bold processing.
  // private async writeLineWithInlineBold(
  // 	line: string,
  // 	x: number,
  // 	y: number,
  // 	normalFont: DocumentFont,
  // 	fontSize: number,
  // 	color: string,
  // 	maxWidth: number,
  // 	lineSpacingFactor: number = 1.15
  // ): Promise<number> {
  // 	let currentX = x;
  // 	// Split the line by bold segments. The regex splits by bold markers.
  // 	const segments = line.split(/(\*\*.*?\*\*)/g);
  // 	const lineHeight = (fontSize * lineSpacingFactor / 72) * 25.4;

  // 	for (const seg of segments) {
  // 		// Skip empty segments
  // 		if (!seg) continue;

  // 		let segText = seg;
  // 		let useBold = false;

  // 		// Check if this segment is bold (wrapped in **)
  // 		if (seg.startsWith("**") && seg.endsWith("**")) {
  // 			useBold = true;
  // 			segText = seg.substring(2, seg.length - 2);
  // 		}

  // 		// Set the appropriate font
  // 		if (useBold && normalFont.boldFont) {
  // 			this.doc.setFont(normalFont.boldFont.nome, 'bold');
  // 		} else {
  // 			this.doc.setFont(normalFont.nome);
  // 		}

  // 		this.doc.setFontSize(fontSize);
  // 		this.doc.setTextColor(color);

  // 		// Skip rendering if segment is empty after processing
  // 		if (!segText.trim()) continue;

  // 		const segWidth = this.doc.getTextWidth(segText);

  // 		// Check if we need to wrap to the next line
  // 		if (currentX + segWidth > x + maxWidth) {
  // 			y += lineHeight;
  // 			currentX = x;
  // 		}

  // 		// Write segment
  // 		this.doc.text(segText, currentX, y);
  // 		currentX += segWidth;
  // 	}

  // 	return y + lineHeight;
  // }

  // private async writeWrappedTextWithFont(
  // 	fontConf: DocumentFont,
  // 	text: string,
  // 	x: number,
  // 	y: number,
  // 	maxWidth: number,
  // 	lineSpacingFactor: number = 1.15
  // ): Promise<void> {
  // 	const fontList = this.doc.getFontList();
  // 	if (!fontList[fontConf.nome]) {
  // 		if (fontConf.installPath) await this.installFont(fontConf.installPath, fontConf.nome);
  // 		else throw new Error("Font not present and no installPath provided");
  // 	} else {
  // 		this.doc.setFont(fontConf.nome);
  // 	}
  // 	this.curY = await this.writeWrappedTextCore(fontConf, fontConf.dimensione, fontConf.colore, text, x, y, maxWidth, lineSpacingFactor);
  // }


  // public async writeBoxedText(
  // 	text: string,
  // 	fontConf: DocumentFont,
  // 	padding: number = 5,
  // 	borderRadius: number = 5,
  // 	borderWidth: number = 1,
  // 	boxColor?: string
  // ): Promise<void> {
  // 	const fontList = this.doc.getFontList();
  // 	if (!fontList[fontConf.nome]) {
  // 		if (fontConf.installPath) await this.installFont(fontConf.installPath, fontConf.nome);
  // 		else throw new Error("Font not present and no installPath provided");
  // 	} else {
  // 		this.doc.setFont(fontConf.nome);
  // 	}
  // 	this.doc.setFontSize(fontConf.dimensione);
  // 	this.doc.setTextColor(fontConf.colore);
  // 	const pageWidth = this.doc.internal.pageSize.getWidth();
  // 	const maxTextWidth = pageWidth - this.config.margini.sx - this.config.margini.dx - 2 * padding;
  // 	const lines = this.doc.splitTextToSize(text, maxTextWidth);
  // 	const lineHeight = (fontConf.dimensione * 1.15 / 72) * 25.4;
  // 	const textHeight = lines.length * lineHeight;
  // 	const boxX = this.curX;
  // 	const boxY = this.curY;
  // 	const boxWidth = maxTextWidth + 2 * padding;
  // 	const boxHeight = textHeight + 2 * padding;
  // 	if (boxColor) {
  // 		this.doc.setFillColor(boxColor);
  // 		this.doc.roundedRect(boxX, boxY, boxWidth, boxHeight, borderRadius, borderRadius, "F");
  // 	}
  // 	this.doc.setLineWidth(borderWidth);
  // 	this.doc.roundedRect(boxX, boxY, boxWidth, boxHeight, borderRadius, borderRadius);
  // 	const textX = boxX + padding;
  // 	let textY = boxY + padding + lineHeight;
  // 	for (const line of lines) {
  // 		if (line.includes("**")) {
  // 			textY = await this.writeLineWithInlineBold(line, textX, textY, fontConf, fontConf.dimensione, fontConf.colore, maxTextWidth, 1.15);
  // 		} else {
  // 			this.doc.text(line, textX, textY);
  // 			textY += lineHeight;
  // 		}
  // 	}
  // 	this.curY = boxY + boxHeight + this.config.staccoriga;
  // }


  // Checks if text is wrapped in '^' markers for boxed text.
  private isBoxedText(text: string): boolean {
    return text.startsWith('^') && text.endsWith('^');
  }

  // Removes '^' markers.
  private stripBoxMarkers(text: string): string {
    return text.substring(1, text.length - 1);
  }

  // Checks if text is entirely wrapped in '**' markers (not inline).
  // (This function is kept for backward compatibility.)
  private isBoldText(text: string): boolean {
    return text.startsWith('**') && text.endsWith('**');
  }

  // Removes '**' markers.
  private stripBoldMarkers(text: string): string {
    return text.substring(2, text.length - 2);
  }

  // // Inserts images using the current cursor position.
  // private async insertLogo(): Promise<void> {
  // 	if (this.config.immagini && this.config.immagini.length > 0) {
  // 		const startX = this.curX;
  // 		for (const imgConf of this.config.immagini) {
  // 			const format = imgConf.path.split('.').pop()?.toUpperCase() || 'PNG';
  // 			const base64Image = await loadImageAsBase64(imgConf.path);
  // 			const startY = this.curY;
  // 			if (startY + imgConf.dimensioni[1] > (this.doc.internal.pageSize.getHeight() - this.config.margini.basso)) {
  // 				this.doc.addPage();
  // 				this.curY = this.config.margini.alto;
  // 			}
  // 			this.doc.addImage(base64Image, format, startX, this.curY, imgConf.dimensioni[0], imgConf.dimensioni[1]);
  // 			console.log(`Image inserted at X: ${startX}, Y: ${this.curY}`);
  // 			this.curY = this.curY + imgConf.dimensioni[1] + this.config.staccoriga;
  // 		}
  // 	}
  // }



  // Inserts images using the current cursor position.
  private async insertImage(imgParam: ImageParams): Promise<void> {
    const startX = this.curX;

    const format = imgParam.path.split('.').pop()?.toUpperCase() || 'PNG';
    const base64Image = await loadImageAsBase64(imgParam.path);
    const startY = this.curY;
    if (startY + imgParam.dimensioni[1] > (this.doc.internal.pageSize.getHeight() - this.config.margini.basso)) {
      this.doc.addPage();
      this.curY = this.config.margini.alto;
    }
    this.doc.addImage(base64Image, format, startX, this.curY, imgParam.dimensioni[0], imgParam.dimensioni[1]);
    console.log(`Image inserted at X: ${startX}, Y: ${this.curY}`);
    this.curY = this.curY + imgParam.dimensioni[1] + this.config.staccoriga;
  }

  /**
   * # parseText 
   * trova i tag di formattazine, li rimuove dal testo e ritorna un oggetto con le impostazioni
   * passate nei tag
   * @param text 
   * @returns 
   */
  //#region parseText
  private parseText(text: string): FormattedText {
    const tagRegex = /<\|(.*?)\|>/g;  // Trova i tag <|...|>
    let content = text.replace(tagRegex, "").trim(); // Rimuove i tag e lascia solo il testo principale

    let formattedText: FormattedText = { content };
    // Trova tutti i tag e processali
    const matched = Array.from(text.matchAll(tagRegex));
    for (const match of matched) {
      const tags = match[1].trim().split(';'); // Esclude i delimitatori <| e |>
      for (const tagContent of tags) {
        if (tagContent.includes(":")) {
          const [key, value] = tagContent.split(":").map(s => s.trim());

          // Mappa i valori nell'oggetto in base alla chiave trovata
          // console.log("tag formattazione ", key, value);
          switch (key) {
            case "fontId":
              formattedText.fontId = value;
              break;
            case "hAlign":
              formattedText.hAlign = value as HAlign;
              break;
            case "vAlign":
              formattedText.vAlign = value as VAlign;
              break;
          }
        }
      }
    }
    return formattedText;
  }




  //#region parseSections
  private parseBoldSections(content: string): SectionsText[] {
    let sections: SectionsText[] = []
    let index = 0;
    let matches = Array.from(content.matchAll(/\*\*(.*?)\*\*/g));
    if (matches.length === 0) {
      sections.push({
        text: content,
        type: 'normal',
        start: 0,
        end: content.length
      });
    } else {
      while (index < content.length) {
        for (const match of matches) {
          if (index !== match['index']) {
            sections.push({
              text: content.substring(index, match['index']),
              type: 'normal',
              start: index,
              end: match['index']
            });
          }
          sections.push({
            text: content.substring(match['index'], match['index'] + match[0].length + 1),
            type: 'bold',
            start: match['index'],
            end: match['index'] + match[0].length
          });
          index = match['index'] + match[0].length;
        }
        sections.push({
          text: content.substring(index, content.length),
          type: 'normal',
          start: index,
          end: content.length - 1
        });
        index = content.length;
      }
    }
    return sections;
  }
  //#endregion

  //#region drawBox
  private drawBox(text: string, maxWidth: number, option: TextOptionsLight) {
    console.log("################ BBBBOOOOXXXXX ", text, "\ntext option: ", option);
    this.doc.setDrawColor(this.config.box.lineColor);
    this.doc.setLineWidth(this.config.box.lineWidth);
    this.doc.setFillColor(this.config.box.background);
    let tArr = this.doc.splitTextToSize(text, maxWidth);
    let [x, y, w, h, r] = [
      this.curX,
      this.curY,
      maxWidth, 
      tArr.length * (this.doc.getFontSize() * this.config.interlinea / 72) * 25.4, 
      this.config.box.raggio
    ];

    x -= this.config.box.padding * .5;
    w += this.config.box.padding;
    h += this.config.box.padding;

    if (!option.baseline || option.baseline === 'alphabetic') {
      y -= this.doc.getFontSize() * this.config.interlinea / 72 * 25.4;
    } else if (option.baseline === 'middle') {
      y -= (this.doc.getFontSize() * this.config.interlinea / 72 * 25.4) * 0.5;
    }
    this.doc.roundedRect(x, y, w, h, r, r, /*'F'*/);
  }
  //#endregion

  //#region generateDocument
  public async generateDocument(params: DocumentParams) {
    await this.loadConfig(); // read the config json file  
    await this.initDoc(); // prepares the doc obj and the cursor
    const dynamicFields = params.dynamicFields || {};
    const dynamicElements = params.dynamicElements || {};
    const pageWidth = this.doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - (this.config.margini.sx + this.config.margini.dx);

    // Parse contents
    for (const c of this.contenuti) {
      for (const key of Object.keys(c)) {
        switch (key) {
          case 'testo':
            let write = this.parseText(c[key]);
            let textToWrite = this.applyTemplate(write.content, dynamicFields);
            textToWrite = this.applyPartiPlaceholders(textToWrite, params.parti);

            this.setupText(write.fontId);
            const option: TextOptionsLight = {
              align: write.hAlign ? write.hAlign : null,
              // baseline: 'middle'
              // baseline: write.vAlign ? write.vAlign : null
            };
            let boxedText = textToWrite.match(/^\^.*\^$/)
            if (boxedText) {
              this.drawBox(boxedText['input'], maxWidth, option);
              textToWrite = textToWrite.replace(/\^/g, '');
            }
            let section = this.parseBoldSections(textToWrite);
            // writeSection
            for (const s of section) {
              let text = s.text.replace(/\*\*/g, '');
              this.doc.setFont(this.doc.getFont().fontName, s.type);
              this.writeTextInLine(text, maxWidth, option);
            }
            // this.yCursor = this.curY + (this.doc.getFontSize() * this.config.interlinea / 72) * 25.4;
            this.xCursor = this.config.margini.sx;
            this.yCursor = this.curY + this.config.staccoriga;

            break;
          case 'Punti':

            break;
          case 'immagini':

            break;
          case 'tabella':

            break;

          default:
            break;
        }
      }
    }
    this.doc.save("test.pdf");
  }
  //#endregion

  //#region writeTextInLine
  private writeTextInLine(text: string, maxWidth: number, option: TextOptionsLight) {
    let words = text.split(" ");
    let spaceWidth = this.doc.getTextWidth(" "); // Larghezza dello spazio
    let lineWidth = 0; // Larghezza della linea corrente

    for (let word of words) {
      let wordWidth = this.doc.getTextWidth(word);

      // Se la parola non entra nella riga, fai il ritorno a capo
      if (lineWidth + wordWidth >= maxWidth) {
        this.curX = this.config.margini.sx; // Reset X
        this.yCursor = this.curY + (this.doc.getFontSize() * this.config.interlinea / 72) * 25.4;// Vai a capo
        lineWidth = 0; // Reset della larghezza linea
      }

      // Scrivi la parola
      if (word !== '') {
        this.doc.text(word, this.curX, this.curY, option);
        this.xCursor = this.curX + wordWidth + spaceWidth; // Aggiorna X per la parola successiva
        lineWidth += wordWidth + spaceWidth; // Aggiorna la larghezza della riga
      }
    }
  }
  //#endregion

  //#region writeBold
  private writeBold(text: string, option?: TextOptionsLight) {
    try {
      const actFont = this.doc.getFont();
      console.log(`writing bold text: ${text} font: ${actFont.fontName}`);
      this.doc.setFont(actFont.fontName, 'bold');
      this.doc.text(text, this.curX, this.curY, option);
      // re-set original font
      this.doc.setFont(actFont.fontName, actFont.fontStyle);
    } catch (error) {
      throw new Error(`Error writing text bold: ${error}`);
    }
  }
  //#endregion

  //#region writeNormal
  private writeNormal(text: string, option?: TextOptionsLight) {
    try {
      const actFont = this.doc.getFont();
      console.log(`writing normal text ${text}, font: ${actFont.fontName}`);
      text = text.replace(/\*\*|\^/g, '');
      this.doc.text(text, this.curX, this.curY, option);
    } catch (error) {
      throw new Error(`Error writing text normal: ${error}`);
    }
  }
  //#endregion

  //#region writeBoxedText
  public async writeBoxedText(
    text: string[],
    padding: number = 5,
    borderRadius: number = 5,
    borderWidth: number = 1,
    boxColor?: string
  ): Promise<void> {
    // const boxX = this.curX;
    // const boxY = this.curY;
    // const maxLength = Math.max(...text.map(t => t.length));
    // const boxWidth = this.doc.getTextWidth(text.find(el => el.length === maxLength)) + padding;
    // const boxHeight = textHeight + 2 * padding;
    // if (boxColor) {
    // 	this.doc.setFillColor(boxColor);
    // 	this.doc.roundedRect(boxX, boxY, boxWidth, boxHeight, borderRadius, borderRadius, "F");
    // }
    // this.doc.setLineWidth(borderWidth);
    // this.doc.roundedRect(boxX, boxY, boxWidth, boxHeight, borderRadius, borderRadius);
    // const textX = boxX + padding;
    // let textY = boxY + padding + lineHeight;
    // for (const line of lines) {
    // 	if (line.includes("**")) {
    // 		textY = await this.writeLineWithInlineBold(line, textX, textY, fontConf, fontConf.dimensione, fontConf.colore, maxTextWidth, 1.15);
    // 	} else {
    // 		this.doc.text(line, textX, textY);
    // 		textY += lineHeight;
    // 	}
    // }
    // this.curY = boxY + boxHeight + this.config.staccoriga;
  }

  //#region LEGACYgenerateDocument
  /**
   * # generateDocument
   * Generates the PDF document by processing images, dynamic fields, tables, and text.
   * Supports inline bold formatting and boxed text.
   * @param params 
   * @returns 
   */
  // public async LEGACYgenerateDocument(params: DocumentParams): Promise<string | ArrayBuffer> {
  // 	await this.loadConfig(); // read the config json file  
  // 	this.initDoc(); // prepares the doc obj and the cursor
  // 	//await this.insertLogo(); // insert the images

  // 	const dynamicFields = params.dynamicFields || {};

  // 	const dynamicElements = params.dynamicElements || {};

  // 	const pageWidth = this.doc.internal.pageSize.getWidth();

  // 	const maxWidth = pageWidth - (this.config.margini.sx + this.config.margini.dx);

  // let titolo = this.applyTemplate(this.config.testi.titolo, dynamicFields);
  // 	titolo = this.applyPartiPlaceholders(titolo, params.parti);
  // 	await this.writeWrappedTextWithFont(this.config.fontTitolo, titolo, this.curX, this.curY, maxWidth);
  // 	this.curY += this.config.staccoriga;
  // 	let premessa = this.applyTemplate(this.config.testi.premessa, dynamicFields);
  // 	premessa = this.applyPartiPlaceholders(premessa, params.parti);
  // 	await this.writeWrappedTextWithFont(this.config.fontTesto, premessa, this.curX, this.curY, maxWidth);
  // 	this.curY += this.config.staccoriga;
  // 	for (const punto of this.config.testi.Punti) {
  // 		let puntoTitolo = this.applyTemplate(punto.titolo, dynamicFields);
  // 		puntoTitolo = this.applyPartiPlaceholders(puntoTitolo, params.parti);
  // 		await this.writeWrappedTextWithFont(this.config.fontTitolo, puntoTitolo, this.curX, this.curY, maxWidth);
  // 		this.curY += this.config.staccoriga;
  // 		for (const sub of punto.Sottopunti) {
  // 			const placeholder = this.extractPlaceholder(sub.titolo);
  // 			if (placeholder && dynamicElements[placeholder] && dynamicElements[placeholder].type === 'table' && dynamicElements[placeholder].config) {
  // 				const tableConfig = dynamicElements[placeholder].config!;
  // 				const defaultTableOptions = this.config.tableStyle || {};
  // 				autotable(this.doc, {
  // 					startY: this.curY,
  // 					head: [tableConfig.head],
  // 					body: tableConfig.body,
  // 					...defaultTableOptions,
  // 					...tableConfig.options,
  // 					...tableConfig.styles
  // 				});
  // 				this.curY = (this.doc as any).lastAutoTable.finalY + this.config.staccoriga;
  // 			} else {
  // 				if (sub.titolo) {
  // 					let titleText = this.applyTemplate(sub.titolo, dynamicFields);
  // 					titleText = this.applyPartiPlaceholders(titleText, params.parti);
  // 					if (this.isBoxedText(titleText)) {
  // 						const boxText = this.stripBoxMarkers(titleText);
  // 						await this.writeBoxedText(boxText, this.config.fontSottotitolo);
  // 					} else if (this.isBoldText(titleText)) {
  // 						const boldText = this.stripBoldMarkers(titleText);

  // 						await this.writeWrappedTextWithFont(this.config.fontSottotitolo,
  // 							boldText, this.curX + this.config.rientro, this.curY, maxWidth - this.config.rientro);
  // 					} else {
  // 						await this.writeWrappedTextWithFont(this.config.fontSottotitolo, titleText, this.curX + this.config.rientro, this.curY, maxWidth - this.config.rientro);
  // 					}
  // 					this.curY += this.config.staccoriga;
  // 				}
  // 			}
  // 			const contentPlaceholder = this.extractPlaceholder(sub.contenuto);
  // 			if (contentPlaceholder && dynamicElements[contentPlaceholder] && dynamicElements[contentPlaceholder].type === 'table' && dynamicElements[contentPlaceholder].config) {
  // 				const tableConfig = dynamicElements[contentPlaceholder].config!;
  // 				const defaultTableOptions = this.config.tableStyle || {};
  // 				autotable(this.doc, {
  // 					startY: this.curY,
  // 					head: [tableConfig.head],
  // 					body: tableConfig.body,
  // 					...defaultTableOptions,
  // 					...tableConfig.options,
  // 					...tableConfig.styles
  // 				});
  // 				this.curY = (this.doc as any).lastAutoTable.finalY + this.config.staccoriga;
  // 			} else if (sub.contenuto) {
  // 				let contenuto = this.applyTemplate(sub.contenuto, dynamicFields);
  // 				contenuto = this.applyPartiPlaceholders(contenuto, params.parti);
  // 				if (this.isBoxedText(contenuto)) {
  // 					const boxText = this.stripBoxMarkers(contenuto);
  // 					await this.writeBoxedText(boxText, this.config.fontTesto);
  // 				} else if (this.isBoldText(contenuto)) {
  // 					const boldText = this.stripBoldMarkers(contenuto);
  // 					await this.writeWrappedTextWithFont(this.config.fontTesto,
  // 						boldText, this.curX + this.config.rientro, this.curY, maxWidth - this.config.rientro);
  // 				} else {
  // 					await this.writeWrappedTextWithFont(this.config.fontTesto, contenuto, this.curX + this.config.rientro, this.curY, maxWidth - this.config.rientro);
  // 				}
  // 				this.curY += this.config.staccoriga;
  // 			}
  // 		}
  // 		this.curY += this.config.staccoriga;
  // 	}
  // 	const tipOutput = params.tipOutput || 'd';
  // 	const fileName = `Documento_${params.parti.cliente.denominazione}.pdf`;
  // 	if (tipOutput === 'd') {
  // 		const pdfBuffer = this.doc.output('arraybuffer');
  // 		await fs.writeFile(fileName, Buffer.from(pdfBuffer));
  // 		return fileName;
  // 	} else if (tipOutput === 'u') {
  // 		return this.doc.output('arraybuffer');
  // 	} else {
  // 		return this.doc.output('arraybuffer');
  // 	}
  // }
  //#endregion
}