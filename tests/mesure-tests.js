"use strict";
/* ═══════════════════════════════════════════════════════════════════════════
   comping — tests d'acceptation des fonctions pures du moteur de mesure
   SPEC-MESURE.md v0.10 · §13 tests 2 (partiel), 3, 4, 5, 8, 10 à 19
   + §10.2, §10.3, §10.5, §7.1

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
   pasClic(bpm, echelon, tempsParMesure, subdivision) → s | null
       §7.3. Renvoie null aux échelons 4 et 5 ; à l'échelon 0 quand la
       subdivision manque (plus de défaut silencieux — il était faux pour
       ar-triolets et ar-doubles, qui démarrent tous deux à l'échelon 0) ;
       et à l'échelon 3 dès 5 temps par mesure, où les clics sur 2 et 4 ne
       sont plus équidistants.
   fen(pasGrilleMs, opts)             → ms  opts {FEN_RELATIVE, COEF_FEN, PLANCHER_FEN}
   stats(gestes, {ancre_s, pas_grille_s})
       → {n, R, p, biais_ms, sigma_grille_ms, sigma_locale_ms, rho, pct_cible}
   concluante(st, {tempo_regle, tempo_joue}) → {ok, motif}
   noteProposee(st, historique)       → {note|null, plafonnee, discordante, motif}
       note ∈ "debuts" | "progres" | "bien" | "acquis" | null
   echelonDepart(bpm)                 → 0 | 1
   memeQuadruplet(a, b)               → bool
       §6.2 depuis la spec v0.10 : le tempo est comparé au PALIER de 4 bpm,
       plus à l'unité. Les trois autres termes restent comparés à l'identique.

   ── étape 7 du §14, spécifiées et pas encore écrites ────────────────────
   quadrupletDe(carte)                → {tempo, subdivision, repere, soutien} | null
       §6.1. tempo = carte.bpmTravail (jamais bpmCible) ; subdivision = table
       inverse de SUBDIVISIONS sur carte.preset.sub ; repere = carte.preset.repere
       tel quel ; soutien = echelonDe(carte.preset). null dès qu'un terme
       manque — jamais de quadruplet partiel.
   palierTempo(bpm)                   → Math.round(bpm/4)*4          §6.2
   echelonDe(preset)                  → 0..5                        §7.4
       Ordre NON commutatif : muet → 5, gap → 4, seuls24 → 3, accent24 → 2,
       sub > 1 → 0, sinon 1. Le repère se lit AVANT la subdivision.
   cycleInitial()                     → {phase:"presentation", …}   §8.1
   cycleMesure(etat, evt)             → etat'                       §8.1
       phase ∈ presentation | decompte | mesure | bilan | abandon
       etat  {phase, mesure0, ancre, gestes, fin, motif}
       evt   {type:"demarrer"}
             {type:"clic", mesure, temps, sub, t}
             {type:"geste", t}
             {type:"horloge", t}
             {type:"arret"}
       Transition TOTALE : un évènement inattendu renvoie l'état inchangé.
   positionBarre(rho)                 → [0,1] | null                §10.4.1
       (0,12 − ρ) / (0,12 − 0,03), bornée. null si ρ n'est pas fini —
       jamais 0, qui se lirait « très dispersé » là où il n'y a pas de mesure.
   DUREE_MESURE_S 45 · MESURES_DECOMPTE 2 · GESTES_MIN 24
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
/* Rouge POUR LA BONNE RAISON (§13) : tant qu'une fonction de l'étape 7 n'est
   pas écrite dans le bloc d'index.html, le test qui la vise échoue en la
   nommant, au lieu de faire tomber la suite entière avant le premier test. */
function exige(nom) {
  if (M[nom] === undefined)
    throw new Error(nom + " absente du bloc pur — §14 étape 7, pas encore écrite.");
  return M[nom];
}
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
  const pg0 = M.pasGrille(bpm, sub), pc0 = M.pasClic(bpm, 0, tpm, sub);
  const pg1 = M.pasGrille(bpm, sub), pc1 = M.pasClic(bpm, 1, tpm, sub);
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
test("T3d · §7.3 — échelon 0 sans subdivision : null, jamais un défaut", () => {
  egal(M.pasClic(60, 0, 4), null, "subdivision absente :");
  proche(M.pasClic(60, 0, 4, 3), M.pasGrille(60, 3), 1e-12, "triolets (ar-triolets) :");
  proche(M.pasClic(60, 0, 4, 4), M.pasGrille(60, 4), 1e-12, "doubles (ar-doubles) :");
  proche(M.pasClic(90, 0, 4, 2), M.pasGrille(90, 2), 1e-12, "croches :");
});
test("T3e · §7.3 — échelon 3 : le pas dépend du nombre de temps, pas du seul 4/4", () => {
  const noire = 60 / 90;
  egal(M.pasClic(90, 3, 1), null, "1 temps — le temps 2 n'existe pas :");
  proche(M.pasClic(90, 3, 2), 2 * noire, 1e-12, "2/4 — un clic par mesure :");
  proche(M.pasClic(90, 3, 3), 3 * noire, 1e-12, "3/4 (scarborough) — un clic par mesure :");
  proche(M.pasClic(90, 3, 4), 2 * noire, 1e-12, "4/4 — deux clics équidistants :");
  egal(M.pasClic(90, 3, 5), null, "5/4 — intervalles 2 puis 3 :");
  egal(M.pasClic(90, 3, 6), null, "6/8 — intervalles 2 puis 4 :");
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
  const a = Q(88, "croches", "accent24", 1), b = Q(88, "croches", "accent24", 2);
  egal(M.memeQuadruplet(a, a), true, "identité :");
  egal(M.memeQuadruplet(a, b), false, "le soutien seul suffit à séparer :");
  egal(M.memeQuadruplet(a, Q(92, "croches", "accent24", 1)), false, "tempo :");
  egal(M.memeQuadruplet(a, Q(88, "noires", "accent24", 1)), false, "subdivision :");
  egal(M.memeQuadruplet(a, Q(88, "croches", "seuls24", 1)), false, "repère :");
});
test("T8b · §10.3 — trois mesures à ρ ≤ 4,5 % au MÊME quadruplet lèvent le plafond", () => {
  const st = { n: 60, R: 0.8, p: 1e-9, rho: 0.03, pct_cible: 85, sigma_locale_ms: 10 };
  const ok = { ok: true, motif: null }, q = Q(88, "croches", "accent24", 1);
  const trois = [
    { quadruplet: q, rho: 0.04, concluante: true },
    { quadruplet: q, rho: 0.03, concluante: true },
    { quadruplet: q, rho: 0.042, concluante: true }
  ];
  egal(M.noteProposee(st, { concluante: ok, quadruplet: q, historique: trois }).note, "acquis");
  const casse = [trois[0], { quadruplet: Q(88, "croches", "accent24", 2), rho: 0.03, concluante: true }, trois[2]];
  const r = M.noteProposee(st, { concluante: ok, quadruplet: q, historique: casse });
  egal(r.note, "bien", "quadruplet rompu → plafond maintenu :");
  egal(r.plafonnee, true);
});
test("T8c · prise isolée excellente → plafonnée à « Bien » (§10.3)", () => {
  const st = { n: 60, R: 0.85, p: 1e-9, rho: 0.028, pct_cible: 88, sigma_locale_ms: 9 };
  const r = M.noteProposee(st, { concluante: { ok: true }, quadruplet: Q(88, "croches", "accent24", 1), historique: [] });
  egal(r.note, "bien", "jamais « Acquis » sur une prise isolée :");
  egal(r.plafonnee, true);
});

/* ═══ Table de notation §10.2 — bornes ══════════════════════════════════════ */
test("§10.2 · bornes de la table de correspondance", () => {
  const base = { n: 60, R: 0.8, p: 1e-9, sigma_locale_ms: 20 };
  const q = Q(88, "croches", "accent24", 1), c = { ok: true };
  const note = (rho, pct) => M.noteProposee(Object.assign({}, base, { rho: rho, pct_cible: pct }),
    { concluante: c, quadruplet: q, historique: [] }).note;
  egal(note(0.05, 74), "bien", "ρ = 5 % (jeu de référence) :");
  egal(note(0.07, 60), "progres", "ρ = 7 % :");
  egal(note(0.09, 50), "debuts", "ρ = 9 % :");
  egal(note(0.03, 85), "bien", "ρ = 3 % plafonné faute d'historique :");
});
test("§10.2b · lecture discordante : la plus basse des deux, et elle se dit", () => {
  const st = { n: 60, R: 0.8, p: 1e-9, rho: 0.03, pct_cible: 45, sigma_locale_ms: 10 };
  const r = M.noteProposee(st, { concluante: { ok: true }, quadruplet: Q(88, "croches", "accent24", 1), historique: [] });
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


/* ═══════════════════════════════════════════════════════════════════════════
   ÉTAPE 7 — tests 10 à 19, écrits avant le code (§13, §14 étape 7)
   Rouges tant que le bloc pur ne contient pas les fonctions ; verts d'eux-
   mêmes ensuite. Aucun ne touche le DOM.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ═══ 7b · dérivation — §6.1, §6.2, §7.4 ════════════════════════════════════ */

test("18 · echelonDe — les six lignes du tableau du §7.4, dans l'ordre", () => {
  const f = exige("echelonDe");
  egal(f({ sub: 1, repere: "tous", muet: true }), 5, "muet l'emporte sur tout :");
  egal(f({ sub: 1, repere: "tous", gap: true }), 4, "gap avant le repère :");
  egal(f({ sub: 1, repere: "seuls24" }), 3, "seuls24 :");
  egal(f({ sub: 1, repere: "accent24" }), 2, "accent24 :");
  egal(f({ sub: 2, repere: "tous" }), 0, "subdivision audible :");
  egal(f({ sub: 1, repere: "tous" }), 1, "temps seuls :");
});
test("18b · echelonDe — le repère se lit AVANT la subdivision (carte du corpus)", () => {
  const f = exige("echelonDe");
  /* Cartes réelles du corpus : sub:2 ET repere:"seuls24". Les croches sont
     réglées mais inaudibles — Moteur.clic() les écarte avant d'émettre. Lire
     sub d'abord donnerait 0, donc un pas_clic en croches pour une carte où
     l'on n'entend que 2 et 4. */
  egal(f({ sub: 2, repere: "seuls24" }), 3, "sub:2 + seuls24 :");
  egal(f({ sub: 2, repere: "accent24" }), 2, "sub:2 + accent24 :");
});
test("10 · quadrupletDe sur une carte à sub:2 + seuls24 → soutien 3, jamais 0", () => {
  const f = exige("quadrupletDe");
  const q = f({ bpmTravail: 88, bpmCible: 70, preset: { sub: 2, repere: "seuls24" } });
  egal(q.tempo, 88, "bpmTravail, jamais bpmCible :");
  egal(q.subdivision, "croches", "table inverse de SUBDIVISIONS :");
  egal(q.repere, "seuls24", "repère tel quel :");
  egal(q.soutien, 3, "échelon lu, pas stocké :");
});
test("11 · quadrupletDe — un terme manque → null, jamais un quadruplet partiel", () => {
  const f = exige("quadrupletDe");
  egal(f({ preset: { sub: 2, repere: "tous" } }), null, "sans bpmTravail :");
  egal(f({ bpmTravail: 88, preset: { sub: 7, repere: "tous" } }), null, "subdivision hors table :");
  egal(f({ bpmTravail: 88, preset: { sub: 2 } }), null, "sans repère :");
  egal(f({ bpmTravail: 88 }), null, "sans préréglage :");
  egal(f(null), null, "sans carte :");
});
test("12 · memeQuadruplet — 78 et 80 bpm sont le même palier (§6.2)", () => {
  exige("palierTempo");
  egal(M.palierTempo(78), 80, "78 → 80 :");
  egal(M.palierTempo(80), 80, "80 → 80 :");
  egal(M.memeQuadruplet(Q(78, "croches", "accent24", 1), Q(80, "croches", "accent24", 1)), true);
});
test("13 · memeQuadruplet — 76 et 80 bpm sont deux paliers distincts", () => {
  exige("palierTempo");
  egal(M.palierTempo(76), 76, "76 → 76 :");
  egal(M.memeQuadruplet(Q(76, "croches", "accent24", 1), Q(80, "croches", "accent24", 1)), false);
});
test("19 · le palier ÉLARGIT la comparabilité, il ne fusionne rien (rejeu de T8)", () => {
  exige("palierTempo");
  const a = Q(88, "croches", "accent24", 1);
  egal(M.memeQuadruplet(a, a), true, "identité :");
  egal(M.memeQuadruplet(a, Q(88, "croches", "accent24", 2)), false, "soutien :");
  egal(M.memeQuadruplet(a, Q(92, "croches", "accent24", 1)), false, "palier voisin :");
  egal(M.memeQuadruplet(a, Q(88, "noires", "accent24", 1)), false, "subdivision :");
  egal(M.memeQuadruplet(a, Q(88, "croches", "seuls24", 1)), false, "repère :");
});

/* ═══ 7c · cycle de mesure — §8, §8.1 ═══════════════════════════════════════ */

/* Décompte synthétique : MESURES_DECOMPTE mesures entières de `temps` temps,
   puis le temps 1 de la mesure utile. Le générateur ne sait rien du cycle —
   il ne fait que ce que Moteur.ordonnancer() enverrait. */
function clicsDecompte(temps, pas_s, t0, mesures) {
  const out = [];
  let t = t0;
  for (let m = 0; m < mesures; m++)
    for (let p = 0; p < temps; p++) { out.push({ type: "clic", mesure: m, temps: p, sub: 0, t: t }); t += pas_s; }
  return out;
}
function derouler(evts, etat) {
  const f = exige("cycleMesure");
  return evts.reduce((e, v) => f(e, v), etat || exige("cycleInitial")());
}

test("14 · l'ancre est posée au temps 1 de la 3e mesure — en 4/4 comme en 3/4", () => {
  exige("cycleMesure");
  [[4, 0.75], [3, 0.75]].forEach(([temps, pas]) => {
    const t0 = 10;
    const suite = [{ type: "demarrer" }].concat(clicsDecompte(temps, pas, t0, 2));
    let e = derouler(suite);
    egal(e.phase, "decompte", temps + "/4 · deux mesures consommées, toujours en décompte :");
    egal(e.ancre, null, temps + "/4 · aucune ancre pendant le décompte :");
    e = M.cycleMesure(e, { type: "clic", mesure: 2, temps: 0, sub: 0, t: t0 + 2 * temps * pas });
    egal(e.phase, "mesure", temps + "/4 · passage en mesure :");
    proche(e.ancre, t0 + 2 * temps * pas, 1e-9, temps + "/4 · ancre au temps 1 de la 3e mesure :");
  });
});
test("14b · l'ancre ignore les clics qui précèdent le premier temps 1", () => {
  exige("cycleMesure");
  /* Moteur tourne déjà : le premier clic reçu tombe au 3e temps. Compter à
     partir de lui donnerait moins de deux mesures de décompte. */
  const pas = 0.75;
  let e = derouler([{ type: "demarrer" },
    { type: "clic", mesure: 0, temps: 2, sub: 0, t: 10.0 },
    { type: "clic", mesure: 0, temps: 3, sub: 0, t: 10.75 }]);
  egal(e.phase, "decompte", "aucun temps 1 encore vu :");
  const suite = clicsDecompte(4, pas, 11.5, 2).map(c => Object.assign({}, c, { mesure: c.mesure + 1 }));
  e = derouler(suite, e);
  egal(e.ancre, null, "deux mesures pleines à compter du premier temps 1 :");
  e = M.cycleMesure(e, { type: "clic", mesure: 3, temps: 0, sub: 0, t: 17.5 });
  proche(e.ancre, 17.5, 1e-9, "ancre au bon temps 1 :");
});
test("15 · aucun geste retenu avant l'ancre ni après ancre + 45 s", () => {
  exige("cycleMesure");
  let e = derouler([{ type: "demarrer" }].concat(clicsDecompte(4, 0.75, 10, 2))
    .concat([{ type: "geste", t: 11.2 }, { type: "geste", t: 12.9 }])
    .concat([{ type: "clic", mesure: 2, temps: 0, sub: 0, t: 16 }]));
  egal(e.gestes.length, 0, "gestes du décompte écartés :");
  e = derouler([{ type: "geste", t: 20 }, { type: "geste", t: 40 },
                { type: "geste", t: 61.5 }, { type: "geste", t: 80 }], e);
  egal(e.gestes.length, 2, "seuls les gestes de la fenêtre de 45 s :");
});
test("16 · arrêt manuel : 23 gestes → abandon, 24 → bilan (frontière GESTES_MIN)", () => {
  const N = exige("GESTES_MIN");
  egal(N, 24, "GESTES_MIN vaut 24 (§9.1, [P]) :");
  const amorce = [{ type: "demarrer" }].concat(clicsDecompte(4, 0.75, 10, 2))
    .concat([{ type: "clic", mesure: 2, temps: 0, sub: 0, t: 16 }]);
  const avec = k => {
    const g = [];
    for (let i = 0; i < k; i++) g.push({ type: "geste", t: 17 + i * 0.5 });
    return derouler(amorce.concat(g).concat([{ type: "arret" }]));
  };
  egal(avec(N - 1).phase, "abandon", "23 gestes :");
  egal(avec(N - 1).motif, "gestes", "et le motif est écrit :");
  egal(avec(N).phase, "bilan", "24 gestes :");
});
test("16b · l'horloge ferme la mesure à 45 s, et la transition est totale", () => {
  const D = exige("DUREE_MESURE_S");
  egal(D, 45, "DUREE_MESURE_S vaut 45 (§8) :");
  const amorce = [{ type: "demarrer" }].concat(clicsDecompte(4, 0.75, 10, 2))
    .concat([{ type: "clic", mesure: 2, temps: 0, sub: 0, t: 16 }]);
  let e = derouler(amorce.concat([{ type: "horloge", t: 16 + D - 0.01 }]));
  egal(e.phase, "mesure", "avant 45 s :");
  e = M.cycleMesure(e, { type: "horloge", t: 16 + D });
  egal(e.phase, "bilan", "à 45 s :");
  const apres = M.cycleMesure(e, { type: "geste", t: 62 });
  egal(apres.phase, "bilan", "évènement inattendu → état inchangé, jamais d'exception :");
  egal(M.cycleMesure(exige("cycleInitial")(), { type: "geste", t: 1 }).phase, "presentation",
       "geste avant démarrage → ignoré :");
});

/* ═══ 7d · géométrie de la barre — §10.4.1 ══════════════════════════════════ */

test("17 · positionBarre aux cinq points remarquables, et null hors domaine", () => {
  const f = exige("positionBarre");
  proche(f(0.12), 0, 1e-9, "bord gauche, 12 % :");
  proche(f(0.08), 0.4444444444, 1e-6, "frontière Débuts / En progrès, 8 % :");
  proche(f(0.06), 0.6666666667, 1e-6, "« ton habitude », 6 % :");
  proche(f(0.045), 0.8333333333, 1e-6, "frontière Bien / Acquis, 4,5 % :");
  proche(f(0.03), 1, 1e-9, "bord droit, 3 % :");
  proche(f(0.20), 0, 1e-9, "borné à gauche :");
  proche(f(0.01), 1, 1e-9, "borné à droite :");
  egal(f(null), null, "ρ absent → null, JAMAIS 0 :");
  egal(f(Infinity), null, "ρ non fini → null :");
  egal(f("6"), null, "ρ non numérique → null :");
});

/* ── verdict ──────────────────────────────────────────────────────────────── */
console.log(ligne.join("\n"));
console.log("\n" + passes + " passés, " + echecs + " échoués.");
if (M.__manquants && M.__manquants.length)
  console.log("Pas encore écrites dans le bloc pur (§14 étape 7) : " + M.__manquants.join(", "));
process.exit(echecs ? 1 : 0);
