import { jsPDF, TextOptionsLight } from "jspdf";
import autotable from "jspdf-autotable";
import { promises as fs } from 'fs';
import * as path from 'path';
import { stringify } from "querystring";

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


export interface DocumentConfig {
  versione?: string;
  impostazioniPagina?: PageSettings;
  contenuti: Partial<Content>[];
  /**
   * move table style inside the definition of a table becouse there could be multiple tables with different styles
   */
  tableStyle?: { lineColor?: string; lineWidth?: number; font?: string; fontSize?: number; cellPadding?: number; fillColor?: string; };
}

export interface PageSettings {
  /**
   * the fontDefault is assumed when no other formatting rules is given
   */
  // fontDefault: DocumentFont;
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


export interface DocumentFont {
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



export interface ImageParams {
  path: string; posizione?: [number, number]; dimensioni?: [number, number]; coeffDim?: number;
}

export interface Content {
  // titolo: string;
  // sottotitolo: string;
  testo: string | string[];
  Punti: Elenco[];// Array<{ titolo: string; Sottopunti: Array<{ titolo: string; contenuto: string; }>; }>;
  immagini: ImageParams;
};

export interface Elenco {
  titolo: string;
  Sottopunti: Array<{
    titolo: string;
    contenuto: string[];
  }>;
}

interface FormattedText {
  content: string;
  fontId?: string;
  hAlign?: HAlign;
  vAlign?: VAlign;
  maxWidth?: number;
  riportaCursore?: 'fianco' | 'sotto';
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
  //#region flag Debug
  private debugActive: boolean = true;
  //#endregion
  public _configPath: string;
  public _configObject: DocumentConfig;
  constructor(private inputConfig?: string | DocumentConfig) { }

  public setConfig(config: DocumentConfig) {
    this.config = config.impostazioniPagina;
    this.configLoaded = true;
  }


  //#region setter
  private set yCursor(yPosition: number) {
    // this.debugCursor('#DC143C')
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
    } else {
      throw new Error(`${yPosition} is not a valid position for y coordinate`);
    }
    // this.debugCursor('#96dc14');
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
    } else {
      throw new Error(`${xPosition} is not a valid position for x coordinate`);
    }
  }
  //#endregion

  /**
   * # get the position of the cursor in a new line below the actual.
   */
  get yNewLine() {
    const newY = this.curY + (this.doc.getFontSize() * this.config.interlinea / 72) * 25.4
    if (newY > this.doc.internal.pageSize.getHeight() - this.config.margini.basso) {
      this.doc.addPage();
      this.curY = this.config.margini.alto;
      this.curX = this.config.margini.sx;

      return this.curY;
    } else return newY;
  }
  //#region debug
  private debugCursor(inputColor?: string) {
    const noise = Math.random();
    console.log(`cusor X:(${this.curX.toFixed(4)}), Y:(${this.curY.toFixed(4)}) *** noise: ${noise}`);
    if (this.debugActive) {
      const color = this.doc.getDrawColor();
      if (inputColor) this.doc.setDrawColor(inputColor);
      else this.doc.setDrawColor('green');
      this.doc.line(this.curX - 2 + noise, this.curY + noise * .1, this.curX + 2, this.curY);
      this.doc.line(this.curX + noise, this.curY - 2 + noise * .1, this.curX, this.curY + 2);
      this.doc.setDrawColor(color);

    }
  }

  private debugMargini() {
    if (this.debugActive) {

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
    }
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
  //#region applyTemplate
  private applyTemplate(template: string, dynamicFields?: { [key: string]: string }): string {
    if (!dynamicFields) return template;
    return template.replace(/\$(\w+)\$/g, (match, key) =>
      dynamicFields[key] !== undefined ? dynamicFields[key] : match
    );
  }
  //#endregion

  //#region applyPartiPlaceholders
  private applyPartiPlaceholders(text: string, parti: IPartiContratto): string {
    return text.replace(/\$(fornitore|cliente):(\w+)\$/g, (match, party, field) =>
      (parti[party] && (parti[party] as any)[field]) ? (parti[party] as any)[field] : match
    );
  }
  //#endregion

  //#region loadConfig
  private async loadConfig(): Promise<void> {
    if (this.configLoaded) return;
    if (!this.inputConfig) throw new Error("No configuration provided.");
    try {
      if (typeof (this.inputConfig) === 'string') {
        const data = await fs.readFile(this.inputConfig, 'utf8');
        this.template = JSON.parse(data) as DocumentConfig;
        this.config = this.template.impostazioniPagina;
        this.contenuti = this.template.contenuti;
      } else {
        if (!this.inputConfig.contenuti) throw new Error("Missing or incomplete configurations");
        if ("impostazioniPagina" in this.inputConfig)
          this.config = this.inputConfig.impostazioniPagina as PageSettings;
        this.contenuti = this.inputConfig.contenuti as Content[];
      }
      console.log("Loaded configurations", this.config, this.contenuti);
      this.configLoaded = true;
    } catch (error) {
      throw new Error(`Error reading configuration file: ${error}`);
    }
  }
  //#endregion


  //#region initDoc
  /**
   * # initDoc
   * 
   * initialize the jsPDF object, set the margins and the cursor, installs the fonts
   */
  private async initDoc(): Promise<void> {
    try {
      this.doc = new jsPDF();

      const margins = this.config.margini;
      this.curX = margins.sx ? margins.sx : 10;
      this.curY = margins.alto ? margins.alto : 10;
      const fontList = this.doc.getFontList();
      for (const font of this.config.fonts) {
        // console.log("Font List: ", fontList, " Font selected ", font.nome)
        if (!fontList[font.nome]) {
          if (font.installPath) {
            let styles = font.style.split(',');
            let paths = font.installPath.split(',');
            for (let i = 0; i < styles.length; i++) {
              await this.installFont(paths[i].trim(), font.nome, styles[i].trim());
            }
          }
        }
      }
      // console.log("updated font list ", this.doc.getFontList());

      //////////////////////////////////////////////////////////////////////////
      this.debugMargini();
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  //#region setupText
  private setupText(fontId: string = 'default'): void {
    let font = this.config.fonts.find(font => font.id === fontId);
    if (!font) {
      console.warn(`no font found with the id ${fontId}`);
      font = { nome: 'courier', dimensione: 5, id: 'no configuration', colore: '#000000' };
    }
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
    console.log(`Installing font ${fontName} from ${absolutePath}`);
    const buffer = await fs.readFile(absolutePath);
    const base64Font = buffer.toString('base64');
    console.log(`this.doc.addFileToVFS ${fontName}.ttf`, "base64Font");
    this.doc.addFileToVFS(`${fontName}.ttf`, base64Font);
    this.doc.addFont(`${fontName}.ttf`, fontName, style);
    this.doc.setFont(fontName);
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


  //#region insertImage
  // Inserts images using the current cursor position.
  private async insertImage(imgParam: ImageParams): Promise<{x: number;y: number}> {
    try {
      let startX = this.curX;
      let startY = this.curY;
      this.debugCursor('#FF00FF');
      if (imgParam.posizione) {
        startX += imgParam.posizione[0];
        startY += imgParam.posizione[1];
      }

      const format = imgParam.path.split('.').pop()?.toUpperCase() || 'PNG';
      const base64Image = await loadImageAsBase64(imgParam.path);
      if (startY + imgParam.dimensioni[1] > (this.doc.internal.pageSize.getHeight() - this.config.margini.basso)) {
        this.doc.addPage();
        this.curY = this.config.margini.alto;
        startY = this.curY + imgParam.posizione[1];
      }
      this.doc.addImage(base64Image, format, startX, startY, imgParam.dimensioni[0], imgParam.dimensioni[1]);
      this.curY = startY + imgParam.dimensioni[1] + this.config.staccoriga;
      return {x: this.curX, y: this.curY}
    } catch (error) {
      console.error(error);
    }
  }
  //#endregion

  /**
   * # parseText 
   * trova i tag di formattazine, li rimuove dal testo e ritorna un oggetto con le impostazioni
   * passate nei tag
   * @param text 
   * @returns 
   */
  //#region parseText
  private parseText(text: string, params: DocumentParams): FormattedText {
    const tagRegex = /<\|(.*?)\|>/g;  // Trova i tag <|...|>
    let content = text.replace(tagRegex, "").trim(); // Rimuove i tag e lascia solo il testo principale
    content = this.applyTemplate(content, params.dynamicFields);
    content = this.applyPartiPlaceholders(content, params.parti);
    let formattedText: FormattedText = { content };
    // Trova tutti i tag e processali
    const matched = Array.from(text.matchAll(tagRegex));
    for (const match of matched) {
      const tags = match[1].trim().split(';'); // Esclude i delimitatori <| e |>
      for (const tagContent of tags) {
        if (tagContent.includes(":")) {
          const [key, value] = tagContent.split(":").map(s => s.trim());
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
  private drawBox(
    text: string,
    maxWidth: number,
    option: TextOptionsLight
  ): { x: number, y: number } {
    this.doc.setDrawColor(this.config.box.lineColor);
    this.doc.setLineWidth(this.config.box.lineWidth);
    this.doc.setFillColor(this.config.box.background);
    let [x, y, w, h, r] = [
      this.curX,
      this.curY,
      maxWidth + this.config.box.padding,
      0,
      this.config.box.raggio
    ];
    let section = this.parseBoldSections(text);
    // writeSection
    let endCur = { x: 0, y: 0 };
    for (const s of section) {
      let text = s.text.replace(/\*\*/g, '');
      this.doc.setFont(this.doc.getFont().fontName, s.type);
      endCur = this.writeTextInLine(text, maxWidth, option);
    }
    if (!option.baseline || option.baseline === 'alphabetic') {
      y -= this.doc.getFontSize() * this.config.interlinea / 72 * 25.4;
    } else if (option.baseline === 'middle') {
      y -= (this.doc.getFontSize() * this.config.interlinea / 72 * 25.4) * 0.5;
    }

    x -= this.config.box.padding * .5;
    h = this.config.box.padding + (endCur.y - y);

    this.doc.roundedRect(x, y, w, h, r, r, 'S');
    this.yCursor = this.curY + (this.doc.getFontSize() * this.config.interlinea / 72 * 25.4);
    return endCur;
  }
  //#endregion

  //#region writeTextSection
  private writeTextSection(
    origText: string,
    params: DocumentParams,
    offsetX?: number,
    offsetY?: number
  ): { x: number, y: number } {
    let finalCur = { x: NaN, y: NaN };
    const pageWidth = this.doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - (this.config.margini.sx + this.config.margini.dx);
    let write = this.parseText(origText, params);
    let textToWrite = write.content;
    this.setupText(write.fontId);
    const option: TextOptionsLight = {
      align: write.hAlign ? write.hAlign : null,
      baseline: write.vAlign ? write.vAlign : null
    };
    let boxedText = textToWrite.match(/^\^.*\^$/)
    if (boxedText) {
      // this.debugCursor();
      textToWrite = textToWrite.replace(/\^/g, '');
      finalCur = this.drawBox(textToWrite, maxWidth, option);
      this.curX = this.config.margini.sx;
    } else {
      let section = this.parseBoldSections(textToWrite);
      // writeSection
      for (const s of section) {
        let text = s.text.replace(/\*\*/g, '');
        this.doc.setFont(this.doc.getFont().fontName, s.type);
        // this.debugCursor();
        finalCur = this.writeTextInLine(text, maxWidth, option, offsetX, offsetY);
        // console.log("finalCur ", finalCur);
      }
    }
    this.curX = this.config.margini.sx;
    // this.yCursor = this.curY + this.config.staccoriga;
    return finalCur;
  }
  //#endregion

  //#region writeTextInLine
  private writeTextInLine(
    text: string,
    maxWidth: number,
    option: TextOptionsLight,
    offsetX?: number,
    offsetY?: number
  ): { x: number, y: number } {
    let words = text.split(" ");
    if (offsetX && this.curX < offsetX) this.xCursor = offsetX;
    let spaceWidth = this.doc.getTextWidth(" "); // Larghezza dello spazio
    let lineWidth = this.curX; // Larghezza disponibile corrente

    for (let word of words) {
      let wordWidth = this.doc.getTextWidth(word);
      // Se la parola non entra nella riga, fai il ritorno a capo
      if (lineWidth + wordWidth >= maxWidth) {
        this.curX = this.config.margini.sx; // Reset X
        if (offsetX && this.curX < offsetX) this.xCursor = offsetX;
        this.yCursor = this.yNewLine;// Vai a capo
        lineWidth = this.curX; // Reset della larghezza linea
      }
      // Scrivi la parola
      if (word !== '') {
        this.doc.text(word, this.curX, this.curY, option);
        this.curX += wordWidth + spaceWidth; // Aggiorna X per la parola successiva
        lineWidth += wordWidth + spaceWidth; // Aggiorna la larghezza della riga
      }
    }
    return { x: Number(this.curX), y: Number(this.curY) };
  }
  //#endregion


  //#region generateDocument
  public async generateDocument(params: DocumentParams) {
    await this.loadConfig(); // read the config json file  
    await this.initDoc(); // prepares the doc obj and the cursor

    // Parse contents
    for (const block of this.contenuti) {
      console.log("blocco", block);
      const [blockX, blockY] = [this.curX, this.curY];
      // this.debugCursor('blue');
      let finalCur = { x: NaN, y: NaN };
      for (const key of Object.keys(block)) {
        switch (key) {
          case 'testo':
            let testo = block[key];
            if (Array.isArray(testo)) {
              testo.forEach((riga, i, arr) => {
                let tmpCur = this.writeTextSection(riga, params);
                if (tmpCur.x > finalCur.x || Number.isNaN(finalCur.x))
                  finalCur.x = Number(tmpCur.x);
                if (tmpCur.y > finalCur.y || Number.isNaN(finalCur.y))
                  finalCur.y = Number(tmpCur.y);
                if (i < arr.length - 1) this.yCursor = this.yNewLine;
                // this.debugCursor('#FA8072');
              });
            } else {
              finalCur = this.writeTextSection(testo, params);
            }
            // this.yCursor = this.curY + this.config.staccoriga;
            break;
          case 'Punti':
            const punti = block[key] as Elenco[];

            for (const section of punti) {
              // console.log("Section Title", section.titolo);
              finalCur = this.writeTextSection(section.titolo, params);
              this.curY += this.config.staccoriga;
              let tmpCur = {x: finalCur.x, y: finalCur.y};
              for (const point of section.Sottopunti) {
                console.log("Point title:", point.titolo, " point content: ", point.contenuto);
                // this.curX = this.config.margini.sx + this.config.rientro;
                const offset = this.config.margini.sx + this.config.rientro;
                tmpCur = this.writeTextSection(point.titolo, params, offset);
                this.curY = this.yNewLine;
                point.contenuto?.forEach(line => {
                  const offset = this.config.margini.sx + this.config.rientro * 2;
                  tmpCur = this.writeTextSection(line, params, offset);
                  this.curY = this.yNewLine;
                })
                // this.yCursor = this.curY + this.config.staccoriga;
              }
              if (tmpCur.x > finalCur.x || Number.isNaN(finalCur.x))
                finalCur.x = Number(tmpCur.x);
              if (tmpCur.y > finalCur.y || Number.isNaN(finalCur.y))
                finalCur.y = Number(tmpCur.y);
            }
            break;
          case 'immagine':
            let imgParam = block[key] as ImageParams
            let tmpCur = await this.insertImage(imgParam);
            if (tmpCur.x > finalCur.x || Number.isNaN(finalCur.x))
              finalCur.x = Number(tmpCur.x);
            if (tmpCur.y > finalCur.y || Number.isNaN(finalCur.y))
              finalCur.y = Number(tmpCur.y);
            break;
          case 'tabella':
            // this.doc.table(this.curX, this.curY, {"elemento1": "test1", "elemento 2": "test 2", "Elemento 3", "test 3"}, ["1", "2", "3"], {})
            break;

          default:
            break;
        }
      
        this.curX = finalCur.x;
        this.curY = blockY;
        console.log("elemento terminato")
        this.debugCursor('#007abb')
        //ended element
      }
      //ended block
      this.yCursor = finalCur.y;
      this.yCursor = this.yNewLine + this.config.staccoriga;
      this.curX = this.config.margini.sx;
      console.log("blocco terminato");
      this.debugCursor('#88ff00');

    }
    this.doc.save("test_image0.pdf");
  }
  //#endregion



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