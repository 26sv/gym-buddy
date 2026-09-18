import React, { useState, useMemo } from "react";
import { TIPI_CORSA, dec, passo, clock } from "../modello.js";
import { ScalaRpe, ScalaFeel } from "../componenti/base.jsx";

/**
 * Inserimento a mano di un'uscita, o di un'attività qualsiasi.
 *
 * Il GPS lo fa già l'orologio: qui si riportano i tre numeri che si leggono sul
 * polso, e devono starci dentro venti secondi. Per riuscirci si arriva con tutto
 * già compilato — distanza dal piano, durata stimata dal passo delle ultime
 * uscite — e si tocca solo quello che non torna.
 *
 * Nessun campo è obbligatorio: una sessione con la sola durata si salva lo
 * stesso, resta segnata come bozza. Un dato parziale vale sempre più di niente.
 */
export default function Corsa({ tipo = "corsa", prefill, sessioni, onSalva, onChiudi }) {
  const passoTipico = useMemo(() => {
    const ultime = sessioni.filter((s) => s.tipo === "corsa" && s.corsa?.passoMedioSec).slice(0, 5);
    return ultime.length
      ? Math.round(ultime.reduce((t, s) => t + s.corsa.passoMedioSec, 0) / ultime.length)
      : 390; // 6:30/km, il passo di partenza di chi ricostruisce la base
  }, [sessioni]);

  /* Il piano ha la precedenza; senza piano si riparte dall'ultima uscita, che è
     quasi sempre quella giusta. Solo alla primissima si tira a indovinare. */
  const ultimaDistanza = useMemo(
    () => sessioni.find((s) => s.tipo === "corsa" && s.corsa?.distanzaKm > 0)?.corsa.distanzaKm ?? null,
    [sessioni]
  );
  const kmIniziali = prefill?.km ?? ultimaDistanza ?? 5;
  const [km, setKm] = useState(kmIniziali);
  const [min, setMin] = useState(Math.max(1, Math.round((kmIniziali * passoTipico) / 60)));
  const [tipoSessione, setTipoSessione] = useState(prefill?.tipoSessione || "facile");
  const [rpe, setRpe] = useState(null);
  const [feel, setFeel] = useState(null);
  const [dislivello, setDislivello] = useState("");
  const [fc, setFc] = useState("");
  const [fastidio, setFastidio] = useState("");
  const [note, setNote] = useState("");
  const [altro, setAltro] = useState(tipo === "altro");

  const durataSec = min * 60;
  const passoSec = km > 0 ? Math.round(durataSec / km) : null;

  /* La distanza segue il tipo di uscita: se cambio da facile a lungo, la durata
     stimata si adegua da sola invece di restare quella di prima. */
  const cambiaKm = (v) => {
    setKm(v);
    if (v > 0) setMin(Math.max(1, Math.round((v * passoTipico) / 60)));
  };

  return (
    <div className="sheet sheet-piena">
      <div className="sheet-in corsa">
        <div className="between middle">
          <div>
            <p className="eyebrow">{altro ? "Altra attività" : prefill?.gara ? "Gara" : "Uscita di corsa"}</p>
            <h2 className="h2">{altro ? "Cosa hai fatto" : "Com'è andata"}</h2>
          </div>
          <button className="btn btn-line btn-inline" onClick={onChiudi}>
            Chiudi
          </button>
        </div>

        {!altro && (
          <>
            <div className="bigstat">
              <div className="bigstat-n">{dec(km)}</div>
              <div className="bigstat-u">chilometri</div>
            </div>
            <div className="steppers solo">
              <div className="stepper">
                <button className="step" onClick={() => cambiaKm(Math.max(0, Math.round((km - 0.5) * 10) / 10))} aria-label="Mezzo chilometro in meno">
                  −
                </button>
                <div className="sval">
                  <span className="mono big">{dec(km)}</span>
                  <span className="unit">km</span>
                </div>
                <button className="step" onClick={() => cambiaKm(Math.round((km + 0.5) * 10) / 10)} aria-label="Mezzo chilometro in più">
                  +
                </button>
              </div>
            </div>
          </>
        )}

        <p className="eyebrow spaced">Durata</p>
        <div className="steppers solo">
          <div className="stepper">
            <button className="step" onClick={() => setMin((m) => Math.max(1, m - 1))} aria-label="Un minuto in meno">
              −
            </button>
            <div className="sval">
              <span className="mono big">{clock(durataSec)}</span>
              <span className="unit">h:mm</span>
            </div>
            <button className="step" onClick={() => setMin((m) => m + 1)} aria-label="Un minuto in più">
              +
            </button>
          </div>
        </div>
        <div className="incs">
          <span className="eyebrow">Salto</span>
          {[5, 10, 15].map((v) => (
            <button key={v} className="chip" onClick={() => setMin((m) => m + v)}>
              +{v} min
            </button>
          ))}
          <button className="chip" onClick={() => setMin((m) => Math.max(1, m - 5))}>
            −5 min
          </button>
        </div>

        {!altro && (
          <div className="derivato">
            <span className="derivato-n mono">{passo(passoSec)}</span>
            <span className="unit">al km, calcolato</span>
          </div>
        )}

        {!altro && (
          <>
            <p className="eyebrow spaced">Che uscita era</p>
            <div className="filtri">
              {TIPI_CORSA.map((t) => (
                <button
                  key={t.id}
                  className={tipoSessione === t.id ? "chip chip-on chip-corsa" : "chip"}
                  onClick={() => setTipoSessione(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </>
        )}

        <p className="eyebrow spaced">Quanto ti è costata</p>
        <ScalaRpe valore={rpe} onPick={setRpe} />

        {!altro && (
          <>
            <p className="eyebrow spaced">Come è andato il ginocchio</p>
            <ScalaFeel valore={feel} onPick={setFeel} />

            <div className="opzionali">
              <label className="mini-field">
                <span>Fastidio al min.</span>
                <input
                  type="number" inputMode="numeric" placeholder="—"
                  value={fastidio} onChange={(e) => setFastidio(e.target.value)}
                />
              </label>
              <label className="mini-field">
                <span>Dislivello m</span>
                <input
                  type="number" inputMode="numeric" placeholder="—"
                  value={dislivello} onChange={(e) => setDislivello(e.target.value)}
                />
              </label>
              <label className="mini-field">
                <span>FC media</span>
                <input
                  type="number" inputMode="numeric" placeholder="—"
                  value={fc} onChange={(e) => setFc(e.target.value)}
                />
              </label>
            </div>
            <p className="footnote">
              Il minuto in cui compare il fastidio è il numero che conta: se a settembre è il 18° e a novembre il 40°,
              stai vincendo.
            </p>
          </>
        )}

        <textarea
          className="nota-field"
          rows={2}
          placeholder="Due parole, se ti va"
          value={note}
          maxLength={280}
          onChange={(e) => setNote(e.target.value)}
        />

        <button
          className="btn btn-corsa"
          onClick={() =>
            onSalva({
              tipo: altro ? "altro" : "corsa",
              distanzaKm: altro ? 0 : km,
              durataSec,
              rpe,
              tipoSessione,
              feel,
              dislivello: numero(dislivello),
              fcMedia: numero(fc),
              minutoFastidio: numero(fastidio),
              note: note.trim() || null,
            })
          }
        >
          Salva {altro ? "attività" : km > 0 ? `${dec(km)} km` : "uscita"}
          <span className="btn-sub mono">
            {clock(durataSec)}
            {!altro && km > 0 ? ` · ${passo(passoSec)}/km` : ""}
          </span>
        </button>

        {!altro && km === 0 && (
          <p className="footnote">
            Senza distanza si salva lo stesso: resta una bozza con durata e sensazione, che è comunque meglio di niente.
          </p>
        )}

        <button className="btn btn-ghost" onClick={() => setAltro((a) => !a)}>
          {altro ? "Era una corsa" : "Non era una corsa"}
        </button>
      </div>
    </div>
  );
}

const numero = (v) => {
  const n = Number(v);
  return v === "" || Number.isNaN(n) ? null : n;
};
