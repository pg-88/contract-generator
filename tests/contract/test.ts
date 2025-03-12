import { DocumentGenerator, DocumentParams } from '../../ContractGenerator';

async function testDocumentGenerator() {
    const generator = new DocumentGenerator('test.json');
    const params: DocumentParams = {
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

    try {
        const output = await generator.generateDocument(params);
        console.log("Document generated successfully:", output);
    } catch (error) {
        console.error("Error generating document:", error);
    }
}

// Run the test.
testDocumentGenerator();