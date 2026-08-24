import React, { useState, useRef, useMemo } from "react";
import { SCHEDE, WARMUP, INCREMENTS } from "../dati/schede.js";
import { ESERCIZI, esercizio, unitaDi, haCarico } from "../dati/esercizi.js";
import { num, dayLabel, caricoMax, serieDi } from "../modello.js";

/**
 * La seduta in corso: una cosa alla volta.
 *
 * Il percorso "registra la serie" resta un solo tocco e non si allunga mai:
 * carico e ripetizioni arrivano già compilati dall'ultima volta, il pulsante
 * grande li conferma. Tutto il resto (cambiare esercizio, aggiungerne uno fuori
 * scheda, correggere) sta intorno e non intralcia.
 */
export default function Forza({
  active, stato, focusIdx, setFocusIdx, onLog, onUndo, onWarmup, onFinish,
  onAggiungi, confirmCancel, setConfirmCancel, onCancel,
}) {
  const [aggiungi, setAggiungi] = useState(false);

  /* La lista è la scheda più quello che ho aggiunto strada facendo. */
  const lista = useMemo(() => {
    const base = (SCHEDE[active.scheda]?.esercizi || []).map((e) => ({ ...e, fuoriScheda: false }));
    const extra = (active.extra || []).map((e) => ({ ...e, fuoriScheda: true }));
    return [...base, ...extra];
  }, [active.scheda, active.extra]);

  const idx = Math.min(focusIdx, Math.max(0, lista.length - 1));
  const voce = lista[idx];
  const warmupDone = (active.warmup || []).length === WARMUP.length;

  if (!voce) return null;

  const logged = serieDi({ forza: active }, voce.id);

  return (
    <div className="stack">
      {!warmupDone && (
        <section className="card">
          <p className="eyebrow">Riscaldamento</p>
          <ul className="list">
            {WARMUP.map((w) => {
              const on = (active.warmup || []).includes(w);
              return (
                <li key={w}>
                  <button className={on ? "check check-on" : "check"} onClick={() => onWarmup(w)}>
                    <span className="box">{on ? "✓" : ""}</span>
                    <span className="body">{w}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <nav className="rail" aria-label="Esercizi della seduta">
        {lista.map((e, i) => {
          const n = serieDi({ forza: active }, e.id).length;
          const state = n >= e.sets ? "rail-done" : i === idx ? "rail-on" : "";
          return (
            <button key={e.id} className={`rail-item ${state}`} onClick={() => setFocusIdx(i)}>
              <span className="rail-bar" style={{ "--fill": `${Math.min(100, (n / e.sets) * 100)}%` }} />
              <span className="rail-label">{esercizio(e.id, e).short || e.nome}</span>
            </button>
          );
        })}
      </nav>

      <Esercizio
        key={voce.id}
        voce={voce}
        idx={idx}
        count={lista.length}
        logged={logged}
        ultimoCarico={stato.ultimiCarichi[voce.id]}
        ultima={ultimaVolta(stato.sessioni, voce.id)}
        record={recordDi(stato.sessioni, voce.id)}
        onLog={onLog}
        onUndo={onUndo}
      />

      <div className="navrow">
        <button className="btn btn-line" disabled={idx === 0} onClick={() => setFocusIdx(idx - 1)}>
          ‹ Precedente
        </button>
        <button
          className={logged.length >= voce.sets && idx < lista.length - 1 ? "btn btn-line btn-next" : "btn btn-line"}
          disabled={idx === lista.length - 1}
          onClick={() => setFocusIdx(idx + 1)}
        >
          {logged.length >= voce.sets && idx < lista.length - 1
            ? `${esercizio(lista[idx + 1].id, lista[idx + 1]).short} ›`
            : "Successivo ›"}
        </button>
      </div>

      {aggiungi ? (
        <FuoriScheda
          esclusi={lista.map((e) => e.id)}
          onAnnulla={() => setAggiungi(false)}
          onScegli={(e) => {
            onAggiungi(e);
            setAggiungi(false);
            setFocusIdx(lista.length);
          }}
        />
      ) : (
        <button className="btn btn-line" onClick={() => setAggiungi(true)}>
          + Aggiungi un esercizio
        </button>
      )}

      <button className="btn btn-primary" onClick={onFinish}>
        Termina allenamento
      </button>

      {confirmCancel ? (
        <div className="card card-warn">
          <p className="body">Butti via questa seduta senza salvarla?</p>
          <div className="navrow">
            <button className="btn btn-line" onClick={() => setConfirmCancel(false)}>
              Continua ad allenarti
            </button>
            <button className="btn btn-danger" onClick={onCancel}>
              Butta via
            </button>
          </div>
        </div>
      ) : (
        <button className="btn btn-ghost" onClick={() => setConfirmCancel(true)}>
          Annulla seduta
        </button>
      )}
    </div>
  );
}

const ultimaVolta = (sessioni, id) => {
  const s = sessioni.find((x) => x.tipo === "forza" && serieDi(x, id).length);
  return s ? { data: s.data, serie: serieDi(s, id) } : null;
};

const recordDi = (sessioni, id) =>
  sessioni.reduce((m, s) => Math.max(m, caricoMax(serieDi(s, id))), 0);

/* ---------------- il singolo esercizio ---------------- */

function Esercizio({ voce, idx, count, logged, ultimoCarico, ultima, record, onLog, onUndo }) {
  const meta = esercizio(voce.id, voce);
  const unita = voce.unita || unitaDi(voce.id);
  const conCarico = voce.carico !== false && haCarico(voce.id);
  const passoRip = unita === "sec" ? 5 : 1;

  const [carico, setCarico] = useState(ultimoCarico ?? 0);
  const [reps, setReps] = useState(voce.reps);
  const [inc, setInc] = useState(meta.inc || 2.5);
  const [typing, setTyping] = useState(false);
  const completo = logged.length >= voce.sets;

  const step = (d) => setCarico((w) => Math.max(0, Math.round((w + d) * 100) / 100));
  const valore = (s) => (conCarico ? (s.carico > 0 ? num(s.carico) : "cl") : `${s.reps}`);

  /* Tocco corto sull'ultimo disco: correggo. Tocco lungo: ripeto identica la
     serie che c'è dentro, senza rimettere mano agli stepper. */
  const lungo = useRef(null);
  const scattato = useRef(false);
  const premi = (s) => {
    scattato.current = false;
    lungo.current = setTimeout(() => {
      scattato.current = true;
      onLog(voce, s.carico, s.reps);
    }, 500);
  };
  const rilascia = (isLast) => {
    clearTimeout(lungo.current);
    if (!scattato.current && isLast) onUndo(voce);
  };
  const annulla = () => {
    clearTimeout(lungo.current);
    scattato.current = true; // così il pointerup che segue non cancella la serie
  };

  return (
    <section className={completo ? "card card-done" : "card card-focus"}>
      <div className="between">
        <div>
          <p className="eyebrow">
            Esercizio {idx + 1} di {count}
            {voce.fuoriScheda ? " · fuori scheda" : voce.blocco === "anca" ? " · resistenza anca" : ""}
          </p>
          <h2 className="h1">{meta.nome}</h2>
          <p className="body muted">
            <span className="mono strong">
              {voce.sets}×{voce.reps}
              {unita === "sec" ? '"' : ""}
            </span>
            {meta.perLato ? (
              <>
                {" "}
                <span className="dot" /> per lato
              </>
            ) : null}
            {voce.nota ? (
              <>
                {" "}
                <span className="dot" /> {voce.nota}
              </>
            ) : null}
          </p>
        </div>
        {conCarico && record > 0 && <span className="badge mono">max {num(record)}</span>}
      </div>

      <p className="lastline mono">
        {ultima ? (
          <>
            <span className="muted">Volta scorsa {dayLabel(ultima.data)}:</span>{" "}
            {ultima.serie.map((s, i) => (
              <span key={i}>
                {conCarico ? `${s.carico > 0 ? num(s.carico) : "cl"}×${s.reps}` : `${s.reps}${unita === "sec" ? '"' : ""}`}{" "}
              </span>
            ))}
          </>
        ) : (
          <span className="muted">Prima volta con questo esercizio</span>
        )}
      </p>

      <div className="plates">
        {Array.from({ length: Math.max(voce.sets, logged.length) }).map((_, i) => {
          const s = logged[i];
          const isLast = i === logged.length - 1;
          return (
            <button
              key={i}
              className={s ? "plate plate-on" : i === logged.length ? "plate plate-next" : "plate"}
              onPointerDown={s && isLast ? () => premi(s) : undefined}
              onPointerUp={s && isLast ? () => rilascia(true) : undefined}
              /* se il dito parte da qui ma sta scorrendo, non è né un tocco né
                 una pressione lunga: si annulla e basta */
              onPointerLeave={s && isLast ? annulla : undefined}
              onPointerCancel={s && isLast ? annulla : undefined}
              onContextMenu={(e) => e.preventDefault()}
              aria-label={
                s
                  ? `Serie ${i + 1}: ${conCarico ? `${s.carico} kg per ` : ""}${s.reps}${unita === "sec" ? " secondi" : " ripetizioni"}${isLast ? ". Tocco corto per correggere, tocco lungo per ripeterla" : ""}`
                  : `Serie ${i + 1} da fare`
              }
            >
              {s ? (
                <span className="pv mono">
                  {valore(s)}
                  <em>{conCarico ? `${s.reps} ${unita === "sec" ? "sec" : "rip"}` : unita === "sec" ? "sec" : "rip"}</em>
                </span>
              ) : (
                <span className="pi mono">{i + 1}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className={conCarico ? "steppers" : "steppers solo"}>
        {conCarico && (
          <div className="stepper">
            <button className="step" onClick={() => step(-inc)} aria-label={`Togli ${inc} chili`}>
              −
            </button>
            {typing ? (
              <input
                className="win mono"
                type="number"
                inputMode="decimal"
                autoFocus
                value={carico}
                onChange={(e) => setCarico(Math.max(0, Number(e.target.value) || 0))}
                onBlur={() => setTyping(false)}
              />
            ) : (
              <button className="sval" onClick={() => setTyping(true)}>
                <span className="mono big">{carico > 0 ? num(carico) : "—"}</span>
                <span className="unit">kg</span>
              </button>
            )}
            <button className="step" onClick={() => step(inc)} aria-label={`Aggiungi ${inc} chili`}>
              +
            </button>
          </div>
        )}
        <div className="stepper">
          <button
            className="step"
            onClick={() => setReps((r) => Math.max(1, r - passoRip))}
            aria-label={unita === "sec" ? "Cinque secondi in meno" : "Una ripetizione in meno"}
          >
            −
          </button>
          <div className="sval">
            <span className="mono big">{reps}</span>
            <span className="unit">{unita === "sec" ? "sec" : "rip"}</span>
          </div>
          <button
            className="step"
            onClick={() => setReps((r) => r + passoRip)}
            aria-label={unita === "sec" ? "Cinque secondi in più" : "Una ripetizione in più"}
          >
            +
          </button>
        </div>
      </div>

      {conCarico && (
        <div className="incs">
          <span className="eyebrow">Scatto</span>
          {INCREMENTS.map((v) => (
            <button key={v} className={inc === v ? "chip chip-on" : "chip"} onClick={() => setInc(v)}>
              {num(v)} kg
            </button>
          ))}
        </div>
      )}

      <button className="btn btn-log" onClick={() => onLog(voce, conCarico ? carico : 0, reps)}>
        Registra serie {logged.length + 1}
        <span className="btn-sub mono">
          {conCarico ? (carico > 0 ? `${num(carico)} kg` : "corpo libero") : "corpo libero"} × {reps}
          {unita === "sec" ? '"' : ""}
        </span>
      </button>

      <p className="doneline mono">
        {logged.length
          ? `${completo ? "Esercizio completato. " : ""}Ultimo disco: tocco corto lo cancella, tocco lungo ripete la serie.`
          : " "}
      </p>
    </section>
  );
}

/* ---------------- esercizio fuori scheda ---------------- */

function FuoriScheda({ esclusi, onScegli, onAnnulla }) {
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const disponibili = Object.keys(ESERCIZI).filter((id) => !esclusi.includes(id));
  const [id, setId] = useState(disponibili[0] || "");

  if (!disponibili.length) {
    return (
      <section className="card">
        <p className="body muted">Sono già tutti nella seduta.</p>
        <button className="btn btn-ghost" onClick={onAnnulla}>
          Chiudi
        </button>
      </section>
    );
  }

  return (
    <section className="card">
      <p className="eyebrow">Aggiungi alla seduta</p>
      <select className="select" value={id} onChange={(e) => setId(e.target.value)}>
        {disponibili.map((k) => (
          <option key={k} value={k}>
            {ESERCIZI[k].nome}
          </option>
        ))}
      </select>
      <div className="steppers">
        <div className="stepper">
          <button className="step" onClick={() => setSets((s) => Math.max(1, s - 1))} aria-label="Una serie in meno">
            −
          </button>
          <div className="sval">
            <span className="mono big">{sets}</span>
            <span className="unit">serie</span>
          </div>
          <button className="step" onClick={() => setSets((s) => s + 1)} aria-label="Una serie in più">
            +
          </button>
        </div>
        <div className="stepper">
          <button className="step" onClick={() => setReps((r) => Math.max(1, r - 1))} aria-label="Una ripetizione in meno">
            −
          </button>
          <div className="sval">
            <span className="mono big">{reps}</span>
            <span className="unit">{unitaDi(id) === "sec" ? "sec" : "rip"}</span>
          </div>
          <button className="step" onClick={() => setReps((r) => r + 1)} aria-label="Una ripetizione in più">
            +
          </button>
        </div>
      </div>
      <div className="navrow">
        <button className="btn btn-line" onClick={onAnnulla}>
          Annulla
        </button>
        <button className="btn btn-primary" onClick={() => onScegli({ id, sets, reps })}>
          Aggiungi
        </button>
      </div>
    </section>
  );
}
