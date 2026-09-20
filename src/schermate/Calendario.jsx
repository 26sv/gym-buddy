import React, { useState, useMemo } from "react";
import { dayKey, fullLabel } from "../modello.js";
import {
  impegniDelGiorno, giorniConImpegni, prossimiImpegni, descriviGiorno, TIPI_IMPEGNO,
} from "../modello.js";

const MESI = [
  "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
  "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre",
];
const GIORNI = ["L", "M", "M", "G", "V", "S", "D"];

/**
 * Solo impegni di lavoro, niente allenamenti: è un calendario a parte apposta,
 * perché mescolarlo con corsa e forza vorrebbe dire tornare a cercare la
 * lezione di domani in mezzo alle serie di panca. "Prossimi impegni" sta sopra
 * la griglia perché è quello che serve prima di uscire di casa, non il mese
 * intero da scorrere.
 */
export default function Calendario({ data, onSalva, onElimina, onTogglePronto }) {
  const impegni = data.impegni || [];
  const [cursore, setCursore] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [giornoAperto, setGiornoAperto] = useState(null);
  const [foglio, setFoglio] = useState(null); // null | { impegno: Impegno|null, data: chiave }

  const perGiorno = useMemo(() => giorniConImpegni(impegni), [impegni]);
  const prossimi = useMemo(() => prossimiImpegni(impegni), [impegni]);

  const oggi = new Date();
  const chiaveOggi = dayKey(oggi);
  const anno = cursore.getFullYear();
  const mese = cursore.getMonth();

  const celle = useMemo(() => {
    const primo = new Date(anno, mese, 1);
    const giorniNelMese = new Date(anno, mese + 1, 0).getDate();
    const vuote = (primo.getDay() + 6) % 7; // settimana che parte da lunedì
    const out = [];
    for (let i = 0; i < vuote; i++) out.push(null);
    for (let g = 1; g <= giorniNelMese; g++) out.push(g);
    return out;
  }, [anno, mese]);

  const delGiorno = giornoAperto ? impegniDelGiorno(impegni, giornoAperto) : [];

  const chiudiFoglio = () => setFoglio(null);

  return (
    <div className="stack">
      <section className="card">
        <p className="eyebrow">Da qui a due settimane</p>
        <h2 className="h3">Prossimi impegni</h2>
        {!prossimi.length && (
          <p className="body muted spaced">
            Niente in calendario. Segna la prossima lezione appena la sai, così la ritrovi qui invece che a memoria.
          </p>
        )}
        <div className="stack" style={prossimi.length ? { marginTop: 11 } : undefined}>
          {prossimi.map((i) => (
            <div key={i.id} className="card mini between middle">
              <button
                className={i.pronto ? "imp-check check-on" : "imp-check"}
                onClick={() => onTogglePronto(i.id)}
                aria-label={i.pronto ? `${i.titolo}: segna da preparare` : `${i.titolo}: segna come pronto`}
              >
                <span className="box">{i.pronto ? "✓" : ""}</span>
              </button>
              <button className="imp-body" onClick={() => setFoglio({ impegno: i })}>
                <p className={i.pronto ? "body muted" : "body"}>{i.titolo}</p>
                <p className="mono muted small">
                  {descriviGiorno(i.data)}
                  {i.ora ? ` · ${i.ora}` : ""}
                  {i.luogo ? ` · ${i.luogo}` : ""}
                </p>
              </button>
              <span className={i.tipo === "lezione" ? "pill pill-lavoro" : "badge badge-lavoro"}>
                {TIPI_IMPEGNO[i.tipo].corto}
              </span>
            </div>
          ))}
        </div>
        <button className="btn btn-line" onClick={() => setFoglio({ impegno: null, data: chiaveOggi })}>
          + Nuovo impegno
        </button>
      </section>

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
            const ims = perGiorno[k] || [];
            const haLezione = ims.some((x) => x.tipo === "lezione");
            const classi = ["cal-day"];
            if (haLezione) classi.push("cal-lezione");
            else if (ims.length) classi.push("cal-impegno");
            if (k === chiaveOggi) classi.push("cal-today");
            if (k === giornoAperto) classi.push("cal-open");
            return (
              <button
                key={k}
                className={classi.join(" ")}
                aria-label={ims.length ? `${fullLabel(k)}, ${ims.length} impegni` : String(g)}
                onClick={() => setGiornoAperto(giornoAperto === k ? null : k)}
              >
                <span className="mono">{g}</span>
              </button>
            );
          })}
        </div>

        <div className="cal-legend">
          <span className="cal-key cal-lezione" /> Lezione
          <span className="cal-key cal-impegno" /> Altro impegno
        </div>

        {giornoAperto && (
          <div className="cal-detail">
            <p className="eyebrow">{fullLabel(giornoAperto)}</p>
            {!delGiorno.length && <p className="body muted">Niente in programma.</p>}
            {delGiorno.map((i) => (
              <button key={i.id} className="imp-row" onClick={() => setFoglio({ impegno: i })}>
                <span className="left">
                  <p className="body">{i.titolo}</p>
                  <p className="mono muted small">
                    {i.ora || "Senza orario"}
                    {i.luogo ? ` · ${i.luogo}` : ""}
                  </p>
                </span>
                <span className={i.tipo === "lezione" ? "pill pill-lavoro" : "badge badge-lavoro"}>
                  {TIPI_IMPEGNO[i.tipo].corto}
                </span>
              </button>
            ))}
            <button className="btn btn-line" onClick={() => setFoglio({ impegno: null, data: giornoAperto })}>
              + Aggiungi qui
            </button>
          </div>
        )}
      </section>

      {foglio && (
        <FoglioImpegno
          impegno={foglio.impegno}
          dataIniziale={foglio.data || foglio.impegno?.data || chiaveOggi}
          onSalva={(campi) => {
            onSalva(campi, foglio.impegno?.id);
            chiudiFoglio();
          }}
          onElimina={
            foglio.impegno
              ? () => {
                  onElimina(foglio.impegno.id);
                  chiudiFoglio();
                }
              : null
          }
          onChiudi={chiudiFoglio}
        />
      )}
    </div>
  );
}

function FoglioImpegno({ impegno, dataIniziale, onSalva, onElimina, onChiudi }) {
  const [data, setData] = useState(impegno?.data || dataIniziale);
  const [ora, setOra] = useState(impegno?.ora || "");
  const [tipo, setTipo] = useState(impegno?.tipo || "lezione");
  const [titolo, setTitolo] = useState(impegno?.titolo || "");
  const [luogo, setLuogo] = useState(impegno?.luogo || "");
  const [note, setNote] = useState(impegno?.note || "");
  const [confermaElimina, setConfermaElimina] = useState(false);

  return (
    <div className="sheet">
      <div className="sheet-in lavoro">
        <div className="between middle">
          <div>
            <p className="eyebrow">{impegno ? "Modifica" : "Nuovo"}</p>
            <h2 className="h2">{tipo === "lezione" ? "Lezione" : "Impegno"}</h2>
          </div>
          <button className="btn btn-line btn-inline" onClick={onChiudi}>
            Chiudi
          </button>
        </div>

        <p className="eyebrow spaced">Che cos'è</p>
        <div className="filtri">
          {Object.entries(TIPI_IMPEGNO).map(([id, t]) => (
            <button
              key={id}
              className={tipo === id ? "chip chip-on chip-lavoro" : "chip"}
              onClick={() => setTipo(id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <input
          className="field"
          type="text"
          placeholder={tipo === "lezione" ? "Es. Lezione di chitarra, Marco" : "Es. Riunione di reparto"}
          value={titolo}
          maxLength={80}
          autoFocus
          onChange={(e) => setTitolo(e.target.value)}
        />

        <div className="grid2 spaced">
          <label className="mini-field">
            <span>Data</span>
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </label>
          <label className="mini-field">
            <span>Ora</span>
            <input type="time" value={ora} onChange={(e) => setOra(e.target.value)} />
          </label>
        </div>

        <input
          className="field"
          type="text"
          placeholder="Dove (opzionale)"
          value={luogo}
          maxLength={60}
          onChange={(e) => setLuogo(e.target.value)}
        />

        <textarea
          className="nota-field"
          rows={3}
          placeholder="Cosa devi preparare, materiale, argomenti"
          value={note}
          maxLength={400}
          onChange={(e) => setNote(e.target.value)}
        />

        <button
          className="btn btn-primary"
          disabled={!data}
          onClick={() => onSalva({ data, ora: ora || null, tipo, titolo, luogo, note })}
        >
          Salva
        </button>

        {onElimina && !confermaElimina && (
          <button className="btn btn-ghost" onClick={() => setConfermaElimina(true)}>
            Elimina
          </button>
        )}
        {onElimina && confermaElimina && (
          <>
            <p className="footnote">Sicuro? Non si può annullare.</p>
            <div className="navrow">
              <button className="btn btn-line" onClick={() => setConfermaElimina(false)}>
                Annulla
              </button>
              <button className="btn btn-danger" onClick={onElimina}>
                Elimina
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
