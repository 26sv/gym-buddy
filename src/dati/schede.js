/**
 * Le schede di sala pesi. Ogni voce cita un id del catalogo e ci mette sopra la
 * prescrizione (serie, ripetizioni, nota): lo stesso stacco rumeno vale 3×6 nella
 * scheda del piano e 4×6 nella vecchia A, ma resta lo stesso esercizio e la sua
 * curva di carico non si spezza.
 *
 * A e B sono le due sedute in alternanza di GYM BUDDY, restano dove sono perché
 * ci sta appesa tutta la storia. P è la seduta prescritta dal piano mezza
 * maratona: forza specifica più i 6-7 minuti di resistenza dell'anca in fondo.
 * Cambiare l'allenamento significa cambiare questo oggetto, nient'altro.
 */

export const SCHEDE = {
  P: {
    nome: "Forza e anca",
    focus: "La seduta del piano: gamba singola, polpaccio, anca in resistenza",
    durataMin: 60,
    esercizi: [
      { id: "p1", sets: 3, reps: 8, nota: "Scendi contando 4 secondi. Se ne fai uno solo, fai questo" },
      { id: "a3", sets: 3, reps: 8, nota: "Profondità senza dolore" },
      { id: "p2", sets: 5, reps: 45, nota: "Brucia: è quello che deve fare" },
      { id: "a1", sets: 3, reps: 8, nota: "Oppure nordic curl" },
      { id: "a4", sets: 3, reps: 12, nota: "Primo ammortizzatore" },
      { id: "p3", sets: 3, reps: 15 },
      { id: "h1", sets: 3, reps: 25, nota: "Lente, gamba leggermente indietro", blocco: "anca" },
      { id: "h2", sets: 3, reps: 20, blocco: "anca" },
      { id: "h3", sets: 3, reps: 20, nota: "Passi per direzione", blocco: "anca" },
      { id: "h4", sets: 3, reps: 25, blocco: "anca" },
      { id: "h5", sets: 3, reps: 12, blocco: "anca" },
    ],
  },
  A: {
    nome: "Seduta A",
    focus: "Catena posteriore e spinta",
    durataMin: 55,
    esercizi: [
      { id: "a1", sets: 4, reps: 6, nota: "Discesa in 3 secondi" },
      { id: "a2", sets: 4, reps: 5, nota: "Mai a cedimento" },
      { id: "a3", sets: 3, reps: 8, nota: "Profondità senza dolore" },
      { id: "a4", sets: 3, reps: 12, nota: "Discesa in 3 secondi" },
      { id: "a5", sets: 3, reps: 10 },
    ],
  },
  B: {
    nome: "Seduta B",
    focus: "Spinta gambe e trazione",
    durataMin: 55,
    esercizi: [
      { id: "b1", sets: 4, reps: 5, nota: "Tempo controllato" },
      { id: "b2", sets: 4, reps: 6 },
      { id: "b3", sets: 3, reps: 8 },
      { id: "b4", sets: 3, reps: 8 },
      { id: "b5", sets: 3, reps: 10 },
    ],
  },
};

export const SCHEDA_DEFAULT = "P";
export const ID_SCHEDE = Object.keys(SCHEDE);

export const WARMUP = ["5 min bici o vogatore", "Mobilità anche e caviglie", 'Isometria ginocchio 4×40"'];

export const REST_PRESETS = [90, 120, 180];
export const INCREMENTS = [1, 2.5, 5];

/** Le serie previste dalla scheda, quelle su cui si misura "quanto manca". */
export const seriePreviste = (scheda) =>
  (SCHEDE[scheda]?.esercizi || []).reduce((t, e) => t + e.sets, 0);

/** La prescrizione di un esercizio dentro una scheda, se c'è. */
export const prescrizione = (scheda, id) =>
  (SCHEDE[scheda]?.esercizi || []).find((e) => e.id === id) || null;
