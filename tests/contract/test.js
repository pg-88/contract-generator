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
var ContractGenerator_1 = require("../../ContractGenerator");
function testDocumentGenerator() {
    return __awaiter(this, void 0, void 0, function () {
        var generator, params, output, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    generator = new ContractGenerator_1.DocumentGenerator('testElencoContent.json');
                    params = {
                        parti: {
                            fornitore: {
                                denominazione: "Supplier Co",
                                codiceFiscale: "123456789",
                                indirizzoCompleto: "Via Supplier, 1, 00100 Roma"
                            },
                            cliente: {
                                denominazione: "Acme Corp",
                                codiceFiscale: "987654321",
                                indirizzoCompleto: "Via Client, 2, 20100 Milano"
                            }
                        },
                        tipOutput: 'd', // 'f' to open in a new window for visual inspection.
                        dynamicFields: {
                            numeroContratto: 'ABC123',
                            data: new Date().toLocaleDateString('it-IT', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })
                        },
                        dynamicElements: {
                            TABLE1: {
                                type: 'table',
                                config: {
                                    head: ['Column 1', 'Column 2'],
                                    body: [
                                        ['Row 1, Col 1', 'Row 1, Col 2'],
                                        ['Row 2, Col 1', 'Row 2, Col 2']
                                    ],
                                    options: {
                                        theme: 'striped'
                                    },
                                    styles: {
                                        headStyles: {
                                            fillColor: "#03fc0b"
                                        },
                                        columnStyles: {
                                            0: {
                                                fontStyle: 'bold'
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, generator.generateDocument(params)];
                case 2:
                    output = _a.sent();
                    console.log("Document generated successfully:", output);
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error("Error generating document:", error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Run the test.
testDocumentGenerator();
