# GYM BUDDY

Corsa e sala pesi nello stesso posto, sul telefono e senza account.

Registra le serie in palestra con un tocco, riporta le uscite di corsa in venti
secondi, e risponde alla domanda che conta: **sto aumentando il carico
complessivo in modo sostenibile, o mi sto scavando la fossa prima della gara?**

- **Oggi** dice cosa prevede il piano e lo avvia con un tocco
- **Storico** mescola corsa e palestra su una linea del tempo sola
- **Progressi** somma le due discipline in un carico settimanale unico e avvisa
  quando cresce troppo in fretta
- **Dati** tiene calendario, sensazioni, record e backup

Dentro c'è il piano mezza maratona da 24 settimane: la home sa che oggi tocca
l'uscita A da 4 km, quanti giorni mancano alla gara e quante sedute di palestra
restano da chiudere questa settimana.

## Avvio

```bash
npm install
npm run dev
```

Vite stampa due indirizzi. Quello `Network:` si apre dal telefono
collegato alla stessa rete wifi.

```bash
npm test           # il modello: migrazione, carico, record, coerenza del piano
npm run build      # genera dist/
```

## Installazione sul telefono

Serve HTTPS (oppure localhost): in locale il Wake Lock, le notifiche e
l'installazione PWA non funzionano dall'indirizzo di rete. Per usarla davvero in
palestra pubblicala su un hosting statico, poi dal browser del telefono:
Condividi, "Aggiungi a schermata Home".

La notifica di fine recupero a schermo spento è verificata su Android. Su iPhone
richiede l'app installata dalla schermata home e iOS 16.4 o successivo, e va
ancora provata sul campo: il conto del recupero resta comunque corretto al
rientro nell'app anche se la notifica non arriva.

## Dati

Tutto in `localStorage`, chiave `gymbuddy:diario-v2`. Niente account, niente
server. Svuotare i dati del sito cancella lo storico, quindi in **Dati → Backup
ed export** ci sono il JSON completo (che si reimporta) e due CSV per il foglio
di calcolo. Dopo un po' di sessioni senza backup l'app lo ricorda da sola.

Reimportare **unisce**: le sessioni già presenti non si duplicano, quelle che
mancano rientrano, e niente di quello che c'è viene cancellato.

Chi arriva da una versione precedente non deve fare niente. Al primo avvio
`migraDaFerro()` ricopia le vecchie chiavi `ferro:`, e `migraStato()` traduce lo
storico di sola palestra nel modello unificato. Le chiavi vecchie restano dove
sono, così tornare indietro non perde niente.
