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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentGenerator = void 0;
var jspdf_1 = require("jspdf");
var fs_1 = require("fs");
var path = require("path");
;
function loadImageAsBase64(imagePath) {
    return __awaiter(this, void 0, void 0, function () {
        var absolutePath, buffer, ext, base64;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    absolutePath = path.resolve(imagePath);
                    return [4 /*yield*/, fs_1.promises.readFile(absolutePath)];
                case 1:
                    buffer = _a.sent();
                    ext = path.extname(imagePath).slice(1).toLowerCase();
                    base64 = buffer.toString('base64');
                    return [2 /*return*/, "data:image/".concat(ext, ";base64,").concat(base64)];
            }
        });
    });
}
var DocumentGenerator = /** @class */ (function () {
    function DocumentGenerator(configPath) {
        this.configPath = configPath;
        this.curX = 0;
        this.curY = 0;
        this.configLoaded = false;
    }
    DocumentGenerator.prototype.setConfig = function (config) {
        this.config = config.impostazioniPagina;
        this.configLoaded = true;
    };
    Object.defineProperty(DocumentGenerator.prototype, "yCursor", {
        //#region setter
        set: function (yPosition) {
            var maxY = this.doc.internal.pageSize.getHeight() - this.config.margini.basso;
            if (yPosition >= this.config.margini.alto &&
                yPosition <= maxY) {
                this.curY = yPosition;
            }
            else if (yPosition > maxY) {
                console.log("adding new page ");
                this.doc.addPage();
                this.curY = this.config.margini.alto;
                this.curX = this.config.margini.sx;
            }
            else
                throw new Error("".concat(yPosition, " is not a valid position"));
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DocumentGenerator.prototype, "xCursor", {
        set: function (xPosition) {
            var maxX = this.doc.internal.pageSize.getWidth() - this.config.margini.dx;
            if (xPosition >= this.config.margini.sx &&
                xPosition <= maxX) {
                this.curX = xPosition;
            }
            else if (xPosition > maxX) {
                console.log("new line");
                this.yCursor = this.curY + (this.doc.getFontSize() * this.config.interlinea / 72) * 25.4;
                this.curX = this.config.margini.sx;
            }
            else
                throw new Error("".concat(xPosition, " is not a valid position"));
        },
        enumerable: false,
        configurable: true
    });
    //#endregion
    /**
     * # applyTemplate
     *
     * Replaces tag `$content$` with dynamic field that has the same key
     * @param template
     * @param dynamicFields
     * @returns
     */
    DocumentGenerator.prototype.applyTemplate = function (template, dynamicFields) {
        if (!dynamicFields)
            return template;
        return template.replace(/\$(\w+)\$/g, function (match, key) {
            return dynamicFields[key] !== undefined ? dynamicFields[key] : match;
        });
    };
    DocumentGenerator.prototype.applyPartiPlaceholders = function (text, parti) {
        return text.replace(/\$(fornitore|cliente):(\w+)\$/g, function (match, party, field) {
            return (parti[party] && parti[party][field]) ? parti[party][field] : match;
        });
    };
    DocumentGenerator.prototype.loadConfig = function () {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.configLoaded)
                            return [2 /*return*/];
                        if (!this.configPath)
                            throw new Error("No configuration provided.");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, fs_1.promises.readFile(this.configPath, 'utf8')];
                    case 2:
                        data = _a.sent();
                        this.template = JSON.parse(data);
                        this.config = this.template.impostazioniPagina;
                        this.contenuti = this.template.contenuti;
                        this.configLoaded = true;
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        throw new Error("Error reading configuration file: ".concat(error_1));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    //#region initDoc
    /**
     * # initDoc
     *
     * initialize the jsPDF object, set the margins and the cursor, installs the fonts
     */
    DocumentGenerator.prototype.initDoc = function () {
        return __awaiter(this, void 0, void 0, function () {
            var margins, fontList, _i, _a, font, color, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 5, , 6]);
                        this.doc = new jspdf_1.jsPDF();
                        margins = this.template.impostazioniPagina.margini;
                        this.curX = margins.sx;
                        this.curY = margins.alto;
                        fontList = this.doc.getFontList();
                        _i = 0, _a = this.config.fonts;
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        font = _a[_i];
                        if (!!fontList[font.nome]) return [3 /*break*/, 3];
                        console.log("Installing font ", font.nome);
                        if (!font.installPath) return [3 /*break*/, 3];
                        console.log("Path ", font.installPath);
                        return [4 /*yield*/, this.installFont(font.installPath, font.nome, font.style ? font.style : undefined)];
                    case 2:
                        _b.sent();
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        console.log("updated font list ", this.doc.getFontList());
                        /// debug
                        console.log("debug: righe margini");
                        color = this.doc.getDrawColor();
                        this.doc.setDrawColor("green");
                        //hzo alto
                        this.doc.line(this.config.margini.sx, this.config.margini.alto, this.doc.internal.pageSize.getWidth() - this.config.margini.dx, this.config.margini.alto);
                        // vert sx
                        this.doc.line(this.config.margini.sx, this.config.margini.alto, this.config.margini.sx, this.doc.internal.pageSize.getHeight() - this.config.margini.basso);
                        // vert dx
                        this.doc.line(this.doc.internal.pageSize.getWidth() - this.config.margini.dx, this.config.margini.alto, this.doc.internal.pageSize.getWidth() - this.config.margini.dx, this.doc.internal.pageSize.getHeight() - this.config.margini.basso);
                        // hzo basso
                        this.doc.line(this.config.margini.sx, this.doc.internal.pageSize.getHeight() - this.config.margini.basso, this.doc.internal.pageSize.getWidth() - this.config.margini.dx, this.doc.internal.pageSize.getHeight() - this.config.margini.basso);
                        this.doc.setDrawColor(color);
                        return [3 /*break*/, 6];
                    case 5:
                        error_2 = _b.sent();
                        console.error(error_2);
                        throw error_2;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    //#region setupText
    DocumentGenerator.prototype.setupText = function (fontId) {
        if (fontId === void 0) { fontId = 'default'; }
        var font = this.config.fonts.find(function (font) { return font.id === fontId; });
        if (!font)
            throw new Error("no font found with the id ".concat(fontId));
        // console.log("Il font definito in config", font);
        this.doc.setFont(font.nome, font.style ? font.style : undefined);
        this.doc.setFontSize(font.dimensione);
        this.doc.setTextColor(font.colore ? font.colore : undefined);
    };
    DocumentGenerator.prototype.extractPlaceholder = function (text) {
        var match = text.match(/^\$(\w+)\$$/);
        return match ? match[1] : null;
    };
    DocumentGenerator.prototype.installFont = function (fontPath_1, fontName_1) {
        return __awaiter(this, arguments, void 0, function (fontPath, fontName, style) {
            var absolutePath, buffer, base64Font;
            if (style === void 0) { style = 'normal'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        absolutePath = path.resolve(fontPath);
                        return [4 /*yield*/, fs_1.promises.readFile(absolutePath)];
                    case 1:
                        buffer = _a.sent();
                        base64Font = buffer.toString('base64');
                        // console.log(`Installing font ${fontName} from ${absolutePath}`);
                        this.doc.addFileToVFS("".concat(fontName, ".ttf"), base64Font);
                        this.doc.addFont("".concat(fontName, ".ttf"), fontName, style);
                        // this.doc.addFont(`${fontName}.ttf`, fontName, 'bold');
                        // this.doc.addFont(`${fontName}.ttf`, fontName, 'italic');
                        this.doc.setFont(fontName);
                        return [2 /*return*/];
                }
            });
        });
    };
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
    DocumentGenerator.prototype.isBoxedText = function (text) {
        return text.startsWith('^') && text.endsWith('^');
    };
    // Removes '^' markers.
    DocumentGenerator.prototype.stripBoxMarkers = function (text) {
        return text.substring(1, text.length - 1);
    };
    // Checks if text is entirely wrapped in '**' markers (not inline).
    // (This function is kept for backward compatibility.)
    DocumentGenerator.prototype.isBoldText = function (text) {
        return text.startsWith('**') && text.endsWith('**');
    };
    // Removes '**' markers.
    DocumentGenerator.prototype.stripBoldMarkers = function (text) {
        return text.substring(2, text.length - 2);
    };
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
    DocumentGenerator.prototype.insertImage = function (imgParam) {
        return __awaiter(this, void 0, void 0, function () {
            var startX, format, base64Image, startY;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        startX = this.curX;
                        format = ((_a = imgParam.path.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toUpperCase()) || 'PNG';
                        return [4 /*yield*/, loadImageAsBase64(imgParam.path)];
                    case 1:
                        base64Image = _b.sent();
                        startY = this.curY;
                        if (startY + imgParam.dimensioni[1] > (this.doc.internal.pageSize.getHeight() - this.config.margini.basso)) {
                            this.doc.addPage();
                            this.curY = this.config.margini.alto;
                        }
                        this.doc.addImage(base64Image, format, startX, this.curY, imgParam.dimensioni[0], imgParam.dimensioni[1]);
                        console.log("Image inserted at X: ".concat(startX, ", Y: ").concat(this.curY));
                        this.curY = this.curY + imgParam.dimensioni[1] + this.config.staccoriga;
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * # parseText
     * trova i tag di formattazine, li rimuove dal testo e ritorna un oggetto con le impostazioni
     * passate nei tag
     * @param text
     * @returns
     */
    //#region parseText
    DocumentGenerator.prototype.parseText = function (text) {
        var tagRegex = /<\|(.*?)\|>/g; // Trova i tag <|...|>
        var content = text.replace(tagRegex, "").trim(); // Rimuove i tag e lascia solo il testo principale
        var formattedText = { content: content };
        // Trova tutti i tag e processali
        var matched = Array.from(text.matchAll(tagRegex));
        for (var _i = 0, matched_1 = matched; _i < matched_1.length; _i++) {
            var match = matched_1[_i];
            var tags = match[1].trim().split(';'); // Esclude i delimitatori <| e |>
            for (var _a = 0, tags_1 = tags; _a < tags_1.length; _a++) {
                var tagContent = tags_1[_a];
                if (tagContent.includes(":")) {
                    var _b = tagContent.split(":").map(function (s) { return s.trim(); }), key = _b[0], value = _b[1];
                    // Mappa i valori nell'oggetto in base alla chiave trovata
                    // console.log("tag formattazione ", key, value);
                    switch (key) {
                        case "fontId":
                            formattedText.fontId = value;
                            break;
                        case "hAlign":
                            formattedText.hAlign = value;
                            break;
                        case "vAlign":
                            formattedText.vAlign = value;
                            break;
                    }
                }
            }
        }
        return formattedText;
    };
    //#region parseSections
    DocumentGenerator.prototype.parseBoldSections = function (content) {
        var sections = [];
        var index = 0;
        var matches = Array.from(content.matchAll(/\*\*(.*?)\*\*/g));
        if (matches.length === 0) {
            sections.push({
                text: content,
                type: 'normal',
                start: 0,
                end: content.length
            });
        }
        else {
            while (index < content.length) {
                for (var _i = 0, matches_1 = matches; _i < matches_1.length; _i++) {
                    var match = matches_1[_i];
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
    };
    //#endregion
    //#region drawBox
    DocumentGenerator.prototype.drawBox = function (text, maxWidth, option) {
        console.log("################ BBBBOOOOXXXXX ", text, "\ntext option: ", option);
        this.doc.setDrawColor(this.config.box.lineColor);
        this.doc.setLineWidth(this.config.box.lineWidth);
        this.doc.setFillColor(this.config.box.background);
        var tArr = this.doc.splitTextToSize(text, maxWidth);
        var _a = [
            this.curX,
            this.curY,
            maxWidth,
            tArr.length * (this.doc.getFontSize() * this.config.interlinea / 72) * 25.4,
            this.config.box.raggio
        ], x = _a[0], y = _a[1], w = _a[2], h = _a[3], r = _a[4];
        x -= this.config.box.padding * .5;
        w += this.config.box.padding;
        h += this.config.box.padding;
        if (!option.baseline || option.baseline === 'alphabetic') {
            y -= this.doc.getFontSize() * this.config.interlinea / 72 * 25.4;
        }
        else if (option.baseline === 'middle') {
            y -= (this.doc.getFontSize() * this.config.interlinea / 72 * 25.4) * 0.5;
        }
        this.doc.roundedRect(x, y, w, h, r, r);
    };
    //#endregion
    //#region generateDocument
    DocumentGenerator.prototype.generateDocument = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var dynamicFields, dynamicElements, pageWidth, maxWidth, _i, _a, c, _b, _c, key, write, textToWrite, option, boxedText, section, _d, section_1, s, text;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0: return [4 /*yield*/, this.loadConfig()];
                    case 1:
                        _e.sent(); // read the config json file  
                        return [4 /*yield*/, this.initDoc()];
                    case 2:
                        _e.sent(); // prepares the doc obj and the cursor
                        dynamicFields = params.dynamicFields || {};
                        dynamicElements = params.dynamicElements || {};
                        pageWidth = this.doc.internal.pageSize.getWidth();
                        maxWidth = pageWidth - (this.config.margini.sx + this.config.margini.dx);
                        // Parse contents
                        for (_i = 0, _a = this.contenuti; _i < _a.length; _i++) {
                            c = _a[_i];
                            for (_b = 0, _c = Object.keys(c); _b < _c.length; _b++) {
                                key = _c[_b];
                                switch (key) {
                                    case 'testo':
                                        write = this.parseText(c[key]);
                                        textToWrite = this.applyTemplate(write.content, dynamicFields);
                                        textToWrite = this.applyPartiPlaceholders(textToWrite, params.parti);
                                        this.setupText(write.fontId);
                                        option = {
                                            align: write.hAlign ? write.hAlign : null,
                                            // baseline: 'middle'
                                            // baseline: write.vAlign ? write.vAlign : null
                                        };
                                        boxedText = textToWrite.match(/^\^.*\^$/);
                                        if (boxedText) {
                                            this.drawBox(boxedText['input'], maxWidth, option);
                                            textToWrite = textToWrite.replace(/\^/g, '');
                                        }
                                        section = this.parseBoldSections(textToWrite);
                                        // writeSection
                                        for (_d = 0, section_1 = section; _d < section_1.length; _d++) {
                                            s = section_1[_d];
                                            text = s.text.replace(/\*\*/g, '');
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
                        return [2 /*return*/];
                }
            });
        });
    };
    //#endregion
    //#region writeTextInLine
    DocumentGenerator.prototype.writeTextInLine = function (text, maxWidth, option) {
        var words = text.split(" ");
        var spaceWidth = this.doc.getTextWidth(" "); // Larghezza dello spazio
        var lineWidth = 0; // Larghezza della linea corrente
        for (var _i = 0, words_1 = words; _i < words_1.length; _i++) {
            var word = words_1[_i];
            var wordWidth = this.doc.getTextWidth(word);
            // Se la parola non entra nella riga, fai il ritorno a capo
            if (lineWidth + wordWidth >= maxWidth * 0.95) {
                this.curX = this.config.margini.sx; // Reset X
                this.yCursor = this.curY + (this.doc.getFontSize() * this.config.interlinea / 72) * 25.4; // Vai a capo
                lineWidth = 0; // Reset della larghezza linea
            }
            // Scrivi la parola
            if (word !== '') {
                this.doc.text(word, this.curX, this.curY, option);
                this.xCursor = this.curX + wordWidth + spaceWidth; // Aggiorna X per la parola successiva
                lineWidth += wordWidth + spaceWidth; // Aggiorna la larghezza della riga
            }
        }
    };
    //#endregion
    //#region writeBold
    DocumentGenerator.prototype.writeBold = function (text, option) {
        try {
            var actFont = this.doc.getFont();
            console.log("writing bold text: ".concat(text, " font: ").concat(actFont.fontName));
            this.doc.setFont(actFont.fontName, 'bold');
            this.doc.text(text, this.curX, this.curY, option);
            // re-set original font
            this.doc.setFont(actFont.fontName, actFont.fontStyle);
        }
        catch (error) {
            throw new Error("Error writing text bold: ".concat(error));
        }
    };
    //#endregion
    //#region writeNormal
    DocumentGenerator.prototype.writeNormal = function (text, option) {
        try {
            var actFont = this.doc.getFont();
            console.log("writing normal text ".concat(text, ", font: ").concat(actFont.fontName));
            text = text.replace(/\*\*|\^/g, '');
            this.doc.text(text, this.curX, this.curY, option);
        }
        catch (error) {
            throw new Error("Error writing text normal: ".concat(error));
        }
    };
    //#endregion
    //#region writeBoxedText
    DocumentGenerator.prototype.writeBoxedText = function (text_1) {
        return __awaiter(this, arguments, void 0, function (text, padding, borderRadius, borderWidth, boxColor) {
            if (padding === void 0) { padding = 5; }
            if (borderRadius === void 0) { borderRadius = 5; }
            if (borderWidth === void 0) { borderWidth = 1; }
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    return DocumentGenerator;
}());
exports.DocumentGenerator = DocumentGenerator;
