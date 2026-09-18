# GYM BUDDY

App personale per tenere insieme corsa e sala pesi: la consulto col telefono
appoggiato alla panca tra una serie e l'altra, e la sera dopo l'uscita per
riportare i numeri che leggo sull'orologio.

Si chiamava Ferro fino ad agosto 2026. Il rename ha portato con sé il path di
GitHub Pages (`/gym-buddy/`, deve combaciare col nome della repo) e il prefisso di
localStorage (`gymbuddy:`); `migraDaFerro()` in `storage.js` ricopia i dati vecchi.

Da agosto 2026 l'app segue il piano mezza maratona del 7 febbraio 2027 e registra
anche le uscite di corsa. Il nome resta GYM BUDDY: rinominare significa rifare
path di Pages e prefisso di storage, e non vale il disturbo finché il nome
definitivo non è deciso.

## Comandi

```bash
npm install
npm run dev      # server locale, --host così lo apro dal telefono sulla stessa rete
npm run build
npm run preview
npm test         # node --test sul modello: migrazione, carico, record, piano
```

## Stack

- React 18 + Vite
- recharts per i grafici, caricato con `React.lazy` solo dalla scheda Progressi
- vite-plugin-pwa per l'installazione sul telefono
- Nessuna libreria di UI: tutto il CSS sta in un tag `<style>` in `src/stile.jsx`,
  con le variabili colore su `.root`

## Struttura

```
src/
  App.jsx              guscio: stato, tab, cronometro, recupero, fogli modali
  modello.js           il modello unificato della sessione e tutti i suoi conti
  storage.js           persistenza su localStorage, export JSON/CSV, import
  timer.js             suono, vibrazione e notifica di fine recupero
  stile.jsx            tutto il CSS
  dati/
    esercizi.js        catalogo esercizi, normalizzato per id
    schede.js          le schede di sala pesi (P, A, B) che citano quegli id
    scale.js           ENERGIA, SODDISFAZIONE, RPE, FEEL
    piano.js           le 24 settimane del piano mezza maratona
  schermate/           Oggi, Forza, Corsa, Riepilogo, Esito, Storico, Progressi,
                       Dati, Onboarding
  componenti/          base.jsx (anello, scale, stepper, confronto), Grafico.jsx
test/modello.test.js   36 test sulle funzioni pure
public/icon.svg        icona PWA
```

## Come funziona

### Il modello unificato

Corsa e forza sono la stessa cosa vista da due angoli. Ogni sessione ha data,
durata, RPE e **carico relativo**; i sotto-oggetti `corsa` e `forza` portano
quello che è specifico. Le viste che confrontano, sommano e disegnano lavorano
solo sui campi comuni, quindi aggiungere una terza disciplina significa scrivere
una schermata di inserimento e nient'altro.

```js
{
  id, userId: "local", data, tipo: "forza" | "corsa" | "altro",
  durataSec, durataMin, rpe: 1..5, note, stato: "bozza" | "completata",
  caricoRelativo,                       // durataMin × rpe
  corsa?: { distanzaKm, passoMedioSec, dislivello, fcMedia, tipoSessione, minutoFastidio },
  forza?: { scheda, esercizi: [ { nomeId, serie: [ { reps, carico, completata } ] } ] },
  energy, satisfaction, feel
}
```

`userId` vale sempre `"local"`: non c'è nessun account e in v1 non ci sarà, ma il
campo c'è già così il giorno che arriva la sincronizzazione non serve rimettere
le mani in ogni riga dello storico.

Lo stato completo sta sotto la chiave `gymbuddy:diario-v2`:

```js
{
  versione: 2, userId, userName,
  sessioni: [ Sessione ],              // più recente in testa
  ultimiCarichi: { idEsercizio: kg },
  active: { scheda, startedAt, esercizi, extra, warmup, energy } | null,
  energyLog: [ { ts, level } ],        // più recente in testa, ultimi 400
  obiettivoPalestra, sogliaCarico, ultimoBackup
}
```

`active` viene salvato a ogni serie registrata: se chiudo l'app a metà
allenamento e riapro, ritrovo il cronometro che gira e le serie già fatte.

### Migrazione

`migraStato()` traduce lo stato vecchio (`gymbuddy:palestra-v1`, solo palestra,
`type: "A"|"B"` e `log` come mappa) nel formato nuovo. La chiave vecchia resta
intatta: la si legge una volta e non la si tocca più, così un rollback non perde
niente — stessa logica del passaggio da Ferro. Lo storico migrato non ha RPE,
quindi il carico si stima a 3 e l'app lo dichiara invece di inventare un numero.

### Esercizi e schede

`ESERCIZI` in `dati/esercizi.js` è il catalogo, normalizzato per id: lo storico
salva l'id, mai il nome. `SCHEDE` in `dati/schede.js` cita quegli id e ci mette
sopra la prescrizione. Un esercizio che sta in più schede tiene lo stesso id, così
la sua curva di carico non si spezza in due. Cambiare l'allenamento significa
cambiare `SCHEDE`, nient'altro.

- **P, Forza e anca** è la seduta del piano: forza specifica più i 6-7 minuti di
  resistenza dell'anca. È quella proposta di default.
- **A** e **B** sono le due sedute in alternanza di prima, tenute perché ci sta
  appesa tutta la storia. Restano a un tocco dalla home.

### Il piano

`dati/piano.js` contiene le 24 settimane. Il documento del piano dice "lunedì 25
agosto" ma il 25 è un martedì, quindi le settimane si contano a ritroso dalle
gare, che sono le date che non possono sbagliare: la 8 chiude domenica 18 ottobre
(10 km), la 24 domenica 7 febbraio (mezza). Ne esce che la settimana 1 parte
lunedì 24 agosto 2026.

`GIORNI_PIANO` decide su che giorno cade cosa. I vincoli sono due: palestra mai
nelle 48 ore prima del lungo né prima di un'uscita con discese, e tre uscite a
settimana, mai quattro. Con il lungo di domenica e le discese di lunedì restano
liberi martedì e giovedì per la sala pesi; è l'unica combinazione che li rispetta
entrambi senza incastrare due sedute di palestra di fila. C'è un test che lo
verifica.

### Il carico relativo

`durataMin × rpe`, la formula più semplice che regge il confronto tra un'ora di
sala pesi e un'ora di corsa. `caricoSettimanale()` somma la settimana e la
confronta con la media delle quattro precedenti; sopra la soglia (default +10%)
l'app alza la mano. Le settimane precedenti alla prima seduta in assoluto sono
escluse dalla media: non sono settimane scariche, sono settimane che non
esistono, e includerle farebbe suonare l'allarme al primo allenamento vero.

## Convenzioni

- Interfaccia e commenti in italiano
- Le scritture su storage passano da un debounce di 500 ms (`persist`), non chiamare
  `storage.set` a raffica. `salvaSubito` scrive senza attesa: è per le scelte una tantum
  (nome, energia) dopo le quali si può ricaricare la pagina all'istante
- Tre famiglie tipografiche con ruoli fissi: Big Shoulders Display per i titoli,
  Space Grotesk per i testi, Space Mono per tutti i numeri
- Niente numeri o colori scritti a mano nel CSS: usare le variabili su `.root`
- Un accento per disciplina: la corsa è `--corsa` (freddo), la forza tiene il
  rosso `--piastra` che l'app ha da sempre. Il PRD suggeriva l'accoppiata
  opposta, ma il rosso è l'identità di GYM BUDDY e quello che conta è riconoscere
  la disciplina senza leggere
- Il reset dei bottoni è `:where(.root button)`: senza `:where()` la sua specificità
  batte le classi con sfondo pieno (`.btn-primary`, `.cal-forza`…) e le rende trasparenti
- I test coprono le funzioni pure di `modello.js`, `storage.js` e `dati/piano.js`.
  Le schermate no: si verificano aprendo l'app

## Vincoli

- Deve restare usabile con una mano sola e leggibile a un metro di distanza
- Target touch minimo 48 px
- Il Wake Lock funziona solo su HTTPS o localhost
- Ogni funzione nuova non deve allungare il percorso "registra la serie": resta un solo tocco
- Il prompt dell'energia non compare mai a seduta aperta né sopra a un foglio già
  aperto: riaprendo tra una serie e l'altra devo ritrovare il cronometro, non una domanda
- Nessun campo è obbligatorio: una corsa con la sola durata si salva lo stesso e
  resta segnata come bozza

## Cose da fare

- [ ] **Verificare la notifica di fine recupero a schermo spento su iOS.** È la
      domanda aperta del PRD che nessuno ha ancora chiuso. `timer.js` fa tutto
      quello che una PWA può fare (suono, vibrazione, notifica via service worker,
      ricalcolo dal timestamp al rientro) ma su iPhone va provato davvero, con
      l'app installata dalla schermata home
- [ ] Import GPX o CSV dall'orologio, per non riscrivere a mano le uscite
- [ ] Deload automatico: dopo 5 settimane piene proporre la settimana a carico ridotto
- [ ] Incrociare il minuto del fastidio con il carico di palestra dei giorni prima,
      per capire quale esercizio lo sposta
- [ ] Rendere `SCHEDE` modificabile dall'app, non solo dal file
- [ ] Frase di sintesi in linguaggio naturale nei Progressi ("nelle ultime 4
      settimane il volume di forza è stabile mentre i chilometri sono cresciuti del 18%")
