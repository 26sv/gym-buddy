/**
 * Le scale con cui l'app fa domande. Tutte a gradini corti: in palestra, tra una
 * serie e l'altra, si sceglie con il pollice senza leggere due volte.
 *
 * ENERGIA e SODDISFAZIONE restano a quattro gradini con lo stesso passo, così
 * nella scheda Dati si confrontano a colpo d'occhio (come sono partito, come
 * sono finito). RPE ne ha cinque perché è la scala del PRD ed entra nel calcolo
 * del carico relativo: durata × RPE.
 */

export const ENERGIA = [
  { level: 1, emoji: "😵‍💫", label: "A terra", tone: "piastra" },
  { level: 2, emoji: "😐", label: "Fiacco", tone: "ambra" },
  { level: 3, emoji: "💪", label: "In forma", tone: "verde" },
  { level: 4, emoji: "🔥", label: "Carico", tone: "verde" },
];

export const SODDISFAZIONE = [
  { level: 1, emoji: "😞", label: "Male", tone: "piastra" },
  { level: 2, emoji: "😐", label: "Così così", tone: "ambra" },
  { level: 3, emoji: "😊", label: "Bene", tone: "verde" },
  { level: 4, emoji: "🤩", label: "Alla grande", tone: "verde" },
];

/* Quanto è costata la seduta, non quanto è piaciuta. È il moltiplicatore del
   carico relativo, quindi va data sempre: quando manca si stima 3. */
export const RPE = [
  { level: 1, label: "Molto facile", nota: "Potevo continuare a lungo", tone: "verde" },
  { level: 2, label: "Facile", nota: "Conversazione senza sforzo", tone: "verde" },
  { level: 3, label: "Medio", nota: "Frasi corte", tone: "ambra" },
  { level: 4, label: "Duro", nota: "Parole singole", tone: "ambra" },
  { level: 5, label: "Massimale", nota: "Non parlavo più", tone: "piastra" },
];

export const RPE_STIMATO = 3;

/* Il semaforo del ginocchio del piano, tradotto in tre bottoni. */
export const FEEL = [
  { id: "ok", label: "Bene", tone: "verde" },
  { id: "lieve", label: "Fastidio lieve", tone: "ambra" },
  { id: "forte", label: "Fastidio marcato", tone: "piastra" },
];

export const gradino = (scala, level) => scala.find((x) => x.level === level) || null;
