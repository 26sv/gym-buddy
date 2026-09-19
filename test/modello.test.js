import test from "node:test";
import assert from "node:assert/strict";

import {
  migraStato, migraSessione, caricoDi, caricoSettimanale, calcolaRecord,
  recordBattuti, confronto, precedenteConfrontabile, nuovaCorsa, chiudiForza,
  nuovaForza, serieDi, serieTotali, volumeDi, massimaleStimato, passo, VERSIONE,
  descriviCarico, nuovoImpegno, impegniDelGiorno, prossimiImpegni, giorniA, descriviGiorno,
} from "../src/modello.js";
import { esportaCSV, leggiBackup, unisci } from "../src/storage.js";
import { settimanaDi, previstoIl, giorniAllaGara, dateSettimana, SETTIMANE, PIANO } from "../src/dati/piano.js";
import { SCHEDE, seriePreviste } from "../src/dati/schede.js";

const iso = (s) => new Date(s).toISOString();

/* ---------------- migrazione ---------------- */

const V1 = {
  history: [
    {
      id: "s1", date: iso("2026-08-10T18:00:00"), type: "A", durationSec: 3300,
      log: { a2: [{ weight: 60, reps: 5 }, { weight: 62.5, reps: 5 }], a1: [{ weight: 80, reps: 6 }] },
      feel: "ok", satisfaction: 3, energy: 2,
    },
    {
      id: "s2", date: iso("2026-08-07T18:00:00"), type: "B", durationSec: 3000,
      log: { b1: [{ weight: 90, reps: 5 }] }, feel: null, satisfaction: 4, energy: 3,
    },
  ],
  lastWeights: { a2: 62.5, a1: 80, b1: 90 },
  weeklyTarget: 3,
  active: null,
  userName: "Marco",
  energyLog: [{ ts: iso("2026-08-10T17:00:00"), level: 2 }],
};

test("la migrazione non perde nessuna sessione né nessuna serie", () => {
  const v2 = migraStato(V1);
  assert.equal(v2.versione, VERSIONE);
  assert.equal(v2.sessioni.length, 2);
  assert.equal(v2.userName, "Marco");
  assert.equal(v2.obiettivoPalestra, 3, "weeklyTarget diventa l'obiettivo di palestra");

  const s1 = v2.sessioni[0];
  assert.equal(s1.tipo, "forza");
  assert.equal(s1.forza.scheda, "A");
  assert.equal(serieTotali(s1), 3);
  assert.deepEqual(serieDi(s1, "a2"), [
    { reps: 5, carico: 60, completata: true },
    { reps: 5, carico: 62.5, completata: true },
  ]);
  assert.equal(volumeDi(s1), 60 * 5 + 62.5 * 5 + 80 * 6);
});

test("la migrazione rimette gli esercizi nell'ordine della scheda", () => {
  const s = migraSessione(V1.history[0]);
  assert.deepEqual(s.forza.esercizi.map((e) => e.nomeId), ["a1", "a2"]);
});

test("senza RPE il carico si stima medio invece di valere zero", () => {
  const s = migraSessione(V1.history[0]);
  assert.equal(s.rpe, null);
  assert.equal(s.caricoRelativo, 55 * 3); // 3300 s = 55 min, RPE stimato 3
});

test("una seduta aperta a metà sopravvive alla migrazione", () => {
  const v2 = migraStato({
    ...V1,
    active: { type: "B", startedAt: iso("2026-08-12T18:00:00"), log: { b1: [{ weight: 90, reps: 5 }] }, warmup: ["x"], energy: 3 },
  });
  assert.equal(v2.active.scheda, "B");
  assert.equal(v2.active.esercizi[0].serie.length, 1);
  assert.equal(v2.active.energy, 3);
});

test("rimigrare uno stato già nuovo lo lascia com'è", () => {
  const v2 = migraStato(V1);
  const v3 = migraStato(v2);
  assert.deepEqual(v3.sessioni, v2.sessioni);
});

test("uno stato inesistente dà lo stato vuoto, non un errore", () => {
  const v = migraStato(null);
  assert.deepEqual(v.sessioni, []);
  assert.equal(v.userName, null);
});

/* ---------------- carico relativo ---------------- */

test("il carico è durata per RPE, e mette sullo stesso piano corsa e palestra", () => {
  const corsa = nuovaCorsa({ distanzaKm: 10, durataSec: 3600, rpe: 3, tipoSessione: "lungo" });
  const forza = chiudiForza(nuovaForza({ scheda: "P", energia: 3 }), 3600, { rpe: 3 });
  assert.equal(corsa.caricoRelativo, 180);
  assert.equal(forza.caricoRelativo, 180);
});

test("il passo si calcola, non si digita", () => {
  const c = nuovaCorsa({ distanzaKm: 10, durataSec: 3000, rpe: 2 });
  assert.equal(c.corsa.passoMedioSec, 300);
  assert.equal(passo(300), "5:00");
});

test("una corsa senza distanza resta salvabile, marcata bozza", () => {
  const c = nuovaCorsa({ distanzaKm: 0, durataSec: 1800, rpe: 3 });
  assert.equal(c.stato, "bozza");
  assert.equal(c.corsa.passoMedioSec, null);
  assert.equal(c.caricoRelativo, 90);
});

/* ---------------- carico settimanale ---------------- */

const sessione = (data, tipo, durataMin, rpe, extra = {}) => ({
  id: `${data}-${tipo}`, userId: "local", data: iso(data), tipo,
  durataMin, durataSec: durataMin * 60, rpe, stato: "completata",
  caricoRelativo: durataMin * rpe, ...extra,
});

test("il carico settimanale somma le due discipline e le tiene distinte", () => {
  const oggi = new Date("2026-09-16T12:00:00"); // mercoledì
  const c = caricoSettimanale(
    [
      sessione("2026-09-15T18:00:00", "forza", 60, 3),
      sessione("2026-09-14T07:00:00", "corsa", 45, 2, { corsa: { distanzaKm: 8, passoMedioSec: 337 } }),
    ],
    oggi,
    10
  );
  assert.equal(c.totale, 180 + 90);
  assert.equal(c.perTipo.forza, 180);
  assert.equal(c.perTipo.corsa, 90);
  assert.equal(c.kmCorsa, 8);
});

test("l'allarme scatta solo sopra la soglia, non a ogni settimana buona", () => {
  const oggi = new Date("2026-09-16T12:00:00");
  const passate = [];
  for (let i = 1; i <= 4; i++) {
    const d = new Date("2026-09-15T18:00:00");
    d.setDate(d.getDate() - 7 * i);
    passate.push(sessione(d.toISOString(), "corsa", 50, 2)); // 100 a settimana
  }
  const sotto = caricoSettimanale([sessione("2026-09-15T18:00:00", "corsa", 52, 2), ...passate], oggi, 10);
  assert.equal(sotto.media4, 100);
  assert.equal(sotto.delta, 4);
  assert.equal(sotto.allarme, false);

  const sopra = caricoSettimanale([sessione("2026-09-15T18:00:00", "corsa", 70, 2), ...passate], oggi, 10);
  assert.equal(sopra.delta, 40);
  assert.equal(sopra.allarme, true);
});

test("le settimane prima della prima seduta non abbassano la media", () => {
  const oggi = new Date("2026-09-16T12:00:00");
  const c = caricoSettimanale([sessione("2026-09-15T18:00:00", "forza", 60, 3)], oggi, 10);
  assert.equal(c.media4, null, "senza storico non c'è confronto, quindi nessun falso allarme");
  assert.equal(c.allarme, false);
});

/* ---------------- record ---------------- */

test("il record di carico si accorge del sorpasso e dice qual era il precedente", () => {
  const storico = [
    sessione("2026-08-01T18:00:00", "forza", 60, 3, {
      forza: { scheda: "A", esercizi: [{ nomeId: "a2", serie: [{ reps: 5, carico: 60, completata: true }] }] },
    }),
  ];
  const nuova = sessione("2026-08-08T18:00:00", "forza", 60, 3, {
    forza: { scheda: "A", esercizi: [{ nomeId: "a2", serie: [{ reps: 5, carico: 65, completata: true }] }] },
  });
  const rec = recordBattuti(nuova, storico);
  assert.equal(rec.length, 1);
  assert.equal(rec[0].valore, "65 kg");
  assert.equal(rec[0].precedente, "60 kg");
});

test("restare sotto il massimo non è un record", () => {
  const storico = [
    sessione("2026-08-01T18:00:00", "forza", 60, 3, {
      forza: { scheda: "A", esercizi: [{ nomeId: "a2", serie: [{ reps: 5, carico: 80, completata: true }] }] },
    }),
  ];
  const nuova = sessione("2026-08-08T18:00:00", "forza", 60, 3, {
    forza: { scheda: "A", esercizi: [{ nomeId: "a2", serie: [{ reps: 5, carico: 70, completata: true }] }] },
  });
  assert.deepEqual(recordBattuti(nuova, storico), []);
});

test("il passo migliore vale solo sulle distanze davvero coperte", () => {
  const veloce5 = sessione("2026-09-01T07:00:00", "corsa", 25, 4, {
    corsa: { distanzaKm: 5, passoMedioSec: 300, tipoSessione: "qualita" },
  });
  const lento10 = sessione("2026-09-08T07:00:00", "corsa", 60, 2, {
    corsa: { distanzaKm: 10, passoMedioSec: 360, tipoSessione: "lungo" },
  });
  const rec = calcolaRecord([veloce5, lento10]);
  assert.equal(rec.passo, undefined);
  assert.equal(rec.corsa.passo["5 km"].sec, 300, "la 10 km più lenta non batte la 5 km veloce");
  assert.equal(rec.corsa.passo["10 km"].sec, 360, "ma sui 10 km il record è suo, la 5 km non li ha coperti");
  assert.equal(rec.corsa.distanza.km, 10);
});

test("il massimale stimato segue Epley", () => {
  assert.equal(massimaleStimato(100, 5), 116.7);
  assert.equal(massimaleStimato(0, 5), 0);
});

/* ---------------- confronto ---------------- */

test("i delta di forza si leggono in italiano, non in percentuali", () => {
  const prima = sessione("2026-08-01T18:00:00", "forza", 60, 3, {
    forza: { scheda: "A", esercizi: [{ nomeId: "a2", serie: [{ reps: 5, carico: 60, completata: true }] }] },
  });
  const dopo = sessione("2026-08-08T18:00:00", "forza", 60, 3, {
    forza: { scheda: "A", esercizi: [{ nomeId: "a2", serie: [{ reps: 5, carico: 65, completata: true }] }] },
  });
  const righe = confronto(dopo, prima);
  assert.ok(righe.some((r) => r.testo === "+5 kg su panca" && r.tono === "su"), JSON.stringify(righe));
});

test("stesso passo a battito più basso è un miglioramento, non un pareggio", () => {
  const prima = sessione("2026-09-01T07:00:00", "corsa", 60, 3, {
    corsa: { distanzaKm: 10, passoMedioSec: 360, fcMedia: 158, tipoSessione: "lungo" },
  });
  const dopo = sessione("2026-09-08T07:00:00", "corsa", 60, 3, {
    corsa: { distanzaKm: 10, passoMedioSec: 358, fcMedia: 150, tipoSessione: "lungo" },
  });
  const righe = confronto(dopo, prima);
  assert.ok(righe.some((r) => /battito più basso/.test(r.testo) && r.tono === "su"), JSON.stringify(righe));
});

test("il minuto del fastidio che si sposta in avanti è la riga che conta", () => {
  const prima = sessione("2026-09-01T07:00:00", "corsa", 60, 3, {
    corsa: { distanzaKm: 10, passoMedioSec: 360, minutoFastidio: 18, tipoSessione: "lungo" },
  });
  const dopo = sessione("2026-09-08T07:00:00", "corsa", 60, 3, {
    corsa: { distanzaKm: 10, passoMedioSec: 360, minutoFastidio: 26, tipoSessione: "lungo" },
  });
  const righe = confronto(dopo, prima);
  assert.ok(
    righe.some((r) => r.testo === "Il ginocchio si è fatto sentire 8 minuti più tardi" && r.tono === "su"),
    JSON.stringify(righe)
  );
});

test("il confronto cerca l'uscita dello stesso tipo, non solo l'ultima", () => {
  const lungoVecchio = sessione("2026-09-01T07:00:00", "corsa", 90, 3, {
    corsa: { distanzaKm: 15, tipoSessione: "lungo", passoMedioSec: 360 },
  });
  const facileIeri = sessione("2026-09-07T07:00:00", "corsa", 30, 2, {
    corsa: { distanzaKm: 5, tipoSessione: "facile", passoMedioSec: 360 },
  });
  const lungoOggi = sessione("2026-09-08T07:00:00", "corsa", 95, 3, {
    corsa: { distanzaKm: 16, tipoSessione: "lungo", passoMedioSec: 356 },
  });
  const p = precedenteConfrontabile(lungoOggi, [facileIeri, lungoVecchio]);
  assert.equal(p.id, lungoVecchio.id);
});

test("senza niente con cui confrontarsi non si inventa un delta", () => {
  const sola = nuovaCorsa({ distanzaKm: 5, durataSec: 1800, rpe: 2 });
  assert.deepEqual(confronto(sola, precedenteConfrontabile(sola, [])), []);
});

/* ---------------- piano ---------------- */

test("le 24 settimane cadono sulle date delle due gare", () => {
  assert.equal(SETTIMANE.length, 24);
  assert.equal(settimanaDi(new Date("2026-10-18T10:00:00")).n, 8, "la 10 km è la domenica della settimana 8");
  assert.equal(settimanaDi(new Date("2027-02-07T09:00:00")).n, 24, "la mezza è la domenica della settimana 24");
  assert.equal(settimanaDi(new Date("2026-08-24T09:00:00")).n, 1);
  assert.equal(settimanaDi(new Date("2026-08-17T09:00:00")), null, "prima dell'inizio non c'è piano");
  assert.equal(settimanaDi(new Date("2027-03-01T09:00:00")), null, "dopo la gara nemmeno");
});

/* La regola 2 del piano dice che il lungo cresce di massimo 1 km a settimana.
   La tabella la rispetta dappertutto tranne al picco, dove passa da 16 a 18: è
   così nel documento del piano, quindi resta così anche qui, ma segnata come
   eccezione voluta invece che nascosta. Se salta fuori uno scalino altrove, è
   un errore di trascrizione e questo test lo prende. */
const SALTI_AMMESSI = { 21: 2 };

test("il lungo cresce di massimo 1 km a settimana, fuori dagli scarichi", () => {
  for (let i = 1; i < SETTIMANE.length; i++) {
    const prima = SETTIMANE[i - 1];
    const ora = SETTIMANE[i];
    if (ora.scarico || prima.scarico || ora.gara || prima.gara) continue;
    const massimo = SALTI_AMMESSI[ora.n] ?? 1;
    assert.ok(
      ora.lungo.km - prima.lungo.km <= massimo,
      `settimana ${ora.n}: il lungo passa da ${prima.lungo.km} a ${ora.lungo.km}`
    );
  }
});

test("i totali settimanali tornano con la somma delle tre uscite", () => {
  for (const s of SETTIMANE) {
    if (s.gara) continue; // in settimana di gara il totale non include la gara
    const somma = s.lungo.km + s.a.km + s.b.km;
    assert.equal(somma, s.totale, `settimana ${s.n}: ${somma} contro ${s.totale} dichiarati`);
  }
});

test("ogni quarta settimana circa si scarica, e il piano ne ha in ogni blocco", () => {
  const scarichi = SETTIMANE.filter((s) => s.scarico).map((s) => s.n);
  assert.deepEqual(scarichi, [4, 9, 13, 17, 19]);
});

test("la palestra non cade mai nelle 48 ore prima del lungo o delle discese", () => {
  /* Il vincolo del piano vale sui giorni della settimana, quindi si verifica
     una volta sola su una settimana con discese. */
  const sett = SETTIMANE.find((s) => s.a.discese);
  const giorni = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(dateSettimana(sett.n).da);
    d.setDate(d.getDate() + i);
    giorni.push({ d, previsto: previstoIl(d) });
  }
  const palestra = giorni.filter((g) => g.previsto.some((p) => p.tipo === "forza"));
  const delicate = giorni.filter((g) =>
    g.previsto.some((p) => p.slot === "lungo" || (p.slot === "a" && sett.a.discese))
  );
  assert.equal(palestra.length, 2, "due sedute di palestra a settimana, il pavimento del piano");
  for (const p of palestra) {
    for (const u of delicate) {
      const ore = (u.d - p.d) / 3600000;
      assert.ok(ore <= 0 || ore >= 48, `palestra ${ore} ore prima di ${u.previsto[0].titolo}`);
    }
  }
});

test("tre uscite di corsa a settimana, mai quattro", () => {
  for (const sett of SETTIMANE) {
    const da = new Date(`${PIANO.inizio}T00:00:00`);
    da.setDate(da.getDate() + (sett.n - 1) * 7);
    let corse = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(da);
      d.setDate(d.getDate() + i);
      corse += previstoIl(d).filter((p) => p.tipo === "corsa").length;
    }
    assert.equal(corse, 3, `settimana ${sett.n}`);
  }
});

test("il conto alla rovescia guarda la gara vera", () => {
  assert.equal(giorniAllaGara(new Date("2027-02-06T12:00:00")), 1);
  assert.equal(giorniAllaGara(new Date("2027-02-07T06:00:00")), 0);
});

/* ---------------- schede ---------------- */

test("le schede citano solo esercizi che esistono in catalogo", async () => {
  const { ESERCIZI } = await import("../src/dati/esercizi.js");
  for (const [id, scheda] of Object.entries(SCHEDE)) {
    for (const e of scheda.esercizi) {
      assert.ok(ESERCIZI[e.id], `${id} cita ${e.id}, che non è in catalogo`);
    }
  }
});

test("gli esercizi condivisi tra schede tengono lo stesso id, così lo storico non si spezza", () => {
  const inP = SCHEDE.P.esercizi.map((e) => e.id);
  const inA = SCHEDE.A.esercizi.map((e) => e.id);
  assert.ok(inP.includes("a1") && inA.includes("a1"), "lo stacco rumeno è lo stesso esercizio in tutte e due");
  assert.ok(inP.includes("a3") && inA.includes("a3"));
});

test("seriePreviste conta quello che c'è davvero nella scheda", () => {
  assert.equal(seriePreviste("A"), 4 + 4 + 3 + 3 + 3);
});

/* ---------------- export e import ---------------- */

test("il CSV ha una riga per sessione più l'intestazione", () => {
  const csv = esportaCSV([
    sessione("2026-09-15T18:00:00", "forza", 60, 3, {
      forza: { scheda: "A", esercizi: [{ nomeId: "a2", serie: [{ reps: 5, carico: 60, completata: true }] }] },
    }),
    sessione("2026-09-14T07:00:00", "corsa", 45, 2, { corsa: { distanzaKm: 8, passoMedioSec: 337 } }),
  ]);
  const righe = csv.split("\n");
  assert.equal(righe.length, 3);
  assert.ok(righe[0].startsWith("data,tipo,durata_min"));
  assert.ok(righe[1].includes("corsa"), "le righe escono in ordine cronologico");
});

test("le note con virgole non sfondano il CSV", () => {
  const csv = esportaCSV([sessione("2026-09-15T18:00:00", "corsa", 45, 2, { note: 'freddo, "molto" freddo' })]);
  assert.ok(csv.includes('"freddo, ""molto"" freddo"'));
});

test("un file rotto viene rifiutato con un motivo, non svuota lo storico", () => {
  assert.throws(() => leggiBackup("non sono json"), /JSON leggibile/);
  assert.throws(() => leggiBackup('{"stato":{}}'), /nessuno storico/);
});

test("reimportare due volte lo stesso backup non duplica niente", () => {
  const attuale = { sessioni: [sessione("2026-09-15T18:00:00", "forza", 60, 3)], energyLog: [] };
  const backup = { sessioni: [sessione("2026-09-15T18:00:00", "forza", 60, 3)], energyLog: [] };
  assert.equal(unisci(attuale, backup).sessioni.length, 1);
});

test("l'unione riporta indietro le sessioni che mancano", () => {
  const attuale = { sessioni: [sessione("2026-09-15T18:00:00", "forza", 60, 3)], energyLog: [] };
  const backup = { sessioni: [sessione("2026-08-15T18:00:00", "corsa", 40, 2)], energyLog: [] };
  const out = unisci(attuale, backup);
  assert.equal(out.sessioni.length, 2);
  assert.equal(out.sessioni[0].tipo, "forza", "restano in ordine, la più recente in testa");
});

/* ---------------- come si racconta il carico ---------------- */

test("a metà settimana non si sventola un meno che dipende dai giorni passati", () => {
  const martedi = new Date("2026-09-15T09:00:00");
  const passate = [];
  for (let i = 1; i <= 4; i++) {
    const d = new Date("2026-09-08T18:00:00");
    d.setDate(d.getDate() - 7 * (i - 1));
    passate.push(sessione(d.toISOString(), "corsa", 100, 4)); // 400 a settimana
  }
  const c = caricoSettimanale([sessione("2026-09-14T18:00:00", "corsa", 30, 2), ...passate], martedi, 10);
  assert.equal(c.parziale, true);
  assert.equal(c.giorniTrascorsi, 2);
  assert.match(descriviCarico(c), /contro una media di/);
  assert.doesNotMatch(descriviCarico(c), /sotto la media/);
});

test("il segno più invece è vero in qualunque giorno e si dice", () => {
  const martedi = new Date("2026-09-15T09:00:00");
  const passate = [];
  for (let i = 1; i <= 4; i++) {
    const d = new Date("2026-09-08T18:00:00");
    d.setDate(d.getDate() - 7 * (i - 1));
    passate.push(sessione(d.toISOString(), "corsa", 50, 2)); // 100 a settimana
  }
  const c = caricoSettimanale([sessione("2026-09-14T18:00:00", "corsa", 60, 3), ...passate], martedi, 10);
  assert.equal(c.parziale, true);
  assert.equal(c.allarme, true);
  assert.match(descriviCarico(c), /sopra la media/);
});

test("a settimana chiusa il meno si dice eccome", () => {
  const domenica = new Date("2026-09-20T22:00:00");
  const passate = [];
  for (let i = 1; i <= 4; i++) {
    const d = new Date("2026-09-13T18:00:00");
    d.setDate(d.getDate() - 7 * (i - 1));
    passate.push(sessione(d.toISOString(), "corsa", 100, 4)); // 400 a settimana
  }
  const c = caricoSettimanale([sessione("2026-09-19T18:00:00", "corsa", 50, 4), ...passate], domenica, 10);
  assert.equal(c.parziale, false);
  assert.equal(c.giorniTrascorsi, 7);
  assert.match(descriviCarico(c), /50% sotto la media/);
});

test("senza storico non si racconta nessun confronto", () => {
  const c = caricoSettimanale([sessione("2026-09-14T18:00:00", "forza", 60, 3)], new Date("2026-09-15T09:00:00"), 10);
  assert.match(descriviCarico(c), /Serve qualche settimana/);
});

/* ---------------- calendario di lavoro ---------------- */

test("un impegno senza tipo diventa 'impegno', non 'lezione' per default", () => {
  const i = nuovoImpegno({ data: "2026-09-22", titolo: "  Riunione  " });
  assert.equal(i.tipo, "impegno");
  assert.equal(i.titolo, "Riunione", "il titolo si ripulisce degli spazi");
  assert.equal(i.pronto, false);
  assert.ok(i.id);
});

test("un impegno senza titolo resta comunque salvabile", () => {
  const i = nuovoImpegno({ data: "2026-09-22", tipo: "lezione" });
  assert.equal(i.titolo, "Impegno");
  assert.equal(i.tipo, "lezione");
});

test("impegniDelGiorno prende solo quel giorno e ordina per orario", () => {
  const impegni = [
    nuovoImpegno({ data: "2026-09-22", ora: "15:00", titolo: "Pomeriggio" }),
    nuovoImpegno({ data: "2026-09-22", ora: "09:00", titolo: "Mattina" }),
    nuovoImpegno({ data: "2026-09-23", ora: "09:00", titolo: "Domani" }),
  ];
  const del22 = impegniDelGiorno(impegni, "2026-09-22");
  assert.equal(del22.length, 2);
  assert.equal(del22[0].titolo, "Mattina");
});

test("prossimiImpegni tiene fuori il passato e quello troppo lontano", () => {
  const oggi = new Date("2026-09-19T09:00:00");
  const impegni = [
    nuovoImpegno({ data: "2026-09-18", titolo: "Ieri" }),
    nuovoImpegno({ data: "2026-09-19", titolo: "Oggi" }),
    nuovoImpegno({ data: "2026-09-25", titolo: "Tra una settimana" }),
    nuovoImpegno({ data: "2026-10-20", titolo: "Tra un mese" }),
  ];
  const prox = prossimiImpegni(impegni, oggi, 14);
  assert.deepEqual(prox.map((i) => i.titolo), ["Oggi", "Tra una settimana"]);
});

test("il conto alla rovescia dei giorni segue il calendario, non le 24 ore esatte", () => {
  const oggi = new Date("2026-09-19T22:00:00"); // tardi sera
  assert.equal(giorniA("2026-09-20", oggi), 1, "anche partendo dalla sera, domani resta domani");
  assert.equal(giorniA("2026-09-19", oggi), 0);
  assert.equal(giorniA("2026-09-18", oggi), -1);
});

test("descriviGiorno traduce il conto alla rovescia in italiano", () => {
  const oggi = new Date("2026-09-19T09:00:00");
  assert.equal(descriviGiorno("2026-09-19", oggi), "Oggi");
  assert.equal(descriviGiorno("2026-09-20", oggi), "Domani");
  assert.equal(descriviGiorno("2026-09-23", oggi), "Tra 4 giorni");
  assert.equal(descriviGiorno("2026-09-18", oggi), "Ieri");
});

test("l'unione dei backup riporta indietro anche gli impegni mancanti, senza duplicare quelli comuni", () => {
  const comune = nuovoImpegno({ id: "i1", data: "2026-09-20", titolo: "Lezione comune" });
  const soloNelBackup = nuovoImpegno({ id: "i2", data: "2026-09-21", titolo: "Solo nel backup" });
  const attuale = { sessioni: [], energyLog: [], impegni: [comune] };
  const backup = { sessioni: [], energyLog: [], impegni: [comune, soloNelBackup] };
  const out = unisci(attuale, backup);
  assert.equal(out.impegni.length, 2);
  assert.ok(out.impegni.some((i) => i.id === "i2"));
});
