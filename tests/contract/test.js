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
Object.defineProperty(exports, "__esModule", { value: true });
const ContractGenerator_1 = require("../../ContractGenerator");
function testDocumentGenerator() {
    return __awaiter(this, void 0, void 0, function* () {
        const generator = new ContractGenerator_1.DocumentGenerator('test.json');
        const params = {
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
                numeroContratto: 'ABC123'
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
        try {
            const output = yield generator.generateDocument(params);
            console.log("Document generated successfully:", output);
        }
        catch (error) {
            console.error("Error generating document:", error);
        }
    });
}
// Run the test.
testDocumentGenerator();
