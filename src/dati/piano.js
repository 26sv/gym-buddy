/**
 * Il piano mezza maratona: 24 settimane, dal punto di partenza (4 km non stop)
 * alla gara del 7 febbraio 2027, con la 10 km del 18 ottobre nel mezzo.
 *
 * Ancoraggio del calendario: il documento del piano dice "lunedì 25 agosto", ma
 * il 25 è un martedì e tutte le settimane elencate vanno da lunedì a domenica.
 * Le due date che non possono sbagliare sono le gare, quindi le settimane si
 * contano a ritroso da lì: la 8 chiude domenica 18 ottobre, la 24 domenica
 * 7 febbraio. Ne esce che la settimana 1 parte lunedì 24 agosto 2026.
 *
 * I chilometri sono quelli delle tabelle. La nota è la prescrizione testuale
 * dell'uscita, quella che in gergo dice cosa farci dentro.
 */

export const PIANO = {
  nome: "Mezza maratona 21,1 km",
  inizio: "2026-08-24", // lunedì della settimana 1
  gara: { data: "2027-02-07", nome: "Mezza maratona", distanzaKm: 21.1 },
  intermedia: { data: "2026-10-18", nome: "Gara 10 km", distanzaKm: 10, settimana: 8 },
  palestraSettimana: 2,
};

/* lungo / a / b: { km, nota }. scarico marca le settimane a volume ridotto,
   quelle che salvano la preparazione e non si saltano mai. */
export const SETTIMANE = [
  { n: 1, blocco: 1, lungo: { km: 5 }, a: { km: 4 }, b: { km: 4 }, totale: 13 },
  { n: 2, blocco: 1, lungo: { km: 6 }, a: { km: 4 }, b: { km: 5 }, totale: 15 },
  { n: 3, blocco: 1, lungo: { km: 7 }, a: { km: 5 }, b: { km: 5 }, totale: 17 },
  { n: 4, blocco: 1, scarico: true, lungo: { km: 5 }, a: { km: 4 }, b: { km: 4 }, totale: 13 },
  { n: 5, blocco: 1, lungo: { km: 8 }, a: { km: 5 }, b: { km: 5 }, totale: 18 },
  { n: 6, blocco: 1, lungo: { km: 9 }, a: { km: 5 }, b: { km: 6 }, totale: 20 },
  { n: 7, blocco: 1, lungo: { km: 10 }, a: { km: 5 }, b: { km: 5 }, totale: 20 },
  {
    n: 8, blocco: 1, gara: "10 km",
    lungo: { km: 10, nota: "GARA 10 km", gara: true },
    a: { km: 4, nota: "Facili" }, b: { km: 4, nota: "Facili" }, totale: 18,
  },
  { n: 9, blocco: 2, scarico: true, lungo: { km: 6, nota: "Recupero dalla gara" }, a: { km: 4 }, b: { km: 4 }, totale: 14 },
  { n: 10, blocco: 2, lungo: { km: 10 }, a: { km: 5, discese: '4 × 30" dolci, risalita lenta' }, b: { km: 6, nota: "Facili" }, totale: 21 },
  { n: 11, blocco: 2, lungo: { km: 11 }, a: { km: 5, discese: '4 × 30" dolci, risalita lenta' }, b: { km: 6, nota: "Ultimi 2 km progressivi" }, totale: 22 },
  { n: 12, blocco: 2, lungo: { km: 12 }, a: { km: 6, discese: '6 × 45"' }, b: { km: 6, nota: "5 × 3' medi, recupero 2'" }, totale: 24 },
  { n: 13, blocco: 2, scarico: true, lungo: { km: 8 }, a: { km: 5 }, b: { km: 5, nota: "Facili" }, totale: 18 },
  { n: 14, blocco: 2, lungo: { km: 13 }, a: { km: 6, discese: '6 × 45"' }, b: { km: 6, nota: "5 × 3' medi, recupero 2'" }, totale: 25 },
  { n: 15, blocco: 2, lungo: { km: 14 }, a: { km: 6, discese: '5 × 90", pendenza più marcata' }, b: { km: 7, nota: "Ultimi 3 km progressivi" }, totale: 27 },
  { n: 16, blocco: 2, lungo: { km: 15 }, a: { km: 6, discese: '5 × 90", pendenza più marcata' }, b: { km: 7, nota: "6 × 3' medi, recupero 2'" }, totale: 28 },
  { n: 17, blocco: 2, scarico: true, lungo: { km: 10 }, a: { km: 5 }, b: { km: 6, nota: "Facili" }, totale: 21 },
  { n: 18, blocco: 3, lungo: { km: 16, nota: "Tratti in discesa dentro il lungo, se le 48 ore dopo restano pulite" }, a: { km: 6 }, b: { km: 7, nota: "Ultimi 4 km a ritmo gara" }, totale: 29 },
  { n: 19, blocco: 3, scarico: true, lungo: { km: 12, nota: "Settimana di festività" }, a: { km: 6 }, b: { km: 6, nota: "Facili" }, totale: 24 },
  { n: 20, blocco: 3, lungo: { km: 16 }, a: { km: 7 }, b: { km: 7, nota: "3 × 2 km a ritmo gara" }, totale: 30 },
  { n: 21, blocco: 3, picco: true, lungo: { km: 18, nota: "Il lungo più lungo di tutta la preparazione" }, a: { km: 7 }, b: { km: 7, nota: "Ultimi 4 km a ritmo gara" }, totale: 32 },
  { n: 22, blocco: 3, lungo: { km: 14 }, a: { km: 6 }, b: { km: 7, nota: "3 × 2 km a ritmo gara" }, totale: 27 },
  { n: 23, blocco: 3, lungo: { km: 12, nota: "Di cui 8 km a ritmo gara" }, a: { km: 6 }, b: { km: 6, nota: "Facili" }, totale: 24 },
  {
    n: 24, blocco: 3, gara: "21,1 km",
    lungo: { km: 21.1, nota: "GARA", gara: true },
    a: { km: 6, nota: "Facili" }, b: { km: 4, nota: "4 allunghi" }, totale: 31,
  },
];

export const BLOCCHI = {
  1: { nome: "Ricostruire la base", obiettivo: "10 km in gara il 18 ottobre, tutto in facile" },
  2: { nome: "Costruzione", obiettivo: "Rientrano discese e qualità, il lungo va da 10 a 15 km" },
  3: { nome: "Specifico e rifinitura", obiettivo: "Il lungo tocca 18 km, poi si scarica verso la gara" },
};

/**
 * Su che giorno cade cosa.
 *
 * I vincoli del piano sono due: palestra mai nelle 48 ore prima del lungo né
 * prima di un'uscita con discese, e tre uscite a settimana, mai quattro. Con il
 * lungo di domenica e le discese di lunedì restano liberi martedì e giovedì per
 * la sala pesi: martedì è il giorno dopo le discese (il vincolo guarda solo
 * prima), giovedì dista tre giorni dal lungo. È l'unica combinazione che li
 * rispetta entrambi senza incastrare due sedute di palestra di fila.
 *
 * 0 = domenica, come getDay().
 */
export const GIORNI_PIANO = {
  1: ["a"],        // lunedì: uscita A, quella con le discese dal blocco 2
  2: ["palestra"],
  3: ["b"],        // mercoledì: uscita B, la qualità dal blocco 2
  4: ["palestra"],
  5: [],
  6: [],
  0: ["lungo"],    // domenica
};

/* La settimana di gara ha il suo incastro: la 10 km e la mezza si corrono di
   domenica, l'uscita di richiamo cade il lunedì e gli allunghi il giovedì. */
export const GIORNI_GARA = {
  1: ["a"],
  2: ["palestra"],
  3: [],
  4: ["b"],
  5: [],
  6: [],
  0: ["lungo"],
};

const GIORNO_MS = 24 * 3600 * 1000;

const mezzanotte = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

/** Il lunedì della settimana che contiene d. */
export const lunediDi = (d) => {
  const x = mezzanotte(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
};

/** Numero di settimana del piano per una data, o null se fuori dalle 24. */
export const settimanaDi = (d) => {
  const inizio = lunediDi(new Date(`${PIANO.inizio}T00:00:00`));
  const diff = Math.round((lunediDi(d) - inizio) / GIORNO_MS / 7);
  return diff >= 0 && diff < SETTIMANE.length ? SETTIMANE[diff] : null;
};

/** Le date di inizio e fine di una settimana del piano. */
export const dateSettimana = (n) => {
  const da = lunediDi(new Date(`${PIANO.inizio}T00:00:00`));
  da.setDate(da.getDate() + (n - 1) * 7);
  const a = new Date(da);
  a.setDate(a.getDate() + 6);
  return { da, a };
};

/** Giorni che mancano alla gara, negativi se è già passata. */
export const giorniAllaGara = (d = new Date()) =>
  Math.round((mezzanotte(new Date(`${PIANO.gara.data}T00:00:00`)) - mezzanotte(d)) / GIORNO_MS);

/**
 * Cosa prevede il piano per un certo giorno.
 * Restituisce sempre un array, vuoto quando è riposo o si è fuori dal piano.
 */
export const previstoIl = (d = new Date()) => {
  const sett = settimanaDi(d);
  if (!sett) return [];
  const mappa = sett.gara ? GIORNI_GARA : GIORNI_PIANO;
  return (mappa[new Date(d).getDay()] || []).map((slot) => {
    if (slot === "palestra") {
      return { slot, tipo: "forza", titolo: "Palestra", nota: "Forza e anca, 60 minuti" };
    }
    const u = sett[slot];
    const titolo = slot === "lungo" ? (u.gara ? u.nota : "Lungo") : slot === "a" ? "Uscita A" : "Uscita B";
    const pezzi = [u.nota, u.discese && `Discese: ${u.discese}`].filter(Boolean);
    return {
      slot,
      tipo: "corsa",
      titolo,
      km: u.km,
      gara: !!u.gara,
      tipoSessione: u.gara ? "gara" : slot === "lungo" ? "lungo" : u.discese ? "discese" : u.nota ? "qualita" : "facile",
      nota: pezzi.join(" · ") || null,
    };
  });
};

/** Tutte le sessioni previste in una settimana del piano, per la vista di aderenza. */
export const previstoSettimana = (sett) => {
  if (!sett) return [];
  const { da } = dateSettimana(sett.n);
  const out = [];
  for (let i = 0; i < 7; i++) {
    const giorno = new Date(da);
    giorno.setDate(giorno.getDate() + i);
    previstoIl(giorno).forEach((p) => out.push({ ...p, giorno }));
  }
  return out;
};
