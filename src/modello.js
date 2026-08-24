/**
 * Il modello unificato della sessione.
 *
 * Corsa e forza sono la stessa cosa vista da due angoli: entrambe hanno una
 * data, una durata, un RPE e un carico relativo. Le viste che confrontano,
 * sommano e disegnano lavorano solo su quei quattro campi, quindi aggiungere
 * domani il nuoto o la bici significa scrivere una schermata di inserimento e
 * basta, senza toccare storico, carico settimanale e record.
 *
 *   Sessione {
 *     id, userId, data, tipo: "forza" | "corsa" | "altro",
 *     durataSec, durataMin, rpe (1-5), note, stato: "bozza" | "completata",
 *     caricoRelativo,
 *     corsa?: { distanzaKm, passoMedioSec, dislivello, fcMedia, tipoSessione, minutoFastidio },
 *     forza?: { scheda, esercizi: [ { nomeId, serie: [ { reps, carico, completata } ] } ] },
 *     energy, satisfaction, feel
 *   }
 *
 * userId vale sempre "local": non c'è nessun account e in v1 non ci sarà, ma il
 * campo c'è già così il giorno che arriva la sincronizzazione non serve
 * rimettere le mani in ogni riga dello storico.
 */

import { RPE_STIMATO } from "./dati/scale.js";
import { ESERCIZI, esercizio } from "./dati/esercizi.js";
import { SCHEDE } from "./dati/schede.js";

export const VERSIONE = 2;
export const UTENTE_LOCALE = "local";

export const statoVuoto = {
  versione: VERSIONE,
  userId: UTENTE_LOCALE,
  userName: null,
  sessioni: [], // la più recente in testa
  ultimiCarichi: {}, // id esercizio -> ultimo carico usato
  active: null,
  energyLog: [], // [{ ts, level }], il più recente in testa
  obiettivoPalestra: 2, // il pavimento del piano: due sedute a settimana
  sogliaCarico: 10, // % di aumento settimanale oltre cui l'app alza la mano
  ultimoBackup: null, // { ts, sessioni }
};

/* ---------------- numeri e formati ---------------- */

export const pad = (n) => String(n).padStart(2, "0");

export const clock = (t) => {
  const s = Math.max(0, Math.floor(t));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`;
};

export const num = (n) => (Number.isInteger(n) ? String(n) : String(n).replace(".", ","));
export const dec = (n, c = 1) => n.toFixed(c).replace(".", ",");

/** Passo in secondi al chilometro, formattato 5:24. */
export const passo = (sec) => (sec ? `${Math.floor(sec / 60)}:${pad(Math.round(sec % 60))}` : "—");

export const dayLabel = (iso) => new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
export const fullLabel = (iso) =>
  new Date(iso).toLocaleDateString("it-IT", { weekday: "long", day: "2-digit", month: "long" });

export const dayKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
};

export const startOfWeek = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
};

/* ---------------- carico relativo ---------------- */

/**
 * Durata × RPE: la formula più semplice che regge il confronto tra un'ora di
 * sala pesi e un'ora di corsa. Quando l'RPE manca, cioè in tutto lo storico
 * arrivato dalle versioni che non lo chiedevano, si stima medio.
 */
export const caricoDi = (s) => Math.round((s.durataMin || 0) * (s.rpe || RPE_STIMATO));

export const rpeStimato = (s) => !s.rpe;

/* ---------------- costruzione delle sessioni ---------------- */

const nuovoId = () => `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Le serie registrate di un esercizio dentro una sessione di forza. */
export const serieDi = (s, nomeId) =>
  s?.forza?.esercizi?.find((e) => e.nomeId === nomeId)?.serie || [];

export const serieTotali = (s) =>
  (s?.forza?.esercizi || []).reduce((t, e) => t + e.serie.length, 0);

/** Tonnellaggio: quanti chili si sono spostati in tutto. */
export const volumeDi = (s) =>
  (s?.forza?.esercizi || []).reduce(
    (t, e) => t + e.serie.reduce((a, x) => a + (x.carico || 0) * (x.reps || 0), 0),
    0
  );

export const caricoMax = (serie) =>
  serie.length ? Math.max(...serie.map((x) => x.carico || 0)) : 0;

/** Massimale stimato con Epley, il riferimento per i record di forza. */
export const massimaleStimato = (carico, reps) =>
  carico > 0 && reps > 0 ? Math.round(carico * (1 + reps / 30) * 10) / 10 : 0;

export const massimaleSessione = (serie) =>
  serie.reduce((m, x) => Math.max(m, massimaleStimato(x.carico, x.reps)), 0);

export function nuovaForza({ scheda, energia }) {
  return {
    scheda,
    startedAt: new Date().toISOString(),
    esercizi: [], // popolati man mano che si registra: l'ordine è quello reale
    extra: [], // esercizi aggiunti fuori scheda, { id, nome, sets, reps }
    warmup: [],
    energy: energia ?? null,
  };
}

/** Chiude la seduta aperta e ne fa una sessione da mettere in archivio. */
export function chiudiForza(active, durataSec, { rpe, feel, satisfaction, note }) {
  const durataMin = Math.max(1, Math.round(durataSec / 60));
  const base = {
    id: nuovoId(),
    userId: UTENTE_LOCALE,
    data: active.startedAt,
    tipo: "forza",
    durataSec: Math.round(durataSec),
    durataMin,
    rpe: rpe || null,
    note: note || null,
    stato: "completata",
    forza: { scheda: active.scheda, esercizi: active.esercizi, extra: active.extra || [] },
    energy: active.energy ?? null,
    satisfaction: satisfaction || null,
    feel: feel || null,
  };
  return { ...base, caricoRelativo: caricoDi(base) };
}

export function nuovaCorsa({
  data, distanzaKm, durataSec, rpe, tipoSessione, dislivello, fcMedia, minutoFastidio, feel, note, energia,
}) {
  const durataMin = Math.max(1, Math.round(durataSec / 60));
  const base = {
    id: nuovoId(),
    userId: UTENTE_LOCALE,
    data: data || new Date().toISOString(),
    tipo: "corsa",
    durataSec: Math.round(durataSec),
    durataMin,
    rpe: rpe || null,
    note: note || null,
    stato: distanzaKm > 0 ? "completata" : "bozza",
    corsa: {
      distanzaKm: distanzaKm || 0,
      /* Il passo non si digita mai: si ricava. */
      passoMedioSec: distanzaKm > 0 ? Math.round(durataSec / distanzaKm) : null,
      dislivello: dislivello ?? null,
      fcMedia: fcMedia ?? null,
      tipoSessione: tipoSessione || "facile",
      /* Il numero che il piano chiede a ogni uscita: non se il fastidio
         compare, ma a che minuto. */
      minutoFastidio: minutoFastidio ?? null,
    },
    energy: energia ?? null,
    satisfaction: null,
    feel: feel || null,
  };
  return { ...base, caricoRelativo: caricoDi(base) };
}

export function nuovaAltro({ data, durataSec, rpe, note, feel, energia }) {
  const durataMin = Math.max(1, Math.round(durataSec / 60));
  const base = {
    id: nuovoId(),
    userId: UTENTE_LOCALE,
    data: data || new Date().toISOString(),
    tipo: "altro",
    durataSec: Math.round(durataSec),
    durataMin,
    rpe: rpe || null,
    note: note || null,
    stato: "completata",
    energy: energia ?? null,
    satisfaction: null,
    feel: feel || null,
  };
  return { ...base, caricoRelativo: caricoDi(base) };
}

/* ---------------- migrazione dallo storico vecchio ---------------- */

/**
 * Lo stato v1 teneva solo la palestra: history con type "A"/"B" e log come mappa
 * id esercizio -> serie. Qui diventa una Sessione di tipo forza.
 *
 * L'RPE non esisteva, quindi resta nullo e il carico si stima: meglio un dato
 * dichiarato incompleto che un numero inventato che poi nessuno sa più leggere.
 * L'ordine degli esercizi si ricostruisce da quello della scheda, perché una
 * mappa non lo conserva.
 */
export function migraSessione(vecchia) {
  const scheda = SCHEDE[vecchia.type] ? vecchia.type : "A";
  const ordine = (SCHEDE[scheda]?.esercizi || []).map((e) => e.id);
  const ids = Object.keys(vecchia.log || {});
  ids.sort((x, y) => {
    const ix = ordine.indexOf(x);
    const iy = ordine.indexOf(y);
    return (ix < 0 ? 99 : ix) - (iy < 0 ? 99 : iy);
  });

  const durataSec = vecchia.durationSec || 0;
  const base = {
    id: vecchia.id || nuovoId(),
    userId: UTENTE_LOCALE,
    data: vecchia.date,
    tipo: "forza",
    durataSec,
    durataMin: Math.max(1, Math.round(durataSec / 60)),
    rpe: null,
    note: null,
    stato: "completata",
    forza: {
      scheda,
      esercizi: ids.map((nomeId) => ({
        nomeId,
        serie: (vecchia.log[nomeId] || []).map((x) => ({
          reps: x.reps,
          carico: x.weight || 0,
          completata: true,
        })),
      })),
      extra: [],
    },
    energy: vecchia.energy ?? null,
    satisfaction: vecchia.satisfaction ?? null,
    feel: vecchia.feel ?? null,
  };
  return { ...base, caricoRelativo: caricoDi(base) };
}

/** Traduce l'intero stato v1 nel formato nuovo. Non tocca l'originale. */
export function migraStato(v1) {
  if (!v1) return { ...statoVuoto };
  if (v1.versione === VERSIONE) return { ...statoVuoto, ...v1 };

  const active = v1.active
    ? {
        scheda: SCHEDE[v1.active.type] ? v1.active.type : "A",
        startedAt: v1.active.startedAt,
        esercizi: Object.entries(v1.active.log || {}).map(([nomeId, serie]) => ({
          nomeId,
          serie: serie.map((x) => ({ reps: x.reps, carico: x.weight || 0, completata: true })),
        })),
        extra: [],
        warmup: v1.active.warmup || [],
        energy: v1.active.energy ?? null,
      }
    : null;

  return {
    ...statoVuoto,
    userName: v1.userName ?? null,
    sessioni: (v1.history || []).map(migraSessione),
    ultimiCarichi: { ...(v1.lastWeights || {}) },
    energyLog: v1.energyLog || [],
    /* weeklyTarget contava le sedute di palestra: è la stessa cosa
       dell'obiettivo nuovo, quindi si porta dietro il valore scelto. */
    obiettivoPalestra: v1.weeklyTarget || statoVuoto.obiettivoPalestra,
    active,
  };
}

/* ---------------- carico settimanale unificato ---------------- */

const inSettimana = (sessioni, lunedi) => {
  const fine = new Date(lunedi);
  fine.setDate(fine.getDate() + 7);
  return sessioni.filter((s) => {
    const t = new Date(s.data);
    return t >= lunedi && t < fine;
  });
};

/**
 * Il numero unico che risponde a "com'è andata la settimana": somma dei carichi
 * relativi, confrontata con la media delle quattro settimane precedenti.
 * Oltre la soglia (default +10%) l'app lo dice, perché è lì che si aprono gli
 * infortuni, non nella singola seduta storta.
 */
export function caricoSettimanale(sessioni, riferimento = new Date(), soglia = 10) {
  const lunedi = startOfWeek(riferimento);
  const corrente = inSettimana(sessioni, lunedi);
  const somma = (arr) => arr.reduce((t, s) => t + (s.caricoRelativo ?? caricoDi(s)), 0);

  const precedenti = [];
  for (let i = 1; i <= 4; i++) {
    const l = new Date(lunedi);
    l.setDate(l.getDate() - 7 * i);
    precedenti.push(inSettimana(sessioni, l));
  }
  /* Le settimane a zero prima della prima seduta in assoluto non sono
     settimane scariche, sono settimane che non esistono: abbassarebbero la
     media e farebbero suonare l'allarme al primo allenamento vero. */
  const prima = sessioni.length
    ? new Date(Math.min(...sessioni.map((s) => new Date(s.data).getTime())))
    : null;
  const valide = precedenti.filter((w, i) => {
    if (!prima) return false;
    const l = new Date(lunedi);
    l.setDate(l.getDate() - 7 * (i + 1));
    const fine = new Date(l);
    fine.setDate(fine.getDate() + 7);
    return fine > prima;
  });

  const media4 = valide.length ? somma(valide.flat()) / valide.length : null;
  const totale = somma(corrente);
  const delta = media4 ? Math.round(((totale - media4) / media4) * 100) : null;

  return {
    totale,
    media4: media4 !== null ? Math.round(media4) : null,
    delta,
    allarme: delta !== null && delta > soglia,
    sessioni: corrente,
    perTipo: {
      forza: somma(corrente.filter((s) => s.tipo === "forza")),
      corsa: somma(corrente.filter((s) => s.tipo === "corsa")),
      altro: somma(corrente.filter((s) => s.tipo === "altro")),
    },
    kmCorsa: corrente.reduce((t, s) => t + (s.corsa?.distanzaKm || 0), 0),
    settimane: [...precedenti].reverse().map(somma).concat(totale),
  };
}

/* ---------------- record personali ---------------- */

const SOGLIE_PASSO = [
  { km: 5, label: "5 km" },
  { km: 10, label: "10 km" },
  { km: 15, label: "15 km" },
  { km: 21.1, label: "mezza" },
];

/**
 * I record calcolati su un insieme di sessioni. Passandogli tutto lo storico
 * meno la seduta appena chiusa si scopre in un colpo solo cosa ha battuto.
 */
export function calcolaRecord(sessioni) {
  const forza = {};
  const corsa = { distanza: null, passo: {} };

  sessioni.forEach((s) => {
    if (s.tipo === "forza") {
      (s.forza?.esercizi || []).forEach((e) => {
        const max = massimaleSessione(e.serie);
        const peso = caricoMax(e.serie);
        const cur = forza[e.nomeId] || { massimale: 0, carico: 0, data: null };
        if (max > cur.massimale) forza[e.nomeId] = { massimale: max, carico: peso, reps: e.serie.find((x) => massimaleStimato(x.carico, x.reps) === max)?.reps ?? null, data: s.data };
        else if (peso > cur.carico) forza[e.nomeId] = { ...cur, carico: peso };
      });
    }
    if (s.tipo === "corsa" && s.corsa?.distanzaKm > 0) {
      if (!corsa.distanza || s.corsa.distanzaKm > corsa.distanza.km) {
        corsa.distanza = { km: s.corsa.distanzaKm, data: s.data };
      }
      SOGLIE_PASSO.forEach(({ km, label }) => {
        if (s.corsa.distanzaKm + 0.001 < km || !s.corsa.passoMedioSec) return;
        const cur = corsa.passo[label];
        if (!cur || s.corsa.passoMedioSec < cur.sec) {
          corsa.passo[label] = { sec: s.corsa.passoMedioSec, km: s.corsa.distanzaKm, data: s.data };
        }
      });
    }
  });

  return { forza, corsa };
}

/**
 * Cosa ha battuto la sessione appena chiusa rispetto a tutto quello che c'era
 * prima. Restituisce voci già pronte da leggere, non numeri da interpretare.
 */
export function recordBattuti(sessione, storicoPrecedente) {
  const prima = calcolaRecord(storicoPrecedente);
  const out = [];

  if (sessione.tipo === "forza") {
    (sessione.forza?.esercizi || []).forEach((e) => {
      const max = massimaleSessione(e.serie);
      const peso = caricoMax(e.serie);
      const cur = prima.forza[e.nomeId];
      if (peso > 0 && (!cur || peso > cur.carico)) {
        out.push({
          tipo: "carico",
          nomeId: e.nomeId,
          titolo: esercizio(e.nomeId).nome,
          valore: `${num(peso)} kg`,
          precedente: cur?.carico ? `${num(cur.carico)} kg` : null,
        });
      } else if (max > 0 && (!cur || max > cur.massimale)) {
        out.push({
          tipo: "massimale",
          nomeId: e.nomeId,
          titolo: esercizio(e.nomeId).nome,
          valore: `${dec(max)} kg stimati`,
          precedente: cur?.massimale ? `${dec(cur.massimale)} kg` : null,
        });
      }
    });
  }

  if (sessione.tipo === "corsa" && sessione.corsa?.distanzaKm > 0) {
    const c = sessione.corsa;
    if (!prima.corsa.distanza || c.distanzaKm > prima.corsa.distanza.km) {
      out.push({
        tipo: "distanza",
        titolo: "Uscita più lunga",
        valore: `${dec(c.distanzaKm)} km`,
        precedente: prima.corsa.distanza ? `${dec(prima.corsa.distanza.km)} km` : null,
      });
    }
    SOGLIE_PASSO.forEach(({ km, label }) => {
      if (c.distanzaKm + 0.001 < km || !c.passoMedioSec) return;
      const cur = prima.corsa.passo[label];
      if (!cur || c.passoMedioSec < cur.sec) {
        out.push({
          tipo: "passo",
          titolo: `Miglior passo sui ${label}`,
          valore: `${passo(c.passoMedioSec)} al km`,
          precedente: cur ? `${passo(cur.sec)}` : null,
        });
      }
    });
  }

  return out;
}

/* ---------------- confronto con la volta prima ---------------- */

/** L'ultima sessione confrontabile con questa: stessa scheda, o stesso tipo di uscita. */
export function precedenteConfrontabile(sessione, storico) {
  const altre = storico.filter((s) => s.id !== sessione.id && s.tipo === sessione.tipo);
  if (sessione.tipo === "forza") {
    return altre.find((s) => s.forza?.scheda === sessione.forza?.scheda) || altre[0] || null;
  }
  if (sessione.tipo === "corsa") {
    return (
      altre.find((s) => s.corsa?.tipoSessione === sessione.corsa?.tipoSessione) || altre[0] || null
    );
  }
  return altre[0] || null;
}

const segno = (n, unita, dec1 = false) => {
  const v = dec1 ? dec(Math.abs(n)) : num(Math.abs(Math.round(n * 10) / 10));
  return `${n > 0 ? "+" : "−"}${v} ${unita}`;
};

/**
 * I delta rispetto alla volta prima, in italiano.
 * "+5 kg sulla panca" si legge in mezzo secondo, "+7,3%" no.
 */
export function confronto(sessione, precedente) {
  if (!precedente) return [];
  const righe = [];

  if (sessione.tipo === "forza") {
    (sessione.forza?.esercizi || []).forEach((e) => {
      const ora = caricoMax(e.serie);
      const prima = caricoMax(serieDi(precedente, e.nomeId));
      if (!ora || !prima || ora === prima) return;
      righe.push({
        tono: ora > prima ? "su" : "giu",
        testo: `${segno(ora - prima, "kg")} su ${esercizio(e.nomeId).short.toLowerCase()}`,
      });
    });

    const vOra = volumeDi(sessione);
    const vPrima = volumeDi(precedente);
    if (vPrima > 0) {
      const d = Math.round(vOra - vPrima);
      if (Math.abs(d) < vPrima * 0.03) righe.push({ tono: "pari", testo: "Stesso volume della volta scorsa" });
      else righe.push({ tono: d > 0 ? "su" : "giu", testo: `${segno(d, "kg")} di volume totale` });
    }

    const sOra = serieTotali(sessione);
    const sPrima = serieTotali(precedente);
    if (sOra !== sPrima) {
      righe.push({
        tono: sOra > sPrima ? "su" : "giu",
        testo: `${Math.abs(sOra - sPrima)} serie in ${sOra > sPrima ? "più" : "meno"}`,
      });
    }
  }

  if (sessione.tipo === "corsa") {
    const a = sessione.corsa || {};
    const b = precedente.corsa || {};
    if (a.distanzaKm && b.distanzaKm && Math.abs(a.distanzaKm - b.distanzaKm) >= 0.1) {
      righe.push({
        tono: a.distanzaKm > b.distanzaKm ? "su" : "giu",
        testo: `${segno(a.distanzaKm - b.distanzaKm, "km", true)}`,
      });
    }
    if (a.passoMedioSec && b.passoMedioSec) {
      const d = b.passoMedioSec - a.passoMedioSec; // positivo = più veloce
      const stesso = Math.abs(d) < 4;
      if (stesso && a.fcMedia && b.fcMedia && b.fcMedia - a.fcMedia >= 3) {
        righe.push({ tono: "su", testo: `Stesso passo a battito più basso, ${b.fcMedia - a.fcMedia} bpm in meno` });
      } else if (stesso) {
        righe.push({ tono: "pari", testo: "Stesso passo della volta scorsa" });
      } else {
        righe.push({
          tono: d > 0 ? "su" : "giu",
          testo: `${Math.abs(d)} secondi al km più ${d > 0 ? "veloce" : "lento"}`,
        });
      }
    }
    if (a.minutoFastidio != null && b.minutoFastidio != null && a.minutoFastidio !== b.minutoFastidio) {
      const d = a.minutoFastidio - b.minutoFastidio;
      righe.push({
        tono: d > 0 ? "su" : "giu",
        testo: `Il ginocchio si è fatto sentire ${Math.abs(d)} minuti ${d > 0 ? "più tardi" : "prima"}`,
      });
    } else if (a.minutoFastidio == null && b.minutoFastidio != null) {
      righe.push({ tono: "su", testo: "Nessun fastidio, la volta scorsa era comparso" });
    }
  }

  const dm = sessione.durataMin - precedente.durataMin;
  if (Math.abs(dm) >= 5) righe.push({ tono: "pari", testo: `${segno(dm, "minuti")} di durata` });

  return righe;
}

/* ---------------- utilità per le viste ---------------- */

export const TIPI = {
  forza: { label: "Forza", corto: "Forza", icona: "◼", tono: "forza" },
  corsa: { label: "Corsa", corto: "Corsa", icona: "▲", tono: "corsa" },
  altro: { label: "Altro", corto: "Altro", icona: "●", tono: "altro" },
};

export const TIPI_CORSA = [
  { id: "facile", label: "Facile" },
  { id: "lungo", label: "Lungo" },
  { id: "qualita", label: "Qualità" },
  { id: "discese", label: "Discese" },
  { id: "gara", label: "Gara" },
];

export const etichettaCorsa = (id) => TIPI_CORSA.find((t) => t.id === id)?.label || "Corsa";

/** Titolo di una riga di storico: dice cos'era senza doverla aprire. */
export function titoloSessione(s) {
  if (s.tipo === "forza") return SCHEDE[s.forza?.scheda]?.nome || "Palestra";
  if (s.tipo === "corsa") return etichettaCorsa(s.corsa?.tipoSessione);
  return "Altra attività";
}

/** La riga di numeri sotto al titolo. */
export function sottotitoloSessione(s) {
  if (s.tipo === "forza") {
    return `${clock(s.durataSec)} · ${serieTotali(s)} serie · ${Math.round(volumeDi(s))} kg`;
  }
  if (s.tipo === "corsa") {
    const c = s.corsa || {};
    return c.distanzaKm
      ? `${dec(c.distanzaKm)} km · ${clock(s.durataSec)} · ${passo(c.passoMedioSec)}/km`
      : `${clock(s.durataSec)} · distanza non registrata`;
  }
  return clock(s.durataSec);
}

/** Ultimo carico e ultime ripetizioni usate su un esercizio, per il precompilato. */
export function ultimaPrestazione(sessioni, nomeId) {
  const s = sessioni.find((x) => x.tipo === "forza" && serieDi(x, nomeId).length);
  return s ? { data: s.data, serie: serieDi(s, nomeId) } : null;
}

/** Tutti gli id esercizio visti almeno una volta, scheda o fuori scheda che siano. */
export function eserciziUsati(sessioni) {
  const set = new Set();
  sessioni.forEach((s) => (s.forza?.esercizi || []).forEach((e) => set.add(e.nomeId)));
  Object.keys(ESERCIZI).forEach((id) => set.add(id));
  return [...set];
}
