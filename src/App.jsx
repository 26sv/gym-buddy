import React, { useState, useEffect, useRef, useCallback } from "react";
import Style from "./stile.jsx";
import { storage, migraDaFerro, KEY, KEY_V1, unisci } from "./storage.js";
import {
  statoVuoto, migraStato, VERSIONE, clock, serieDi, serieTotali, volumeDi,
  nuovaForza, chiudiForza, nuovaCorsa, nuovaAltro, recordBattuti, confronto,
  precedenteConfrontabile, dayKey,
} from "./modello.js";
import { SCHEDE, SCHEDA_DEFAULT, REST_PRESETS, seriePreviste } from "./dati/schede.js";
import { preparaAudio, beep, buzz, programmaAvviso, annullaAvviso, chiediNotifiche } from "./timer.js";
import { Anello } from "./componenti/base.jsx";
import Oggi from "./schermate/Oggi.jsx";
import Forza from "./schermate/Forza.jsx";
import Corsa from "./schermate/Corsa.jsx";
import Riepilogo from "./schermate/Riepilogo.jsx";
import Esito from "./schermate/Esito.jsx";
import Storico from "./schermate/Storico.jsx";
import Progressi from "./schermate/Progressi.jsx";
import Dati from "./schermate/Dati.jsx";
import Onboarding, { Energia } from "./schermate/Onboarding.jsx";

/* Ogni quante sessioni ricordare il backup: sta tutto su un telefono solo. */
const SESSIONI_PER_BACKUP = 12;

export default function App() {
  const [data, setData] = useState(statoVuoto);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("oggi");
  const [now, setNow] = useState(Date.now());
  const [rest, setRest] = useState(null);
  const [focusIdx, setFocusIdx] = useState(0);
  const [schedaScelta, setSchedaScelta] = useState(SCHEDA_DEFAULT);
  const [riepilogo, setRiepilogo] = useState(false);
  const [manuale, setManuale] = useState(null); // { tipo, prefill } | null
  const [esito, setEsito] = useState(null); // { sessione, record, righe }
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [flash, setFlash] = useState(null);
  const [toast, setToast] = useState(null);
  const [compatta, setCompatta] = useState(false);
  /* Non persistiti: valgono per questa apertura dell'app e basta. */
  const [energiaChiesta, setEnergiaChiesta] = useState(false);
  const [rinomina, setRinomina] = useState(false);
  const saveTimer = useRef(null);
  const beeped = useRef(false);

  /* ---------------- caricamento e migrazione ---------------- */

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        migraDaFerro();
        let letto = null;
        try {
          letto = JSON.parse((await storage.get(KEY)).value);
        } catch (e) {
          /* Prima apertura della versione con corsa e forza insieme: si legge
             lo stato vecchio, lo si traduce e lo si riscrive sotto la chiave
             nuova. Quella vecchia resta intatta, così tornare indietro non
             perde niente. */
          try {
            letto = JSON.parse((await storage.get(KEY_V1)).value);
          } catch (e2) {
            letto = null;
          }
        }
        const stato = migraStato(letto);
        if (!alive) return;
        setData(stato);
        if (letto && letto.versione !== VERSIONE) {
          storage.set(KEY, JSON.stringify(stato)).catch(() => {});
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const persist = useCallback((next) => {
    setData(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await storage.set(KEY, JSON.stringify(next));
      } catch (e) {
        avvisa("Salvataggio non riuscito. Resta tutto sullo schermo, riprova a fine serie.");
      }
    }, 500);
  }, []);

  /* Come persist ma senza debounce: per nome ed energia, che si scelgono una
     volta sola e subito dopo si può ricaricare la pagina. Il debounce serve alle
     serie, che arrivano a raffica. */
  const salvaSubito = useCallback(async (next) => {
    setData(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    try {
      await storage.set(KEY, JSON.stringify(next));
    } catch (e) {
      avvisa("Salvataggio non riuscito. Resta tutto sullo schermo, riprova a fine serie.");
    }
  }, []);

  const avvisa = (testo, ok = false) => {
    setToast({ testo, ok });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(i);
  }, []);

  const active = data.active;

  /* Se c'è una seduta aperta la domanda sull'energia è già acqua passata: l'ho
     data all'avvio, o l'ho saltata riaprendo a metà. Senza questo, chiudendo la
     seduta il prompt tornerebbe a galla a fine allenamento. */
  useEffect(() => {
    if (active) setEnergiaChiesta(true);
  }, [active]);

  /* schermo sempre acceso durante l'allenamento */
  useEffect(() => {
    let lock = null;
    let cancelled = false;
    if (active && navigator.wakeLock) {
      navigator.wakeLock
        .request("screen")
        .then((l) => {
          if (cancelled) l.release();
          else lock = l;
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
      try {
        if (lock) lock.release();
      } catch (e) {}
    };
  }, [active]);

  /* Il recupero si ricalcola sempre dal timestamp di fine: se il sistema ha
     strozzato il timer mentre l'app era in background, al rientro il conto è
     comunque quello giusto. */
  useEffect(() => {
    if (!rest) {
      beeped.current = false;
      return;
    }
    if (!beeped.current && now >= rest.endsAt) {
      beeped.current = true;
      annullaAvviso();
      if (document.visibilityState === "visible") {
        beep();
        buzz([120, 80, 120]);
      }
    }
  }, [now, rest]);

  useEffect(() => () => annullaAvviso(), []);

  const elapsed = active ? (now - new Date(active.startedAt).getTime()) / 1000 : 0;
  const restLeft = rest ? Math.max(0, (rest.endsAt - now) / 1000) : 0;

  /* ---------------- azioni ---------------- */

  const avviaForza = (scheda) => {
    preparaAudio();
    chiediNotifiche();
    const energia = data.energyLog.length ? data.energyLog[0].level : null;
    persist({ ...data, active: nuovaForza({ scheda, energia }) });
    setSchedaScelta(scheda);
    setFocusIdx(0);
    setTab("oggi");
  };

  const toggleWarmup = (item) => {
    const w = active.warmup || [];
    persist({
      ...data,
      active: { ...active, warmup: w.includes(item) ? w.filter((x) => x !== item) : [...w, item] },
    });
  };

  const registraSerie = (voce, carico, reps) => {
    const esercizi = [...(active.esercizi || [])];
    const i = esercizi.findIndex((e) => e.nomeId === voce.id);
    const serie = { reps, carico, completata: true };
    if (i >= 0) esercizi[i] = { ...esercizi[i], serie: [...esercizi[i].serie, serie] };
    else esercizi.push({ nomeId: voce.id, serie: [serie] });

    const record = carico > 0 && carico > massimoStorico(data.sessioni, voce.id);
    persist({
      ...data,
      ultimiCarichi: carico > 0 ? { ...data.ultimiCarichi, [voce.id]: carico } : data.ultimiCarichi,
      active: { ...active, esercizi },
    });

    setFlash(record ? "record" : "ok");
    setTimeout(() => setFlash(null), record ? 1600 : 700);
    buzz(record ? [40, 60, 40] : 25);

    const durata = REST_PRESETS[0];
    const endsAt = Date.now() + durata * 1000;
    setRest({ endsAt, duration: durata });
    beeped.current = false;
    programmaAvviso(endsAt, "Prossima serie.");
  };

  const annullaSerie = (voce) => {
    const esercizi = (active.esercizi || [])
      .map((e) => (e.nomeId === voce.id ? { ...e, serie: e.serie.slice(0, -1) } : e))
      .filter((e) => e.serie.length);
    persist({ ...data, active: { ...active, esercizi } });
    buzz(15);
  };

  const aggiungiEsercizio = (e) => {
    persist({ ...data, active: { ...active, extra: [...(active.extra || []), e] } });
  };

  /** Mette in archivio una sessione e apre l'esito: record prima, delta poi. */
  const archivia = (sessione) => {
    const record = recordBattuti(sessione, data.sessioni);
    const righe = confronto(sessione, precedenteConfrontabile(sessione, data.sessioni));
    persist({ ...data, sessioni: [sessione, ...data.sessioni], active: null });
    setRest(null);
    annullaAvviso();
    setRiepilogo(false);
    setManuale(null);
    setFocusIdx(0);
    setEsito({ sessione, record, righe });
    if (record.length) buzz([50, 70, 50, 70, 90]);
  };

  const salvaForza = ({ rpe, feel, satisfaction }) =>
    archivia(chiudiForza(active, elapsed, { rpe, feel, satisfaction }));

  const salvaManuale = (campi) => {
    const energia = data.energyLog.length ? data.energyLog[0].level : null;
    archivia(
      campi.tipo === "altro"
        ? nuovaAltro({ ...campi, energia })
        : nuovaCorsa({ ...campi, energia })
    );
  };

  const importa = (statoLetto, quante) => {
    const tradotto = statoLetto.versione === VERSIONE ? statoLetto : migraStato(statoLetto);
    salvaSubito(unisci(data, tradotto));
    avvisa(`Backup unito: ${quante} sessioni lette.`, true);
  };

  /* ---------------- render ---------------- */

  if (loading) {
    return (
      <div className="root center">
        <Style />
        <p className="mono muted">Carico i dati</p>
      </div>
    );
  }

  /* Prima apertura in assoluto, o richiesta esplicita di cambiare nome. */
  if (!data.userName || rinomina) {
    return (
      <Onboarding
        nomeAttuale={rinomina ? data.userName : ""}
        onSalva={(nome) => {
          salvaSubito({ ...data, userName: nome });
          setRinomina(false);
        }}
        onAnnulla={rinomina ? () => setRinomina(false) : null}
      />
    );
  }

  /* L'energia si chiede a ogni apertura, ma mai a metà allenamento: se riapro
     l'app tra una serie e l'altra devo ritrovare il cronometro, non una domanda.
     E nemmeno sopra a un foglio già aperto, che sarebbe la stessa interruzione. */
  const chiediEnergia = !energiaChiesta && !active && !manuale && !esito;

  const fatte = active ? serieTotali({ forza: active }) : 0;
  const previste = active ? seriePreviste(active.scheda) : 0;
  const daBackup = data.sessioni.length - (data.ultimoBackup?.sessioni ?? 0);

  return (
    <div className="root">
      <Style />

      <header className={compatta ? "topbar shrunk" : "topbar"}>
        {active ? (
          <>
            <div>
              <p className="eyebrow">{SCHEDE[active.scheda]?.nome || "Seduta"} in corso</p>
              <p className="clock mono">{clock(elapsed)}</p>
            </div>
            <Anello fatto={fatte} totale={previste} />
          </>
        ) : (
          <>
            <div>
              <p className="eyebrow">Ciao {data.userName}</p>
              <h1 className="brand">GYM BUDDY</h1>
            </div>
            <div className="right">
              <p className="eyebrow">Questa settimana</p>
              <p className="clock mono">
                {settimanali(data).length}
                <span className="muted">/{data.obiettivoPalestra + 3}</span>
              </p>
            </div>
          </>
        )}
      </header>

      <main
        className={rest ? "content with-rest" : "content"}
        onScroll={(e) => setCompatta(e.currentTarget.scrollTop > 24)}
      >
        {tab === "oggi" &&
          (active ? (
            <Forza
              active={active}
              stato={data}
              focusIdx={focusIdx}
              setFocusIdx={setFocusIdx}
              onLog={registraSerie}
              onUndo={annullaSerie}
              onWarmup={toggleWarmup}
              onAggiungi={aggiungiEsercizio}
              onFinish={() => setRiepilogo(true)}
              confirmCancel={confirmCancel}
              setConfirmCancel={setConfirmCancel}
              onCancel={() => {
                persist({ ...data, active: null });
                setRest(null);
                annullaAvviso();
                setConfirmCancel(false);
              }}
            />
          ) : (
            <Oggi
              data={data}
              schedaScelta={schedaScelta}
              onScegliScheda={setSchedaScelta}
              onStartForza={avviaForza}
              onCorsa={(prefill) => setManuale({ tipo: "corsa", prefill })}
              onAltro={() => setManuale({ tipo: "altro", prefill: null })}
            />
          ))}
        {tab === "progressi" && (
          <Progressi data={data} onSoglia={(v) => persist({ ...data, sogliaCarico: v })} />
        )}
        {tab === "dati" && (
          <Dati
            data={data}
            avvisoBackup={daBackup >= SESSIONI_PER_BACKUP ? daBackup : null}
            onRinomina={() => setRinomina(true)}
            onImporta={importa}
            onObiettivo={(t) => persist({ ...data, obiettivoPalestra: t })}
            onBackupFatto={() =>
              persist({
                ...data,
                ultimoBackup: { ts: new Date().toISOString(), sessioni: data.sessioni.length },
              })
            }
          />
        )}
        {tab === "storico" && <Storico data={data} />}
      </main>

      {flash && (
        <div className={flash === "record" ? "flash flash-record" : "flash"}>
          {flash === "record" ? "Nuovo record" : ""}
        </div>
      )}

      {rest && (
        <Recupero
          left={restLeft}
          duration={rest.duration}
          onSet={(secs) => {
            const endsAt = Date.now() + secs * 1000;
            setRest({ endsAt, duration: secs });
            beeped.current = false;
            programmaAvviso(endsAt, "Prossima serie.");
          }}
          onAdd={() => {
            const endsAt = rest.endsAt + 30000;
            setRest({ ...rest, endsAt });
            beeped.current = false;
            programmaAvviso(endsAt, "Prossima serie.");
          }}
          onClose={() => {
            setRest(null);
            annullaAvviso();
          }}
        />
      )}

      {riepilogo && active && (
        <Riepilogo
          active={active}
          elapsed={elapsed}
          serie={fatte}
          volume={volumeDi({ forza: active })}
          onSalva={salvaForza}
          onIndietro={() => setRiepilogo(false)}
        />
      )}

      {manuale && (
        <Corsa
          tipo={manuale.tipo}
          prefill={manuale.prefill}
          sessioni={data.sessioni}
          onSalva={salvaManuale}
          onChiudi={() => setManuale(null)}
        />
      )}

      {esito && (
        <Esito
          sessione={esito.sessione}
          record={esito.record}
          righe={esito.righe}
          onChiudi={() => {
            setEsito(null);
            setTab("oggi");
          }}
        />
      )}

      {chiediEnergia && (
        <Energia
          nome={data.userName}
          onPick={(level) => {
            preparaAudio();
            salvaSubito({
              ...data,
              energyLog: [{ ts: new Date().toISOString(), level }, ...data.energyLog].slice(0, 400),
            });
            setEnergiaChiesta(true);
            buzz(20);
          }}
        />
      )}

      {toast && <div className={toast.ok ? "toast toast-ok" : "toast"}>{toast.testo}</div>}

      <nav className="tabbar">
        {[
          ["oggi", "Oggi"],
          ["storico", "Storico"],
          ["progressi", "Progressi"],
          ["dati", "Dati"],
        ].map(([id, label]) => (
          <button key={id} className={tab === id ? "tab tab-on" : "tab"} onClick={() => setTab(id)}>
            {label}
            {id === "oggi" && active && <span className="live" />}
          </button>
        ))}
      </nav>
    </div>
  );
}

/* ---------------- pezzi minori ---------------- */

const massimoStorico = (sessioni, id) =>
  sessioni.reduce(
    (m, s) => Math.max(m, ...serieDi(s, id).map((x) => x.carico || 0), 0),
    0
  );

const settimanali = (data) => {
  const lunedi = new Date();
  lunedi.setHours(0, 0, 0, 0);
  lunedi.setDate(lunedi.getDate() - ((lunedi.getDay() + 6) % 7));
  return data.sessioni.filter((s) => new Date(s.data) >= lunedi);
};

function Recupero({ left, duration, onSet, onAdd, onClose }) {
  const pct = Math.max(0, Math.min(100, (left / duration) * 100));
  const over = left <= 0;
  return (
    <div className={over ? "rest rest-over" : "rest"} role="status" aria-live="polite">
      <div className="rest-drain" style={{ width: `${pct}%` }} />
      <div className="rest-in">
        <div>
          <p className="eyebrow">{over ? "Recupero finito" : "Recupero"}</p>
          <p className="rest-clock mono">{clock(left)}</p>
        </div>
        <div className="rest-actions">
          {REST_PRESETS.map((p) => (
            <button key={p} className={duration === p ? "chip chip-on" : "chip"} onClick={() => onSet(p)}>
              {p === 90 ? "1:30" : `${p / 60}:00`}
            </button>
          ))}
          <button className="chip" onClick={onAdd}>
            +30s
          </button>
          <button className="chip chip-x" onClick={onClose} aria-label="Chiudi il recupero">
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
