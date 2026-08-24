import React, { useState, useMemo } from "react";
import {
  TIPI, titoloSessione, sottotitoloSessione, fullLabel, dayLabel, dec, passo,
  caricoDi, confronto, precedenteConfrontabile, serieTotali, volumeDi,
} from "../modello.js";
import { FEEL, SODDISFAZIONE, ENERGIA, RPE, gradino } from "../dati/scale.js";
import { Punto, Confronto, Vuoto } from "../componenti/base.jsx";
import { DettaglioForza } from "./Riepilogo.jsx";

const PERIODI = [
  { id: "30", label: "30 giorni", giorni: 30 },
  { id: "90", label: "3 mesi", giorni: 90 },
  { id: "tutto", label: "Tutto", giorni: null },
];

const MESE = (iso) =>
  new Date(iso).toLocaleDateString("it-IT", { month: "long", year: "numeric" });

/**
 * Una linea del tempo sola, con dentro corsa e forza mescolate: è il punto del
 * modello unificato. Colore e simbolo dicono la disciplina senza doverla
 * leggere, il filtro serve solo quando si cerca qualcosa di preciso.
 */
export default function Storico({ data }) {
  const [tipi, setTipi] = useState([]); // vuoto = tutti
  const [periodo, setPeriodo] = useState("90");
  const [aperta, setAperta] = useState(null);

  const filtrate = useMemo(() => {
    const p = PERIODI.find((x) => x.id === periodo);
    const limite = p?.giorni ? Date.now() - p.giorni * 24 * 3600 * 1000 : null;
    return data.sessioni.filter(
      (s) =>
        (!tipi.length || tipi.includes(s.tipo)) &&
        (!limite || new Date(s.data).getTime() >= limite)
    );
  }, [data.sessioni, tipi, periodo]);

  const apri = (id) => {
    /* Transizione shared element quando il browser la supporta: la card si apre
       sul dettaglio invece di sostituirsi di colpo. Dove non c'è, si apre e
       basta, senza fallback finti. */
    const cambia = () => setAperta((x) => (x === id ? null : id));
    if (document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.startViewTransition(cambia);
    } else cambia();
  };

  const toggleTipo = (t) =>
    setTipi((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  if (!data.sessioni.length) {
    return (
      <div className="stack">
        <Vuoto
          titolo="Ancora niente qui"
          testo="Chiudi il primo allenamento, di corsa o di palestra: comparirà qui con durata, carico e dettaglio."
        />
      </div>
    );
  }

  let meseCorrente = null;

  return (
    <div className="stack">
      <section className="card mini">
        <div className="filtri">
          {Object.entries(TIPI).map(([id, t]) => (
            <button
              key={id}
              className={tipi.includes(id) ? "chip chip-on" : "chip"}
              onClick={() => toggleTipo(id)}
            >
              <span className={`t-${t.tono}`}>{t.icona}</span> {t.label}
            </button>
          ))}
        </div>
        <div className="filtri" style={{ marginTop: 8 }}>
          {PERIODI.map((p) => (
            <button
              key={p.id}
              className={periodo === p.id ? "chip chip-on" : "chip"}
              onClick={() => setPeriodo(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </section>

      {!filtrate.length && (
        <Vuoto titolo="Niente in questo filtro" testo="Allarga il periodo o togli un tipo di attività." />
      )}

      <div className="tl">
        {filtrate.map((s, i) => {
          const mese = MESE(s.data);
          const nuovoMese = mese !== meseCorrente;
          meseCorrente = mese;
          return (
            <React.Fragment key={s.id}>
              {nuovoMese && <p className="tl-mese">{mese}</p>}
              <div className="tl-item">
                <div className="tl-gutter">
                  {i < filtrate.length - 1 && <span className="tl-line" />}
                  <Punto tipo={s.tipo} />
                </div>
                <section
                  className={aperta === s.id ? "card tl-card tl-open dettaglio" : "card tl-card"}
                >
                  <button className="between full" onClick={() => apri(s.id)}>
                    <div className="left">
                      <p className="eyebrow">{dayLabel(s.data)}</p>
                      <h3 className="h3">{titoloSessione(s)}</h3>
                      <p className="mono muted small">{sottotitoloSessione(s)}</p>
                    </div>
                    <div className="right">
                      <span className="badge mono">{s.caricoRelativo ?? caricoDi(s)}</span>
                      <span className="caret">{aperta === s.id ? "−" : "+"}</span>
                    </div>
                  </button>
                  {aperta === s.id && <Dettaglio sessione={s} storico={data.sessioni} />}
                </section>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function Dettaglio({ sessione, storico }) {
  const righe = useMemo(
    () => confronto(sessione, precedenteConfrontabile(sessione, storico)),
    [sessione, storico]
  );
  const feel = FEEL.find((f) => f.id === sessione.feel);
  const en = gradino(ENERGIA, sessione.energy);
  const sat = gradino(SODDISFAZIONE, sessione.satisfaction);
  const rpe = gradino(RPE, sessione.rpe);
  const c = sessione.corsa;

  return (
    <div className="cal-detail">
      <p className="eyebrow">{fullLabel(sessione.data)}</p>

      <ul className="list">
        <li className="row">
          <span className="body muted">Carico relativo</span>
          <span className="mono">
            {sessione.caricoRelativo ?? caricoDi(sessione)}
            {!sessione.rpe && <span className="muted small"> stimato</span>}
          </span>
        </li>
        {rpe && (
          <li className="row">
            <span className="body muted">RPE</span>
            <span className="mono">
              {rpe.level}/5 · {rpe.label}
            </span>
          </li>
        )}
        {c && c.distanzaKm > 0 && (
          <>
            <li className="row">
              <span className="body muted">Passo medio</span>
              <span className="mono">{passo(c.passoMedioSec)}/km</span>
            </li>
            {c.dislivello != null && (
              <li className="row">
                <span className="body muted">Dislivello</span>
                <span className="mono">{c.dislivello} m</span>
              </li>
            )}
            {c.fcMedia != null && (
              <li className="row">
                <span className="body muted">FC media</span>
                <span className="mono">{c.fcMedia} bpm</span>
              </li>
            )}
            {c.minutoFastidio != null && (
              <li className="row">
                <span className="body muted">Fastidio comparso al</span>
                <span className="mono">{c.minutoFastidio}° minuto</span>
              </li>
            )}
          </>
        )}
        {sessione.tipo === "forza" && (
          <li className="row">
            <span className="body muted">Serie e volume</span>
            <span className="mono">
              {serieTotali(sessione)} · {Math.round(volumeDi(sessione))} kg
            </span>
          </li>
        )}
      </ul>

      {sessione.tipo === "forza" && <DettaglioForza sessione={sessione} />}

      {(en || sat) && (
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
        </p>
      )}
      {feel && <span className={`pill pill-${feel.tone}`}>Ginocchio: {feel.label.toLowerCase()}</span>}
      {sessione.note && <p className="body spaced">{sessione.note}</p>}

      <Confronto righe={righe} />
    </div>
  );
}
