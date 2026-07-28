"use strict";
/* ═══════════════════════════════════════════════════════════════════════════
   comping — fonctions pures du moteur de mesure, exportées en CommonJS
   SPEC-MESURE.md §14 étapes 3 à 5 + étape 7 (7b, 7c, 7d) · consommé par
   tests/mesure-tests.js

   Ce fichier ne CONTIENT pas les fonctions : il les EXTRAIT d'index.html à
   l'exécution, comme tests/calibration-tests.js le fait pour la calibration.
   Une copie dériverait sans prévenir ; un extrait ne le peut pas.

   La liste EXPORTES est la seule frontière : toute fonction ajoutée au bloc
   d'index.html doit y être ajoutée pour être visible des tests.

   L'export est DÉFENSIF depuis le 2026-07-28, et c'est ce qui rend possible
   la règle « tests avant code » du §13 sur l'étape 7 : un nom listé ici mais
   pas encore écrit dans index.html s'exporte à `undefined` au lieu de lever
   une ReferenceError. Sans cela, une seule fonction manquante faisait tomber
   la suite ENTIÈRE avant le premier test, et le rouge ne disait plus rien —
   il ne disait surtout pas laquelle manquait. `__manquants` porte la liste,
   pour que la suite l'affiche au lieu de la deviner.
   ═══════════════════════════════════════════════════════════════════════════ */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const RACINE = path.join(__dirname, "..");
const CHEMIN = fs.existsSync(path.join(RACINE, "index.html"))
  ? path.join(RACINE, "index.html")
  : path.join(RACINE, "comping-index.html");
const HTML = fs.readFileSync(CHEMIN, "utf8");

const DEBUT = "/* ── fonctions pures de mesure, testables sous Node ─";
const FIN = "/* ── fin des fonctions pures de mesure ─";
const i0 = HTML.indexOf(DEBUT), i1 = HTML.indexOf(FIN);
if (i0 < 0 || i1 < 0 || i1 < i0) {
  console.error("bloc de fonctions pures de mesure introuvable dans " + path.basename(CHEMIN) +
    " — les marqueurs de section ont bougé.");
  process.exit(2);
}

/* Étapes 2 à 5 du §14 — écrites, vertes. */
const EXPORTES = [
  "regrouper", "stats", "concluante", "noteProposee", "serieAcquise",
  "rangRho", "rangCible", "NOTES", "RHO_ACQUIS",
  "pasGrille", "pasClic", "fen", "echelonDepart", "memeQuadruplet",
  "facteurSubdivision", "SUBDIVISIONS", "libelleSubdivision", "LIBELLES_SUBDIVISION",
  "FEN_RELATIVE", "COEF_FEN", "PLANCHER_FEN", "FEN_FIXE_MS"
];

/* Étape 7 du §14 — spécifiées (spec v0.10), pas encore écrites. Listées ici
   dès maintenant pour que les tests 10 à 19 soient rouges sur « absente »,
   et verts d'eux-mêmes le jour où le bloc les contient. */
const EXPORTES_ETAPE_7 = [
  "quadrupletDe", "palierTempo", "echelonDe",           // 7b · §6.1, §6.2, §7.4
  "cycleInitial", "cycleMesure",                        // 7c · §8.1
  "DUREE_MESURE_S", "MESURES_DECOMPTE", "GESTES_MIN",   // 7c · constantes
  "positionBarre", "PLAGES_BARRE",                      // 7d · §10.4.1
  "tempoJoue"                                           // 7e-0 · §9.2
];

const TOUS = EXPORTES.concat(EXPORTES_ETAPE_7);

const bac = { module: {}, console: console };
vm.createContext(bac);
vm.runInContext(HTML.slice(i0, i1) +
  "\nmodule.exports={" +
  TOUS.map(n => n + ':(typeof ' + n + '!=="undefined"?' + n + ":undefined)").join(",") +
  "};", bac);

const sortie = bac.module.exports;
sortie.__manquants = TOUS.filter(n => sortie[n] === undefined);

module.exports = sortie;
