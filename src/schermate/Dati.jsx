import React, { useState, useMemo, useRef } from "react";
import { ENERGIA, SODDISFAZIONE, FEEL, RPE, gradino } from "../dati/scale.js";
import {
  dayKey, fullLabel, dayLabel, startOfWeek, titoloSessione, sottotitoloSessione, dec,
} from "../modello.js";
import {
  esportaJSON, esportaCSV, esportaSerieCSV, scarica, nomeBackup, leggiBackup,
} from "../storage.js";

const MESI = [
  "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
  "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre",
];
const GIORNI = ["L", "M", "M", "G", "V", "S", "D"];

/** Settimane consecutive con almeno un allenamento, risalendo da quella corrente. */
const streakSettimane = (sessioni) => {
  if (!sessioni.length) return 0;
  const settimane = new Set(sessioni.map((s) => startOfWeek(new Date(s.data)).getTime()));
  const cur = startOfWeek(new Date());
  /* La settimana in corso non conta come interruzione se è ancora vuota:
     parto da quella precedente e la aggiungo solo se ha già una seduta. */
  let n = settimane.has(cur.getTime()) ? 1 : 0;
  const c = new Date(cur);
  c.setDate(c.getDate() - 7);
  while (settimane.has(c.getTime())) {
    n += 1;
    c.setDate(c.getDate() - 7);
  }
  return n;
};

const media = (valori) => (valori.length ? valori.reduce((t, v) => t + v, 0) / valori.length : null);

export default function Dati({ data, onRinomina, onImporta, onObiettivo, onBackupFatto, avvisoBackup }) {
  const [cursore, setCursore] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [giornoAperto, setGiornoAperto] = useState(null);
  const [esito, setEsito] = useState(null);
  const fileInput = useRef(null);

  const perGiorno = useMemo(() => {
    const m = {};
    data.sessioni.forEach((s) => {
      const k = dayKey(s.data);
      (m[k] = m[k] || []).push(s);
    });
    return m;
  }, [data.sessioni]);

  const oggi = new Date();
  const chiaveOggi = dayKey(oggi);
  const anno = cursore.getFullYear();
  const mese = cursore.getMonth();
  const meseCorrente = anno === oggi.getFullYear() && mese === oggi.getMonth();

  const celle = useMemo(() => {
    const primo = new Date(anno, mese, 1);
    const giorniNelMese = new Date(anno, mese + 1, 0).getDate();
    const vuote = (primo.getDay() + 6) % 7; // settimana che parte da lunedì
    const out = [];
    for (let i = 0; i < vuote; i++) out.push(null);
    for (let g = 1; g <= giorniNelMese; g++) out.push(g);
    return out;
  }, [anno, mese]);

  const nelMese = data.sessioni.filter((s) => {
    const d = new Date(s.data);
    return d.getFullYear() === anno && d.getMonth() === mese;
  });

  const daTrentaGiorni = Date.now() - 30 * 24 * 3600 * 1000;
  const energiaMedia = media(
    data.energyLog.filter((e) => new Date(e.ts).getTime() >= daTrentaGiorni).map((e) => e.level)
  );
  const soddisfazioneMedia = media(data.sessioni.map((s) => s.satisfaction).filter(Boolean));
  const eMedia = energiaMedia !== null ? gradino(ENERGIA, Math.round(energiaMedia)) : null;
  const sMedia = soddisfazioneMedia !== null ? gradino(SODDISFAZIONE, Math.round(soddisfazioneMedia)) : null;

  /* Le sedute in cui ho dichiarato sia come sono partito sia come sono finito:
     è lì che si vede se allenarsi da stanchi cambia davvero il risultato. */
  const coppie = useMemo(
    () => data.sessioni.filter((s) => s.energy && s.satisfaction).slice(0, 12),
    [data.sessioni]
  );

  const sedute = giornoAperto ? perGiorno[giornoAperto] || [] : [];

  const importa = async (file) => {
    try {
      const stato = leggiBackup(await file.text());
      const n = (stato.sessioni ?? stato.history ?? []).length;
      onImporta(stato, n);
      setEsito({ ok: true, testo: `Letto il backup: ${n} sessioni.` });
    } catch (e) {
      setEsito({ ok: false, testo: e.message });
    }
  };

  return (
    <div className="stack">
      {avvisoBackup && (
        <div className="avviso">
          <span className="avviso-ic">▲</span>
          <p>
            Sono {avvisoBackup} sessioni dall'ultimo backup. Sta tutto solo su questo telefono: se svuoti i dati del
            sito, sparisce. Scarica il file qui sotto.
          </p>
        </div>
      )}

      <div className="grid2">
        <section className="card mini">
          <p className="eyebrow">Nel mese</p>
          <p className="mono stat">
            {nelMese.length}
            <span className="unit">sedute</span>
          </p>
        </section>
        <section className="card mini">
          <p className="eyebrow">Settimane di fila</p>
          <p className="mono stat">{streakSettimane(data.sessioni)}</p>
        </section>
      </div>

      <div className="grid2">
        <section className="card mini">
          <p className="eyebrow">Energia media</p>
          <p className="mono stat">
            {eMedia ? (
              <>
                <span className="stat-emoji">{eMedia.emoji}</span>
                {dec(energiaMedia)}
              </>
            ) : (
              <span className="muted">—</span>
            )}
          </p>
        </section>
        <section className="card mini">
          <p className="eyebrow">Soddisfazione</p>
          <p className="mono stat">
            {sMedia ? (
              <>
                <span className="stat-emoji">{sMedia.emoji}</span>
                {dec(soddisfazioneMedia)}
              </>
            ) : (
              <span className="muted">—</span>
            )}
          </p>
        </section>
      </div>

      {/* --- come sono partito, come sono finito --- */}
      {coppie.length > 0 && (
        <section className="card">
          <p className="eyebrow">Partito e finito</p>
          <h3 className="h3">Seduta per seduta</h3>
          <ul className="list">
            {coppie.map((s) => {
              const e = gradino(ENERGIA, s.energy);
              const t = gradino(SODDISFAZIONE, s.satisfaction);
              const salto = s.satisfaction - s.energy;
              return (
                <li key={s.id} className="statusrow">
                  <div>
                    <p className="body">{titoloSessione(s)}</p>
                    <p className="mono muted small">{dayLabel(s.data)}</p>
                  </div>
                  <div className="right">
                    <p className="body nowrap">
                      {e.emoji} <span className="muted">→</span> {t.emoji}
                    </p>
                    <p className={salto > 0 ? "mono small up" : salto < 0 ? "mono small down" : "mono muted small"}>
                      {salto > 0 ? `+${salto}` : salto < 0 ? salto : "="}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="footnote">
            {(() => {
              const stanche = coppie.filter((s) => s.energy <= 2);
              const su = stanche.filter((s) => s.satisfaction > s.energy).length;
              if (stanche.length < 3) return "Con qualche seduta in più qui compare se partire stanchi cambia il risultato.";
              return su >= stanche.length / 2
                ? `Su ${stanche.length} sedute iniziate da fiacco, ${su} sono finite meglio di come erano cominciate. Partire stanchi non è un motivo per non andare.`
                : `Su ${stanche.length} sedute iniziate da fiacco, solo ${su} sono migliorate strada facendo. Quando parti a terra, tieni il carico basso e portala a casa.`;
            })()}
          </p>
        </section>
      )}

      {/* --- calendario --- */}
      <section className="card">
        <div className="cal-head">
          <button
            className="cal-nav"
            aria-label="Mese precedente"
            onClick={() => {
              setCursore(new Date(anno, mese - 1, 1));
              setGiornoAperto(null);
            }}
          >
            ‹
          </button>
          <h2 className="h3">
            {MESI[mese]} {anno}
          </h2>
          <button
            className="cal-nav"
            aria-label="Mese successivo"
            disabled={meseCorrente}
            onClick={() => {
              setCursore(new Date(anno, mese + 1, 1));
              setGiornoAperto(null);
            }}
          >
            ›
          </button>
        </div>

        <div className="cal-grid cal-dows">
          {GIORNI.map((g, i) => (
            <span key={i} className="cal-dow">
              {g}
            </span>
          ))}
        </div>

        <div className="cal-grid">
          {celle.map((g, i) => {
            if (g === null) return <span key={`v${i}`} className="cal-empty" />;
            const k = dayKey(new Date(anno, mese, g));
            const ses = perGiorno[k] || [];
            const tipi = new Set(ses.map((s) => s.tipo));
            const classi = ["cal-day"];
            if (tipi.has("corsa") && tipi.has("forza")) classi.push("cal-both");
            else if (tipi.has("corsa")) classi.push("cal-corsa");
            else if (tipi.has("forza")) classi.push("cal-forza");
            if (k === chiaveOggi) classi.push("cal-today");
            if (k === giornoAperto) classi.push("cal-open");
            return (
              <button
                key={k}
                className={classi.join(" ")}
                disabled={!ses.length}
                aria-label={ses.length ? `${fullLabel(ses[0].data)}, ${ses.length} allenamenti` : String(g)}
                onClick={() => setGiornoAperto(giornoAperto === k ? null : k)}
              >
                <span className="mono">{g}</span>
              </button>
            );
          })}
        </div>

        <div className="cal-legend">
          <span className="cal-key bg-corsa" /> Corsa
          <span className="cal-key bg-forza" /> Palestra
          <span className="cal-key cal-both" /> Tutte e due
        </div>

        {sedute.map((s) => {
          const feel = FEEL.find((f) => f.id === s.feel);
          const en = gradino(ENERGIA, s.energy);
          const sat = gradino(SODDISFAZIONE, s.satisfaction);
          const rpe = gradino(RPE, s.rpe);
          return (
            <div key={s.id} className="cal-detail">
              <p className="eyebrow">{fullLabel(s.data)}</p>
              <h3 className="h3">{titoloSessione(s)}</h3>
              <p className="mono muted small">
                {sottotitoloSessione(s)}
                {rpe ? ` · RPE ${rpe.level}` : ""}
              </p>
              <p className="body spaced">
                {en && (
                  <>
                    Partito {en.emoji} {en.label.toLowerCase()}
                  </>
                )}
                {en && sat && <span className="dot" />}
                {sat && (
                  <>
                    Finito {sat.emoji} {sat.label.toLowerCase()}
                  </>
                )}
                {!en && !sat && <span className="muted">Nessuna sensazione registrata</span>}
              </p>
              {feel && <span className={`pill pill-${feel.tone}`}>Ginocchio: {feel.label.toLowerCase()}</span>}
            </div>
          );
        })}

        {!data.sessioni.length && (
          <div className="cal-detail">
            <p className="body muted">
              Nessun allenamento registrato. Chiudi il primo e comparirà qui, sul giorno in cui l'hai fatto.
            </p>
          </div>
        )}
      </section>

      {/* --- backup --- */}
      <section className="card">
        <p className="eyebrow">Backup ed export</p>
        <h3 className="h3">I dati sono tuoi</h3>
        <p className="body muted">
          Tutto sta in questo telefono, senza account e senza server. Il JSON serve a rimettere tutto com'era, il CSV ad
          aprirlo in un foglio di calcolo.
        </p>

        <div className="navrow spaced">
          <button
            className="btn btn-line"
            onClick={() => {
              scarica(nomeBackup("json"), esportaJSON(data));
              onBackupFatto();
              setEsito({ ok: true, testo: "Backup JSON scaricato." });
            }}
          >
            Backup JSON
          </button>
          <button
            className="btn btn-line"
            onClick={() => {
              scarica(nomeBackup("csv"), esportaCSV(data.sessioni), "text/csv");
              setEsito({ ok: true, testo: "CSV delle sessioni scaricato." });
            }}
          >
            CSV sessioni
          </button>
        </div>
        <button
          className="btn btn-line"
          onClick={() => {
            scarica(`gymbuddy-serie-${new Date().toISOString().slice(0, 10)}.csv`, esportaSerieCSV(data.sessioni), "text/csv");
            setEsito({ ok: true, testo: "CSV serie per serie scaricato." });
          }}
        >
          CSV serie per serie
        </button>

        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importa(f);
            e.target.value = "";
          }}
        />
        <button className="btn btn-line" onClick={() => fileInput.current?.click()}>
          Reimporta un backup
        </button>
        <p className="footnote">
          Reimportare unisce: le sessioni che ci sono già non si duplicano, quelle che mancano rientrano. Non cancella
          mai niente di quello che hai adesso.
        </p>

        {esito && (
          <p className={esito.ok ? "doneline mono" : "record-line"}>{esito.testo}</p>
        )}

        {data.ultimoBackup && (
          <p className="footnote">
            Ultimo backup {dayLabel(data.ultimoBackup.ts)}, con {data.ultimoBackup.sessioni} sessioni.
          </p>
        )}
      </section>

      {/* --- impostazioni --- */}
      <section className="card">
        <p className="eyebrow">Obiettivo di palestra</p>
        <div className="incs">
          {[2, 3, 4].map((t) => (
            <button key={t} className={data.obiettivoPalestra === t ? "chip chip-on" : "chip"} onClick={() => onObiettivo(t)}>
              {t} a settimana
            </button>
          ))}
        </div>
        <p className="footnote">
          Il piano ne chiede due, ed è un pavimento: anche a dicembre, anche in settimana di scarico.
        </p>
      </section>

      <section className="card mini">
        <div className="between middle">
          <div className="left">
            <p className="eyebrow">Nome</p>
            <p className="body">{data.userName}</p>
          </div>
          <button className="btn btn-line btn-inline" onClick={onRinomina}>
            Cambia
          </button>
        </div>
      </section>
    </div>
  );
}
