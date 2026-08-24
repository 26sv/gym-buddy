import React, { useMemo } from "react";
import { BLOCCHI, SETTIMANE, settimanaDi, previstoIl, giorniAllaGara, dateSettimana } from "../dati/piano.js";
import { SCHEDE, SCHEDA_DEFAULT, ID_SCHEDE, seriePreviste } from "../dati/schede.js";
import { caricoSettimanale, dec, dayKey, etichettaCorsa } from "../modello.js";
import { Anello } from "../componenti/base.jsx";

/**
 * La home è un momento, non un menu: dice cosa c'è da fare oggi e quanto manca
 * a chiudere la settimana. Lo storico sta da un'altra parte.
 *
 * Il conto dei tap è il vincolo: apro l'app, tocco "Inizia", sto già allenando.
 * Quando il piano non prevede niente restano due scorciatoie dirette, così
 * anche l'allenamento non programmato parte con lo stesso numero di gesti.
 */
export default function Oggi({ data, onStartForza, onCorsa, onAltro, onScegliScheda, schedaScelta }) {
  const oggi = new Date();
  const sett = settimanaDi(oggi);
  const previsto = useMemo(() => previstoIl(oggi), [dayKey(oggi)]);
  const mancano = giorniAllaGara(oggi);

  const carico = useMemo(
    () => caricoSettimanale(data.sessioni, oggi, data.sogliaCarico),
    [data.sessioni, data.sogliaCarico]
  );

  const fatteOggi = data.sessioni.filter((s) => dayKey(s.data) === dayKey(oggi));
  const palestraFatte = carico.sessioni.filter((s) => s.tipo === "forza").length;
  const corseFatte = carico.sessioni.filter((s) => s.tipo === "corsa").length;
  const corsePreviste = 3; // tre uscite a settimana, mai quattro

  /* Se una sessione prevista è già stata fatta oggi non la ripropongo come
     "da fare": in palestra il pulsante grande deve essere quello giusto. */
  const daFare = previsto.filter(
    (p) => !fatteOggi.some((s) => s.tipo === p.tipo)
  );
  const principale = daFare[0] || null;

  return (
    <div className="stack">
      {/* --- oggi --- */}
      {principale ? (
        <section className={principale.tipo === "corsa" ? "card card-oggi card-corsa" : "card card-oggi card-hi"}>
          <div className="between">
            <div>
              <p className="eyebrow">
                Oggi {sett ? `· settimana ${sett.n} di ${SETTIMANE.length}` : ""}
              </p>
              <h2 className="h1">{principale.titolo}</h2>
              <p className="body muted">
                {principale.tipo === "corsa"
                  ? `${dec(principale.km)} km${principale.nota ? ` · ${principale.nota}` : ""}`
                  : `${SCHEDE[schedaScelta || SCHEDA_DEFAULT].focus}`}
              </p>
            </div>
            <span className={`badge badge-${principale.tipo === "corsa" ? "corsa" : "forza"}`}>
              {principale.tipo === "corsa"
                ? etichettaCorsa(principale.tipoSessione)
                : `${seriePreviste(schedaScelta || SCHEDA_DEFAULT)} serie`}
            </span>
          </div>

          {principale.tipo === "corsa" ? (
            <button className="btn btn-corsa" onClick={() => onCorsa(principale)}>
              Registra {principale.gara ? "la gara" : "l'uscita"}
            </button>
          ) : (
            <>
              <button className="btn btn-primary" onClick={() => onStartForza(schedaScelta || SCHEDA_DEFAULT)}>
                Inizia {SCHEDE[schedaScelta || SCHEDA_DEFAULT].nome.toLowerCase()}
              </button>
              <div className="incs">
                <span className="eyebrow">Scheda</span>
                {ID_SCHEDE.map((id) => (
                  <button
                    key={id}
                    className={(schedaScelta || SCHEDA_DEFAULT) === id ? "chip chip-on" : "chip"}
                    onClick={() => onScegliScheda(id)}
                  >
                    {SCHEDE[id].nome}
                  </button>
                ))}
              </div>
            </>
          )}

          {principale.tipo === "corsa" && (
            <p className="footnote">
              Segna a che minuto è comparso il fastidio, non se è comparso: è il numero che dice se stai vincendo.
            </p>
          )}
        </section>
      ) : (
        <section className="card card-oggi">
          <p className="eyebrow">Oggi {sett ? `· settimana ${sett.n}` : ""}</p>
          <h2 className="h1">
            {previsto.length ? "Fatto" : sett ? "Riposo" : "Niente in programma"}
          </h2>
          <p className="body muted">
            {previsto.length
              ? "Il piano per oggi è chiuso. Il resto è recupero."
              : sett
              ? "Il piano non prevede niente. Se ti va comunque, parti da qui sotto."
              : "Fuori dalle 24 settimane del piano: registra quello che fai."}
          </p>
        </section>
      )}

      {/* --- due scorciatoie, sempre --- */}
      <div className="scorciatoie">
        <button className="scorc corsa" onClick={() => onCorsa(null)}>
          <span className="scorc-ic">▲</span>
          <span className="scorc-t">Registra corsa</span>
          <span className="scorc-s">Distanza, durata, sensazione</span>
        </button>
        <button className="scorc forza" onClick={() => onStartForza(schedaScelta || SCHEDA_DEFAULT)}>
          <span className="scorc-ic">◼</span>
          <span className="scorc-t">Registra palestra</span>
          <span className="scorc-s">{SCHEDE[schedaScelta || SCHEDA_DEFAULT].nome}</span>
        </button>
      </div>

      {/* --- la settimana --- */}
      <section className="card">
        <div className="between middle">
          <div>
            <p className="eyebrow">Questa settimana</p>
            <p className="clock big-clock mono">
              {carico.totale}
              <span className="unit">carico</span>
            </p>
            <p className="body muted">
              {carico.media4 === null
                ? "Serve qualche settimana per avere un confronto"
                : carico.delta === 0
                ? "In linea con le ultime quattro settimane"
                : `${carico.delta > 0 ? "+" : ""}${carico.delta}% sulla media delle ultime 4`}
            </p>
          </div>
          <Anello fatto={palestraFatte + corseFatte} totale={data.obiettivoPalestra + corsePreviste} size={62} />
        </div>

        <div className="bar-split" aria-hidden="true">
          <span className="bg-corsa" style={{ width: `${quota(carico, "corsa")}%` }} />
          <span className="bg-forza" style={{ width: `${quota(carico, "forza")}%` }} />
          <span className="bg-altro" style={{ width: `${quota(carico, "altro")}%` }} />
        </div>

        <ul className="list">
          <li className="row">
            <span className="body">
              <span className="t-corsa">▲</span> Corsa
            </span>
            <span className="mono muted small">
              {corseFatte}/{corsePreviste} uscite · {dec(carico.kmCorsa)} km
            </span>
          </li>
          <li className="row">
            <span className="body">
              <span className="t-forza">◼</span> Palestra
            </span>
            <span className="mono muted small">
              {palestraFatte}/{data.obiettivoPalestra} sedute
            </span>
          </li>
        </ul>

        {carico.allarme && (
          <div className="avviso">
            <span className="avviso-ic">▲</span>
            <p>
              Il carico è salito del {carico.delta}% sulla media delle ultime quattro settimane, oltre la soglia del{" "}
              {data.sogliaCarico}%. Non è un divieto, è il momento di guardare come dormi e come risponde il ginocchio.
            </p>
          </div>
        )}

        {palestraFatte < data.obiettivoPalestra && (
          <p className="footnote">
            {data.obiettivoPalestra - palestraFatte === 1
              ? "Manca una seduta di palestra a chiudere la settimana."
              : `Mancano ${data.obiettivoPalestra - palestraFatte} sedute di palestra: due a settimana sono il pavimento, anche in scarico.`}
          </p>
        )}
      </section>

      {/* --- la gara --- */}
      {sett && (
        <section className="card mini">
          <div className="between middle">
            <div>
              <p className="eyebrow">
                {BLOCCHI[sett.blocco].nome}
                {sett.scarico ? " · scarico" : sett.picco ? " · picco" : ""}
              </p>
              <p className="body">
                {sett.gara
                  ? `Settimana di gara: ${sett.gara}`
                  : `Lungo da ${dec(sett.lungo.km)} km, ${sett.totale} km in tutto`}
              </p>
              <p className="body muted small mono">
                {finestra(sett.n)}
              </p>
            </div>
            <div className="right">
              <p className="eyebrow">Alla mezza</p>
              <p className="clock mono">
                {mancano > 0 ? mancano : 0}
                <span className="unit">gg</span>
              </p>
            </div>
          </div>
          {sett.scarico && (
            <p className="footnote">
              Settimana di scarico: il volume scende del 25-30%. È quella che salva la preparazione, non si salta.
            </p>
          )}
        </section>
      )}

      <button className="btn btn-ghost" onClick={onAltro}>
        Registra un'altra attività
      </button>
    </div>
  );
}

const quota = (carico, tipo) => {
  const tot = carico.perTipo.forza + carico.perTipo.corsa + carico.perTipo.altro;
  return tot > 0 ? (carico.perTipo[tipo] / tot) * 100 : 0;
};

const finestra = (n) => {
  const { da, a } = dateSettimana(n);
  const f = (d) => d.toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
  return `${f(da)} – ${f(a)}`;
};
