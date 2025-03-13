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
    //#endregion
    function DocumentGenerator(configPath) {
        this.configPath = configPath;
        this.curX = 0;
        this.curY = 0;
        this.configLoaded = false;
        //#region flag Debug
        this.debugActive = false;
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
            else {
                this.debugCursor();
                throw new Error("".concat(yPosition, " is not a valid position for y coordinate"));
            }
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
            else {
                throw new Error("".concat(xPosition, " is not a valid position for x coordinate"));
            }
        },
        enumerable: false,
        configurable: true
    });
    //#endregion
    //#region debug
    DocumentGenerator.prototype.debugCursor = function (inputColor) {
        if (this.debugActive) {
            var color = this.doc.getDrawColor();
            if (inputColor)
                this.doc.setDrawColor(inputColor);
            else
                this.doc.setDrawColor('green');
            this.doc.line(this.curX - 2, this.curY, this.curX + 2, this.curY);
            this.doc.line(this.curX, this.curY - 2, this.curX, this.curY + 2);
            this.doc.setDrawColor(color);
        }
    };
    DocumentGenerator.prototype.debugMargini = function () {
        if (this.debugActive) {
            /// debug
            console.log("debug: righe margini");
            var color = this.doc.getDrawColor();
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
        }
    };
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
    DocumentGenerator.prototype.applyTemplate = function (template, dynamicFields) {
        if (!dynamicFields)
            return template;
        return template.replace(/\$(\w+)\$/g, function (match, key) {
            return dynamicFields[key] !== undefined ? dynamicFields[key] : match;
        });
    };
    //#endregion
    //#region applyPartiPlaceholders
    DocumentGenerator.prototype.applyPartiPlaceholders = function (text, parti) {
        return text.replace(/\$(fornitore|cliente):(\w+)\$/g, function (match, party, field) {
            return (parti[party] && parti[party][field]) ? parti[party][field] : match;
        });
    };
    //#endregion
    //#region loadConfig
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
    //#endregion
    //#region initDoc
    /**
     * # initDoc
     *
     * initialize the jsPDF object, set the margins and the cursor, installs the fonts
     */
    DocumentGenerator.prototype.initDoc = function () {
        return __awaiter(this, void 0, void 0, function () {
            var margins, fontList, _i, _a, font, styles, paths, i, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 8, , 9]);
                        this.doc = new jspdf_1.jsPDF();
                        margins = this.template.impostazioniPagina.margini;
                        this.curX = margins.sx;
                        this.curY = margins.alto;
                        fontList = this.doc.getFontList();
                        _i = 0, _a = this.config.fonts;
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 7];
                        font = _a[_i];
                        if (!!fontList[font.nome]) return [3 /*break*/, 6];
                        console.log("Installing font ", font.nome, " id: ", font.id);
                        if (!font.installPath) return [3 /*break*/, 6];
                        styles = font.style.split(',');
                        paths = font.installPath.split(',');
                        i = 0;
                        _b.label = 2;
                    case 2:
                        if (!(i < styles.length)) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.installFont(paths[i].trim(), font.nome, styles[i].trim())];
                    case 3:
                        _b.sent();
                        _b.label = 4;
                    case 4:
                        i++;
                        return [3 /*break*/, 2];
                    case 5:
                        console.log("Path ", font.installPath);
                        _b.label = 6;
                    case 6:
                        _i++;
                        return [3 /*break*/, 1];
                    case 7:
                        console.log("updated font list ", this.doc.getFontList());
                        return [3 /*break*/, 9];
                    case 8:
                        error_2 = _b.sent();
                        console.error(error_2);
                        throw error_2;
                    case 9: return [2 /*return*/];
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
                        console.log("Installing font ".concat(fontName, " from ").concat(absolutePath));
                        return [4 /*yield*/, fs_1.promises.readFile(absolutePath)];
                    case 1:
                        buffer = _a.sent();
                        base64Font = buffer.toString('base64');
                        console.log("this.doc.addFileToVFS ".concat(fontName, ".ttf"), "base64Font");
                        this.doc.addFileToVFS("".concat(fontName, ".ttf"), base64Font);
                        this.doc.addFont("".concat(fontName, ".ttf"), fontName, style);
                        this.doc.setFont(fontName);
                        return [2 /*return*/];
                }
            });
        });
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
    //#region insertImage
    // Inserts images using the current cursor position.
    DocumentGenerator.prototype.insertImage = function (imgParam) {
        return __awaiter(this, void 0, void 0, function () {
            var startX, format, base64Image, startY, error_3;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
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
                        console.log("base 64 image: ", base64Image);
                        this.doc.addImage(base64Image, format, startX, this.curY, imgParam.dimensioni[0], imgParam.dimensioni[1]);
                        console.log("Image inserted at X: ".concat(startX, ", Y: ").concat(this.curY));
                        this.curY = this.curY + imgParam.dimensioni[1] + this.config.staccoriga;
                        return [3 /*break*/, 3];
                    case 2:
                        error_3 = _b.sent();
                        console.error(error_3);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    //#endregion
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
        this.doc.setDrawColor(this.config.box.lineColor);
        this.doc.setLineWidth(this.config.box.lineWidth);
        this.doc.setFillColor(this.config.box.background);
        var _a = [
            this.curX,
            this.curY,
            maxWidth + this.config.box.padding,
            0,
            this.config.box.raggio
        ], x = _a[0], y = _a[1], w = _a[2], h = _a[3], r = _a[4];
        var section = this.parseBoldSections(text);
        // writeSection
        var endCur = { x: 0, y: 0 };
        for (var _i = 0, section_1 = section; _i < section_1.length; _i++) {
            var s = section_1[_i];
            var text_1 = s.text.replace(/\*\*/g, '');
            this.doc.setFont(this.doc.getFont().fontName, s.type);
            endCur = this.writeTextInLine(text_1, maxWidth, option);
        }
        if (!option.baseline || option.baseline === 'alphabetic') {
            y -= this.doc.getFontSize() * this.config.interlinea / 72 * 25.4;
        }
        else if (option.baseline === 'middle') {
            y -= (this.doc.getFontSize() * this.config.interlinea / 72 * 25.4) * 0.5;
        }
        x -= this.config.box.padding * .5;
        h = this.config.box.padding + (endCur.y - y);
        this.doc.roundedRect(x, y, w, h, r, r);
        this.yCursor = this.curY + (this.doc.getFontSize() * this.config.interlinea / 72 * 25.4);
    };
    //#endregion
    //#region generateDocument
    DocumentGenerator.prototype.generateDocument = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var dynamicFields, dynamicElements, pageWidth, maxWidth, _i, _a, c, _b, _c, key, _d, write, textToWrite, option, boxedText, section, _e, section_2, s, text, imgParam;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0: return [4 /*yield*/, this.loadConfig()];
                    case 1:
                        _f.sent(); // read the config json file  
                        return [4 /*yield*/, this.initDoc()];
                    case 2:
                        _f.sent(); // prepares the doc obj and the cursor
                        dynamicFields = params.dynamicFields || {};
                        dynamicElements = params.dynamicElements || {};
                        pageWidth = this.doc.internal.pageSize.getWidth();
                        maxWidth = pageWidth - (this.config.margini.sx + this.config.margini.dx);
                        _i = 0, _a = this.contenuti;
                        _f.label = 3;
                    case 3:
                        if (!(_i < _a.length)) return [3 /*break*/, 13];
                        c = _a[_i];
                        _b = 0, _c = Object.keys(c);
                        _f.label = 4;
                    case 4:
                        if (!(_b < _c.length)) return [3 /*break*/, 12];
                        key = _c[_b];
                        _d = key;
                        switch (_d) {
                            case 'testo': return [3 /*break*/, 5];
                            case 'Punti': return [3 /*break*/, 6];
                            case 'immagine': return [3 /*break*/, 7];
                            case 'tabella': return [3 /*break*/, 9];
                        }
                        return [3 /*break*/, 10];
                    case 5:
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
                            this.debugCursor();
                            textToWrite = textToWrite.replace(/\^/g, '');
                            this.drawBox(textToWrite, maxWidth, option);
                            this.curX = this.config.margini.sx;
                        }
                        else {
                            section = this.parseBoldSections(textToWrite);
                            // writeSection
                            for (_e = 0, section_2 = section; _e < section_2.length; _e++) {
                                s = section_2[_e];
                                text = s.text.replace(/\*\*/g, '');
                                this.doc.setFont(this.doc.getFont().fontName, s.type);
                                this.debugCursor();
                                this.writeTextInLine(text, maxWidth, option);
                            }
                        }
                        this.curX = this.config.margini.sx;
                        this.yCursor = this.curY + this.config.staccoriga;
                        return [3 /*break*/, 11];
                    case 6: return [3 /*break*/, 11];
                    case 7:
                        console.log("Image insert: ", c[key]);
                        imgParam = c[key];
                        return [4 /*yield*/, this.insertImage(imgParam)];
                    case 8:
                        _f.sent();
                        // let img = new Image(imgParam.dimensioni[0], imgParam.dimensioni[1]);
                        // img.src = await loadImageAsBase64(imgParam.path);
                        // this.doc.addImage(img, 'PNG', 15, 15, imgParam.dimensioni[0], imgParam.dimensioni[1]);
                        // this.curX = this.config.margini.sx;
                        // this.curY = imgParam.dimensioni[1] + this.config.staccoriga;
                        return [3 /*break*/, 11];
                    case 9: return [3 /*break*/, 11];
                    case 10: return [3 /*break*/, 11];
                    case 11:
                        _b++;
                        return [3 /*break*/, 4];
                    case 12:
                        _i++;
                        return [3 /*break*/, 3];
                    case 13:
                        this.doc.save("test_image0.pdf");
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
        var lineWidth = this.curX; // Larghezza disponibile corrente
        for (var _i = 0, words_1 = words; _i < words_1.length; _i++) {
            var word = words_1[_i];
            var wordWidth = this.doc.getTextWidth(word);
            // Se la parola non entra nella riga, fai il ritorno a capo
            if (lineWidth + wordWidth >= maxWidth) {
                this.curX = this.config.margini.sx; // Reset X
                this.yCursor = this.curY + (this.doc.getFontSize() * this.config.interlinea / 72) * 25.4; // Vai a capo
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
    };
    return DocumentGenerator;
}());
exports.DocumentGenerator = DocumentGenerator;
