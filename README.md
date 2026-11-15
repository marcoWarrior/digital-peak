# 🏔️ Digital Peak — Growth Without Limits

> Sito web istituzionale di **Digital Peak**, agenzia B2B ad alto contenuto tecnologico specializzata in Lead Generation, eCommerce B2B, Agentic AI, Marketing Automation, Marketing Strategy e Web App su misura.

---

## 📁 Struttura del Progetto (Clean Architecture)

Il progetto adotta un'architettura standard per siti web moderni, scalabile e manutenibile:

```text
digital-peak/
│
├── index.html                     # Homepage con navigazione e panoramica dei 6 servizi
├── README.md                      # Documentazione completa e guida operativa
│
├── assets/                        # Risorse statiche condivise
│   ├── css/
│   │   └── style.css              # Foglio di stile globale (design system, variabili CSS, responsive)
│   ├── js/
│   │   ├── i18n.js                # Motore multilingua (IT, EN, ES) con supporto offline
│   │   └── main.js                # Interazioni UI, hamburger menu, scroll reveal, parallax, form
│   ├── img/
│   │   └── DigitalPeak_Logo.png   # Logo ufficiale dell'agenzia
│   └── locales/                   # File JSON delle traduzioni (modificabili dal team marketing)
│       ├── it.json                # Italiano (default)
│       ├── en.json                # Inglese
│       └── es.json                # Spagnolo
│
└── pages/                         # Pagine dedicate alle 6 macro-aree di servizio
    ├── agentic-ai.html            # Area Agentic AI (Marco)
    ├── marketing-automation.html  # Area Marketing Automation (Marco)
    ├── siti-web.html              # Area Siti & App Web (Marco)
    ├── lead-generation.html       # Area Lead Generation B2B (Giuliano)
    ├── ecommerce-cro.html         # Area eCommerce B2B & CRO (Giuliano)
    └── strategia-marketing.html   # Area Marketing Strategy (Giuliano)
```

---

## 👥 Divisione dei Ruoli & Responsabilità

| Responsabile | Ruolo | Macro-aree di Competenza |
|---|---|---|
| **Marco** | Developer | **Agentic AI** · **Marketing Automation** · **Siti & App Web** |
| **Giuliano** | Growth Hacker | **Lead Generation B2B** · **eCommerce B2B** · **Marketing Strategy** |

---

## 🌐 Guida alle Traduzioni (Per Giuliano / Content Manager)

Tutti i testi della homepage sono centralizzati nei file JSON dentro la cartella `assets/locales/`:
- `assets/locales/it.json` per l'Italiano
- `assets/locales/en.json` per l'Inglese
- `assets/locales/es.json` per lo Spagnolo

### Come modificare o aggiungere un testo:
1. Apri il file corrispondente con un editor di testo o VS Code.
2. Trova la chiave corrispondente (es. `"hero_title"`, `"s1_title"`, `"form_submit"`).
3. Modifica la frase mantenendo intatte le virgolette e la virgola alla fine della riga.
4. Salva il file. Al ricaricamento del browser le modifiche saranno attive istantaneamente.

> **💡 Nota tecnica:** Il file `assets/js/i18n.js` include un meccanismo automatico di fallback: se apri il file `index.html` direttamente con doppio click (protocollo `file://`), il sito userà il dizionario interno senza errori CORS; se il sito gira su un server web locale o in produzione su Vercel, caricherà dinamicamente i file JSON.

---

## 🖱️ Risoluzione del Cursore

**Problema riscontrato:** Su schermi desktop il puntatore del mouse spariva improvvisamente su qualsiasi sfondo (bianco, scuro o colorato).  
**Causa:** Nel CSS era presente la regola globale `body { cursor: none; }` unita a script del cursore custom basati su `mix-blend-mode: difference`, che rendevano invisibile il cursore di sistema.  
**Soluzione applicata:** 
- Rimosso `cursor: none;` dal `body`.
- Eliminati tutti gli overlay del cursore custom.
- Il puntatore di sistema standard è ora sempre visibile su ogni dispositivo, con feedback `cursor: pointer` su tutti i bottoni e link cliccabili.

---

## 🧪 Come Testare il Sito

### Metodo 1: Doppio Click Diretto su `index.html` (Test Rapido)
Puoi fare doppio click sul file `index.html` da Esplora File di Windows:
- Si aprirà nel tuo browser predefinito (`file:///...`).
- Funzionano tutte le grafiche, immagini, layout responsive, transizioni, menu hamburger e lo switcher di lingua (grazie al fallback offline).

### Metodo 2: VS Code Live Server (Consigliato per lo Sviluppo)
1. Installa l'estensione **Live Server** di VS Code.
2. Fai tasto destro su `index.html` ➔ **Open with Live Server**.
3. Il sito girerà su `http://127.0.0.1:5500`, consentendo l'aggiornamento automatico ad ogni salvataggio dei file JSON e del codice.

---

## ✉️ Gestione del Form Contatti (Full Stack Architecture)

Il form contatti invia i dati in modo completamente trasparente e asincrono (AJAX via `fetch`), **senza aprire alcun programma o client di posta sul computer dell'utente**, mostrando un feedback visivo immediato direttamente nella pagina (*Inviato con successo* o eventuale errore).

### 🛠️ Come funziona l'architettura:
1. **Frontend (`assets/js/main.js`):** Invia una richiesta HTTP `POST` a `/api/contact` con i campi compilati (`name`, `email`, `phone`, `message`, `lang`).
2. **Serverless Backend (`api/contact.js`):** Eseguito automaticamente su **Vercel**:
   - Salva il lead in tempo reale su **Supabase** (tabella `leads`).
   - Invia la notifica via **Resend** a:
     - `giulianoguerriero@gmail.com`
     - `marco.guerriero1994@gmail.com`
   - Risponde al frontend con esito positivo `{ success: true }`.

### 🗄️ Setup Database Supabase:
1. Apri il tuo progetto su [Supabase](https://supabase.com).
2. Vai su **SQL Editor** nel menu a sinistra.
3. Copia e incolla l'intero contenuto del file [`supabase/schema.sql`](file:///c:/Users/Utente/source/repos/Workspace/digital-peak/supabase/schema.sql) ed esegui la query.
4. Verrà creata la tabella `leads` con indici, campi profilati e Row Level Security (RLS) già configurata.

### 🔑 Configurazione Variabili d'Ambiente su Vercel:
Vai nel pannello del progetto su Vercel ➔ **Settings** ➔ **Environment Variables** e inserisci le chiavi (vedi [`.env.example`](file:///c:/Users/Utente/source/repos/Workspace/digital-peak/.env.example)):
* `SUPABASE_URL`: l'URL del tuo database Supabase (es. `https://xxxx.supabase.co`)
* `SUPABASE_ANON_KEY`: la chiave API anon/public di Supabase
* `RESEND_API_KEY`: la tua API key di [Resend](https://resend.com)
* `NOTIFICATION_EMAILS`: `giulianoguerriero@gmail.com,marco.guerriero1994@gmail.com`

---

## 🚀 Architettura di Deployment & Cloud

```text
┌────────────────┐       ┌────────────────┐       ┌────────────────┐
│     GITHUB     │ ────> │     VERCEL     │ ────> │    SUPABASE    │
│ (Repo & CI/CD) │       │ (Static Host)  │       │ (DB & Backend) │
└────────────────┘       └────────────────┘       └────────────────┘
```

1. **Version Control:** Repository Git su **GitHub**.
2. **Frontend Hosting:** **Vercel** collegato direttamente al branch `main` di GitHub per deploy continui e automatici a ogni push.
3. **Backend & Database:** **Supabase** per database PostgreSQL, API REST/GraphQL e autenticazione/lead tracking quando necessario.
