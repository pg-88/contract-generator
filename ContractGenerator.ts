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
  Punti: Elenco[];
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
  private debugCursor(inputColor?: string, label?: string) {
    const noise = Math.random();
    console.log(`cusor X:(${this.curX.toFixed(4)}), Y:(${this.curY.toFixed(4)}) *** noise: ${noise}`);
    if (this.debugActive) {
      const color = this.doc.getDrawColor();
      const txtColor = this.doc.getTextColor();
      if (inputColor) {
        this.doc.setTextColor(inputColor);
        this.doc.setDrawColor(inputColor);
      }
      else this.doc.setDrawColor('green');
      this.doc.line(this.curX - 2 + noise, this.curY + noise * .1, this.curX + 2, this.curY);
      this.doc.line(this.curX + noise, this.curY - 2 + noise * .1, this.curX, this.curY + 2);
      const txtSize = this.doc.getFontSize();
      this.doc.setFontSize(5);
      if (label) this.doc.text(label, this.curX, this.curY);
      this.doc.setDrawColor(color);
      this.doc.setTextColor(txtColor);
      this.doc.setFontSize(txtSize);
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

  //#region installFont
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
  //#endregion

  //#region insertImage
  // Inserts images using the current cursor position.
  private async insertImage(imgParam: ImageParams): Promise<{ x: number; y: number }> {
    try {
      let startX = this.curX;
      let startY = this.curY;
      // this.debugCursor('#FF00FF', 'imageStart');
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
      this.yCursor = startY + imgParam.dimensioni[1];
      this.xCursor = this.curX + imgParam.dimensioni[0];
      //this.xCursor = this.curX + startX + imgParam.dimensioni[0];
      // this.debugCursor('#2fff00', 'imageEnd');
      return { x: this.curX, y: this.curY }
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
    let txtCur = { x: this.curX, y: this.curY };
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
    this.doc.setDrawColor(this.config.box.lineColor);
    this.doc.setLineWidth(this.config.box.lineWidth);
    this.doc.setFillColor(this.config.box.background);
    this.doc.roundedRect(x, y, w, h, r, r, 'FD');

    this.xCursor = txtCur.x;
    this.yCursor = txtCur.y;
    for (const s of section) {
      let text = s.text.replace(/\*\*/g, '');
      this.doc.setFont(this.doc.getFont().fontName, s.type);
      endCur = this.writeTextInLine(text, maxWidth, option);
    }
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
    const maxWidth = this.doc.internal.pageSize.getWidth()
      - this.config.margini.dx
      - (offsetX ? offsetX : this.curX);
    let write = this.parseText(origText, params);
    let textToWrite = write.content;
    this.setupText(write.fontId);
    const option: TextOptionsLight = {
      align: write.hAlign ? write.hAlign : null,
      baseline: write.vAlign ? write.vAlign : null
    };
    let boxedText = textToWrite.match(/^\^.*\^$/);
    if (boxedText) {
      textToWrite = textToWrite.replace(/\^/g, '');
      finalCur = this.drawBox(textToWrite, maxWidth, option);
      this.curX = /*this.config.margini.sx +*/ offsetX;
    } else {
      let section = this.parseBoldSections(textToWrite);
      // writeSection
      for (const s of section) {
        let text = s.text.replace(/\*\*/g, '');
        this.doc.setFont(this.doc.getFont().fontName, s.type);
        // this.xCursor = startCur.x;
        finalCur = this.writeTextInLine(text, maxWidth, option, offsetX, offsetY);
        // this.debugCursor('#aa00aa', "finalCur");
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
    if (offsetX && this.curX < offsetX) {
      this.xCursor = offsetX;
    }
    let spaceWidth = this.doc.getTextWidth(" ");
    let lineWidth = 0;
    const netWidth = this.doc.internal.pageSize.getWidth() - this.config.margini.dx;

    for (let word of words) {
      let wordWidth = this.doc.getTextWidth(word);
      if (lineWidth + wordWidth >= maxWidth || this.curX + wordWidth >= netWidth) {
        // this.debugCursor("pink", `lineWidth: ${(lineWidth + wordWidth).toFixed(3)}; maxWidth: ${maxWidth.toFixed(3)}`);
        // re-set x-cursor
        this.curX = this.config.margini.sx;
        if (offsetX && this.curX < offsetX) {
          this.xCursor = offsetX;
        }
        this.yCursor = this.yNewLine;
        lineWidth = 0;
        // this.debugCursor("#fff71a", "newLine");
      }

      if (word !== '') {
        this.doc.text(word, this.curX, this.curY, option);
        this.curX += wordWidth + spaceWidth;
        lineWidth += wordWidth + spaceWidth;
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
      // console.log("blocco", block);
      let finalCur = { x: NaN, y: NaN };
      for (const key of Object.keys(block)) {
        const [blockX, blockY] = [this.curX, this.curY];
        switch (key) {
          //#region 'testo'
          case 'testo':
            // this.debugCursor('blue', "BLOCK TESTO");
            let testo = block[key];
            if (Array.isArray(testo)) {
              testo.forEach((riga, i, arr) => {
                let tmpCur = this.writeTextSection(riga, params, blockX);
                if (tmpCur.x > finalCur.x || Number.isNaN(finalCur.x))
                  finalCur.x = Number(tmpCur.x);
                if (tmpCur.y > finalCur.y || Number.isNaN(finalCur.y))
                  finalCur.y = Number(tmpCur.y);
                if (i < arr.length - 1) this.yCursor = this.yNewLine;
                // this.debugCursor('#FA8072');
              });
            } else {
              finalCur = this.writeTextSection(testo, params, blockX);
            }
            // this.yCursor = this.curY + this.config.staccoriga;
            break;
          //#region 'testoBox'
          case 'testoBox':
            let testoBox = block[key];
            if (Array.isArray(testoBox)) {
              let tmpCur = {
                x: NaN,
                y: NaN
              }
              testoBox.forEach((riga: string, i: number, arr) => {
                tmpCur = this.writeTextSection(riga, params, blockX);
                if (tmpCur.x > finalCur.x || Number.isNaN(finalCur.x))
                  finalCur.x = Number(tmpCur.x);
                if (tmpCur.y > finalCur.y || Number.isNaN(finalCur.y))
                  finalCur.y = Number(tmpCur.y);
                if (i < arr.length - 1) this.yCursor = this.yNewLine;
                // this.debugCursor('#FA8072');
              });
              const [x, y, w, h] = [
                blockX - this.config.box.padding * 0.5,
                blockY - (this.doc.getFontSize() * this.config.interlinea / 72) * 25.4 - (this.config.box.padding * 0.5),
                finalCur.x - blockX + this.config.box.padding,
                finalCur.y - blockY + this.config.box.padding + (this.doc.getFontSize() * this.config.interlinea / 72) * 25.4,
                this.config.box.raggio,
                this.config.box.raggio
              ];
              
              this.doc.setDrawColor(this.config.box.lineColor);
              this.doc.setLineWidth(this.config.box.lineWidth);
              this.doc.setFillColor(this.config.box.background);
              this.doc.roundedRect(
                x,
                y,
                w,
                h,
                this.config.box.raggio,
                this.config.box.raggio,
                "FD"
              );
              this.curX = blockX;
              this.curY = blockY;
               testoBox.forEach((riga: string, i: number, arr) => {
                tmpCur = this.writeTextSection(riga, params, blockX);
                if (tmpCur.x > finalCur.x || Number.isNaN(finalCur.x))
                  finalCur.x = Number(tmpCur.x);
                if (tmpCur.y > finalCur.y || Number.isNaN(finalCur.y))
                  finalCur.y = Number(tmpCur.y);
                if (i < arr.length - 1) this.yCursor = this.yNewLine;
                // this.debugCursor('#FA8072');
              });


            } else {
              console.warn("testoBox value must be an array of strings");
            }
            // this.yCursor = this.curY + this.config.staccoriga;
            break;
          //#region 'Punti'
          case 'Punti':
            const punti = block[key] as Elenco[];

            for (const section of punti) {
              // console.log("Section Title", section.titolo);
              finalCur = this.writeTextSection(section.titolo, params);
              this.curY += this.config.staccoriga;
              let tmpCur = { x: finalCur.x, y: finalCur.y };
              for (const point of section.Sottopunti) {
                // console.log("Point title:", point.titolo, " point content: ", point.contenuto);
                // this.curX = this.config.margini.sx + this.config.rientro;
                const offset = this.config.margini.sx + this.config.rientro;
                tmpCur = this.writeTextSection(point.titolo, params, offset);
                this.curY = this.yNewLine;
                point.contenuto?.forEach(line => {
                  const offset = this.config.margini.sx + this.config.rientro * 2;
                  tmpCur = this.writeTextSection(line, params, offset);
                  this.curY = this.yNewLine;
                })
                this.yCursor = this.curY + this.config.staccoriga;
              }
              if (tmpCur.x > finalCur.x || Number.isNaN(finalCur.x))
                finalCur.x = Number(tmpCur.x);
              if (tmpCur.y > finalCur.y || Number.isNaN(finalCur.y))
                finalCur.y = Number(tmpCur.y);
            }
            break;
          //#region 'immagine'
          case 'immagine':
            let imgParam = block[key] as ImageParams
            let tmpCur = await this.insertImage(imgParam);
            if (tmpCur.x > finalCur.x || Number.isNaN(finalCur.x))
              finalCur.x = Number(tmpCur.x);
            if (tmpCur.y > finalCur.y || Number.isNaN(finalCur.y))
              finalCur.y = Number(tmpCur.y);
            break;
          //#region 'tabella'
          case 'tabella':
            const tabData = block[key];
            autotable(this.doc, {
              startY: this.curY,
              body: [['hello ', 'world', "!"]]
            })
            break;
          //#region 'saltoRiga'
          case 'saltoRiga':
            console.log(`jump ${block[key]} rows`);
            const rowsNumber = Number(block[key]);
            finalCur.y = this.curY + (this.doc.getFontSize() * this.config.interlinea / 72) * 25.4 * rowsNumber;
            break;
          //#endregion
          default:
            break;
        }

        if (!Number.isNaN(finalCur.x))
          this.xCursor = finalCur.x;
        if (!Number.isNaN(blockY))
          this.yCursor = blockY;
      }
      if (!Number.isNaN(finalCur.y))
        this.yCursor = finalCur.y;
      this.yCursor = this.yNewLine + this.config.staccoriga;
      this.curX = this.config.margini.sx;
    }
    this.doc.save("test_image0.pdf");
  }
  //#endregion
}