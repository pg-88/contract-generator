<# Contract Generator

- [Descrizione](#descrizione)
- [Funzionamento](#funzionamento)
- [`DocumentParams`](#documentparams)
- [`DocumentConfig`](#documentconfig)
  - [Definizione dei **font**](#definizione-dei-font)
  - [Inserimento testi](#inserimento-testi)
  - [Inserimento immagini](#inserimento-immagini)
  - [Elenchi](#elenchi)
  - [Struttura per il template `.json`](#struttura-per-il-template-json)
    - [Sezioni File](#sezioni-file)
      - [versione](#versione)
      - [impostazioni pagina](#impostazioni-pagina)
      - [contenuti](#contenuti)
    - [Esempio file](#esempio-file)
    - [Sintassi per formattazione](#sintassi-per-formattazione)


## Descrizione

Libreria che genera pdf con la possibilità di inserire testi, immagini, elenchi, ~~tabelle~~ 

## Funzionamento

I dati che vanno a generare il documento arrivano da due oggetti: `DocumentParams` e `DocumentConfig`. 
- `DocumentConfig` costituisce lo scheletro rigido del documento e da quindi la struttura di base definendo la posizione e gli stili degli elementi nel pdf
- `DocumentParams` viene passato dinamicamente ogni volta che si genera un documento e contiene i dati variabili come nomi, date, dati contenuti nelle tabelle ecc..



## `DocumentParams`

## `DocumentConfig`

Essendo un elemento statico che mira a costituire un template fisso per ogni documento, è possibile definirlo all'interno del progetto come file `.json`. Passando al costruttore il percorso di tale file verrà letto direttamente dalla libreria.

### Definizione dei **font**

Possiamo predisporre 
font disponibili di default: 
- helvetica: [ 'normal', 'bold', 'italic', 'bolditalic' ],
- Helvetica: [ '', 'Bold', 'Oblique', 'BoldOblique' ],
- courier: [ 'normal', 'bold', 'italic', 'bolditalic' ],
- Courier: [ '', 'Bold', 'Oblique', 'BoldOblique' ],
- times: [ 'normal', 'bold', 'italic', 'bolditalic' ],
- Times: [ 'Roman', 'Bold', 'Italic', 'BoldItalic' ],
- zapfdingbats: [ 'normal' ],
- ZapfDingbats: [ '' ],
- symbol: [ 'normal' ],
- Symbol: [ '' ],


### Inserimento testi

I testi possono essere inseriti con la chiave `testo` e il contenuto di tale campo può essere sia una stringa che un'array di stringhe. Passando un array di stringhe, il sistema scrive una riga per ogni elemento dell'array.

Questo testo può essere formattato utilizzando una serie di [tag]() che permettono di definire il font (tra quelli indicati vedi [sopra](#definizione-dei-font)) e l'allineamento del testo.


### Inserimento immagini

Per inserire un'immagine occore inserire, nella sezione contenuti file `json` un elemento `immagine` che conterrà i seguenti campi: 
````json
"immagine": {
        "path": "./logo-contratto.png",
        "posizione": [
          180,
          100
        ],
        "dimensioni": [
          40,
          10
        ],
        "coeffDim": 0.042
      }
````
- `path` percorso nel sistema del file immagine
- `posizione` posizione relativa al cursore, il primo elemento per il posizionamento orizzontale, il secondo per quello verticale (crescente verso il basso). Essendo tutta la stesura del documento pensata in modo sequenziale, gli elementi vengono inseriti nel pdf seguendo l'ordine in cui sono stati definiti nel `json`, la posizione per l'immagine serve per dare un offset rispetto alla posizione attuale per permettere di correggere la posizione. **Attenzione** questo sistema non controlla la sovrapposizone degli elementi, è quindi consigliabile testare la creazione del documento ad ogni modifica.
- `dimensioni` larghezza, altezza. Il campo è obbligatorio e permette qualsiasi valore, non mantiene quindi le proporzioni originali dell'immagine
- `coeffDim` *NON IMPLEMENTATO*

### Elenchi 
- • `Alt` + 7 tastierino
- ○ `Alt` + 9 tastierino
- ► `Alt` + 16 tastierino
- → `Alt` + 26 tastierino

### Struttura per il template `.json`

#### Sezioni File

##### versione
numero della versione del documento serve in produzione per avere traccia di eventuali modifiche nel tempo. (*non viene mostrato nel documento finale*)
##### impostazioni pagina

##### contenuti
i tipi di contenuto possono essere: 
- `testo`:
- `immagine` vedi dettagli di funzionamento alla sezione [inserimento immagini](#inserimento-immagini)
- `Punti`
#### Esempio file 

````json

{
  "versione": "0.1.1",
  "impostazioniPagina": {
    "fontDefault": {
      "nome": "courier",
      "dimensione": 12,
      "colore": "#6fcdc2",
      "installPath": "./Montserrat-Bold.ttf"
    },
    "fontAlternative": {
      "nome": "helvetica",
      "dimensione": 10,
      "colore": "#000000"
    },
    "margini": {
      "sx": 10,
      "dx": 10,
      "alto": 18,
      "basso": 10
    },
    "staccoriga": 5,
    "rientro": 5,
    "box": {
      "backgrund": "#d9efee",
      "raggio": 5
    }
  },
  "contenuti": {
    "titolo": "Contratto di servizio tra bnbkit srl e $cliente:denominazione$",
    "sottotitolo": "Il presente contratto (di seguito, \"Contratto\") regola i termini e le condizioni tra $fornitore:denominazione$, codice fiscale $fornitore:codiceFiscale$, con sede in $fornitore:indirizzoCompleto$, e $cliente:denominazione$, codice fiscale $cliente:codiceFiscale$, con sede in $cliente:indirizzoCompleto$, per la fornitura e gestione di kit di biancheria da lavanderie industriali.",
    "corpoTesto": "^Box della denominazione del cliente $clienteNome$^",
    "immagine": {
      "path": "./logo-contratto.png",
      "posizione": [
        100,
        100
      ],
      "dimensioni": [
        52.67,
        17.81
      ],
      "coeffDim": 0.042
    },
    "Punti": [
      {
        "titolo": "1. OGGETTO DEL CONTRATTO",
        "Sottopunti": [
          {
            "titolo": "1.1. Servizio fornito da bnbkit srl",
            "contenuto": "bnbkit si impegna a:\n• Noleggiare kit unico di biancheria al Cliente.\n• Garantire la movimentazione dei kit, consegnando kit puliti e ritirando kit sporchi secondo le modalità previste.\n• Monitorare i movimenti e il saldo kit tramite il portale cliente."
          },
          {
            "titolo": "1.2. Movimentazione in kit unico",
            "contenuto": "I kit sono movimentati esclusivamente in forma completa (sia per il ritiro dello sporco che per la consegna del pulito). Non sono accettati articoli sfusi."
          },
          {
            "titolo": "1.3. Ordini",
            "contenuto": "Gli **ordini** possono essere caricati:\n• Manualmente tramite lo store e-commerce bnbkit,\n• Automaticamente tramite integrazione con il Channel Manager.\n• Gli ordini devono rispettare i check-out, assicurando che il numero di kit consegnati corrisponda al numero di kit ritirati con una tolleranza di +/-1."
          },
          {
            "titolo": "1.4. Scorte minime e gestione emergenze",
            "contenuto": "Ogni letto deve disporre di tre kit:\n• Kit in uso.\n• Kit cambio.\n• Kit emergenza: fornito in fase di avviamento punto di consegna a titolo gratuito da bnbkit. Se utilizzato, il Cliente deve pagare il costo di noleggio per il reintegro.\n• Scorte eccessive non sono consentite."
          },
          {
            "titolo": "1.5. Gestione kit smarriti",
            "contenuto": "Qualora un kit non venga movimentato per due cicli consecutivi, sarà considerato smarrito e addebitato al Cliente al valore convenzionale di vendita."
          },
          {
            "titolo": "1.6. Controllo qualità e articoli fallati",
            "contenuto": "In caso di articoli fallati, il Cliente deve inserire il capo difettoso nell'apposito sacchetto fornito da bnbkit e utilizzare il medesimo articolo contenuto nel kit emergenza. Il rider provvederà al reintegro del kit emergenza con un articolo nuovo e al ritiro dell'articolo fallato."
          }
        ]
      },
      {
        "titolo": "2. MODALITÀ DI PAGAMENTO",
        "Sottopunti": [
          {
            "titolo": "2.1. Il Cliente è tenuto a pagare:",
            "contenuto": "• Il costo del noleggio kit secondo le tariffe bnbkit\n• Eventuali costi aggiuntivi (consegna, reintegro, smarrimenti, ecc.)."
          },
          {
            "titolo": "2.2. Il pagamento deve avvenire al momento dell'ordine tramite:",
            "contenuto": "• Carta di credito\n• SEPA (bonifico bancario)\n• SDD"
          }
        ]
      },
      {
        "titolo": "3. CONSEGNA E RITIRO",
        "Sottopunti": [
          {
            "titolo": "3.1. Modalità di consegna e logistica",
            "contenuto": "bnbkit utilizza un software di ottimizzazione logistica per calcolare i percorsi ottimali nel rispetto degli orari di consegna.\nLe consegne negli appartamenti sono effettuate nella fascia oraria 10:00-15:00. Per altre destinazioni, le consegne saranno effettuate senza vincoli di orario nella giornata programmata."
          },
          {
            "titolo": "3.2. Accesso ai locali",
            "contenuto": "Il Cliente è obbligato a rendere bnbkit autonomo nell'accesso ai locali (specifiche da definire)."
          },
          {
            "titolo": "3.3. Consegne mancanti o ritardate",
            "contenuto": "In caso di mancata consegna per cause imputabili al Cliente, la consegna sarà riprogrammata con addebito:\n• Del costo della consegna “saltata”.\n• Del costo della nuova consegna."
          },
          {
            "titolo": "3.4. Completamento del servizio",
            "contenuto": "Il servizio si considera completato al momento della consegna dei kit puliti."
          }
        ]
      },
      {
        "titolo": "4. MONITORAGGIO E CONTROLLO",
        "Sottopunti": [
          {
            "titolo": "4.1. Monitoraggio RFID",
            "contenuto": "bnbkit monitora costantemente i movimenti dei kit attraverso il sistema Radio Frequency Identification RFID (ogni capo è dotato di chip)."
          },
          {
            "titolo": "4.2. Articoli mancanti",
            "contenuto": "Gli articoli mancanti saranno comunicati al Cliente. Se non restituiti al passaggio successivo, saranno considerati smarriti e addebitati al valore convenzionale di vendita."
          }
        ]
      },
      {
        "titolo": "5. DURATA E RISOLUZIONE DEL CONTRATTO",
        "Sottopunti": [
          {
            "titolo": "5.1. Durata",
            "contenuto": "Il contratto ha durata di 12 mesi con rinnovo automatico salvo disdetta scritta con preavviso di 30 giorni."
          },
          {
            "titolo": "5.2. Risoluzione",
            "contenuto": "bnbkit potrà risolvere il contratto nei seguenti casi:\n• Mancato pagamento.\n• Violazione delle condizioni di gestione dei kit."
          },
          {
            "titolo": "5.3. Restituzione kit in caso di disdetta",
            "contenuto": "In caso di disdetta, il Cliente deve restituire i kit entro 30 giorni. Decorso tale termine, bnbkit considererà i kit smarriti e li addebiterà al valore convenzionale di vendita."
          }
        ]
      },
      {
        "titolo": "6. CAMPIONATURA",
        "Sottopunti": [
          {
            "titolo": "",
            "contenuto": "6.1. I kit forniti per campionatura sono consegnati a titolo di visione e devono essere restituiti."
          },
          {
            "titolo": "",
            "contenuto": "6.2. In caso di mancata restituzione, bnbkit addebiterà il costo di noleggio o il valore convenzionale di vendita al Cliente."
          }
        ]
      },
      {
        "titolo": "7. RESPONSABILITÀ DELLE PARTI",
        "Sottopunti": [
          {
            "titolo": "7.1. Obblighi del Cliente",
            "contenuto": "• Garantire l'accesso ai locali per le operazioni di consegna e ritiro.\n• Effettuare ordini in modo corretto e in conformità con i check-out.\n• Segnalare eventuali articoli fallati secondo le modalità previste.\n• Rispettare i termini di pagamento."
          },
          {
            "titolo": "7.2. Obblighi di BNBKIT",
            "contenuto": "• Garantire la consegna puntuale e il ritiro regolare dei kit.\n• Fornire supporto per eventuali problemi tecnici."
          }
        ]
      },
      {
        "titolo": "8. FORO COMPETENTE",
        "Sottopunti": [
          {
            "titolo": "",
            "contenuto": "**Per ogni controversia derivante dal presente contratto, sarà competente il Foro di Genova.**"
          }
        ]
      },
      {
        "titolo": "9. ACCETTAZIONE",
        "Sottopunti": [
          {
            "titolo": "",
            "contenuto": "Le Parti dichiarano di accettare **integralmente** i termini e le condizioni del presente contratto."
          }
        ]
      },
      {
        "titolo": "10. TABELLA",
        "Sottopunti": [
          {
            "titolo": "",
            "contenuto": "$TABLE1$"
          }
        ]
      },
      {
        "titolo": "11. TESTOBOX",
        "Sottopunti": [
          {
            "titolo": "",
            "contenuto": "^prova di testo dentro una **box** prova prova prova^"
          }
        ]
      }
    ]
  }
}

````
----

#### Sintassi per formattazione
*ipotesi iniziale*
- Tag per lo stile: usare il carattere `<| |>` seguito da una chiave e il valore
  - `<|font: times|>` setta il font a Times new roman
  - `<|size: 9|>` setta la dimensione del font
  - `<|style: bold|>` setta lo stile
- Tag per il posizionamento usando i caratteri `<<>>`
  - `<|vAlign: center|>` centra il testo verticalmente
  - `<|hAlign: center|>` centra il testo orizzontalmente
Quanto non vengono passati tag, la formattazione diventa quella contenuta in fontDefault ( vedi [impostazioni pagina](#impostazioni-pagina)) e il posizionamento viene dettato dalla posizione del cursore.

