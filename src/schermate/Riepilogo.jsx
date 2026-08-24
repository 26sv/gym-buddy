import React, { useState } from "react";
import { SCHEDE } from "../dati/schede.js";
import { esercizio } from "../dati/esercizi.js";
import { clock, num, serieDi } from "../modello.js";
import { ScalaRpe, ScalaFeel, ScalaSoddisfazione } from "../componenti/base.jsx";

/**
 * Il foglio che chiude la seduta di palestra: i numeri già fatti, e le tre
 * domande che l'app non può calcolarsi da sola. L'RPE è l'unica che conta
 * davvero, perché moltiplica la durata nel carico relativo.
 */
export default function Riepilogo({ active, elapsed, serie, volume, onSalva, onIndietro }) {
  const [rpe, setRpe] = useState(null);
  const [feel, setFeel] = useState(null);
  const [sat, setSat] = useState(null);

  const scheda = SCHEDE[active.scheda];
  const previste = (scheda?.esercizi || []).reduce((t, e) => t + e.sets, 0);

  return (
    <div className="sheet">
      <div className="sheet-in">
        <p className="eyebrow">{scheda?.nome || "Palestra"}</p>
        <h2 className="h1">Fatto.</h2>

        <div className="grid3">
          <div>
            <p className="eyebrow">Durata</p>
            <p className="mono stat">{clock(elapsed)}</p>
          </div>
          <div>
            <p className="eyebrow">Serie</p>
            <p className="mono stat">
              {serie}
              <span className="muted">/{previste}</span>
            </p>
          </div>
          <div>
            <p className="eyebrow">Volume</p>
            <p className="mono stat">
              {Math.round(volume)}
              <span className="unit">kg</span>
            </p>
          </div>
        </div>

        {serie === 0 && (
          <p className="footnote">
            Nessuna serie registrata: si salva lo stesso, resta la durata e come ti sei sentito.
          </p>
        )}

        <p className="eyebrow spaced">Quanto ti è costata</p>
        <ScalaRpe valore={rpe} onPick={setRpe} />

        <p className="eyebrow spaced">Come è andato il ginocchio</p>
        <ScalaFeel valore={feel} onPick={setFeel} />
        {feel === "forte" && (
          <p className="footnote">
            Semaforo rosso: se ti cambia l'appoggio o resta al mattino dopo, stop e ricontrollo. Alla prossima riduci
            range e carico sulle alzate di gamba.
          </p>
        )}

        <p className="eyebrow spaced">Quanto ti senti soddisfatto</p>
        <ScalaSoddisfazione valore={sat} onPick={setSat} />

        <button className="btn btn-primary" onClick={() => onSalva({ rpe, feel, satisfaction: sat })}>
          Salva allenamento
        </button>
        <button className="btn btn-ghost" onClick={onIndietro}>
          Torna indietro
        </button>
      </div>
    </div>
  );
}

/** Le righe "esercizio: carichi usati", usate sia qui che nello storico. */
export function DettaglioForza({ sessione }) {
  const scheda = SCHEDE[sessione.forza?.scheda];
  const ids = [
    ...(scheda?.esercizi || []).map((e) => e.id),
    ...(sessione.forza?.esercizi || []).map((e) => e.nomeId),
  ].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <ul className="list">
      {ids.map((id) => {
        const serie = serieDi(sessione, id);
        const meta = esercizio(id);
        return (
          <li key={id} className="row">
            <span className="body">{meta.nome}</span>
            <span className="mono muted small">
              {serie.length
                ? serie.map((x) => (x.carico ? `${num(x.carico)}×${x.reps}` : `${x.reps}`)).join("  ")
                : "saltato"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
