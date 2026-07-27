"use strict";
/* ═══════════════════════════════════════════════════════════════════════════
   comping — tests de la calibration de latence et de l'intégrité du fichier
   SPEC-MESURE.md v0.4 · §2 (procédure, rejet, stockage) et §13 test 9

   Les fonctions pures ne sont pas recopiées ici : elles sont EXTRAITES de
   index.html à l'exécution. Une copie dériverait ; un extrait ne peut pas.

   Usage :  node tests/calibration-tests.js
   ═══════════════════════════════════════════════════════════════════════════ */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const RACINE = path.join(__dirname, "..");
const CHEMIN = fs.existsSync(path.join(RACINE, "index.html"))
  ? path.join(RACINE, "index.html")
  : path.join(RACINE, "comping-index.html");
const HTML = fs.readFileSync(CHEMIN, "utf8");

/* ── extraction du bloc de fonctions pures ────────────────────────────────── */
const DEBUT = "/* ── fonctions pures, testables sous Node ─";
const FIN = "/* Empreinte d'appareil";
const i0 = HTML.indexOf(DEBUT), i1 = HTML.indexOf(FIN);
if (i0 < 0 || i1 < 0 || i1 < i0) {
  console.error("bloc de fonctions pures introuvable dans " + path.basename(CHEMIN) +
    " — les marqueurs de section ont bougé.");
  process.exit(2);
}
const bac = { module: {}, console: console };
vm.createContext(bac);
vm.runInContext(HTML.slice(i0, i1) +
  "\nmodule.exports={mediane,quantile,interquartile,apparier,verdictCalibration,arrondi1};", bac);
const M = bac.module.exports;

/* ── harnais ──────────────────────────────────────────────────────────────── */
let passes = 0, echecs = 0;
const ligne = [];
function test(nom, fn) {
  try { fn(); passes++; ligne.push("  ok   " + nom); }
  catch (e) { echecs++; ligne.push("  ÉCHEC " + nom + "\n         " + e.message); }
}
function vrai(c, m) { if (!c) throw new Error(m || "attendu vrai"); }
function egal(a, b, m) {
  if (a !== b) throw new Error((m || "") + " attendu " + JSON.stringify(b) + ", obtenu " + JSON.stringify(a));
}
function proche(a, b, tol, m) {
  if (!(Math.abs(a - b) <= tol)) throw new Error((m || "") + " attendu " + b + " ± " + tol + ", obtenu " + a);
}

/* ═══ statistiques robustes ════════════════════════════════════════════════ */
test("médiane — effectif impair et pair", () => {
  proche(M.mediane([3, 1, 2]), 2, 0);
  proche(M.mediane([4, 1, 3, 2]), 2.5, 0);
  egal(M.mediane([]), null, "série vide :");
});
test("écart interquartile — convention d'interpolation linéaire", () => {
  proche(M.interquartile([1, 2, 3, 4, 5]), 2, 1e-9, "Q3−Q1 sur 1..5 :");
  proche(M.quantile([1, 2, 3, 4], 0.5), 2.5, 1e-9, "médiane par quantile :");
});
test("l'écart interquartile encaisse un clic aberrant, l'écart-type non", () => {
  const propre = [180, 182, 181, 183, 179, 181, 180, 182];
  const souille = propre.concat([640]); // un coup de talon, une porte
  proche(M.interquartile(souille), M.interquartile(propre), 1.5,
    "IQR quasi inchangé malgré l'aberration :");
});

/* ═══ appariement clic programmé → clic entendu (§2.1) ═════════════════════ */
test("appariement — une détection ne sert qu'une fois", () => {
  const prog = [1.0, 2.0, 3.0];
  const det = [1.187, 2.190, 3.185];
  const a = M.apparier(prog, det);
  egal(a.paires.length, 3, "trois clics appariés :");
  proche(a.paires[0].delta_ms, 187, 0.001, "δ₀ :");
  proche(a.paires[2].delta_ms, 185, 0.001, "δ₂ :");
  egal(a.support, 3, "les trois clics portent le consensus :");
});
test("résonance : les redéclenchements du même clic sont ignorés", () => {
  // Un clic au haut-parleur produit souvent 2 ou 3 détections (point ouvert f,
  // tranché : redéclenchement sur la résonance, pas balayage). L'attaque est
  // la détection la plus proche du consensus — ici la première, les
  // redéclenchements arrivant après elle.
  const prog = [1.0, 2.0];
  const det = [1.187, 1.252, 1.310, 2.190, 2.249];
  const a = M.apparier(prog, det);
  egal(a.paires.length, 2, "deux clics, pas cinq :");
  proche(a.paires[0].t_det, 1.187, 1e-9, "l'attaque l'emporte sur sa résonance :");
  proche(a.paires[1].t_det, 2.190, 1e-9);
});
test("clic manqué : le suivant ne se décale pas d'un cran", () => {
  const prog = [1.0, 2.0, 3.0];
  const det = [1.187, 3.185];               // le clic 2 n'a pas été entendu
  const a = M.apparier(prog, det);
  egal(a.paires.length, 2, "deux appariements :");
  egal(a.paires[1].k, 2, "la détection tardive va bien au clic 3, pas au clic 2 :");
  proche(a.paires[1].delta_ms, 185, 0.001);
});
test("hors fenêtre : une détection très en retard n'est pas appariée", () => {
  const a = M.apparier([1.0], [1.700]);     // 700 ms, au-delà des 500 ms admis
  egal(a.paires.length, 0);
  egal(a.consensus_ms, null, "pas de candidat, pas de consensus :");
});
test("une détection légèrement en avance reste admise (jusqu'à 50 ms)", () => {
  egal(M.apparier([1.0], [0.970]).paires.length, 1, "−30 ms :");
  egal(M.apparier([1.0], [0.930]).paires.length, 0, "−70 ms :");
});
test("§2.5 · consensus — un bruit AVANT l'arrivée du clic ne vole plus l'appariement", () => {
  // Le cas qui a causé six refus : la première détection de la fenêtre est
  // un bruit, la vraie arrivée est à +200 ms. L'appariement glouton prenait
  // le bruit ; le consensus prend ce sur quoi les clics s'accordent.
  const prog = [10.0, 11.0, 12.0];
  const det = [9.970, 10.200, 11.200, 11.960, 12.200];
  const a = M.apparier(prog, det);
  proche(a.consensus_ms, 200, 0.001, "consensus :");
  egal(a.support, 3);
  egal(a.paires.length, 3, "les trois clics appariés :");
  for (const p of a.paires) proche(p.delta_ms, 200, 0.001, "clic " + p.k + " :");
});
test("§2.5 · un clic dont l'arrivée est masquée reste non apparié, sans fausser les autres", () => {
  const prog = [10.0, 11.0, 12.0];
  const det = [10.200, 11.155, 12.200];     // clic 1 : bruit à +155, arrivée avalée
  const a = M.apparier(prog, det);
  egal(a.paires.length, 2, "deux appariés :");
  egal(a.paires[0].k, 0); egal(a.paires[1].k, 2);
  proche(a.consensus_ms, 200, 0.001, "le bruit à +155 ne déplace pas le consensus :");
});
test("§2.5 · fixture terrain — la session refusée du 27 devient acceptable", () => {
  // Sixième refus : 136 détections brutes, IQR glouton 193,8 ms. Dessous,
  // 21 clics à +197…+203 ms. Le consensus doit les retrouver, et le verdict
  // du §2.1 point 5, inchangé, doit accepter.
  const f = JSON.parse(fs.readFileSync(
    path.join(__dirname, "fixtures", "calibration-2026-07-27-refus.json"), "utf8"));
  const a = M.apparier(f.programmes_s, f.detections_s);
  proche(a.consensus_ms, f.attendu_consensus.consensus_ms, 0.6, "consensus :");
  egal(a.support, f.attendu_consensus.support, "support :");
  egal(a.paires.length, f.attendu_consensus.apparies, "appariés :");
  const sans = [];
  const vus = new Set(a.paires.map(p => p.k));
  for (let k = 0; k < f.n_clics; k++) if (!vus.has(k)) sans.push(k);
  egal(JSON.stringify(sans), JSON.stringify(f.attendu_consensus.non_apparies),
    "clics masqués par le réfractaire :");
  const v = M.verdictCalibration(a.paires.map(p => p.delta_ms));
  egal(v.ok, true, "verdict :");
  proche(v.latence_ms, f.attendu_consensus.latence_ms, 0.6, "latence :");
  proche(v.dispersion_ms, f.attendu_consensus.dispersion_ms, 0.6, "dispersion :");
});

/* ═══ verdict et conditions de rejet (§2.1 point 5) ════════════════════════ */
function deltasPropres(n, base, pas) {
  const v = [];
  for (let i = 0; i < n; i++) v.push(base + ((i % 4) - 1.5) * (pas || 2));
  return v;
}
test("verdict — 24 clics réguliers : accepté, latence = médiane", () => {
  const v = M.verdictCalibration(deltasPropres(24, 187, 2));
  egal(v.ok, true, "accepté :");
  egal(v.n, 24);
  proche(v.latence_ms, 187, 0.01, "latence :");
  vrai(v.dispersion_ms <= 15, "dispersion sous le seuil");
});
test("verdict — 19 clics entendus : rejeté, motif « clics »", () => {
  const v = M.verdictCalibration(deltasPropres(19, 187, 2));
  egal(v.ok, false, "rejeté :");
  egal(v.motif, "clics", "motif :");
  vrai(/19/.test(v.texte), "le message dit combien de clics ont été entendus");
});
test("verdict — 20 clics : la borne est inclusive", () => {
  egal(M.verdictCalibration(deltasPropres(20, 187, 2)).ok, true);
});
test("verdict — dispersion de 40 ms : rejeté, motif « dispersion »", () => {
  const v = M.verdictCalibration([160, 170, 180, 190, 200, 210, 220, 230, 240, 250,
    160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 165, 175, 185, 195]);
  egal(v.ok, false, "rejeté :");
  egal(v.motif, "dispersion", "motif :");
  vrai(!("latence_ms" in v), "aucune latence n'est proposée sur un rejet");
});
test("verdict — un rejet ne renvoie jamais de valeur enregistrable", () => {
  const v = M.verdictCalibration(deltasPropres(5, 187, 2));
  egal(v.ok, false);
  egal(v.latence_ms, undefined, "rien à enregistrer :");
});
test("verdict — latence négative impossible à confondre avec un défaut", () => {
  // δ ne peut être négatif que si le micro entend avant l'émission programmée :
  // physiquement exclu, mais la fonction ne doit pas planter pour autant.
  const v = M.verdictCalibration(deltasPropres(24, -3, 1));
  egal(v.ok, true, "la fonction reste totale :");
  vrai(v.latence_ms < 0, "et rend la valeur telle quelle, au consommateur d'en juger");
});

/* ═══ §13 test 9 — intégrité du fichier ════════════════════════════════════ */
test("test 9 · les deux scripts sont syntaxiquement valides", () => {
  const principal = HTML.match(/<script>\n([\s\S]*?)\n<\/script>/);
  vrai(!!principal, "script principal introuvable");
  new vm.Script(principal[1], { filename: "index.html:principal" });
  const worklet = HTML.match(/<script id="src-detecteur" type="text\/plain">\n([\s\S]*?)<\/script>/);
  vrai(!!worklet, "worklet introuvable");
  new vm.Script(worklet[1], { filename: "index.html:worklet" });
});
test("test 9 · toute référence DOM a son élément", () => {
  const ids = new Set((HTML.match(/id="([^"]+)"/g) || []).map(s => s.slice(4, -1)));
  const refs = new Set();
  (HTML.match(/\$\("#([A-Za-z0-9_-]+)"\)/g) || []).forEach(s => refs.add(s.slice(4, -2)));
  (HTML.match(/getElementById\("([^"]+)"\)/g) || []).forEach(s => refs.add(s.slice(16, -2)));
  const orphelines = [...refs].filter(r => !ids.has(r));
  egal(orphelines.length, 0, "références sans élément : " + orphelines.join(", ") + " —");
});
test("test 9 · le worklet embarqué est celui de v1.5, non retouché", () => {
  const w = HTML.match(/<script id="src-detecteur" type="text\/plain">\n([\s\S]*?)<\/script>/)[1];
  vrai(w.startsWith("class DetecteurAttaque extends AudioWorkletProcessor"), "en-tête du worklet");
  vrai(/registerProcessor\('detecteur-attaque', DetecteurAttaque\);/.test(w), "enregistrement du processeur");
  vrai(/this\.N = o\.N \|\| 1024/.test(w), "N = 1024");
  vrai(/this\.HOP = o\.HOP \|\| 256/.test(w), "HOP = 256");
  vrai(/Math\.pow\(10, -58\/20\)/.test(w), "porte à −58 dBFS");
  vrai(/0\.45 \* sampleRate/.test(w), "échauffement 0,45 s");
});
test("test 9 · la calibration émet le clic de travail, pas un autre timbre", () => {
  vrai(/emettreClic\(t,900,0\.18,"square",0\.055\)/.test(HTML),
    "le clic de calibration doit reprendre les paramètres du clic non accentué");
  vrai(/function emettreClic\(/.test(HTML), "synthèse partagée");
});
test("test 9 · les deux paramètres du §3.0 sont distincts et non exposés", () => {
  vrai(/const ECART_MIN_MS\s*=\s*55/.test(HTML), "réfractaire du détecteur :");
  vrai(/MIN_IOI_MS:30/.test(HTML), "réfractaire abaissé à 30 ms pendant la calibration (§2.5) :");
  vrai(/const FUSION_MS\s*=\s*120/.test(HTML), "regroupement en gestes :");
  const htmlSeul = HTML.split("<script>")[0];
  vrai(!/ecart_min|fusion_ms|ECART_MIN|FUSION_MS/i.test(htmlSeul),
    "aucun des deux ne doit apparaître dans l'interface");
});
test("test 9 · le registre de calibration est indexé par appareil (§2.2)", () => {
  vrai(/calibration:\{\}/.test(HTML), "état neuf :");
  vrai(/S\.calibration\[empreinteAppareil\(\)\]\s*=\s*\{/.test(HTML), "écriture indexée :");
  vrai(/latence_ms:.*dispersion_ms:.*n:v\.n, date:aujourdhui\(\), sr:ctx\.sampleRate/s.test(HTML),
    "les cinq champs du §2.2 :");
});

console.log(ligne.join("\n"));
console.log("\n" + passes + " passés, " + echecs + " échoués.");
process.exit(echecs ? 1 : 0);
