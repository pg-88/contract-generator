export interface IPartiContratto {
    fornitore: {
        denominazione: string;
        codiceFiscale: string;
        indirizzoCompleto: string;
    };
    cliente: {
        denominazione: string;
        codiceFiscale: string;
        indirizzoCompleto: string;
    };
}
export interface DocumentParams {
    parti?: IPartiContratto;
    tipOutput?: 'f' | 'd' | 'u';
    dynamicFields?: {
        [key: string]: string;
    };
    dynamicElements?: {
        [placeholder: string]: DynamicElement;
    };
}
export type DynamicElement = {
    type: 'table';
    config: {
        head: string[];
        body: string[][];
        options?: any;
        styles?: any;
    };
};
interface DocumentFont {
    nome: string;
    dimensione: number;
    colore: string;
    installPath?: string;
    boldFont: DocumentFont;
}
interface DocumentConfig {
    fontTitolo: DocumentFont;
    fontSottotitolo: DocumentFont;
    fontTesto: DocumentFont;
    margini: {
        sx: number;
        dx: number;
        alto: number;
        basso: number;
    };
    staccoriga: number;
    rientro: number;
    testi: {
        titolo: string;
        premessa: string;
        Punti: Array<{
            titolo: string;
            Sottopunti: Array<{
                titolo: string;
                contenuto: string;
            }>;
        }>;
        versione: string;
    };
    immagini: Array<{
        path: string;
        posizione: [number, number];
        dimensioni: [number, number];
        coeffDim?: number;
    }>;
    box: {
        backgrund: string;
        raggio: number;
    };
    tableStyle?: {
        lineColor?: string;
        lineWidth?: number;
        font?: string;
        fontSize?: number;
        cellPadding?: number;
        fillColor?: string;
    };
}
export declare class DocumentGenerator {
    private configPath?;
    private config;
    private doc;
    private curX;
    private curY;
    private configLoaded;
    constructor(configPath?: string);
    setConfig(config: DocumentConfig): void;
    private applyTemplate;
    private applyPartiPlaceholders;
    private loadConfig;
    private initDoc;
    private extractPlaceholder;
    private installFont;
    private writeWrappedTextCore;
    private writeLineWithInlineBold;
    private writeWrappedTextWithFont;
    writeBoxedText(text: string, fontConf: DocumentFont, padding?: number, borderRadius?: number, borderWidth?: number, boxColor?: string): Promise<void>;
    private isBoxedText;
    private stripBoxMarkers;
    private isBoldText;
    private stripBoldMarkers;
    private insertLogo;
    generateDocument(params: DocumentParams): Promise<string | ArrayBuffer>;
}
export {};
