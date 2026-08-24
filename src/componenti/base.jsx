import React, { useState } from "react";
import { ENERGIA, SODDISFAZIONE, RPE, FEEL, gradino } from "../dati/scale.js";
import { TIPI, num } from "../modello.js";

/** Anello di progressione: si riempie, non finge di caricare. */
export function Anello({ fatto, totale, tono = "forza", size = 52 }) {
  const r = size / 2 - 3;
  const giro = 2 * Math.PI * r;
  const pct = totale > 0 ? Math.min(1, fatto / totale) : 0;
  return (
    <div className="ring" style={{ width: size, height: size }} role="img" aria-label={`${fatto} su ${totale}`}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="3" />
        <circle
          className={tono === "corsa" ? "ring-fill corsa" : "ring-fill"}
          cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="3"
          strokeDasharray={giro} strokeDashoffset={giro * (1 - pct)}
        />
      </svg>
      <span className="ring-txt">
        <span className="mono ring-n">{fatto}</span>
        <span className="mono ring-d">/{totale}</span>
      </span>
    </div>
  );
}

/** Il pallino colorato che dice a colpo d'occhio di che disciplina si tratta. */
export function Punto({ tipo }) {
  return <span className={`tl-dot bg-${TIPI[tipo]?.tono || "altro"}`} />;
}

export function ScalaMood({ scala, valore, onPick }) {
  return (
    <div className="moodrow">
      {scala.map((s) => (
        <button
          key={s.level}
          className={valore === s.level ? `mood mood-${s.tone} mood-on` : `mood mood-${s.tone}`}
          onClick={() => onPick(s.level)}
        >
          <span className="mood-emoji">{s.emoji}</span>
          {s.label}
        </button>
      ))}
    </div>
  );
}

export const ScalaEnergia = (p) => <ScalaMood scala={ENERGIA} {...p} />;
export const ScalaSoddisfazione = (p) => <ScalaMood scala={SODDISFAZIONE} {...p} />;

/** RPE: quanto è costata, non quanto è piaciuta. Entra nel carico relativo. */
export function ScalaRpe({ valore, onPick }) {
  const scelto = gradino(RPE, valore);
  return (
    <>
      <div className="rperow">
        {RPE.map((r) => (
          <button
            key={r.level}
            className={valore === r.level ? `rpe rpe-${r.tone} rpe-on` : `rpe rpe-${r.tone}`}
            onClick={() => onPick(r.level)}
            aria-label={`${r.level}, ${r.label}`}
          >
            <span className="rpe-n">{r.level}</span>
            <span className="rpe-l">{r.label}</span>
          </button>
        ))}
      </div>
      <p className="rpe-nota">{scelto ? scelto.nota : "Quanto ti è costata, da 1 a 5"}</p>
    </>
  );
}

/** Il semaforo del ginocchio del piano, in tre bottoni. */
export function ScalaFeel({ valore, onPick }) {
  return (
    <div className="feelrow">
      {FEEL.map((f) => (
        <button
          key={f.id}
          className={valore === f.id ? `feel feel-${f.tone} feel-on` : `feel feel-${f.tone}`}
          onClick={() => onPick(f.id)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

/** Stepper: si conferma, non si digita. La tastiera è il ripiego. */
export function Stepper({ valore, onChange, passo: p = 1, min = 0, unita, decimali = false, etichetta }) {
  const [typing, setTyping] = useState(false);
  const muovi = (d) => onChange(Math.max(min, Math.round((valore + d) * 100) / 100));
  return (
    <div className="stepper">
      <button className="step" onClick={() => muovi(-p)} aria-label={`Meno ${p} ${etichetta || unita}`}>
        −
      </button>
      {typing ? (
        <input
          className="win mono"
          type="number"
          inputMode="decimal"
          autoFocus
          value={valore}
          onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))}
          onBlur={() => setTyping(false)}
        />
      ) : (
        <button className="sval" onClick={() => setTyping(true)} aria-label={`${valore} ${etichetta || unita}, tocca per digitare`}>
          <span className="mono big">{valore > 0 || min < 0 ? (decimali ? num(valore) : num(valore)) : "—"}</span>
          <span className="unit">{unita}</span>
        </button>
      )}
      <button className="step" onClick={() => muovi(p)} aria-label={`Più ${p} ${etichetta || unita}`}>
        +
      </button>
    </div>
  );
}

/** I delta rispetto alla volta prima, già scritti in italiano. */
export function Confronto({ righe, titolo = "Rispetto alla volta scorsa" }) {
  if (!righe.length) return null;
  return (
    <>
      <p className="eyebrow spaced">{titolo}</p>
      <div>
        {righe.map((r, i) => (
          <div key={i} className={`delta delta-${r.tono}`}>
            <span className="delta-ic">{r.tono === "su" ? "▲" : r.tono === "giu" ? "▼" : "="}</span>
            <span>{r.testo}</span>
          </div>
        ))}
      </div>
    </>
  );
}

export function Vuoto({ titolo, testo }) {
  return (
    <section className="card">
      <h2 className="h2">{titolo}</h2>
      <p className="body muted">{testo}</p>
    </section>
  );
}
