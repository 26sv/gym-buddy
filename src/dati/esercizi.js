/**
 * Catalogo degli esercizi, normalizzato per id.
 *
 * Lo storico salva l'id, mai il nome: rinominare "Panca piana" in "Panca con
 * bilanciere" non deve spezzare in due la curva dei carichi. Gli id a1..b5 sono
 * quelli che GYM BUDDY usa da sempre, quindi non si toccano; i nuovi esercizi
 * arrivati col piano mezza maratona prendono il prefisso p (forza) e h (anca).
 *
 * Campi:
 *   unita     "rip" | "sec"  cosa conta una serie
 *   carico    false quando il peso non ha senso (corpo libero, elastico)
 *   perLato   l'esercizio si fa una gamba o un lato per volta
 *   inc       scatto di default dello stepper del peso
 */

export const ESERCIZI = {
  /* --- sala pesi, scheda storica A/B --- */
  a1: { nome: "Stacco rumeno", short: "Stacco rum.", inc: 2.5 },
  a2: { nome: "Panca piana", short: "Panca", inc: 2.5 },
  a3: { nome: "Bulgarian split squat", short: "Split squat", inc: 2, perLato: true },
  a4: { nome: "Calf raise in piedi", short: "Calf", inc: 5 },
  a5: { nome: "Pallof press", short: "Pallof", inc: 1, perLato: true },
  b1: { nome: "Squat bilanciere", short: "Squat", inc: 2.5 },
  b2: { nome: "Trazioni o lat machine", short: "Trazioni", inc: 2.5 },
  b3: { nome: "Hip thrust o nordic curl", short: "Hip thrust", inc: 5 },
  b4: { nome: "Military press", short: "Military", inc: 2 },
  b5: { nome: "Dead bug", short: "Dead bug", inc: 1, perLato: true },

  /* --- forza specifica per la corsa, dal piano mezza maratona --- */
  p1: { nome: "Step down eccentrico da box", short: "Step down", inc: 2, perLato: true },
  p2: { nome: "Spanish squat o wall sit", short: "Spanish sq.", unita: "sec", carico: false },
  p3: { nome: "Calf raise da seduto", short: "Calf seduto", inc: 5 },
  p4: { nome: "Nordic curl", short: "Nordic", carico: false },

  /* --- resistenza dell'anca, i 6-7 minuti finali --- */
  h1: { nome: "Abduzione sul fianco", short: "Abduzione", carico: false, perLato: true },
  h2: { nome: "Ponte monopodalico", short: "Ponte", carico: false, perLato: true },
  h3: { nome: "Camminata laterale con elastico", short: "Laterale", carico: false, perLato: true },
  h4: { nome: "Copenhagen plank", short: "Copenhagen", unita: "sec", carico: false, perLato: true },
  h5: { nome: "Hip hike sul gradino", short: "Hip hike", carico: false, perLato: true },
};

/** Un esercizio anche se l'id non è in catalogo: gli aggiunti al volo in seduta. */
export const esercizio = (id, fallback) =>
  ESERCIZI[id] || fallback || { nome: id, short: id, inc: 2.5 };

export const unitaDi = (id) => ESERCIZI[id]?.unita || "rip";
export const haCarico = (id) => ESERCIZI[id]?.carico !== false;
