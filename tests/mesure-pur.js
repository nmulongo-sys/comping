"use strict";
/* ═══════════════════════════════════════════════════════════════════════════
   comping — fonctions pures du moteur de mesure, exportées en CommonJS
   SPEC-MESURE.md §14 étapes 3 et 4 · consommé par tests/mesure-tests.js

   Ce fichier ne CONTIENT pas les fonctions : il les EXTRAIT d'index.html à
   l'exécution, comme tests/calibration-tests.js le fait pour la calibration.
   Une copie dériverait sans prévenir ; un extrait ne le peut pas.

   Sont extraites à ce jour les fonctions des étapes 2, 3 et 4 du §14.
   noteProposee (étape 5) n'est pas encore écrite : les tests qui l'appellent
   échouent, et c'est le comportement attendu tant que le code n'existe
   pas (§13).
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

const EXPORTES = [
  "regrouper", "stats", "concluante",
  "pasGrille", "pasClic", "fen", "echelonDepart", "memeQuadruplet",
  "facteurSubdivision", "SUBDIVISIONS",
  "FEN_RELATIVE", "COEF_FEN", "PLANCHER_FEN", "FEN_FIXE_MS"
];

const bac = { module: {}, console: console };
vm.createContext(bac);
vm.runInContext(HTML.slice(i0, i1) +
  "\nmodule.exports={" + EXPORTES.join(",") + "};", bac);

module.exports = bac.module.exports;
