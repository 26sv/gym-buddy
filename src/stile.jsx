import React from "react";

/**
 * Tutto il CSS dell'app, in un tag <style> solo.
 *
 * Le variabili colore stanno su .root: niente numeri o colori scritti a mano
 * nelle regole, si cambia un valore qui e cambia ovunque.
 *
 * Colore per disciplina: la corsa è fredda, la forza tiene il rosso piastra che
 * GYM BUDDY ha da sempre. Il PRD suggeriva l'accoppiata opposta, ma il rosso è
 * l'identità dell'app e il calendario lo usa già per la palestra: quello che
 * conta è riconoscere la disciplina senza leggere, e due accenti distanti tra
 * loro lo fanno comunque.
 */
export default function Style() {
  return (
    <style>{`
@import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800&family=Space+Grotesk:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap');

.root {
  --nero:#000000; --ghisa:#0C0E11; --alto:#14171B; --bordo:#262A31; --fondo:#07080A;
  --gesso:#F7F5F0; --bronzo:#ABA69A; --spento:#3A3F47;
  --piastra:#FF2D3E; --verde:#3FD37C; --ambra:#FFB627; --corsa:#35C4F0;
  --forza:var(--piastra);
  position:relative; display:flex; flex-direction:column; height:100dvh; overflow:hidden;
  background:var(--nero); color:var(--gesso);
  font-family:'Space Grotesk',system-ui,sans-serif; letter-spacing:-.004em;
}
.root.center { align-items:center; justify-content:center; }
/* :where() azzera la specificità: senza, questo reset batterebbe .btn-primary,
   .cal-a e ogni altra classe con uno sfondo pieno, che resterebbero trasparenti. */
:where(.root button) { font-family:inherit; color:inherit; background:none; border:none; cursor:pointer; }
.root button:focus-visible { outline:2px solid var(--gesso); outline-offset:2px; border-radius:6px; }
.root button:disabled { opacity:.32; cursor:default; }

.mono { font-family:'Space Mono',ui-monospace,monospace; font-variant-numeric:tabular-nums; letter-spacing:-.03em; }
.muted { color:var(--bronzo); }
.small { font-size:11.5px; }
.strong { font-weight:700; }
.right { text-align:right; }
.left { text-align:left; }
.unit { font-size:12px; color:var(--bronzo); margin-left:2px; }
.up { color:var(--verde); }
.down { color:var(--piastra); }
.spaced { margin-top:14px; }
.nowrap { white-space:nowrap; }

/* tinte per disciplina */
.t-forza { color:var(--forza); }
.t-corsa { color:var(--corsa); }
.t-altro { color:var(--bronzo); }
.bg-forza { background:var(--forza); }
.bg-corsa { background:var(--corsa); }
.bg-altro { background:var(--bronzo); }

.topbar { display:flex; align-items:center; justify-content:space-between; padding:13px 16px; border-bottom:1px solid var(--bordo); flex-shrink:0; transition:padding 200ms ease; }
.topbar.shrunk { padding:7px 16px; }
.topbar.shrunk .brand { font-size:18px; }
.topbar.shrunk .eyebrow { opacity:0; height:0; margin:0; overflow:hidden; }
.brand { font-family:'Big Shoulders Display',sans-serif; font-weight:800; font-size:23px; letter-spacing:.10em; margin:0; line-height:.95; white-space:nowrap; transition:font-size 200ms ease; }
.brand-big { font-size:38px; letter-spacing:.08em; margin-top:4px; }
.eyebrow { font-family:'Space Mono',monospace; font-size:9.5px; letter-spacing:.18em; text-transform:uppercase; color:var(--bronzo); margin:0 0 4px; font-weight:400; transition:opacity 160ms ease; }
.clock { font-size:24px; font-weight:700; margin:0; line-height:1; }
.big-clock { font-size:34px; }

/* anello di progressione: si riempie con una transizione, non con un caricamento finto */
.ring { position:relative; width:52px; height:52px; flex-shrink:0; }
.ring svg { position:absolute; inset:0; transform:rotate(-90deg); }
.ring-track { stroke:var(--bordo); }
.ring-fill { stroke:var(--forza); stroke-linecap:round; transition:stroke-dashoffset 300ms ease; }
.ring-fill.corsa { stroke:var(--corsa); }
.ring-txt { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; gap:1px; }
.ring-n { font-size:16px; font-weight:700; }
.ring-d { font-size:10px; color:var(--bronzo); }

.content { flex:1; overflow-y:auto; padding:14px 16px 96px; }
.content.with-rest { padding-bottom:186px; }
.stack { display:flex; flex-direction:column; gap:12px; }

.card { background:var(--ghisa); border:1px solid var(--bordo); border-radius:16px; padding:15px; }
.card-hi { border-color:var(--piastra); }
.card-corsa { border-color:#1B4657; }
.card-focus { background:linear-gradient(174deg,#1C0F13 0%,var(--ghisa) 58%); border-color:#43222A; }
.card-done { border-color:var(--verde); }
.card-warn { border-color:var(--piastra); }
.card-oggi { background:linear-gradient(168deg,#151A20 0%,var(--ghisa) 62%); }
.card.mini { padding:13px 15px; }
.card.flat { background:none; border-color:var(--bordo); }

.h1 { font-family:'Big Shoulders Display',sans-serif; font-size:42px; font-weight:800; margin:0 0 6px; line-height:.92; letter-spacing:.012em; text-transform:uppercase; }
.h2 { font-family:'Big Shoulders Display',sans-serif; font-size:31px; font-weight:700; margin:0 0 5px; line-height:.98; letter-spacing:.012em; text-transform:uppercase; }
.h3 { font-family:'Big Shoulders Display',sans-serif; font-size:26px; font-weight:700; margin:0 0 3px; line-height:1; letter-spacing:.012em; text-transform:uppercase; }
.body { font-size:13.5px; margin:0; line-height:1.45; }
.footnote { font-size:11.5px; color:var(--bronzo); line-height:1.55; margin:10px 2px 0; }

.between { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }
.between.full { width:100%; }
.middle { align-items:center; }
.grid2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.grid3 { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin:16px 0 4px; }
.stat { font-size:21px; font-weight:700; margin:0; }
.navrow { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.navrow .btn { margin-top:0; }

.badge { font-size:11px; color:var(--bronzo); border:1px solid var(--bordo); border-radius:999px; padding:4px 9px; white-space:nowrap; }
.badge-corsa { color:var(--corsa); border-color:#1B4657; }
.badge-forza { color:var(--piastra); border-color:#43222A; }
.pill { font-size:10.5px; padding:3px 8px; border-radius:999px; white-space:nowrap; }
.pill-verde { background:rgba(63,211,124,.16); color:var(--verde); }
.pill-ambra { background:rgba(255,182,39,.16); color:var(--ambra); }
.pill-piastra { background:rgba(255,45,62,.16); color:var(--piastra); }
.pill-corsa { background:rgba(53,196,240,.16); color:var(--corsa); }

.list { list-style:none; padding:0; margin:11px 0 0; display:flex; flex-direction:column; gap:8px; }
.row { display:flex; justify-content:space-between; align-items:baseline; gap:12px; font-size:13.5px; }
.statusrow { display:flex; justify-content:space-between; gap:12px; padding-bottom:8px; border-bottom:1px solid var(--bordo); }
.statusrow:last-child { border-bottom:none; padding-bottom:0; }

.bar { height:7px; background:var(--bordo); border-radius:999px; overflow:hidden; margin:12px 0 9px; }
.bar-fill { height:100%; background:var(--piastra); border-radius:999px; transition:width 260ms ease; }
.bar-corsa { background:var(--corsa); }
.bar-split { display:flex; height:9px; border-radius:999px; overflow:hidden; background:var(--bordo); margin:12px 0 9px; }
.bar-split span { display:block; height:100%; transition:width 260ms ease; }
.dot { display:inline-block; width:3px; height:3px; border-radius:50%; background:var(--bronzo); margin:0 5px; vertical-align:middle; }

/* rail degli esercizi */
.rail { display:flex; gap:6px; overflow-x:auto; scrollbar-width:none; }
.rail::-webkit-scrollbar { display:none; }
.rail-item { flex:1 0 auto; min-width:52px; max-width:88px; padding:0; text-align:left; }
.rail-bar { display:block; height:4px; border-radius:999px; background:var(--bordo); position:relative; overflow:hidden; }
.rail-bar::after { content:""; position:absolute; inset:0 auto 0 0; width:var(--fill); background:var(--bronzo); border-radius:999px; transition:width 220ms ease; }
.rail-on .rail-bar::after, .rail-done .rail-bar::after { background:var(--piastra); }
.rail-done .rail-bar::after { background:var(--verde); }
.rail-label { display:block; font-size:9.5px; letter-spacing:.04em; text-transform:uppercase; color:var(--bronzo); margin-top:5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.rail-on .rail-label { color:var(--gesso); font-weight:600; }

.lastline { font-size:12px; margin:12px 0 0; line-height:1.5; }

.plates { display:flex; gap:8px; margin-top:13px; flex-wrap:wrap; }
.plate { width:58px; height:58px; border-radius:50%; border:2px solid var(--bordo); background:var(--fondo); display:flex; align-items:center; justify-content:center; transition:transform 120ms ease,background 160ms ease,border-color 160ms ease; }
.plate:active { transform:scale(.94); }
.plate-next { border-style:dashed; border-color:var(--bronzo); }
.plate-on { background:var(--piastra); border-color:var(--piastra); }
.pv { display:flex; flex-direction:column; align-items:center; font-size:13px; font-weight:700; line-height:1.05; }
.pv em { font-style:normal; font-size:8.5px; opacity:.85; margin-top:2px; letter-spacing:0; }
.pi { font-size:14px; color:var(--bronzo); }

.steppers { display:grid; grid-template-columns:1.35fr 1fr; gap:10px; margin-top:14px; }
.steppers.solo { grid-template-columns:1fr; }
.stepper { display:flex; align-items:center; justify-content:space-between; border:1px solid var(--bordo); border-radius:12px; padding:4px; background:var(--fondo); }
/* 48 px pieni: si centrano col pollice senza guardare */
.step { width:48px; height:48px; font-size:22px; border-radius:9px; color:var(--bronzo); }
.step:active { background:var(--bordo); }
.sval { text-align:center; padding:0 4px; min-width:0; }
.big { font-size:20px; font-weight:700; }
.win { width:74px; background:none; border:none; color:var(--gesso); font-size:19px; font-weight:700; text-align:center; font-family:'Space Mono',monospace; }
.win:focus { outline:none; }

.incs { display:flex; align-items:center; gap:6px; margin-top:11px; flex-wrap:wrap; }
.incs .eyebrow { margin:0 4px 0 0; }

.check { display:flex; align-items:center; gap:10px; width:100%; text-align:left; padding:5px 0; }
.box { width:21px; height:21px; border-radius:6px; border:1px solid var(--bordo); display:flex; align-items:center; justify-content:center; font-size:12px; flex-shrink:0; }
.check-on .box { background:var(--verde); border-color:var(--verde); color:#0F1114; }
.check-on .body { color:var(--bronzo); text-decoration:line-through; }

.btn { width:100%; padding:14px; border-radius:13px; font-size:15px; font-weight:600; margin-top:12px; min-height:48px; }
.btn-primary { background:var(--piastra); color:#fff; }
.btn-primary:active { background:#B8262F; }
.btn-corsa { background:var(--corsa); color:#04212C; }
.btn-corsa:active { background:#2AA5CB; }
.btn-log { background:var(--gesso); color:var(--nero); display:flex; flex-direction:column; gap:3px; padding:16px; font-family:'Big Shoulders Display',sans-serif; font-size:23px; font-weight:800; letter-spacing:.03em; text-transform:uppercase; box-shadow:0 0 34px rgba(247,245,240,.09); }
.btn-log:active { background:#D9D5CB; }
.btn-sub { font-family:'Space Mono',monospace; font-size:11px; font-weight:400; letter-spacing:0; text-transform:none; opacity:.6; }
.btn-line { border:1px solid var(--bordo); }
.btn-next { border-color:var(--verde); color:var(--verde); }
.btn-ghost { border:1px solid transparent; color:var(--bronzo); font-weight:500; margin-top:4px; }
.btn-danger { background:var(--piastra); color:#fff; }
.btn-oro { background:var(--ambra); color:#241800; }
.btn-inline { width:auto; margin-top:0; padding:9px 15px; font-size:13px; flex-shrink:0; min-height:0; }
.doneline { font-size:11.5px; color:var(--verde); margin:14px 0 0; }

/* scorciatoie della home: due tap dall'apertura all'allenamento avviato */
.scorciatoie { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.scorc { display:flex; flex-direction:column; align-items:flex-start; gap:3px; padding:15px; border-radius:16px; border:1px solid var(--bordo); background:var(--ghisa); min-height:76px; }
.scorc-ic { font-size:15px; line-height:1; }
.scorc-t { font-family:'Big Shoulders Display',sans-serif; font-size:21px; font-weight:700; text-transform:uppercase; letter-spacing:.02em; }
.scorc-s { font-size:10.5px; color:var(--bronzo); }
.scorc.forza { border-color:#43222A; } .scorc.forza .scorc-ic { color:var(--forza); }
.scorc.corsa { border-color:#1B4657; } .scorc.corsa .scorc-ic { color:var(--corsa); }

.select { width:100%; margin-top:11px; padding:11px; border-radius:11px; background:var(--fondo); border:1px solid var(--bordo); color:var(--gesso); font-family:'Space Grotesk',sans-serif; font-size:13.5px; }
.chart { margin-top:12px; }
.caret { font-size:22px; color:var(--bronzo); line-height:1; margin-left:8px; }

/* recupero */
.rest { position:absolute; left:0; right:0; bottom:calc(58px + env(safe-area-inset-bottom)); background:var(--alto); border-top:1px solid var(--bordo); overflow:hidden; }
.rest-drain { position:absolute; top:0; left:0; height:100%; background:rgba(255,45,62,.16); transition:width 250ms linear; }
.rest-over .rest-drain { background:rgba(255,45,62,.3); width:100% !important; }
.rest-in { position:relative; display:flex; align-items:center; justify-content:space-between; gap:12px; padding:11px 16px; }
.rest-clock { font-size:27px; font-weight:700; margin:0; line-height:1; }
.rest-over .rest-clock { color:var(--piastra); }
.rest-actions { display:flex; gap:6px; flex-wrap:wrap; justify-content:flex-end; }
.chip { font-size:12px; padding:8px 11px; border-radius:999px; border:1px solid var(--bordo); color:var(--bronzo); }
.chip-on { background:var(--gesso); color:var(--nero); border-color:var(--gesso); }
.chip-on.chip-corsa { background:var(--corsa); border-color:var(--corsa); color:#04212C; }
.chip-x { color:var(--bronzo); padding:8px 12px; }

/* fogli modali */
.sheet { position:absolute; inset:0; background:rgba(12,13,16,.86); display:flex; align-items:flex-end; z-index:20; }
.sheet-in { width:100%; max-height:92%; overflow-y:auto; background:var(--ghisa); border-top:2px solid var(--piastra); border-radius:20px 20px 0 0; padding:20px 18px 26px; }
.sheet-in.corsa { border-top-color:var(--corsa); }
.sheet-in.oro { border-top-color:var(--ambra); }
.sheet-piena { align-items:stretch; }
.sheet-piena .sheet-in { max-height:100%; border-radius:0; border-top:none; padding-top:16px; }
.record-line { font-size:12.5px; color:var(--ambra); margin:14px 0 0; }
.feelrow { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-top:9px; }
.feel { padding:12px 6px; border-radius:11px; border:1px solid var(--bordo); font-size:12px; color:var(--bronzo); min-height:48px; }
.feel-on.feel-verde { border-color:var(--verde); color:var(--verde); background:rgba(63,211,124,.12); }
.feel-on.feel-ambra { border-color:var(--ambra); color:var(--ambra); background:rgba(255,182,39,.12); }
.feel-on.feel-piastra { border-color:var(--piastra); color:var(--piastra); background:rgba(255,45,62,.12); }

/* scale a quattro gradini: energia all'apertura, soddisfazione a fine seduta */
.moodrow { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-top:9px; }
.mood { display:flex; flex-direction:column; align-items:center; gap:6px; padding:11px 3px; border-radius:11px; border:1px solid var(--bordo); font-size:10px; line-height:1.2; text-align:center; color:var(--bronzo); min-height:48px; }
.mood:active { background:var(--alto); }
.mood-emoji { font-size:27px; line-height:1; }
.mood-on.mood-verde { border-color:var(--verde); color:var(--verde); background:rgba(63,211,124,.12); }
.mood-on.mood-ambra { border-color:var(--ambra); color:var(--ambra); background:rgba(255,182,39,.12); }
.mood-on.mood-piastra { border-color:var(--piastra); color:var(--piastra); background:rgba(255,45,62,.12); }
.sat-emoji { font-size:17px; margin-right:7px; vertical-align:middle; }
.stat-emoji { font-size:19px; margin-right:6px; vertical-align:-1px; }

/* RPE: cinque gradini, è il moltiplicatore del carico */
.rperow { display:grid; grid-template-columns:repeat(5,1fr); gap:6px; margin-top:9px; }
.rpe { display:flex; flex-direction:column; align-items:center; gap:4px; padding:10px 2px; border-radius:11px; border:1px solid var(--bordo); color:var(--bronzo); min-height:48px; }
.rpe-n { font-family:'Space Mono',monospace; font-size:17px; font-weight:700; }
.rpe-l { font-size:9px; line-height:1.15; text-align:center; }
.rpe-on.rpe-verde { border-color:var(--verde); color:var(--verde); background:rgba(63,211,124,.12); }
.rpe-on.rpe-ambra { border-color:var(--ambra); color:var(--ambra); background:rgba(255,182,39,.12); }
.rpe-on.rpe-piastra { border-color:var(--piastra); color:var(--piastra); background:rgba(255,45,62,.12); }
.rpe-nota { font-size:11px; color:var(--bronzo); margin:8px 2px 0; min-height:16px; }

/* inserimento della corsa: un dato per schermata, il numero è il protagonista */
.bigstat { text-align:center; padding:6px 0 2px; }
.bigstat-n { font-family:'Space Mono',monospace; font-size:52px; font-weight:700; line-height:1; letter-spacing:-.04em; font-variant-numeric:tabular-nums; }
.bigstat-u { font-size:12px; color:var(--bronzo); letter-spacing:.14em; text-transform:uppercase; margin-top:6px; }
.derivato { display:flex; align-items:baseline; justify-content:center; gap:8px; margin-top:12px; padding-top:12px; border-top:1px solid var(--bordo); }
.derivato-n { font-family:'Space Mono',monospace; font-size:26px; font-weight:700; color:var(--corsa); }
.opzionali { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-top:11px; }
.mini-field { border:1px solid var(--bordo); border-radius:11px; background:var(--fondo); padding:9px 8px; }
/* il <label> è il contenitore, l'etichetta è lo span dentro */
.mini-field > span { display:block; font-family:'Space Mono',monospace; font-size:9px; letter-spacing:.14em; text-transform:uppercase; color:var(--bronzo); margin-bottom:4px; line-height:1.3; }
.mini-field input { width:100%; background:none; border:none; color:var(--gesso); font-family:'Space Mono',monospace; font-size:16px; font-weight:700; padding:0; }
.mini-field input:focus { outline:none; }
.nota-field { width:100%; margin-top:11px; padding:11px; border-radius:11px; background:var(--fondo); border:1px solid var(--bordo); color:var(--gesso); font-family:'Space Grotesk',sans-serif; font-size:13.5px; resize:none; }
.nota-field:focus { outline:none; border-color:var(--corsa); }

/* storico: una sola linea del tempo, corsa e forza mescolate */
.filtri { display:flex; gap:6px; flex-wrap:wrap; }
.tl { display:flex; flex-direction:column; gap:0; }
.tl-item { display:grid; grid-template-columns:26px 1fr; gap:10px; }
.tl-gutter { position:relative; display:flex; justify-content:center; padding-top:20px; }
.tl-line { position:absolute; top:0; bottom:0; width:1px; background:var(--bordo); }
.tl-dot { position:relative; width:11px; height:11px; border-radius:50%; border:2px solid var(--nero); flex-shrink:0; }
.tl-card { flex:1; margin-bottom:12px; }
.tl-mese { font-family:'Space Mono',monospace; font-size:9.5px; letter-spacing:.18em; text-transform:uppercase; color:var(--bronzo); margin:6px 0 8px 36px; }
.tl-open { border-color:var(--bronzo); }
.dettaglio { view-transition-name:dettaglio; }

/* carico settimanale */
.spark { display:flex; align-items:flex-end; gap:5px; height:44px; margin-top:12px; }
.spark-col { flex:1; border-radius:4px 4px 0 0; background:var(--bordo); min-height:3px; transition:height 300ms ease; }
.spark-col.on { background:var(--gesso); }
.spark-col.allarme { background:var(--ambra); }
.spark-lab { display:flex; gap:5px; margin-top:5px; }
.spark-lab span { flex:1; text-align:center; font-family:'Space Mono',monospace; font-size:8.5px; color:var(--spento); }
.avviso { display:flex; gap:9px; align-items:flex-start; border:1px solid var(--ambra); background:rgba(255,182,39,.09); border-radius:12px; padding:11px 12px; margin-top:12px; }
.avviso-ic { color:var(--ambra); font-size:15px; line-height:1.2; }
.avviso p { font-size:12px; margin:0; line-height:1.45; }

/* confronto con la volta prima */
.delta { display:flex; align-items:center; gap:8px; font-size:13px; padding:7px 0; border-bottom:1px solid var(--bordo); }
.delta:last-child { border-bottom:none; }
.delta-ic { width:16px; text-align:center; flex-shrink:0; font-size:11px; }
.delta-su .delta-ic { color:var(--verde); }
.delta-giu .delta-ic { color:var(--piastra); }
.delta-pari .delta-ic { color:var(--bronzo); }

/* record: una schermata sua, non una riga in una lista */
.trofeo { text-align:center; padding:22px 0 6px; }
.trofeo-em { font-size:64px; line-height:1; animation:pulsa 900ms ease-out 2; }
.trofeo-t { font-family:'Big Shoulders Display',sans-serif; font-size:44px; font-weight:800; text-transform:uppercase; letter-spacing:.05em; color:var(--ambra); margin:10px 0 2px; line-height:.95; }
.rec-card { border:1px solid var(--ambra); background:rgba(255,182,39,.07); border-radius:14px; padding:13px 15px; margin-top:10px; }
.rec-v { font-family:'Space Mono',monospace; font-size:25px; font-weight:700; color:var(--ambra); line-height:1.1; }
.rec-p { font-size:11px; color:var(--bronzo); margin-top:2px; }
@keyframes pulsa { 0%{transform:scale(.8);opacity:.4} 55%{transform:scale(1.06)} 100%{transform:scale(1);opacity:1} }

/* onboarding */
.onboard { width:100%; max-width:340px; padding:0 24px; }
.field { width:100%; margin-top:12px; padding:14px; border-radius:12px; background:var(--fondo); border:1px solid var(--bordo); color:var(--gesso); font-family:'Space Grotesk',sans-serif; font-size:17px; }
.field:focus { outline:none; border-color:var(--piastra); }

/* calendario della scheda Dati */
.cal-head { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:12px; }
.cal-head .h3 { margin:0; }
.cal-nav { width:38px; height:38px; border-radius:10px; border:1px solid var(--bordo); font-size:20px; color:var(--bronzo); line-height:1; }
.cal-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:5px; }
.cal-dows { margin-bottom:6px; }
.cal-dow { text-align:center; font-family:'Space Mono',monospace; font-size:9.5px; letter-spacing:.1em; text-transform:uppercase; color:var(--bronzo); }
.cal-empty { aspect-ratio:1; }
.cal-day { position:relative; aspect-ratio:1; display:flex; align-items:center; justify-content:center; border-radius:9px; border:1px solid var(--bordo); font-size:12.5px; color:var(--bronzo); padding:0; overflow:hidden; }
.cal-day:disabled { opacity:1; border-color:transparent; color:var(--spento); }
.cal-forza { background:var(--forza); border-color:var(--forza); color:#fff; font-weight:700; }
.cal-corsa { background:var(--corsa); border-color:var(--corsa); color:#04212C; font-weight:700; }
.cal-both { background:linear-gradient(135deg,var(--corsa) 50%,var(--forza) 50%); border-color:var(--forza); color:#fff; font-weight:700; }
.cal-today { box-shadow:inset 0 0 0 2px var(--gesso); }
.cal-open { outline:2px solid var(--gesso); outline-offset:2px; }
.cal-legend { display:flex; align-items:center; gap:7px; margin-top:13px; font-size:10.5px; color:var(--bronzo); flex-wrap:wrap; }
.cal-key { width:11px; height:11px; border-radius:4px; flex-shrink:0; margin-left:6px; }
.cal-legend .cal-key:first-child { margin-left:0; }
.cal-detail { margin-top:15px; padding-top:14px; border-top:1px solid var(--bordo); }

.flash { position:absolute; inset:0; pointer-events:none; box-shadow:inset 0 0 0 3px var(--gesso); opacity:.5; animation:fade 700ms ease forwards; z-index:15; }
.flash-record { box-shadow:inset 0 0 0 3px var(--ambra); display:flex; align-items:center; justify-content:center; font-family:'Big Shoulders Display',sans-serif; font-size:52px; font-weight:800; color:var(--ambra); letter-spacing:.06em; text-transform:uppercase; animation:fade 1600ms ease forwards; }
@keyframes fade { 0%{opacity:.9} 70%{opacity:.6} 100%{opacity:0} }

.toast { position:absolute; left:16px; right:16px; bottom:130px; background:var(--piastra); color:#fff; padding:12px; border-radius:11px; font-size:12.5px; z-index:25; }
.toast-ok { background:var(--verde); color:#0F1114; }

.tabbar { position:absolute; bottom:0; left:0; right:0; height:calc(58px + env(safe-area-inset-bottom)); padding-bottom:env(safe-area-inset-bottom); display:flex; border-top:1px solid var(--bordo); background:var(--nero); }
.tab { flex:1; font-size:11px; letter-spacing:.04em; text-transform:uppercase; color:var(--bronzo); font-weight:500; border-top:2px solid transparent; position:relative; }
.tab-on { color:var(--gesso); border-top-color:var(--piastra); }
.live { position:absolute; top:12px; right:14px; width:6px; height:6px; border-radius:50%; background:var(--piastra); }

/* nessuna animazione se il telefono chiede di ridurre il movimento */
@media (prefers-reduced-motion:reduce) {
  .root *,.root *::after { transition:none !important; animation:none !important; }
  ::view-transition-group(*),::view-transition-old(*),::view-transition-new(*) { animation:none !important; }
}
::view-transition-old(dettaglio),::view-transition-new(dettaglio) { animation-duration:240ms; }
`}</style>
  );
}
