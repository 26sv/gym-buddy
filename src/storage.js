/**
 * Adattatore di persistenza.
 *
 * Negli artifact di Claude esiste window.storage (asincrono).
 * Qui fuori quell'oggetto non c'è, quindi replichiamo la stessa identica
 * interfaccia sopra localStorage: le schermate non sanno la differenza e restano
 * portabili in entrambi i mondi.
 *
 * Se un domani vuoi sincronizzare su Firestore, ti basta riscrivere
 * questo file mantenendo le stesse quattro funzioni.
 */

const PREFIX = "gymbuddy:";

/* L'app si chiamava Ferro e scriveva sotto "ferro:". Le vecchie chiavi restano
   dove sono: le ricopiamo, non le spostiamo, così un rollback non perde niente. */
const PREFIX_FERRO = "ferro:";

/* La chiave nuova, col modello unificato corsa più forza. Quella vecchia con la
   sola palestra resta al suo posto intatta: la si legge una volta per migrarla e
   poi non la si tocca più, così tornare alla versione precedente ritrova tutto. */
export const KEY = "diario-v2";
export const KEY_V1 = "palestra-v1";

export const storage = {
  async get(key) {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) throw new Error(`chiave non trovata: ${key}`);
    return { key, value: raw };
  },

  async set(key, value) {
    localStorage.setItem(PREFIX + key, value);
    return { key, value };
  },

  async delete(key) {
    localStorage.removeItem(PREFIX + key);
    return { key, deleted: true };
  },

  async list(prefix = "") {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX + prefix)) keys.push(k.slice(PREFIX.length));
    }
    return { keys, prefix };
  },
};

/**
 * Ricopia una tantum i dati salvati dalle versioni chiamate Ferro.
 * Va chiamata prima della prima lettura. Copia solo le chiavi che ancora non
 * esistono sotto il prefisso nuovo, quindi rieseguirla non sovrascrive nulla.
 */
export function migraDaFerro() {
  try {
    const vecchie = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX_FERRO)) vecchie.push(k);
    }
    for (const k of vecchie) {
      const nuova = PREFIX + k.slice(PREFIX_FERRO.length);
      if (localStorage.getItem(nuova) === null) localStorage.setItem(nuova, localStorage.getItem(k));
    }
  } catch (e) {
    /* localStorage negato (navigazione privata): si riparte da zero */
  }
}

/* ---------------- export e import ---------------- */

const ISO_FILE = () => new Date().toISOString().slice(0, 10);

/** Il backup completo: tutto lo stato, così com'è, più un'intestazione. */
export function esportaJSON(stato) {
  return JSON.stringify(
    {
      formato: "gymbuddy/diario",
      versione: stato.versione,
      esportatoIl: new Date().toISOString(),
      stato,
    },
    null,
    2
  );
}

const csvCampo = (v) => {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/**
 * Una riga per sessione, colonne comuni prima e specifiche dopo: è il formato
 * che si apre in un foglio di calcolo senza dover spiegare niente a nessuno.
 */
export function esportaCSV(sessioni) {
  const testa = [
    "data", "tipo", "durata_min", "rpe", "carico_relativo", "energia", "soddisfazione", "ginocchio",
    "km", "passo_sec_km", "dislivello", "fc_media", "tipo_uscita", "minuto_fastidio",
    "scheda", "serie", "volume_kg", "note",
  ];
  const righe = [...sessioni]
    .sort((a, b) => new Date(a.data) - new Date(b.data))
    .map((s) => {
      const c = s.corsa || {};
      const serie = (s.forza?.esercizi || []).reduce((t, e) => t + e.serie.length, 0);
      const volume = (s.forza?.esercizi || []).reduce(
        (t, e) => t + e.serie.reduce((a, x) => a + (x.carico || 0) * (x.reps || 0), 0),
        0
      );
      return [
        s.data, s.tipo, s.durataMin, s.rpe ?? "", s.caricoRelativo ?? "",
        s.energy ?? "", s.satisfaction ?? "", s.feel ?? "",
        c.distanzaKm ?? "", c.passoMedioSec ?? "", c.dislivello ?? "", c.fcMedia ?? "",
        c.tipoSessione ?? "", c.minutoFastidio ?? "",
        s.forza?.scheda ?? "", s.forza ? serie : "", s.forza ? Math.round(volume) : "",
        s.note ?? "",
      ].map(csvCampo).join(",");
    });
  return [testa.join(","), ...righe].join("\n");
}

/** Il dettaglio serie per serie, per chi vuole rifare i conti a mano. */
export function esportaSerieCSV(sessioni) {
  const testa = ["data", "scheda", "esercizio", "serie_n", "carico_kg", "ripetizioni"];
  const righe = [];
  [...sessioni]
    .sort((a, b) => new Date(a.data) - new Date(b.data))
    .forEach((s) => {
      (s.forza?.esercizi || []).forEach((e) => {
        e.serie.forEach((x, i) => {
          righe.push(
            [s.data, s.forza.scheda, e.nomeId, i + 1, x.carico ?? "", x.reps ?? ""].map(csvCampo).join(",")
          );
        });
      });
    });
  return [testa.join(","), ...righe].join("\n");
}

/**
 * Il salvataggio di un file passa da due strade.
 *
 * Normalmente basta un link con l'attributo download, che funziona anche con la
 * PWA installata sul telefono. Ma quando l'app gira dentro una pagina pubblicata
 * su claude.ai quel link è inerte per scelta del contenitore, e l'unico modo di
 * consegnare un file è chiederlo al visualizzatore. Qui si prova prima quella
 * strada e si ripiega sull'altra: una base di codice sola, che si adatta a dove
 * si trova invece di avere due versioni da tenere allineate.
 */
let capacita;
const chiediCapacita = () => {
  if (!capacita) {
    capacita =
      typeof window !== "undefined" && window.claude?.use
        ? Promise.resolve(window.claude.use("downloads")).catch(() => null)
        : Promise.resolve(null);
  }
  return capacita;
};
/* Si scalda subito: quando arriva il tocco sul pulsante deve essere già pronta. */
if (typeof window !== "undefined") chiediCapacita();

const MOTIVI = {
  declined: "Salvataggio annullato.",
  extension_not_enabled: "Qui il CSV non si può salvare: usa il backup JSON.",
  rejected_extension: "Questo tipo di file non è ammesso qui.",
  too_large: "Il file è troppo grande per essere salvato da qui.",
  rate_limited: "C'è già un salvataggio in corso, riprova tra un attimo.",
};

/**
 * Consegna un file. Restituisce { ok } oppure { ok: false, motivo } con una
 * frase già leggibile: chi chiama non deve conoscere i codici di errore.
 */
export async function scarica(nome, contenuto, mime = "application/json") {
  const downloads = await chiediCapacita();
  if (downloads) {
    try {
      await downloads.save({ filename: nome, data: contenuto });
      return { ok: true };
    } catch (e) {
      return { ok: false, motivo: MOTIVI[e?.code] || "Salvataggio non riuscito." };
    }
  }

  try {
    const blob = new Blob([contenuto], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { ok: true };
  } catch (e) {
    return { ok: false, motivo: "Salvataggio non riuscito." };
  }
}

export const nomeBackup = (est) => `gymbuddy-${ISO_FILE()}.${est}`;

/**
 * Rilegge un backup. Non si fida di niente: se il file non ha la forma giusta
 * dice cosa non va invece di svuotare lo storico in silenzio.
 */
export function leggiBackup(testo) {
  let letto;
  try {
    letto = JSON.parse(testo);
  } catch (e) {
    throw new Error("Il file non è un JSON leggibile.");
  }
  const stato = letto?.stato ?? letto;
  if (!stato || typeof stato !== "object") throw new Error("Il file non contiene uno stato valido.");
  const sessioni = stato.sessioni ?? stato.history;
  if (!Array.isArray(sessioni)) throw new Error("Nel file non c'è nessuno storico di sessioni.");
  return stato;
}

/**
 * Unisce il backup allo stato attuale tenendo le sessioni di entrambi.
 * Gli id doppi vincono da una parte sola, quindi reimportare due volte lo stesso
 * file non raddoppia niente.
 */
export function unisci(attuale, importato) {
  const perId = new Map();
  [...(importato.sessioni || []), ...(attuale.sessioni || [])].forEach((s) => {
    if (s && s.id && !perId.has(s.id)) perId.set(s.id, s);
  });
  const sessioni = [...perId.values()].sort((a, b) => new Date(b.data) - new Date(a.data));

  const energie = new Map();
  [...(importato.energyLog || []), ...(attuale.energyLog || [])].forEach((e) => {
    if (e && e.ts && !energie.has(e.ts)) energie.set(e.ts, e);
  });

  return {
    ...attuale,
    userName: attuale.userName || importato.userName || null,
    sessioni,
    ultimiCarichi: { ...(importato.ultimiCarichi || {}), ...(attuale.ultimiCarichi || {}) },
    energyLog: [...energie.values()].sort((a, b) => new Date(b.ts) - new Date(a.ts)).slice(0, 400),
  };
}
