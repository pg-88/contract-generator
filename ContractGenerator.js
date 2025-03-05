"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentGenerator = void 0;
const jspdf_1 = require("jspdf");
const jspdf_autotable_1 = __importDefault(require("jspdf-autotable"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
function loadImageAsBase64(imagePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const absolutePath = path_1.default.resolve(imagePath);
        const buffer = yield fs_1.promises.readFile(absolutePath);
        const ext = path_1.default.extname(imagePath).slice(1).toLowerCase();
        const base64 = buffer.toString('base64');
        return `data:image/${ext};base64,${base64}`;
    });
}
class DocumentGenerator {
    constructor(configPath) {
        this.configPath = configPath;
        this.curX = 0;
        this.curY = 0;
        this.configLoaded = false;
    }
    setConfig(config) {
        this.config = config;
        this.configLoaded = true;
    }
    applyTemplate(template, dynamicFields) {
        if (!dynamicFields)
            return template;
        return template.replace(/\$(\w+)\$/g, (match, key) => dynamicFields[key] !== undefined ? dynamicFields[key] : match);
    }
    applyPartiPlaceholders(text, parti) {
        return text.replace(/\$(fornitore|cliente):(\w+)\$/g, (match, party, field) => (parti[party] && parti[party][field]) ? parti[party][field] : match);
    }
    loadConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configLoaded)
                return;
            if (!this.configPath)
                throw new Error("No configuration provided.");
            try {
                const data = yield fs_1.promises.readFile(this.configPath, 'utf8');
                this.config = JSON.parse(data);
                this.configLoaded = true;
            }
            catch (error) {
                throw new Error(`Error reading configuration file: ${error}`);
            }
        });
    }
    initDoc() {
        this.doc = new jspdf_1.jsPDF();
        const margins = this.config.margini;
        this.curX = margins.sx;
        this.curY = margins.alto;
    }
    extractPlaceholder(text) {
        const match = text.match(/^\$(\w+)\$$/);
        return match ? match[1] : null;
    }
    installFont(fontPath, fontName) {
        return __awaiter(this, void 0, void 0, function* () {
            const absolutePath = path_1.default.resolve(fontPath);
            const buffer = yield fs_1.promises.readFile(absolutePath);
            const base64Font = buffer.toString('base64');
            console.log(`Installing font ${fontName} from ${absolutePath}`);
            this.doc.addFileToVFS(`${fontName}.ttf`, base64Font);
            this.doc.addFont(`${fontName}.ttf`, fontName, 'normal');
            this.doc.setFont(fontName);
        });
    }
    // Writes wrapped text, handling inline bold segments.
    writeWrappedTextCore(font_1, fontSize_1, color_1, text_1, x_1, y_1, maxWidth_1) {
        return __awaiter(this, arguments, void 0, function* (font, fontSize, color, text, x, y, maxWidth, lineSpacingFactor = 1.15) {
            this.doc.setFont(font.nome);
            this.doc.setFontSize(fontSize);
            this.doc.setTextColor(color);
            const lines = this.doc.splitTextToSize(text, maxWidth);
            const lineHeight = (fontSize * lineSpacingFactor / 72) * 25.4;
            for (const line of lines) {
                if (y + lineHeight > (this.doc.internal.pageSize.getHeight() - this.config.margini.basso)) {
                    this.doc.addPage();
                    y = this.config.margini.alto;
                }
                // If the line contains inline bold markers, process them.
                if (line.includes("**")) {
                    y = yield this.writeLineWithInlineBold(line, x, y, font, fontSize, color, maxWidth, lineSpacingFactor);
                }
                else {
                    this.doc.text(line, x, y);
                    y += lineHeight;
                }
            }
            return y;
        });
    }
    // Writes a single line with inline bold processing.
    writeLineWithInlineBold(line_1, x_1, y_1, normalFont_1, fontSize_1, color_1, maxWidth_1) {
        return __awaiter(this, arguments, void 0, function* (line, x, y, normalFont, fontSize, color, maxWidth, lineSpacingFactor = 1.15) {
            let currentX = x;
            // Split the line by bold segments. The regex splits by bold markers.
            const segments = line.split(/(\*\*.*?\*\*)/g);
            const lineHeight = (fontSize * lineSpacingFactor / 72) * 25.4;
            for (const seg of segments) {
                // Skip empty segments
                if (!seg)
                    continue;
                let segText = seg;
                let useBold = false;
                // Check if this segment is bold (wrapped in **)
                if (seg.startsWith("**") && seg.endsWith("**")) {
                    useBold = true;
                    segText = seg.substring(2, seg.length - 2);
                }
                // Set the appropriate font
                if (useBold && normalFont.boldFont) {
                    this.doc.setFont(normalFont.boldFont.nome, 'bold');
                }
                else {
                    this.doc.setFont(normalFont.nome);
                }
                this.doc.setFontSize(fontSize);
                this.doc.setTextColor(color);
                // Skip rendering if segment is empty after processing
                if (!segText.trim())
                    continue;
                const segWidth = this.doc.getTextWidth(segText);
                // Check if we need to wrap to the next line
                if (currentX + segWidth > x + maxWidth) {
                    y += lineHeight;
                    currentX = x;
                }
                // Write segment
                this.doc.text(segText, currentX, y);
                currentX += segWidth;
            }
            return y + lineHeight;
        });
    }
    writeWrappedTextWithFont(fontConf_1, text_1, x_1, y_1, maxWidth_1) {
        return __awaiter(this, arguments, void 0, function* (fontConf, text, x, y, maxWidth, lineSpacingFactor = 1.15) {
            const fontList = this.doc.getFontList();
            if (!fontList[fontConf.nome]) {
                if (fontConf.installPath)
                    yield this.installFont(fontConf.installPath, fontConf.nome);
                else
                    throw new Error("Font not present and no installPath provided");
            }
            else {
                this.doc.setFont(fontConf.nome);
            }
            this.curY = yield this.writeWrappedTextCore(fontConf, fontConf.dimensione, fontConf.colore, text, x, y, maxWidth, lineSpacingFactor);
        });
    }
    writeBoxedText(text_1, fontConf_1) {
        return __awaiter(this, arguments, void 0, function* (text, fontConf, padding = 5, borderRadius = 5, borderWidth = 1, boxColor) {
            const fontList = this.doc.getFontList();
            if (!fontList[fontConf.nome]) {
                if (fontConf.installPath)
                    yield this.installFont(fontConf.installPath, fontConf.nome);
                else
                    throw new Error("Font not present and no installPath provided");
            }
            else {
                this.doc.setFont(fontConf.nome);
            }
            this.doc.setFontSize(fontConf.dimensione);
            this.doc.setTextColor(fontConf.colore);
            const pageWidth = this.doc.internal.pageSize.getWidth();
            const maxTextWidth = pageWidth - this.config.margini.sx - this.config.margini.dx - 2 * padding;
            const lines = this.doc.splitTextToSize(text, maxTextWidth);
            const lineHeight = (fontConf.dimensione * 1.15 / 72) * 25.4;
            const textHeight = lines.length * lineHeight;
            const boxX = this.curX;
            const boxY = this.curY;
            const boxWidth = maxTextWidth + 2 * padding;
            const boxHeight = textHeight + 2 * padding;
            if (boxColor) {
                this.doc.setFillColor(boxColor);
                this.doc.roundedRect(boxX, boxY, boxWidth, boxHeight, borderRadius, borderRadius, "F");
            }
            this.doc.setLineWidth(borderWidth);
            this.doc.roundedRect(boxX, boxY, boxWidth, boxHeight, borderRadius, borderRadius);
            const textX = boxX + padding;
            let textY = boxY + padding + lineHeight;
            for (const line of lines) {
                if (line.includes("**")) {
                    textY = yield this.writeLineWithInlineBold(line, textX, textY, fontConf, fontConf.dimensione, fontConf.colore, maxTextWidth, 1.15);
                }
                else {
                    this.doc.text(line, textX, textY);
                    textY += lineHeight;
                }
            }
            this.curY = boxY + boxHeight + this.config.staccoriga;
        });
    }
    // Checks if text is wrapped in '^' markers for boxed text.
    isBoxedText(text) {
        return text.startsWith('^') && text.endsWith('^');
    }
    // Removes '^' markers.
    stripBoxMarkers(text) {
        return text.substring(1, text.length - 1);
    }
    // Checks if text is entirely wrapped in '**' markers (not inline).
    // (This function is kept for backward compatibility.)
    isBoldText(text) {
        return text.startsWith('**') && text.endsWith('**');
    }
    // Removes '**' markers.
    stripBoldMarkers(text) {
        return text.substring(2, text.length - 2);
    }
    // Inserts images using the current cursor position.
    insertLogo() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (this.config.immagini && this.config.immagini.length > 0) {
                const startX = this.curX;
                for (const imgConf of this.config.immagini) {
                    const format = ((_a = imgConf.path.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toUpperCase()) || 'PNG';
                    const base64Image = yield loadImageAsBase64(imgConf.path);
                    const startY = this.curY;
                    if (startY + imgConf.dimensioni[1] > (this.doc.internal.pageSize.getHeight() - this.config.margini.basso)) {
                        this.doc.addPage();
                        this.curY = this.config.margini.alto;
                    }
                    this.doc.addImage(base64Image, format, startX, this.curY, imgConf.dimensioni[0], imgConf.dimensioni[1]);
                    console.log(`Image inserted at X: ${startX}, Y: ${this.curY}`);
                    this.curY = this.curY + imgConf.dimensioni[1] + this.config.staccoriga;
                }
            }
        });
    }
    // Generates the PDF document by processing images, dynamic fields, tables, and text.
    // Supports inline bold formatting and boxed text.
    generateDocument(params) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadConfig();
            this.initDoc();
            yield this.insertLogo();
            const dynamicFields = params.dynamicFields || {};
            const dynamicElements = params.dynamicElements || {};
            const pageWidth = this.doc.internal.pageSize.getWidth();
            const maxWidth = pageWidth - (this.config.margini.sx + this.config.margini.dx);
            let titolo = this.applyTemplate(this.config.testi.titolo, dynamicFields);
            titolo = this.applyPartiPlaceholders(titolo, params.parti);
            yield this.writeWrappedTextWithFont(this.config.fontTitolo, titolo, this.curX, this.curY, maxWidth);
            this.curY += this.config.staccoriga;
            let premessa = this.applyTemplate(this.config.testi.premessa, dynamicFields);
            premessa = this.applyPartiPlaceholders(premessa, params.parti);
            yield this.writeWrappedTextWithFont(this.config.fontTesto, premessa, this.curX, this.curY, maxWidth);
            this.curY += this.config.staccoriga;
            for (const punto of this.config.testi.Punti) {
                let puntoTitolo = this.applyTemplate(punto.titolo, dynamicFields);
                puntoTitolo = this.applyPartiPlaceholders(puntoTitolo, params.parti);
                yield this.writeWrappedTextWithFont(this.config.fontTitolo, puntoTitolo, this.curX, this.curY, maxWidth);
                this.curY += this.config.staccoriga;
                for (const sub of punto.Sottopunti) {
                    const placeholder = this.extractPlaceholder(sub.titolo);
                    if (placeholder && dynamicElements[placeholder] && dynamicElements[placeholder].type === 'table' && dynamicElements[placeholder].config) {
                        const tableConfig = dynamicElements[placeholder].config;
                        const defaultTableOptions = this.config.tableStyle || {};
                        (0, jspdf_autotable_1.default)(this.doc, Object.assign(Object.assign(Object.assign({ startY: this.curY, head: [tableConfig.head], body: tableConfig.body }, defaultTableOptions), tableConfig.options), tableConfig.styles));
                        this.curY = this.doc.lastAutoTable.finalY + this.config.staccoriga;
                    }
                    else {
                        if (sub.titolo) {
                            let titleText = this.applyTemplate(sub.titolo, dynamicFields);
                            titleText = this.applyPartiPlaceholders(titleText, params.parti);
                            if (this.isBoxedText(titleText)) {
                                const boxText = this.stripBoxMarkers(titleText);
                                yield this.writeBoxedText(boxText, this.config.fontSottotitolo);
                            }
                            else if (this.isBoldText(titleText)) {
                                const boldText = this.stripBoldMarkers(titleText);
                                yield this.writeWrappedTextWithFont(this.config.fontSottotitolo, boldText, this.curX + this.config.rientro, this.curY, maxWidth - this.config.rientro);
                            }
                            else {
                                yield this.writeWrappedTextWithFont(this.config.fontSottotitolo, titleText, this.curX + this.config.rientro, this.curY, maxWidth - this.config.rientro);
                            }
                            this.curY += this.config.staccoriga;
                        }
                    }
                    const contentPlaceholder = this.extractPlaceholder(sub.contenuto);
                    if (contentPlaceholder && dynamicElements[contentPlaceholder] && dynamicElements[contentPlaceholder].type === 'table' && dynamicElements[contentPlaceholder].config) {
                        const tableConfig = dynamicElements[contentPlaceholder].config;
                        const defaultTableOptions = this.config.tableStyle || {};
                        (0, jspdf_autotable_1.default)(this.doc, Object.assign(Object.assign(Object.assign({ startY: this.curY, head: [tableConfig.head], body: tableConfig.body }, defaultTableOptions), tableConfig.options), tableConfig.styles));
                        this.curY = this.doc.lastAutoTable.finalY + this.config.staccoriga;
                    }
                    else if (sub.contenuto) {
                        let contenuto = this.applyTemplate(sub.contenuto, dynamicFields);
                        contenuto = this.applyPartiPlaceholders(contenuto, params.parti);
                        if (this.isBoxedText(contenuto)) {
                            const boxText = this.stripBoxMarkers(contenuto);
                            yield this.writeBoxedText(boxText, this.config.fontTesto);
                        }
                        else if (this.isBoldText(contenuto)) {
                            const boldText = this.stripBoldMarkers(contenuto);
                            yield this.writeWrappedTextWithFont(this.config.fontTesto, boldText, this.curX + this.config.rientro, this.curY, maxWidth - this.config.rientro);
                        }
                        else {
                            yield this.writeWrappedTextWithFont(this.config.fontTesto, contenuto, this.curX + this.config.rientro, this.curY, maxWidth - this.config.rientro);
                        }
                        this.curY += this.config.staccoriga;
                    }
                }
                this.curY += this.config.staccoriga;
            }
            const tipOutput = params.tipOutput || 'd';
            const fileName = `Documento_${params.parti.cliente.denominazione}.pdf`;
            if (tipOutput === 'd') {
                const pdfBuffer = this.doc.output('arraybuffer');
                yield fs_1.promises.writeFile(fileName, Buffer.from(pdfBuffer));
                return fileName;
            }
            else if (tipOutput === 'u') {
                return this.doc.output('arraybuffer');
            }
            else {
                return this.doc.output('arraybuffer');
            }
        });
    }
}
exports.DocumentGenerator = DocumentGenerator;
