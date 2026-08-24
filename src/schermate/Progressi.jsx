import React, { useState, useMemo, Suspense, lazy } from "react";
import { ESERCIZI, esercizio, haCarico } from "../dati/esercizi.js";
import { settimanaDi, previstoSettimana, BLOCCHI } from "../dati/piano.js";
import {
  caricoSettimanale, calcolaRecord, dayLabel, dec, num, passo, startOfWeek,
  serieDi, caricoMax, volumeDi, eserciziUsati, dayKey,
} from "../modello.js";
import { Vuoto } from "../componenti/base.jsx";

/* recharts arriva solo qui: chi apre l'app per registrare una serie non se lo
   scarica. È la voce più pesante del bundle, di gran lunga. */
const Grafico = lazy(() => import("../componenti/Grafico.jsx"));

const VISTE = [
  { id: "carico", label: "Carico" },
  { id: "esercizio", label: "Esercizi" },
  { id: "corsa", label: "Corsa" },
  { id: "record", label: "Record" },
];

export default function Progressi({ data, onSoglia }) {
  const [vista, setVista] = useState("carico");

  return (
    <div className="stack">
      <section className="card mini">
        <div className="filtri">
          {VISTE.map((v) => (
            <button key={v.id} className={vista === v.id ? "chip chip-on" : "chip"} onClick={() => setVista(v.id)}>
              {v.label}
            </button>
          ))}
        </div>
      </section>

      {vista === "carico" && <Carico data={data} onSoglia={onSoglia} />}
      {vista === "esercizio" && <PerEsercizio data={data} />}
      {vista === "corsa" && <Corse data={data} />}
      {vista === "record" && <Record data={data} />}
    </div>
  );
}

/* ---------------- carico settimanale unificato ---------------- */

function Carico({ data, onSoglia }) {
  const c = useMemo(
    () => caricoSettimanale(data.sessioni, new Date(), data.sogliaCarico),
    [data.sessioni, data.sogliaCarico]
  );

  const max = Math.max(...c.settimane, 1);
  const sett = settimanaDi(new Date());
  const aderenza = useMemo(() => {
    if (!sett) return null;
    const previste = previstoSettimana(sett);
    const fatte = c.sessioni;
    return previste.map((p) => ({
      ...p,
      fatta: fatte.some((s) => s.tipo === p.tipo && dayKey(s.data) === dayKey(p.giorno)),
      passata: p.giorno < startOfWeek(new Date()) || p.giorno.getTime() < Date.now() - 24 * 3600 * 1000,
    }));
  }, [sett, c.sessioni]);

  return (
    <>
      <section className={c.allarme ? "card card-hi" : "card"}>
        <p className="eyebrow">Carico della settimana</p>
        <div className="between middle">
          <p className="clock big-clock mono">{c.totale}</p>
          <div className="right">
            <p className="eyebrow">Media 4 settimane</p>
            <p className="mono stat">{c.media4 ?? "—"}</p>
          </div>
        </div>

        <div className="spark" aria-hidden="true">
          {c.settimane.map((v, i) => (
            <span
              key={i}
              className={`spark-col ${i === c.settimane.length - 1 ? (c.allarme ? "on allarme" : "on") : ""}`}
              style={{ height: `${Math.max(4, (v / max) * 100)}%` }}
            />
          ))}
        </div>
        <div className="spark-lab">
          {["−4", "−3", "−2", "−1", "ora"].map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>

        <p className="body muted spaced">
          Durata per RPE, corsa e palestra sommate. È il numero che dice se la settimana è stata pesante nel complesso,
          non solo in un posto.
        </p>

        {c.delta !== null && (
          <p className={c.allarme ? "body" : "body muted"}>
            {c.delta > 0 ? "+" : ""}
            {c.delta}% sulla media delle ultime quattro settimane.
          </p>
        )}

        {c.allarme && (
          <div className="avviso">
            <span className="avviso-ic">▲</span>
            <p>
              Sopra la soglia del {data.sogliaCarico}%. Il piano lo dice a modo suo: il lungo cresce di massimo 1 km a
              settimana, e ogni quarta si scarica.
            </p>
          </div>
        )}

        <div className="incs">
          <span className="eyebrow">Soglia</span>
          {[10, 15, 20].map((v) => (
            <button key={v} className={data.sogliaCarico === v ? "chip chip-on" : "chip"} onClick={() => onSoglia(v)}>
              +{v}%
            </button>
          ))}
        </div>
      </section>

      <div className="grid2">
        <section className="card mini">
          <p className="eyebrow">Km di corsa</p>
          <p className="mono stat">
            {dec(c.kmCorsa)}
            <span className="unit">km</span>
          </p>
        </section>
        <section className="card mini">
          <p className="eyebrow">Sedute</p>
          <p className="mono stat">{c.sessioni.length}</p>
        </section>
      </div>

      {aderenza && aderenza.length > 0 && (
        <section className="card">
          <div className="between">
            <div>
              <p className="eyebrow">
                Settimana {sett.n} · {BLOCCHI[sett.blocco].nome}
              </p>
              <h3 className="h3">Previsto e fatto</h3>
            </div>
            <span className="badge mono">
              {aderenza.filter((a) => a.fatta).length}/{aderenza.length}
            </span>
          </div>
          <ul className="list">
            {aderenza.map((a, i) => (
              <li key={i} className="row">
                <span className="body">
                  <span className={`t-${a.tipo === "corsa" ? "corsa" : "forza"}`}>
                    {a.tipo === "corsa" ? "▲" : "◼"}
                  </span>{" "}
                  {giorno(a.giorno)} · {a.titolo}
                  {a.km ? ` ${dec(a.km)} km` : ""}
                </span>
                <span className={a.fatta ? "mono small up" : a.passata ? "mono small down" : "mono muted small"}>
                  {a.fatta ? "fatta" : a.passata ? "saltata" : "da fare"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

const giorno = (d) => d.toLocaleDateString("it-IT", { weekday: "short" });

/* ---------------- andamento per esercizio ---------------- */

function PerEsercizio({ data }) {
  const usati = useMemo(
    () => eserciziUsati(data.sessioni).filter((id) => ESERCIZI[id]),
    [data.sessioni]
  );
  const [ex, setEx] = useState(usati.includes("p1") ? "p1" : usati[0] || "a1");
  const [metrica, setMetrica] = useState("carico");
  const conCarico = haCarico(ex);

  const punti = useMemo(
    () =>
      data.sessioni
        .filter((s) => serieDi(s, ex).length)
        .map((s) => {
          const serie = serieDi(s, ex);
          return {
            etichetta: dayLabel(s.data),
            ts: new Date(s.data).getTime(),
            carico: caricoMax(serie),
            volume: serie.reduce((t, x) => t + (x.carico || 0) * (x.reps || 0), 0),
            ripetizioni: serie.reduce((t, x) => t + (x.reps || 0), 0),
          };
        })
        .sort((a, b) => a.ts - b.ts),
    [data.sessioni, ex]
  );

  const chiave = conCarico ? metrica : "ripetizioni";

  const stato = useMemo(
    () =>
      usati.map((id) => {
        const pts = data.sessioni
          .filter((s) => serieDi(s, id).length)
          .map((s) => ({ ts: new Date(s.data).getTime(), w: caricoMax(serieDi(s, id)) }))
          .sort((a, b) => a.ts - b.ts);
        const primo = pts.length ? pts[0].w : null;
        const ultimo = pts.length ? pts[pts.length - 1].w : null;
        return { id, ultimo, delta: primo !== null ? ultimo - primo : null, volte: pts.length };
      }),
    [data.sessioni, usati]
  );

  return (
    <>
      <section className="card">
        <div className="between">
          <p className="eyebrow">Andamento</p>
          {conCarico && (
            <div className="rest-actions">
              <button className={metrica === "carico" ? "chip chip-on" : "chip"} onClick={() => setMetrica("carico")}>
                Carico
              </button>
              <button className={metrica === "volume" ? "chip chip-on" : "chip"} onClick={() => setMetrica("volume")}>
                Volume
              </button>
            </div>
          )}
        </div>
        <select className="select" value={ex} onChange={(e) => setEx(e.target.value)}>
          {usati.map((id) => (
            <option key={id} value={id}>
              {esercizio(id).nome}
            </option>
          ))}
        </select>
        {punti.length >= 2 ? (
          <Suspense fallback={<p className="body muted spaced">Carico il grafico</p>}>
            <Grafico
              dati={punti}
              chiave={chiave}
              formato={(v) => [conCarico ? `${v} kg` : `${v} rip`, etichettaMetrica(chiave)]}
            />
          </Suspense>
        ) : (
          <p className="body muted spaced">
            {punti.length === 1
              ? "Un punto solo non è una curva. Alla prossima seduta comincia a dire qualcosa."
              : "Registra questo esercizio almeno due volte e la curva compare qui."}
          </p>
        )}
      </section>

      <section className="card">
        <p className="eyebrow">Dall'inizio</p>
        <ul className="list">
          {stato
            .filter((s) => s.volte > 0)
            .map(({ id, ultimo, delta, volte }) => (
              <li key={id} className="statusrow">
                <div>
                  <p className="body">{esercizio(id).nome}</p>
                  <p className="mono muted small">{volte} sedute</p>
                </div>
                <div className="right">
                  <p className="mono">{ultimo ? `${num(ultimo)} kg` : "corpo libero"}</p>
                  {delta !== null && delta !== 0 && (
                    <p className={delta > 0 ? "mono small up" : "mono small down"}>
                      {delta > 0 ? "+" : ""}
                      {num(delta)} kg
                    </p>
                  )}
                </div>
              </li>
            ))}
        </ul>
        {!stato.some((s) => s.volte > 0) && (
          <p className="body muted spaced">Nessun esercizio registrato per ora.</p>
        )}
      </section>
    </>
  );
}

const etichettaMetrica = (k) =>
  k === "carico" ? "Carico max" : k === "volume" ? "Volume" : "Ripetizioni";

/* ---------------- corsa ---------------- */

function Corse({ data }) {
  const corse = useMemo(() => data.sessioni.filter((s) => s.tipo === "corsa"), [data.sessioni]);
  const [metrica, setMetrica] = useState("km");

  const punti = useMemo(
    () =>
      corse
        .filter((s) => s.corsa?.distanzaKm > 0)
        .map((s) => ({
          etichetta: dayLabel(s.data),
          ts: new Date(s.data).getTime(),
          km: s.corsa.distanzaKm,
          passo: s.corsa.passoMedioSec,
        }))
        .sort((a, b) => a.ts - b.ts),
    [corse]
  );

  /* Il numero che il piano chiede a ogni uscita: non se il fastidio compare, ma
     quando. Se resta fermo per tre o quattro settimane, è il segnale per un
     ricontrollo. */
  const fastidi = useMemo(
    () =>
      corse
        .filter((s) => s.corsa?.minutoFastidio != null)
        .map((s) => ({
          etichetta: dayLabel(s.data),
          ts: new Date(s.data).getTime(),
          minuto: s.corsa.minutoFastidio,
        }))
        .sort((a, b) => a.ts - b.ts),
    [corse]
  );

  const kmTotali = corse.reduce((t, s) => t + (s.corsa?.distanzaKm || 0), 0);

  if (!corse.length) {
    return <Vuoto titolo="Nessuna uscita" testo="Registra la prima corsa e qui compaiono chilometri, passo e fastidio." />;
  }

  return (
    <>
      <div className="grid2">
        <section className="card mini">
          <p className="eyebrow">Km totali</p>
          <p className="mono stat">
            {dec(kmTotali)}
            <span className="unit">km</span>
          </p>
        </section>
        <section className="card mini">
          <p className="eyebrow">Uscite</p>
          <p className="mono stat">{corse.length}</p>
        </section>
      </div>

      <section className="card card-corsa">
        <div className="between">
          <p className="eyebrow">Andamento</p>
          <div className="rest-actions">
            <button className={metrica === "km" ? "chip chip-on chip-corsa" : "chip"} onClick={() => setMetrica("km")}>
              Distanza
            </button>
            <button className={metrica === "passo" ? "chip chip-on chip-corsa" : "chip"} onClick={() => setMetrica("passo")}>
              Passo
            </button>
          </div>
        </div>
        {punti.length >= 2 ? (
          <Suspense fallback={<p className="body muted spaced">Carico il grafico</p>}>
            <Grafico
              dati={punti}
              chiave={metrica}
              colore="#35C4F0"
              formato={(v) => (metrica === "km" ? [`${dec(v)} km`, "Distanza"] : [`${passo(v)}/km`, "Passo medio"])}
            />
          </Suspense>
        ) : (
          <p className="body muted spaced">Serve almeno una seconda uscita perché compaia la curva.</p>
        )}
      </section>

      <section className="card">
        <p className="eyebrow">Il minuto del fastidio</p>
        {fastidi.length >= 2 ? (
          <>
            <Suspense fallback={<p className="body muted spaced">Carico il grafico</p>}>
              <Grafico dati={fastidi} chiave="minuto" colore="#FFB627" formato={(v) => [`${v}° minuto`, "Compare al"]} />
            </Suspense>
            <p className="footnote">
              Se sale, stai vincendo. Se resta fermo per tre o quattro settimane nonostante la palestra, è il segnale
              per un ricontrollo.
            </p>
          </>
        ) : (
          <p className="body muted spaced">
            Segna a che minuto compare il fastidio a ogni uscita: dalla seconda volta qui c'è la curva che conta.
          </p>
        )}
      </section>
    </>
  );
}

/* ---------------- archivio dei record ---------------- */

function Record({ data }) {
  const rec = useMemo(() => calcolaRecord(data.sessioni), [data.sessioni]);
  const forza = Object.entries(rec.forza).filter(([, v]) => v.carico > 0);
  const passi = Object.entries(rec.corsa.passo);

  if (!forza.length && !rec.corsa.distanza && !passi.length) {
    return <Vuoto titolo="Nessun record" testo="Arrivano da soli: appena batti qualcosa, l'app te lo dice e finisce qui." />;
  }

  return (
    <>
      {(rec.corsa.distanza || passi.length > 0) && (
        <section className="card card-corsa">
          <p className="eyebrow">Corsa</p>
          <ul className="list">
            {rec.corsa.distanza && (
              <li className="statusrow">
                <div>
                  <p className="body">Uscita più lunga</p>
                  <p className="mono muted small">{dayLabel(rec.corsa.distanza.data)}</p>
                </div>
                <p className="mono t-corsa">{dec(rec.corsa.distanza.km)} km</p>
              </li>
            )}
            {passi.map(([label, v]) => (
              <li key={label} className="statusrow">
                <div>
                  <p className="body">Miglior passo sui {label}</p>
                  <p className="mono muted small">
                    {dayLabel(v.data)} · {dec(v.km)} km
                  </p>
                </div>
                <p className="mono t-corsa">{passo(v.sec)}/km</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {forza.length > 0 && (
        <section className="card">
          <p className="eyebrow">Forza</p>
          <ul className="list">
            {forza
              .sort((a, b) => b[1].massimale - a[1].massimale)
              .map(([id, v]) => (
                <li key={id} className="statusrow">
                  <div>
                    <p className="body">{esercizio(id).nome}</p>
                    <p className="mono muted small">
                      {dayLabel(v.data)}
                      {v.reps ? ` · ${num(v.carico)} kg × ${v.reps}` : ""}
                    </p>
                  </div>
                  <div className="right">
                    <p className="mono">{num(v.carico)} kg</p>
                    {v.massimale > 0 && <p className="mono muted small">{dec(v.massimale)} stimati</p>}
                  </div>
                </li>
              ))}
          </ul>
          <p className="footnote">
            Il massimale è stimato con Epley dal carico e dalle ripetizioni: serve a confrontare serie diverse tra loro,
            non a dirti quanto alzeresti davvero.
          </p>
        </section>
      )}
    </>
  );
}
