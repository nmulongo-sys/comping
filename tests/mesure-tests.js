"use strict";
/* ═══════════════════════════════════════════════════════════════════════════
   comping — tests d'acceptation des fonctions pures du moteur de mesure
   SPEC-MESURE.md v0.3 · §13 tests 2 (partiel), 3, 4, 5, 8 + §10.3 et §10.5

   Écrits AVANT le code, conformément au §13. Ils ne dépendent ni du worklet,
   ni du navigateur, ni d'un AudioContext.

   Usage :  node tests/mesure-tests.js
   Le module testé est extrait de comping/index.html aux étapes 3 à 5 du §14 et
   exporté en CommonJS sous tests/mesure-pur.js. Tant qu'il n'existe pas, la
   suite affiche le contrat d'API attendu et sort en code 2.
   ═══════════════════════════════════════════════════════════════════════════ */

const fs = require("fs");
const path = require("path");

/* ── contrat d'API attendu ─────────────────────────────────────────────────
   regrouper(detections, fusionMs)
       detections : [{temps_s, intensite_db}] triées croissant
       → [{temps_s, detections, etalement_ms, intensite_db}]
       Le second paramètre est fusion_ms (§3.0), PAS le réfractaire
       ecart_min_ms — la première rédaction de ce contrat les confondait.
       Règle relevée dans analyse-attaque v1.5, fonction regrouper() :
         · un groupe s'ouvre sur une détection (le « chef ») ;
         · une détection est absorbée si elle est à ≤ fusionMs de la DERNIÈRE
           du groupe ET à ≤ 2,5 × fusionMs du chef ; sinon elle ouvre ;
         · temps_s      = celui du chef ;
         · etalement_ms = dernier − premier ;
         · intensite_db = MAXIMUM du groupe, PAS celle du chef.

   pasGrille(bpm, subdivision)        → s   (subdivision : 1 noires, 2 croches…)
   pasClic(bpm, echelon, tempsParMesure) → s | null   (§7, null aux échelons 4 et 5)
   fen(pasGrilleMs, opts)             → ms  opts {FEN_RELATIVE, COEF_FEN, PLANCHER_FEN}
   stats(gestes, {ancre_s, pas_grille_s})
       → {n, R, p, biais_ms, sigma_grille_ms, sigma_locale_ms, rho, pct_cible}
   concluante(st, {tempo_regle, tempo_joue}) → {ok, motif}
   noteProposee(st, historique)       → {note|null, plafonnee, discordante, motif}
       note ∈ "debuts" | "progres" | "bien" | "acquis" | null
   echelonDepart(bpm)                 → 0 | 1
   memeQuadruplet(a, b)               → bool
   ────────────────────────────────────────────────────────────────────────── */

const CHEMIN_MODULE = path.join(__dirname, "mesure-pur.js");
if (!fs.existsSync(CHEMIN_MODULE)) {
  console.error("tests/mesure-pur.js absent — module pas encore extrait de index.html.");
  console.error("Contrat d'API attendu : voir l'en-tête de ce fichier.");
  process.exit(2);
}
const M = require(CHEMIN_MODULE);

/* ── harnais minimal ──────────────────────────────────────────────────────── */
let passes = 0, echecs = 0;
const ligne = [];
function test(nom, fn) {
  try { fn(); passes++; ligne.push("  ok   " + nom); }
  catch (e) { echecs++; ligne.push("  ÉCHEC " + nom + "\n         " + e.message); }
}
function vrai(cond, msg) { if (!cond) throw new Error(msg || "attendu vrai"); }
function egal(a, b, msg) {
  if (a !== b) throw new Error((msg || "") + " attendu " + JSON.stringify(b) + ", obtenu " + JSON.stringify(a));
}
function proche(a, b, tol, msg) {
  if (!(Math.abs(a - b) <= tol)) throw new Error((msg || "") + " attendu " + b + " ± " + tol + ", obtenu " + a);
}
function dans(a, min, max, msg) {
  if (!(a >= min && a <= max)) throw new Error((msg || "") + " attendu dans [" + min + ", " + max + "], obtenu " + a);
}

/* ── générateur de gestes synthétiques ─────────────────────────────────────
   Phase gaussienne d'écart-type sigma_ms autour de la grille, générateur
   déterministe (Box-Muller sur un LCG) : la suite est reproductible.        */
function alea(graine) {
  let s = graine >>> 0;
  return () => { s = (1664525 * s + 1013904223) >>> 0; return s / 4294967296; };
}
function gestesSynthetiques({ n, pas_s, sigma_ms, biais_ms = 0, ancre_s = 10, graine = 7 }) {
  const r = alea(graine), out = [];
  for (let i = 0; i < n; i++) {
    const u1 = Math.max(r(), 1e-12), u2 = r();
    const g = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const dev = (biais_ms + g * sigma_ms) / 1000;
    out.push({ temps_s: ancre_s + i * pas_s + dev, detections: 1, etalement_ms: 0, intensite_db: -10 });
  }
  return out;
}

/* ═══ T2 (partiel) — regroupement conforme à la sortie réelle v1.5 ═════════
   Le fichier de séance libre du 27 contient à la fois le flux de détections
   et les gestes tels que v1.5 les a produits : c'est une vérité terrain, pas
   une supposition. Attention : cette fixture ne discrimine PAS le chaînage
   (règle réelle et règle « depuis le chef » y donnent toutes deux 52/52) —
   d'où T2c et T2d, bâtis sur le code source. Le test complet du §13
   (293 détections → 162 gestes, cf. commentaire de regrouper()) exige
   protocole-2026-07-27-03-17-23.json, non fourni à ce jour.               */
const FIXTURE = path.join(__dirname, "fixtures", "attaques-2026-07-27-02-19-28.json");
test("T2 · regroupement — 82 détections réelles → les 52 gestes de v1.5", () => {
  const j = JSON.parse(fs.readFileSync(FIXTURE, "utf8"));
  const attendu = j.gestes, obtenu = M.regrouper(j.detections, j.reglages.fusion_ms);
  egal(obtenu.length, attendu.length, "nombre de gestes :");
  for (let i = 0; i < attendu.length; i++) {
    proche(obtenu[i].temps_s, attendu[i].temps_s, 1e-9, "geste " + i + " temps_s :");
    egal(obtenu[i].detections, attendu[i].detections, "geste " + i + " détections :");
    proche(obtenu[i].etalement_ms, attendu[i].etalement_ms, 0.15, "geste " + i + " étalement :");
    proche(obtenu[i].intensite_db, attendu[i].intensite_db, 1e-9, "geste " + i + " intensité :");
  }
});
test("T2b · l'intensité du geste est le maximum du groupe, pas celle du chef", () => {
  const g = M.regrouper([
    { temps_s: 1.000, intensite_db: -20 },
    { temps_s: 1.060, intensite_db: -6 }
  ], 120);
  egal(g.length, 1, "un seul geste :");
  proche(g[0].temps_s, 1.000, 1e-9, "le chef marque le temps :");
  proche(g[0].intensite_db, -6, 1e-9, "intensité = max du groupe :");
});
test("T2c · le chaînage est autorisé : l'écart se mesure depuis la DERNIÈRE détection du geste", () => {
  // Règle relevée dans analyse-attaque v1.5, fonction regrouper() :
  //   nouveau geste si  t − cur.tFin > fusion  OU  t − cur.t > 2,5 × fusion
  // Trois détections espacées de 100 ms à fusion = 120 ms : tout se chaîne.
  const g = M.regrouper([
    { temps_s: 0.000, intensite_db: -10 },
    { temps_s: 0.100, intensite_db: -10 },
    { temps_s: 0.200, intensite_db: -10 }
  ], 120);
  egal(g.length, 1, "chaînage autorisé sous le plafond :");
  egal(g[0].detections, 3);
  proche(g[0].etalement_ms, 200, 0.15, "étalement :");
});
test("T2d · plafond d'étalement à 2,5 × fusion : au-delà, le geste se referme", () => {
  // 0 / 100 / 200 / 300 / 400 ms à fusion = 120 ms → plafond 300 ms.
  // La 5ᵉ détection est à 100 ms de la précédente, mais à 400 ms du chef : elle ouvre.
  const g = M.regrouper([0, 0.1, 0.2, 0.3, 0.4].map(t => ({ temps_s: t, intensite_db: -10 })), 120);
  egal(g.length, 2, "le plafond coupe :");
  egal(g[0].detections, 4);
  egal(g[1].detections, 1);
  proche(g[1].temps_s, 0.4, 1e-9);
});

/* ═══ T3 — changement d'échelon en cours de carte ═══════════════════════════
   §13 test 3 : ancre et pas_grille inchangés, pas_clic seul modifié.       */
test("T3 · montée d'échelon : pas_grille et ancre inchangés, pas_clic seul bouge", () => {
  const bpm = 90, sub = 2, tpm = 4, ancre = 12.3456;
  const pg0 = M.pasGrille(bpm, sub), pc0 = M.pasClic(bpm, 0, tpm);
  const pg1 = M.pasGrille(bpm, sub), pc1 = M.pasClic(bpm, 1, tpm);
  proche(pg1, pg0, 1e-12, "pas_grille :");
  proche(pg0, 1 / 3, 1e-9, "croches à 90 bpm = 333 ms :");
  proche(pc0, pg0, 1e-12, "échelon 0 : le clic suit la grille :");
  proche(pc1, 60 / bpm, 1e-12, "échelon 1 : clic à la noire :");
  vrai(pc1 !== pc0, "pas_clic doit changer");
  proche(ancre, 12.3456, 0, "ancre :"); // l'ancre est publiée par l'ordonnanceur, pas recalculée
});
test("T3b · échelons 4 et 5 : plus de clic, la grille reste", () => {
  egal(M.pasClic(90, 4, 4), null, "échelon 4 (clic troué) n'a pas de pas de clic régulier :");
  egal(M.pasClic(90, 5, 4), null, "échelon 5 (sans clic) :");
  proche(M.pasGrille(90, 2), 1 / 3, 1e-9, "la grille d'évaluation survit au silence :");
});
test("T3c · échelon 3 (2 et 4 seuls) : pas_clic à la blanche", () => {
  proche(M.pasClic(90, 3, 4), 2 * 60 / 90, 1e-12);
});

/* ═══ T4 — cohérence FEN / σ ════════════════════════════════════════════════
   §13 test 4 : jeu synthétique à ρ = 6 % → % en cible dans [64 %, 72 %].
   σ = FEN pour une phase de loi normale enroulée ⇒ ≈ 68,3 %.
   Exige FEN_RELATIVE = true : avec ±25 ms figés le test ne veut rien dire.  */
const OPTS_FEN_REL = { FEN_RELATIVE: true, COEF_FEN: 0.06, PLANCHER_FEN: 12 };
/* ATTENTION — point de spec à trancher (§4.2 / §9.2).
   La relation « σ = FEN ⇒ ≈ 68 % en cible » vaut pour l'écart-type de la PHASE
   (dispersion des positions autour de la grille). ρ, lui, est bâti sur
   σ_locale = écart-type des INTERVALLES entre gestes successifs. Les deux ne
   coïncident que si les écarts successifs sont corrélés : pour des écarts
   indépendants, σ_IOI = √2 · σ_phase, et un ρ de 6 % donne ≈ 84 % en cible,
   pas 68 %. L'accord empirique observé le 27 (ρ = 6,4 % ↔ 67 %) implique donc
   un jeu à dérive dominante, pas à écarts indépendants.
   Tant que ce point n'est pas tranché, T4 porte sur la grandeur que la
   relation concerne réellement : le σ de phase. n = 2000 pour que le test soit
   décidé par la loi et non par le bruit d'échantillonnage (à n = 240, la
   fraction dans ±1σ fluctue entre 65 % et 73 % selon la graine). */
test("T4 · σ de phase = FEN → % en cible dans [64, 72]", () => {
  const pas = 1 / 3; // croches à 90 bpm, 333 ms
  const g = gestesSynthetiques({ n: 2000, pas_s: pas, sigma_ms: 0.06 * pas * 1000, graine: 11 });
  const st = M.stats(g, { ancre_s: 10, pas_grille_s: pas, fen: OPTS_FEN_REL });
  proche(st.sigma_grille_ms, M.fen(pas * 1000, OPTS_FEN_REL), 2.5, "σ de phase vs FEN :");
  dans(st.pct_cible, 64, 72, "% en cible :");
});
test("T4b · FEN relative : 6 % du pas, plancher à 12 ms", () => {
  proche(M.fen(1000, OPTS_FEN_REL), 60, 1e-9, "à 1000 ms :");
  proche(M.fen(333, OPTS_FEN_REL), 19.98, 0.01, "à 333 ms :");
  proche(M.fen(150, OPTS_FEN_REL), 12, 1e-9, "plancher sous 200 ms :");
});
test("T4c · FEN_RELATIVE = false conserve ±25 ms, quel que soit le pas", () => {
  const o = { FEN_RELATIVE: false, COEF_FEN: 0.06, PLANCHER_FEN: 12 };
  proche(M.fen(1000, o), 25, 1e-9);
  proche(M.fen(250, o), 25, 1e-9);
});
test("T4d · recentrage sur le biais (§4.3) : un biais > pas/2 ne crée pas de trous", () => {
  const pas = 1 / 3;
  const g = gestesSynthetiques({ n: 240, pas_s: pas, sigma_ms: 20, biais_ms: 215, graine: 3 });
  const st = M.stats(g, { ancre_s: 10, pas_grille_s: pas, fen: OPTS_FEN_REL });
  const gRef = gestesSynthetiques({ n: 240, pas_s: pas, sigma_ms: 20, biais_ms: 0, graine: 3 });
  const stRef = M.stats(gRef, { ancre_s: 10, pas_grille_s: pas, fen: OPTS_FEN_REL });
  proche(st.pct_cible, stRef.pct_cible, 3, "% en cible invariant par translation de phase :");
  proche(st.R, stRef.R, 0.02, "R invariant par translation de phase :");
});

/* ═══ T5 — tempo dérivant ═══════════════════════════════════════════════════
   §13 test 5 : mesure à tempo dérivant de 5 % → rejetée, motif « tempo »,
   aucune note proposée.                                                    */
test("T5 · tempo joué à +5 % → non concluante, motif tempo, aucune note", () => {
  const pas = 1 / 3;
  const g = gestesSynthetiques({ n: 90, pas_s: pas / 1.05, sigma_ms: 15, graine: 5 });
  const st = M.stats(g, { ancre_s: 10, pas_grille_s: pas, fen: OPTS_FEN_REL });
  const c = M.concluante(st, { tempo_regle: 90, tempo_joue: 94.5 });
  egal(c.ok, false, "concluante :");
  egal(c.motif, "tempo", "motif :");
  const n = M.noteProposee(st, { concluante: c, historique: [] });
  egal(n.note, null, "aucune note pré-cochée :");
});
test("T5b · tempo à 2,5 % passe le garde-fou (seuil à 3 %)", () => {
  const pas = 1 / 3;
  const g = gestesSynthetiques({ n: 90, pas_s: pas, sigma_ms: 15, graine: 5 });
  const st = M.stats(g, { ancre_s: 10, pas_grille_s: pas, fen: OPTS_FEN_REL });
  egal(M.concluante(st, { tempo_regle: 90, tempo_joue: 92.25 }).ok, true);
});
test("T5c · moins de 24 gestes → non concluante, motif gestes", () => {
  const pas = 1 / 3;
  const g = gestesSynthetiques({ n: 23, pas_s: pas, sigma_ms: 15, graine: 9 });
  const st = M.stats(g, { ancre_s: 10, pas_grille_s: pas, fen: OPTS_FEN_REL });
  const c = M.concluante(st, { tempo_regle: 90, tempo_joue: 90 });
  egal(c.ok, false, "concluante :");
  egal(c.motif, "gestes", "motif :");
});
test("T5d · §10.5 — une mesure non concluante ne retombe jamais sur « Débuts »", () => {
  const st = { n: 12, R: 0.1, p: 0.4, rho: 0.19, pct_cible: 30, sigma_locale_ms: 60 };
  const n = M.noteProposee(st, { concluante: { ok: false, motif: "rayleigh" }, historique: [] });
  egal(n.note, null, "note :");
  vrai(n.note !== "debuts", "« Débuts » est une note, pas un constat d'échec de mesure");
  vrai(!!n.motif, "le motif de rejet doit être exposé");
});

/* ═══ T8 — quadruplets ══════════════════════════════════════════════════════
   §13 test 8 : deux quadruplets différents dans l'historique → deux séries
   distinctes, jamais moyennées.                                            */
const Q = (t, s, r, so) => ({ tempo: t, subdivision: s, repere: r, soutien: so });
test("T8 · deux quadruplets différents ne sont jamais fusionnés", () => {
  const a = Q(88, "croches", "temps", 1), b = Q(88, "croches", "temps", 2);
  egal(M.memeQuadruplet(a, a), true, "identité :");
  egal(M.memeQuadruplet(a, b), false, "le soutien seul suffit à séparer :");
  egal(M.memeQuadruplet(a, Q(92, "croches", "temps", 1)), false, "tempo :");
  egal(M.memeQuadruplet(a, Q(88, "noires", "temps", 1)), false, "subdivision :");
  egal(M.memeQuadruplet(a, Q(88, "croches", "2et4", 1)), false, "repère :");
});
test("T8b · §10.3 — trois mesures à ρ ≤ 4,5 % au MÊME quadruplet lèvent le plafond", () => {
  const st = { n: 60, R: 0.8, p: 1e-9, rho: 0.03, pct_cible: 85, sigma_locale_ms: 10 };
  const ok = { ok: true, motif: null }, q = Q(88, "croches", "temps", 1);
  const trois = [
    { quadruplet: q, rho: 0.04, concluante: true },
    { quadruplet: q, rho: 0.03, concluante: true },
    { quadruplet: q, rho: 0.042, concluante: true }
  ];
  egal(M.noteProposee(st, { concluante: ok, quadruplet: q, historique: trois }).note, "acquis");
  const casse = [trois[0], { quadruplet: Q(88, "croches", "temps", 2), rho: 0.03, concluante: true }, trois[2]];
  const r = M.noteProposee(st, { concluante: ok, quadruplet: q, historique: casse });
  egal(r.note, "bien", "quadruplet rompu → plafond maintenu :");
  egal(r.plafonnee, true);
});
test("T8c · prise isolée excellente → plafonnée à « Bien » (§10.3)", () => {
  const st = { n: 60, R: 0.85, p: 1e-9, rho: 0.028, pct_cible: 88, sigma_locale_ms: 9 };
  const r = M.noteProposee(st, { concluante: { ok: true }, quadruplet: Q(88, "croches", "temps", 1), historique: [] });
  egal(r.note, "bien", "jamais « Acquis » sur une prise isolée :");
  egal(r.plafonnee, true);
});

/* ═══ Table de notation §10.2 — bornes ══════════════════════════════════════ */
test("§10.2 · bornes de la table de correspondance", () => {
  const base = { n: 60, R: 0.8, p: 1e-9, sigma_locale_ms: 20 };
  const q = Q(88, "croches", "temps", 1), c = { ok: true };
  const note = (rho, pct) => M.noteProposee(Object.assign({}, base, { rho: rho, pct_cible: pct }),
    { concluante: c, quadruplet: q, historique: [] }).note;
  egal(note(0.05, 74), "bien", "ρ = 5 % (jeu de référence) :");
  egal(note(0.07, 60), "progres", "ρ = 7 % :");
  egal(note(0.09, 50), "debuts", "ρ = 9 % :");
  egal(note(0.03, 85), "bien", "ρ = 3 % plafonné faute d'historique :");
});
test("§10.2b · lecture discordante : la plus basse des deux, et elle se dit", () => {
  const st = { n: 60, R: 0.8, p: 1e-9, rho: 0.03, pct_cible: 45, sigma_locale_ms: 10 };
  const r = M.noteProposee(st, { concluante: { ok: true }, quadruplet: Q(88, "croches", "temps", 1), historique: [] });
  egal(r.discordante, true, "discordance signalée :");
  egal(r.note, "debuts", "la plus basse des deux lectures :");
});

/* ═══ §7.1 — échelon de départ ══════════════════════════════════════════════ */
test("§7.1 · échelon de départ selon le tempo (seuils 76 et 132 bpm, provisoires)", () => {
  egal(M.echelonDepart(70), 0, "≤ 76 bpm :");
  egal(M.echelonDepart(76), 0, "borne basse incluse :");
  egal(M.echelonDepart(90), 1, "77–132 bpm :");
  egal(M.echelonDepart(132), 1, "borne haute incluse :");
  egal(M.echelonDepart(150), 1, "> 132 bpm :");
});

/* ── verdict ──────────────────────────────────────────────────────────────── */
console.log(ligne.join("\n"));
console.log("\n" + passes + " passés, " + echecs + " échoués.");
process.exit(echecs ? 1 : 0);
