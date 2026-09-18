import React, { useState } from "react";
import { titoloSessione, sottotitoloSessione, fullLabel, caricoDi } from "../modello.js";
import { Confronto } from "../componenti/base.jsx";

/**
 * Cosa si vede appena una sessione è salvata.
 *
 * Prima i record, se ce ne sono: hanno una schermata tutta loro perché è il
 * momento in cui si ha più voglia di continuare, e una riga in una lista lo
 * sprecherebbe. Poi il confronto con la volta scorsa, scritto in italiano e non
 * in percentuali: si deve leggere in meno di dieci secondi.
 */
export default function Esito({ sessione, record, righe, onChiudi }) {
  const [festa, setFesta] = useState(record.length > 0);

  if (festa) {
    return (
      <div className="sheet sheet-piena">
        <div className="sheet-in oro">
          <div className="trofeo">
            <div className="trofeo-em">🏆</div>
            <h2 className="trofeo-t">
              {record.length > 1 ? `${record.length} record` : "Nuovo record"}
            </h2>
            <p className="body muted">{fullLabel(sessione.data)}</p>
          </div>

          {record.map((r, i) => (
            <div key={i} className="rec-card">
              <p className="eyebrow">{r.titolo}</p>
              <p className="rec-v mono">{r.valore}</p>
              {r.precedente && <p className="rec-p">Prima era {r.precedente}</p>}
            </div>
          ))}

          <button className="btn btn-oro" onClick={() => setFesta(false)}>
            Vai avanti
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sheet">
      <div className={sessione.tipo === "corsa" ? "sheet-in corsa" : "sheet-in"}>
        <p className="eyebrow">{fullLabel(sessione.data)}</p>
        <h2 className="h1">{titoloSessione(sessione)}</h2>
        <p className="mono muted small">{sottotitoloSessione(sessione)}</p>

        <div className="grid3">
          <div>
            <p className="eyebrow">Carico</p>
            <p className="mono stat">{sessione.caricoRelativo ?? caricoDi(sessione)}</p>
          </div>
          <div>
            <p className="eyebrow">Durata</p>
            <p className="mono stat">
              {sessione.durataMin}
              <span className="unit">min</span>
            </p>
          </div>
          <div>
            <p className="eyebrow">RPE</p>
            <p className="mono stat">
              {sessione.rpe ?? <span className="muted">—</span>}
              <span className="unit">/5</span>
            </p>
          </div>
        </div>

        {righe.length ? (
          <Confronto righe={righe} />
        ) : (
          <p className="body muted spaced">
            È la prima di questo tipo: dalla prossima qui sotto compare il confronto.
          </p>
        )}

        <button className="btn btn-primary" onClick={onChiudi}>
          Chiudi
        </button>
      </div>
    </div>
  );
}
