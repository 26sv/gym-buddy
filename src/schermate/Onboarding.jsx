import React, { useState } from "react";
import Style from "../stile.jsx";
import { ScalaEnergia } from "../componenti/base.jsx";

/**
 * Il nome è l'unica cosa che si chiede prima di partire. Piano, scheda e
 * profilo non servono: il primo allenamento deve poter essere registrato subito,
 * altrimenti la configurazione diventa il primo motivo per non cominciare.
 */
export default function Onboarding({ nomeAttuale, onSalva, onAnnulla }) {
  const [nome, setNome] = useState(nomeAttuale || "");
  const pulito = nome.trim().slice(0, 24);

  return (
    <div className="root center">
      <Style />
      <div className="onboard">
        <p className="eyebrow">{onAnnulla ? "Impostazioni" : "Benvenuto"}</p>
        <h1 className="brand brand-big">GYM BUDDY</h1>
        <p className="body muted spaced">Come ti devo chiamare?</p>
        <input
          className="field"
          type="text"
          value={nome}
          maxLength={24}
          autoFocus
          autoComplete="given-name"
          placeholder="Il tuo nome"
          onChange={(e) => setNome(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && pulito) onSalva(pulito);
          }}
        />
        <button className="btn btn-primary" disabled={!pulito} onClick={() => onSalva(pulito)}>
          {onAnnulla ? "Salva" : "Iniziamo"}
        </button>
        {onAnnulla && (
          <button className="btn btn-ghost" onClick={onAnnulla}>
            Annulla
          </button>
        )}
        {!onAnnulla && (
          <p className="footnote">
            Corsa e palestra nello stesso posto, tutto sul telefono. Nessun account, nessun server.
          </p>
        )}
      </div>
    </div>
  );
}

/** La domanda di apertura. Mai a seduta aperta: lì serve il cronometro. */
export function Energia({ nome, onPick }) {
  return (
    <div className="sheet">
      <div className="sheet-in">
        <p className="eyebrow">Ciao {nome}</p>
        <h2 className="h2">Quanta energia hai oggi?</h2>
        <ScalaEnergia valore={null} onPick={onPick} />
        <p className="footnote">
          Serve solo a te: nella scheda Dati vedi se allenarti da stanco cambia il risultato.
        </p>
      </div>
    </div>
  );
}
