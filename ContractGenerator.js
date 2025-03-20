"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var jspdf_autotable_1 = require("jspdf-autotable");
var fs_1 = require("fs");
var path = require("path");
var pdf_lib_1 = require("pdf-lib");
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
    function DocumentGenerator(inputConfig) {
        this.inputConfig = inputConfig;
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
            // this.debugCursor('#DC143C')
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
                throw new Error("".concat(yPosition, " is not a valid position for y coordinate"));
            }
            // this.debugCursor('#96dc14');
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
    Object.defineProperty(DocumentGenerator.prototype, "yNewLine", {
        //#endregion
        /**
         * # get the position of the cursor in a new line below the actual.
         */
        get: function () {
            var newY = this.curY + (this.doc.getFontSize() * this.config.interlinea / 72) * 25.4;
            if (newY > this.doc.internal.pageSize.getHeight() - this.config.margini.basso) {
                this.doc.addPage();
                this.curY = this.config.margini.alto;
                this.curX = this.config.margini.sx;
                return this.curY;
            }
            else
                return newY;
        },
        enumerable: false,
        configurable: true
    });
    //#region debug
    DocumentGenerator.prototype.debugCursor = function (inputColor, label) {
        var noise = Math.random();
        console.log("cusor X:(".concat(this.curX.toFixed(4), "), Y:(").concat(this.curY.toFixed(4), ") *** noise: ").concat(noise));
        if (this.debugActive) {
            var color = this.doc.getDrawColor();
            var txtColor = this.doc.getTextColor();
            if (inputColor) {
                this.doc.setTextColor(inputColor);
                this.doc.setDrawColor(inputColor);
            }
            else
                this.doc.setDrawColor('green');
            this.doc.line(this.curX - 2 + noise, this.curY + noise * .1, this.curX + 2, this.curY);
            this.doc.line(this.curX + noise, this.curY - 2 + noise * .1, this.curX, this.curY + 2);
            var txtSize = this.doc.getFontSize();
            this.doc.setFontSize(5);
            if (label)
                this.doc.text(label, this.curX, this.curY);
            this.doc.setDrawColor(color);
            this.doc.setTextColor(txtColor);
            this.doc.setFontSize(txtSize);
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
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        if (this.configLoaded)
                            return [2 /*return*/];
                        if (!this.inputConfig)
                            throw new Error("No configuration provided.");
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, fs_1.promises.readFile(this.inputConfig, 'utf8')];
                    case 2:
                        data = _e.sent();
                        this.template = JSON.parse(data);
                        this.config = this.template.impostazioniPagina;
                        this.config.margini = {
                            sx: ((_a = this.template.impostazioniPagina.margini) === null || _a === void 0 ? void 0 : _a.sx) ? this.template.impostazioniPagina.margini.sx : 8,
                            dx: ((_b = this.template.impostazioniPagina.margini) === null || _b === void 0 ? void 0 : _b.dx) ? this.template.impostazioniPagina.margini.dx : 8,
                            alto: ((_c = this.template.impostazioniPagina.margini) === null || _c === void 0 ? void 0 : _c.alto) ? this.template.impostazioniPagina.margini.alto : 8,
                            basso: ((_d = this.template.impostazioniPagina.margini) === null || _d === void 0 ? void 0 : _d.basso) ? this.template.impostazioniPagina.margini.basso : 8,
                        };
                        this.contenuti = this.template.contenuti;
                        this.configLoaded = true;
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _e.sent();
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
                        _b.trys.push([0, 7, , 8]);
                        this.doc = new jspdf_1.jsPDF();
                        margins = this.config.margini;
                        this.curX = margins.sx ? margins.sx : 10;
                        this.curY = margins.alto ? margins.alto : 10;
                        console.log("Init cursor: ", this.curX, this.curY);
                        fontList = this.doc.getFontList();
                        _i = 0, _a = this.config.fonts;
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                        font = _a[_i];
                        if (!!fontList[font.nome]) return [3 /*break*/, 5];
                        if (!font.installPath) return [3 /*break*/, 5];
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
                        _i++;
                        return [3 /*break*/, 1];
                    case 6:
                        console.log("updated font list ", this.doc.getFontList());
                        //////////////////////////////////////////////////////////////////////////
                        this.debugMargini();
                        return [3 /*break*/, 8];
                    case 7:
                        error_2 = _b.sent();
                        console.error(error_2);
                        throw error_2;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    //#region setupText
    DocumentGenerator.prototype.setupText = function (fontId) {
        if (fontId === void 0) { fontId = 'default'; }
        var font = this.config.fonts.find(function (font) { return font.id === fontId; });
        if (!font) {
            console.warn("no font found with the id ".concat(fontId));
            font = { nome: 'courier', dimensione: 5, id: 'no configuration', colore: '#000000' };
        }
        // console.log("Il font definito in config", font);
        this.doc.setFont(font.nome, 'normal');
        this.doc.setFontSize(font.dimensione);
        this.doc.setTextColor(font.colore ? font.colore : undefined);
    };
    DocumentGenerator.prototype.extractPlaceholder = function (text) {
        var match = text.match(/^\$(\w+)\$$/);
        return match ? match[1] : null;
    };
    //#region installFont
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
                        // console.log(`this.doc.addFileToVFS ${fontName}.ttf`, "base64Font");
                        this.doc.addFileToVFS("".concat(fontName, ".ttf"), base64Font);
                        this.doc.addFont("".concat(fontName, ".ttf"), fontName, style);
                        this.doc.setFont(fontName);
                        return [2 /*return*/];
                }
            });
        });
    };
    //#endregion
    //#region writePageNumber
    DocumentGenerator.prototype.writePageNumber = function (label, totPages, fontId) {
        var pages = this.doc.internal.pages;
        // console.log("pages",pages);
        for (var p = 1; p < pages.length; p++) {
            this.doc.setPage(p);
            this.setupText(fontId);
            var strlabel = label ? label : 'Pagina';
            strlabel += " ".concat(p);
            if (totPages) {
                strlabel += " ".concat(totPages, " ").concat(pages.length - 1);
            }
            var bottomRight = {
                x: this.doc.internal.pageSize.getWidth() - this.config.margini.dx,
                y: this.doc.internal.pageSize.getHeight() - this.config.margini.basso
            };
            this.doc.text(strlabel, bottomRight.x, bottomRight.y, { align: 'left', baseline: 'hanging' });
        }
    };
    //#endregion
    //#region insertImage
    // Inserts images using the current cursor position.
    DocumentGenerator.prototype.insertImage = function (imgParam) {
        return __awaiter(this, void 0, void 0, function () {
            var startX, startY, format, base64Image, error_3;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        startX = this.curX;
                        startY = this.curY;
                        // this.debugCursor('#FF00FF', 'imageStart');
                        if (imgParam.posizione) {
                            startX += imgParam.posizione[0];
                            startY += imgParam.posizione[1];
                        }
                        format = ((_a = imgParam.path.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toUpperCase()) || 'PNG';
                        return [4 /*yield*/, loadImageAsBase64(imgParam.path)];
                    case 1:
                        base64Image = _b.sent();
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
                        return [2 /*return*/, { x: this.curX, y: this.curY }];
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
    DocumentGenerator.prototype.parseText = function (text, params) {
        var tagRegex = /<\|(.*?)\|>/g; // Trova i tag <|...|>
        var content = text.replace(tagRegex, "").trim(); // Rimuove i tag e lascia solo il testo principale
        content = this.applyTemplate(content, params.dynamicFields);
        content = this.applyPartiPlaceholders(content, params.parti);
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
        var txtCur = { x: this.curX, y: this.curY };
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
        this.doc.setDrawColor(this.config.box.lineColor);
        this.doc.setLineWidth(this.config.box.lineWidth);
        this.doc.setFillColor(this.config.box.background);
        this.doc.roundedRect(x, y, w, h, r, r, 'FD');
        this.xCursor = txtCur.x;
        this.yCursor = txtCur.y;
        for (var _b = 0, section_2 = section; _b < section_2.length; _b++) {
            var s = section_2[_b];
            var text_2 = s.text.replace(/\*\*/g, '');
            this.doc.setFont(this.doc.getFont().fontName, s.type);
            endCur = this.writeTextInLine(text_2, maxWidth, option);
        }
        this.yCursor = this.curY + (this.doc.getFontSize() * this.config.interlinea / 72 * 25.4);
        return endCur;
    };
    //#endregion
    //#region writeTextSection
    DocumentGenerator.prototype.writeTextSection = function (origText, params, offsetX, offsetY) {
        var finalCur = { x: NaN, y: NaN };
        var maxWidth = this.doc.internal.pageSize.getWidth()
            - this.config.margini.dx
            - (offsetX ? offsetX : this.curX);
        var write = this.parseText(origText, params);
        var textToWrite = write.content;
        this.setupText(write.fontId);
        var option = {
            align: write.hAlign ? write.hAlign : null,
            baseline: write.vAlign ? write.vAlign : null
        };
        var boxedText = textToWrite.match(/^\^.*\^$/);
        if (boxedText) {
            textToWrite = textToWrite.replace(/\^/g, '');
            finalCur = this.drawBox(textToWrite, maxWidth, option);
            this.curX = /*this.config.margini.sx +*/ offsetX;
        }
        else {
            var section = this.parseBoldSections(textToWrite);
            // writeSection
            for (var _i = 0, section_3 = section; _i < section_3.length; _i++) {
                var s = section_3[_i];
                var text = s.text.replace(/\*\*/g, '');
                this.doc.setFont(this.doc.getFont().fontName, s.type);
                // this.xCursor = startCur.x;
                finalCur = this.writeTextInLine(text, maxWidth, option, offsetX, offsetY);
                // this.debugCursor('#aa00aa', "finalCur");
            }
        }
        this.curX = this.config.margini.sx;
        // this.yCursor = this.curY + this.config.staccoriga;
        this.setupText();
        return finalCur;
    };
    //#endregion
    //#region writeTextInLine
    DocumentGenerator.prototype.writeTextInLine = function (text, maxWidth, option, offsetX, offsetY) {
        var words = text.split(" ");
        if (offsetX && this.curX < offsetX) {
            this.xCursor = offsetX;
        }
        var spaceWidth = this.doc.getTextWidth(" ");
        var lineWidth = 0;
        var netWidth = this.doc.internal.pageSize.getWidth() - this.config.margini.dx;
        for (var _i = 0, words_1 = words; _i < words_1.length; _i++) {
            var word = words_1[_i];
            var wordWidth = this.doc.getTextWidth(word);
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
    };
    //#endregion
    //#region generateDocument
    DocumentGenerator.prototype.generateDocument = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var _loop_1, this_1, _i, _a, block, error_4;
            var _this = this;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 9, , 10]);
                        return [4 /*yield*/, this.loadConfig()];
                    case 1:
                        _c.sent(); // read the config json file  
                        return [4 /*yield*/, this.initDoc()];
                    case 2:
                        _c.sent(); // prepares the doc obj and the cursor
                        _loop_1 = function (block) {
                            var finalCur, _loop_2, _d, _e, key;
                            return __generator(this, function (_f) {
                                switch (_f.label) {
                                    case 0:
                                        finalCur = { x: NaN, y: NaN };
                                        _loop_2 = function (key) {
                                            var _g, blockX, blockY, _h, testo, testoBox, tmpCur_1, _j, x, y, w, h, punti, _loop_3, _k, punti_1, section, imgParam, tmpCur, tabData, rowsNumber;
                                            return __generator(this, function (_l) {
                                                switch (_l.label) {
                                                    case 0:
                                                        _g = [this_1.curX, this_1.curY], blockX = _g[0], blockY = _g[1];
                                                        _h = key;
                                                        switch (_h) {
                                                            case 'testo': return [3 /*break*/, 1];
                                                            case 'testoBox': return [3 /*break*/, 2];
                                                            case 'punti': return [3 /*break*/, 3];
                                                            case 'immagine': return [3 /*break*/, 4];
                                                            case 'tabella': return [3 /*break*/, 6];
                                                            case 'saltoRiga': return [3 /*break*/, 7];
                                                        }
                                                        return [3 /*break*/, 8];
                                                    case 1:
                                                        testo = block[key];
                                                        if (Array.isArray(testo)) {
                                                            testo.forEach(function (riga, i, arr) {
                                                                var tmpCur = _this.writeTextSection(riga, params, blockX);
                                                                if (tmpCur.x > finalCur.x || Number.isNaN(finalCur.x))
                                                                    finalCur.x = Number(tmpCur.x);
                                                                if (tmpCur.y > finalCur.y || Number.isNaN(finalCur.y))
                                                                    finalCur.y = Number(tmpCur.y);
                                                                if (i < arr.length - 1)
                                                                    _this.yCursor = _this.yNewLine;
                                                                // this.debugCursor('#FA8072');
                                                            });
                                                        }
                                                        else {
                                                            finalCur = this_1.writeTextSection(testo, params, blockX);
                                                        }
                                                        // this.yCursor = this.curY + this.config.staccoriga;
                                                        return [3 /*break*/, 9];
                                                    case 2:
                                                        testoBox = block[key];
                                                        if (Array.isArray(testoBox)) {
                                                            tmpCur_1 = {
                                                                x: NaN,
                                                                y: NaN
                                                            };
                                                            testoBox.forEach(function (riga, i, arr) {
                                                                tmpCur_1 = _this.writeTextSection(riga, params, blockX);
                                                                if (tmpCur_1.x > finalCur.x || Number.isNaN(finalCur.x))
                                                                    finalCur.x = Number(tmpCur_1.x);
                                                                if (tmpCur_1.y > finalCur.y || Number.isNaN(finalCur.y))
                                                                    finalCur.y = Number(tmpCur_1.y);
                                                                if (i < arr.length - 1)
                                                                    _this.yCursor = _this.yNewLine;
                                                                // this.debugCursor('#FA8072');
                                                            });
                                                            _j = [
                                                                blockX - this_1.config.box.padding * 0.5,
                                                                blockY - (this_1.doc.getFontSize() * this_1.config.interlinea / 72) * 25.4 - (this_1.config.box.padding * 0.5),
                                                                finalCur.x - blockX + this_1.config.box.padding,
                                                                finalCur.y - blockY + this_1.config.box.padding + (this_1.doc.getFontSize() * this_1.config.interlinea / 72) * 25.4,
                                                                this_1.config.box.raggio,
                                                                this_1.config.box.raggio
                                                            ], x = _j[0], y = _j[1], w = _j[2], h = _j[3];
                                                            this_1.doc.setDrawColor(this_1.config.box.lineColor);
                                                            this_1.doc.setLineWidth(this_1.config.box.lineWidth);
                                                            this_1.doc.setFillColor(this_1.config.box.background);
                                                            this_1.doc.roundedRect(x, y, w, h, this_1.config.box.raggio, this_1.config.box.raggio, "FD");
                                                            this_1.curX = blockX;
                                                            this_1.curY = blockY;
                                                            testoBox.forEach(function (riga, i, arr) {
                                                                tmpCur_1 = _this.writeTextSection(riga, params, blockX);
                                                                if (tmpCur_1.x > finalCur.x || Number.isNaN(finalCur.x))
                                                                    finalCur.x = Number(tmpCur_1.x);
                                                                if (tmpCur_1.y > finalCur.y || Number.isNaN(finalCur.y))
                                                                    finalCur.y = Number(tmpCur_1.y);
                                                                if (i < arr.length - 1)
                                                                    _this.yCursor = _this.yNewLine;
                                                                // this.debugCursor('#FA8072');
                                                            });
                                                        }
                                                        else {
                                                            console.warn("testoBox value must be an array of strings");
                                                        }
                                                        // this.yCursor = this.curY + this.config.staccoriga;
                                                        return [3 /*break*/, 9];
                                                    case 3:
                                                        punti = block[key];
                                                        _loop_3 = function (section) {
                                                            // console.log("Section Title", section.titolo);
                                                            finalCur = this_1.writeTextSection(section.titolo, params);
                                                            this_1.curY += this_1.config.staccoriga;
                                                            var tmpCur_2 = { x: finalCur.x, y: finalCur.y };
                                                            for (var _m = 0, _o = section.sottopunti; _m < _o.length; _m++) {
                                                                var point = _o[_m];
                                                                // console.log("Point title:", point.titolo, " point content: ", point.contenuto);
                                                                // this.curX = this.config.margini.sx + this.config.rientro;
                                                                var offset = this_1.config.margini.sx + this_1.config.rientro;
                                                                tmpCur_2 = this_1.writeTextSection(point.titolo, params, offset);
                                                                this_1.curY = this_1.yNewLine;
                                                                (_b = point.contenuto) === null || _b === void 0 ? void 0 : _b.forEach(function (line) {
                                                                    var offset = _this.config.margini.sx + _this.config.rientro * 2;
                                                                    tmpCur_2 = _this.writeTextSection(line, params, offset);
                                                                    _this.curY = _this.yNewLine;
                                                                });
                                                                this_1.yCursor = this_1.curY + this_1.config.staccoriga;
                                                            }
                                                            if (tmpCur_2.x > finalCur.x || Number.isNaN(finalCur.x))
                                                                finalCur.x = Number(tmpCur_2.x);
                                                            if (tmpCur_2.y > finalCur.y || Number.isNaN(finalCur.y))
                                                                finalCur.y = Number(tmpCur_2.y);
                                                        };
                                                        for (_k = 0, punti_1 = punti; _k < punti_1.length; _k++) {
                                                            section = punti_1[_k];
                                                            _loop_3(section);
                                                        }
                                                        return [3 /*break*/, 9];
                                                    case 4:
                                                        imgParam = block[key];
                                                        return [4 /*yield*/, this_1.insertImage(imgParam)];
                                                    case 5:
                                                        tmpCur = _l.sent();
                                                        if (tmpCur.x > finalCur.x || Number.isNaN(finalCur.x))
                                                            finalCur.x = Number(tmpCur.x);
                                                        if (tmpCur.y > finalCur.y || Number.isNaN(finalCur.y))
                                                            finalCur.y = Number(tmpCur.y);
                                                        return [3 /*break*/, 9];
                                                    case 6:
                                                        tabData = params.dynamicElements[block[key]];
                                                        // console.log("Dati tabella: ", tabData, "\n$$$$$$$font", this.doc.getFont().fontName);
                                                        if (!tabData.config.styles) {
                                                            tabData.config.styles = {
                                                                font: this_1.doc.getFont().fontName,
                                                                fontSize: this_1.doc.getFontSize(),
                                                                textColor: this_1.doc.getTextColor(),
                                                            };
                                                        }
                                                        else if (!tabData.config.styles.font) {
                                                            tabData.config.styles.font = this_1.doc.getFont().fontName;
                                                            tabData.config.styles.fontSize = this_1.doc.getFontSize();
                                                            tabData.config.styles.textColor = this_1.doc.getTextColor();
                                                        }
                                                        (0, jspdf_autotable_1.default)(this_1.doc, __assign(__assign({}, tabData.config), { startY: this_1.curY, margin: {
                                                                left: this_1.config.margini.sx,
                                                                right: this_1.config.margini.dx
                                                            }, styles: __assign({}, tabData.config.styles) }));
                                                        return [3 /*break*/, 9];
                                                    case 7:
                                                        rowsNumber = Number(block[key]);
                                                        finalCur.y = this_1.curY + (this_1.doc.getFontSize() * this_1.config.interlinea / 72) * 25.4 * rowsNumber;
                                                        return [3 /*break*/, 9];
                                                    case 8: return [3 /*break*/, 9];
                                                    case 9:
                                                        if (!Number.isNaN(finalCur.x))
                                                            this_1.xCursor = finalCur.x;
                                                        if (!Number.isNaN(blockY))
                                                            this_1.yCursor = blockY;
                                                        return [2 /*return*/];
                                                }
                                            });
                                        };
                                        _d = 0, _e = Object.keys(block);
                                        _f.label = 1;
                                    case 1:
                                        if (!(_d < _e.length)) return [3 /*break*/, 4];
                                        key = _e[_d];
                                        return [5 /*yield**/, _loop_2(key)];
                                    case 2:
                                        _f.sent();
                                        _f.label = 3;
                                    case 3:
                                        _d++;
                                        return [3 /*break*/, 1];
                                    case 4:
                                        if (!Number.isNaN(finalCur.y))
                                            this_1.yCursor = finalCur.y;
                                        this_1.yCursor = this_1.yNewLine + this_1.config.staccoriga;
                                        this_1.curX = this_1.config.margini.sx;
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _i = 0, _a = this.contenuti;
                        _c.label = 3;
                    case 3:
                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                        block = _a[_i];
                        return [5 /*yield**/, _loop_1(block)];
                    case 4:
                        _c.sent();
                        _c.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6:
                        ;
                        if (params.numPagina) {
                            this.writePageNumber(params.numPagina.label, params.numPagina.totPages, params.numPagina.fontId);
                        }
                        this.doc.save(params.nomeFile);
                        if (!(params.allegaDocDopo || params.allegaDocPrima)) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.mergeDocument(params)];
                    case 7:
                        _c.sent();
                        _c.label = 8;
                    case 8: return [3 /*break*/, 10];
                    case 9:
                        error_4 = _c.sent();
                        console.error(error_4);
                        return [3 /*break*/, 10];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    //#endregion
    //#region mergeDocument
    /**
     * # Merge external pdf
     * Take the path of a file and the path of the generated doc, merge the generated with
     * the input file and saves the final document with `nomeFile` found un `DocumentParams`
     *
     * @param pathDocBefore
     * @param pathDocAfter
     */
    DocumentGenerator.prototype.mergeDocument = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var mergedPdf, before, _a, _b, doc, _c, _d, after, _e, _f, copiedPages, _g, _h, _j;
            return __generator(this, function (_k) {
                switch (_k.label) {
                    case 0: return [4 /*yield*/, pdf_lib_1.PDFDocument.create()];
                    case 1:
                        mergedPdf = _k.sent();
                        _b = (_a = pdf_lib_1.PDFDocument).load;
                        return [4 /*yield*/, fs_1.promises.readFile(params.allegaDocPrima)];
                    case 2: return [4 /*yield*/, _b.apply(_a, [_k.sent()])];
                    case 3:
                        before = _k.sent();
                        _d = (_c = pdf_lib_1.PDFDocument).load;
                        return [4 /*yield*/, fs_1.promises.readFile(params.nomeFile)];
                    case 4: return [4 /*yield*/, _d.apply(_c, [_k.sent()])];
                    case 5:
                        doc = _k.sent();
                        _f = (_e = pdf_lib_1.PDFDocument).load;
                        return [4 /*yield*/, fs_1.promises.readFile(params.allegaDocDopo)];
                    case 6: return [4 /*yield*/, _f.apply(_e, [_k.sent()])];
                    case 7:
                        after = _k.sent();
                        // copy pages on the temporary object document
                        console.log("readed documnent: ", doc);
                        return [4 /*yield*/, mergedPdf.copyPages(before, before.getPageIndices())];
                    case 8:
                        copiedPages = _k.sent();
                        copiedPages.forEach(function (page) {
                            mergedPdf.addPage(page);
                        });
                        copiedPages = [];
                        return [4 /*yield*/, mergedPdf.copyPages(doc, doc.getPageIndices())];
                    case 9:
                        copiedPages = _k.sent();
                        copiedPages.forEach(function (page) {
                            mergedPdf.addPage(page);
                        });
                        copiedPages = [];
                        return [4 /*yield*/, mergedPdf.copyPages(after, after.getPageIndices())];
                    case 10:
                        copiedPages = _k.sent();
                        copiedPages.forEach(function (page) {
                            mergedPdf.addPage(page);
                        });
                        _h = (_g = fs_1.promises).writeFile;
                        _j = [params.nomeFile];
                        return [4 /*yield*/, mergedPdf.save()];
                    case 11: return [4 /*yield*/, _h.apply(_g, _j.concat([_k.sent()]))];
                    case 12:
                        _k.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return DocumentGenerator;
}());
exports.DocumentGenerator = DocumentGenerator;
