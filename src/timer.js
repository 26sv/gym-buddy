/**
 * Il timer di recupero e i suoi avvisi.
 *
 * Il problema vero non è contare i secondi, è farsi sentire quando il telefono è
 * in tasca con lo schermo spento. Qui dentro si fa tutto quello che una PWA può
 * fare, in quest'ordine:
 *
 *   1. suono e vibrazione, se la pagina è ancora davanti;
 *   2. notifica di sistema tramite service worker, che su Android arriva anche
 *      con l'app in background;
 *   3. recupero al ritorno: quando la pagina torna visibile si ricalcola sempre
 *      dal timestamp di fine, così un timeout strozzato dal sistema non fa
 *      perdere il conto.
 *
 * Su iOS le notifiche funzionano solo con l'app installata dalla schermata home
 * e dalla 16.4 in poi; l'affidabilità a schermo spento è la cosa che il PRD
 * chiede di verificare con un prototipo prima di fidarsi. Per questo il conto
 * resta comunque corretto al rientro anche se la notifica non arriva: è la sola
 * parte su cui l'app può mettere la mano sul fuoco.
 */

let ctx = null;
let programmato = null;

/** L'AudioContext va creato dentro un gesto dell'utente, poi si riusa. */
export function preparaAudio() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!ctx) ctx = new Ctx();
    if (ctx.state === "suspended") ctx.resume();
  } catch (e) {
    /* audio negato: restano vibrazione e notifica */
  }
}

export function beep() {
  try {
    if (!ctx) preparaAudio();
    if (!ctx) return;
    [0, 0.18].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 760;
      const t0 = ctx.currentTime + offset;
      gain.gain.setValueAtTime(0.001, t0);
      gain.gain.exponentialRampToValueAtTime(0.35, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.16);
      osc.start(t0);
      osc.stop(t0 + 0.18);
    });
  } catch (e) {}
}

export function buzz(ms) {
  try {
    if (navigator.vibrate) navigator.vibrate(ms);
  } catch (e) {}
}

export const notificheDisponibili = () => typeof Notification !== "undefined";

export const statoNotifiche = () => (notificheDisponibili() ? Notification.permission : "unsupported");

export async function chiediNotifiche() {
  if (!notificheDisponibili()) return "unsupported";
  if (Notification.permission !== "default") return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch (e) {
    return Notification.permission;
  }
}

async function mostra(titolo, corpo) {
  if (!notificheDisponibili() || Notification.permission !== "granted") return;
  const opzioni = {
    body: corpo,
    tag: "recupero",
    renotify: true,
    silent: false,
    vibrate: [160, 90, 160],
    icon: "icon.svg",
    badge: "icon.svg",
  };
  try {
    /* Via service worker quando c'è: è l'unica strada che regge con la pagina
       in background. Il new Notification() diretto è il ripiego da desktop. */
    if (navigator.serviceWorker?.ready) {
      const reg = await navigator.serviceWorker.ready;
      if (reg?.showNotification) {
        await reg.showNotification(titolo, opzioni);
        return;
      }
    }
    new Notification(titolo, opzioni);
  } catch (e) {}
}

/** Programma l'avviso di fine recupero. Sovrascrive quello precedente. */
export function programmaAvviso(endsAt, corpo) {
  annullaAvviso();
  const fra = endsAt - Date.now();
  if (fra <= 0) return;
  programmato = setTimeout(() => {
    programmato = null;
    if (document.visibilityState !== "visible") mostra("Recupero finito", corpo);
  }, fra);
}

export function annullaAvviso() {
  if (programmato) clearTimeout(programmato);
  programmato = null;
}
