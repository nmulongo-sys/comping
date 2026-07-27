# comping — spécification du moteur de mesure intégré

> Version 0.2 — 2026-07-27. §7.1, §7.2 et §10.2 arbitrés.
> Version 0.1 — 2026-07-27. **Document de spécification, à valider avant toute ligne de code.**
> Couvre le point ouvert 5 du brief de reprise (2) : grille partagée, calibration,
> quadruplet de contexte, échelle de soutien, règle de notation.
> Ne couvre pas : l'étape 2 (vérification d'accord), le swing, l'habillage de timbre.

---

## 0. Ce que la spec engage, et ce qu'elle laisse ouvert

| | |
|---|---|
| **Objet** | Fusionner la chaîne de mesure d'`analyse-attaque` v1.6 dans `comping/index.html`, de sorte qu'une carte travaillée produise une mesure comparable dans le temps, et une **proposition** de note SRS. |
| **Contrainte** | Fichier HTML unique, zéro dépendance, hors ligne, mobile d'abord. Aucune sortie réseau. |
| **Non-objet** | Noter automatiquement. Corriger le placement. Mesurer les étouffées ou les liaisons main gauche. |
| **Bloqué par** | Points ouverts 1 à 4 du brief pour les *valeurs* de deux constantes (§5, §10). La *structure* ci-dessous ne dépend pas de leur issue. |

Chaque constante porte un statut : **[É]** établi par la mesure · **[V]** validé par Jean le
2026-07-27, provisoire tant que la mesure ne l'a pas confirmé · **[P]** proposé dans ce
document, à valider · **[A]** en attente de la seconde série de capture.

---

## 1. Principe : une horloge, deux consommateurs

`comping` possède déjà un ordonnanceur (`setInterval` 25 ms, horizon 120 ms). Il devient
**maître et unique**. Celui d'`analyse-attaque` disparaît. Le module de mesure ne programme
rien : il s'abonne.

```
ordonnanceur comping
  ├── programme le clic audible à t_prog        (échelon de soutien, §7)
  ├── publie  M.ancre  = instant programmé du temps 1 de la mesure courante
  ├── publie  M.pas    = durée d'un pas de la grille d'évaluation (§4)
  └── worklet ── détections ── regroupement ── gestes ── statistiques (§8)
```

**Conséquence de conception à ne pas perdre.** La grille d'évaluation est celle de
*l'ordonnanceur*, pas celle du clic entendu. Couper le clic (échelons 4 et 5) coupe
l'audio, jamais la grille. Une mesure sans clic reste donc pleinement mesurable — c'est
tout l'intérêt de l'échelle de soutien.

**Interdits repris du brief, non négociables :**

- Pas de « Caler sur le jeu » dans `comping`. Le calage annule exactement le défaut à mesurer.
- Pas de second `AudioContext`.
- Pas de recalcul rétroactif d'anciennes mesures contre une ancre nouvelle : chaque geste
  emporte son ancre et son pas (leçon v1.2 d'`analyse-attaque`).

---

## 2. Calibration de latence par boucle acoustique

**Statut : préalable bloquant. Aucune calibration n'existe à ce jour, sur aucun appareil.**

`baseLatency` et `outputLatency` sont inutilisables — l'appareil de référence déclare 4 ms
de latence de sortie au casque, ce qui est invraisemblable.

### 2.1 Procédure

1. L'écran demande de **retirer le casque** et de poser le téléphone micro vers le haut,
   haut-parleur libre. C'est la seule opération de tout le produit où le haut-parleur est
   autorisé — et elle l'exige.
2. L'app émet 24 clics à 1000 ms d'intervalle, mêmes paramètres de synthèse que le clic de
   travail.
3. Le worklet détecte ces clics comme des attaques. Pour chaque clic *k* : `δ_k = t_détecté − t_programmé`.
4. `latence_ms` = médiane des `δ_k` ; `latence_dispersion` = écart interquartile.
5. **Rejet** si moins de 20 clics détectés, ou si l'écart interquartile dépasse 15 ms **[P]**.
   Message explicite, pas de valeur enregistrée.

### 2.2 Stockage

Indexé par appareil, dans `comping_v2` (§11) :

```js
calibration: {
  "<empreinte>": { latence_ms: 187.4, dispersion_ms: 4.1, n: 23,
                   date: "2026-07-27", sr: 48000 }
}
```

Empreinte d'appareil **[P]** : hachage court de `navigator.userAgent` +
`sampleRate` + `AudioContext.baseLatency` arrondi. Volontairement grossier : elle sert à
éviter de réutiliser la latence d'un autre téléphone, pas à identifier une machine.

### 2.3 Comportement en l'absence de calibration

L'app **fonctionne**, mais :

| Grandeur | Sans calibration | Avec calibration |
|---|---|---|
| σ, dispersion | affichée | affichée |
| % en cible (centré sur le biais) | affiché | affiché |
| accroche R, Rayleigh | affichés | affichés |
| **biais / asynchronie** | **masqué**, avec le motif | affiché, avec la question du §9.3 |
| note SRS proposée | proposée | proposée |

La note ne dépend jamais de la latence (§10), donc l'absence de calibration ne bloque pas
le travail. Elle bloque seulement la lecture du placement en avant / en arrière.

---

## 3. Chaîne de détection importée

Reprise **telle quelle** d'`analyse-attaque` v1.6, worklet compris (Blob depuis
`<script type="text/plain">`) : `N = 1024`, `HOP = 256`, trame 5,33 ms à 48 kHz,
blanchiment adaptatif, flux spectral, seuil adaptatif médian sur 45 trames.

Trois changements, et trois seulement :

1. **`ecart_min_ms = 120`, figé, non exposé** **[É]**. Balayé de 30 à 600 ms sur treize
   prises : l'accroche R ne bouge pas, seul le comptage change. Ce n'est pas un paramètre
   de qualité, c'est un paramètre d'affichage. L'élève ne le voit jamais.
2. **Distinction détection / geste conservée.** Toutes les statistiques portent sur les
   gestes. Un accord plaqué produit 1,1 détection par geste, une corde nylon pincée au
   doigt jusqu'à 3,6 : le regroupement n'est pas cosmétique.
3. **Casque verrouillant.** Sans confirmation explicite, pas de mesure. Seule exception :
   l'écran de calibration du §2.

### 3.1 Gestes exclus du parcours de mesure **[É]**

Mesuré, pas supposé :

| Geste | Accroche R observée | Statut |
|---|---|---|
| Palm mute faible | ≤ 0,31 | hors mesure |
| Hammer-on / pull-off | 0,05 – 0,09 | hors mesure |

Ils restent des objets d'enseignement. Une carte qui les porte est marquée
`mesurable: false` et ne reçoit **jamais** de note proposée : Jean note à la main, comme
avant la fusion. L'app doit le dire sur la carte, pas le laisser deviner.

---

## 4. Grille d'évaluation et fenêtre en cible

### 4.1 Deux pas distincts, à ne jamais confondre

- **`pas_grille`** — le pas de la grille d'évaluation, imposé par la carte (la valeur
  rythmique que la carte demande de jouer). C'est le pas contre lequel les phases sont
  calculées.
- **`pas_clic`** — le pas de ce qui est *entendu*, imposé par l'échelon de soutien (§7).

C1 / C2 ont montré que faire varier `pas_clic` à `pas_grille` constant change l'accroche
(+11 points) sans changer la régularité locale. Les deux doivent donc être stockés
séparément, sans quoi l'historique mélange deux tâches différentes.

### 4.2 Fenêtre en cible `FEN`

```
FEN = max(COEF_FEN × pas_grille, PLANCHER_FEN)
```

| Constante | Valeur | Statut |
|---|---|---|
| `COEF_FEN` | 0,06 | **[A]** — sept mesures concordantes, un appareil, un instrument, une séance. B3 (11,1 %) et B5 (12,2 %) s'en écartent mais ne reposent que sur 17 et 18 intervalles. **À confirmer par la seconde série avant implémentation.** |
| `PLANCHER_FEN` | 12 ms | **[P]** — deux trames de worklet (10,7 ms) plus marge. En deçà, on mesurerait la résolution du détecteur, pas le jeu. Mord seulement sous `pas_grille` = 200 ms. |

La constante actuelle de ±25 ms est juste par accident autour de 375–400 ms, absurdement
sévère à 1000 ms, laxiste à 250 ms. Elle disparaît.

**Cohérence interne à conserver comme test.** Pour une phase de loi normale enroulée,
σ = FEN implique ≈ 68 % en cible. La séance libre du 27 donne σ/pas = 6,4 % pour 67 % en
cible : les deux moitiés du dispositif se répondent. Si une future version casse cette
relation, c'est un défaut, pas une nouveauté.

**Tant que `COEF_FEN` n'est pas confirmé**, le drapeau `FEN_RELATIVE` reste à `false` et
l'app conserve ±25 ms. Un seul point de bascule dans le code, une seule ligne à changer
le jour où la seconde série tranche.

### 4.3 Recentrage obligatoire sur le biais

Tout comptage de couverture ou de cible est calculé **centré sur le biais circulaire**.
Sans cela, dès que la latence non calibrée dépasse `pas/2`, les attaques basculent dans la
case suivante et sont comptées comme des trous — observé en B4 : 215 ms de biais contre
166 ms de demi-pas. L'accroche R, invariante par translation de phase, n'est pas concernée.

---

## 5. Découpage en passages

Repris d'`analyse-attaque` v1.5, sans changement :

- Un silence supérieur à `max(4 × pas_grille, 3 s)` ouvre un nouveau passage.
- Aucune fenêtre glissante n'enjambe une pause.
- Une carte dure 45 s : en pratique un ou deux passages. **Seul le passage le plus long
  est mesuré** **[P]** ; les autres sont conservés bruts mais n'alimentent pas la note.
  Motif : dans une séance de travail, le premier passage est souvent un faux départ.

---

## 6. Quadruplet de contexte

**Toute mesure stockée porte son quadruplet.** Sans lui, l'historique est un artefact.

```js
contexte: {
  tempo:        88,          // bpm de la carte
  subdivision:  "croches",   // valeur rythmique demandée → pas_grille
  repere:       "temps",     // ce qui est entendu → pas_clic
  soutien:      2            // échelon 0..5, §7
}
```

**Règle de comparabilité.** Deux mesures ne sont comparables — courbe de progression,
moyenne, tendance — que si leur quadruplet est **identique**. Sinon elles apparaissent sur
le graphique comme deux séries distinctes, jamais fusionnées. C'est la règle qui empêche
l'historique de mentir quand une carte monte d'échelon.

Corollaire : monter d'échelon **repart d'un historique vide** pour ce couple. L'app doit
l'annoncer (« nouvelle condition — l'historique précédent reste consultable, il ne sera pas
mélangé »).

---

## 7. Échelle de soutien

Nouvel axe de difficulté, à côté du tempo. Une carte a un **couple** (tempo, soutien), pas
un objectif unique.

| Échelon | Nom | Entendu | `pas_clic` |
|---|---|---|---|
| 0 | soutien plein | temps + subdivision | `pas_grille` |
| 1 | temps seuls | chaque temps | noire |
| 2 | `accent24` | tous les temps, 2 et 4 accentués | noire |
| 3 | `seuls24` | 2 et 4 seulement | blanche |
| 4 | clic troué | une mesure sur deux | — |
| 5 | sans clic | rien (grille interne maintenue) | — |

**Les timbres idiomatiques ne constituent pas un échelon** **[É]**. `accent24` et
`seuls24` *sont* déjà le charleston sur 2 et 4 : changer le timbre ne retire ni n'ajoute
d'information temporelle. Statut : habillage optionnel, verrouillé par carte, en toute fin
de parcours, et admissible seulement si σ se révèle insensible au timbre. Sinon le timbre
devient une cinquième composante du contexte et tout l'historique antérieur devient
incomparable.

### 7.1 Seuils — **[V]** validé provisoire 2026-07-27, point ouvert 10

L'échelon **de départ** d'une carte n'est pas libre : il dépend du tempo.

| Tempo de la carte | Échelon de départ | Motif |
|---|---|---|
| ≤ 76 bpm | 0 (soutien plein) | C2 : le clic subdivisé gagne 11 points d'accroche. Aux tempos lents, l'intervalle nu est trop long pour tenir la phase. |
| 77 – 132 bpm | 1 (temps seuls) | zone où la subdivision n'apporte plus rien de mesuré. |
| > 132 bpm | 1, `pas_clic` = noire | subdiviser au-delà encombre plus qu'il n'aide. |

**Ces trois seuils sont les moins étayés de tout le document.** Ils reposent sur une prise
par condition (série C, non concluante). **Arbitrage retenu : conservés tels quels, à titre
provisoire, jusqu'aux trois répétitions alternées C1/C2 du point ouvert 2.**

### 7.2 Règle de progression — **[V]** validé 2026-07-27

Trois mesures **concluantes** (§9.1) consécutives notées « bien » ou mieux, à quadruplet
constant, ouvrent une proposition :

1. **d'abord monter d'un échelon de soutien**, à tempo constant ;
2. échelon 5 atteint : **alors seulement** +4 bpm, retour à l'échelon de départ du §7.1.

Le soutien avant le tempo, parce que c'est l'axe neuf et le moins coûteux à redescendre.
Proposition, jamais application automatique. **Arbitrage retenu : soutien d'abord.**

---

## 8. Cycle d'une carte mesurée

```
présentation ──▶ décompte 2 mesures ──▶ MESURE 45 s ──▶ bilan ──▶ note (§10)
                  (clic seul,             (worklet actif,     (proposée,
                   non mesuré)             gestes collectés)   pré-cochée)
```

- Le décompte n'est **jamais** inclus dans la mesure. Ancre posée au temps 1 de la première
  mesure utile.
- Interruption avant 24 gestes **[P]** : mesure abandonnée, aucune note proposée, la carte
  revient en main.
- Arrêt manuel possible à tout instant ; les gestes déjà collectés sont conservés et le
  bilan s'affiche si les conditions du §9.1 sont réunies.

---

## 9. Statistiques et conditions d'affichage

### 9.1 Conditions de validité — une mesure est *concluante* si

| Condition | Seuil | Statut |
|---|---|---|
| Nombre de gestes du passage retenu | ≥ 24 | **[P]** |
| Test de Rayleigh | p < 0,001 | **[É]** (déjà en place v1.3+) |
| Accroche | R > 0,25 | **[É]** |
| Écart du tempo joué au tempo réglé | ≤ 3 % | **[É]** — garde-fou du protocole. Au-delà, B4/B5 montrent 5 à 7 tours de phase sur 30 s : l'accroche s'effondre mécaniquement et la mesure ne dit plus rien du jeu. |

Une mesure non concluante n'affiche **ni biais, ni régularité, ni profil d'accentuation**,
et ne propose **aucune note**. Elle affiche son motif de rejet, en clair, et la carte
retourne à la notation manuelle.

### 9.2 Grandeurs calculées

Statistique circulaire sur les phases `2π · dev / pas_grille`, déjà implémentée :

- **R** — accroche à la grille, longueur du vecteur résultant ;
- **Rayleigh** — `z = nR²`, p-valeur ;
- **biais** — angle moyen ;
- **σ_grille** = `pas_grille / 2π · √(−2 ln R)` ;
- **σ_locale** — écart-type des intervalles entre gestes successifs. **Immune à la dérive**,
  c'est elle qui nourrit la note (§10), pas σ_grille ;
- **ρ = σ_locale / pas_grille** — dispersion relative, la seule grandeur comparable d'un
  tempo à l'autre. Référence mesurée : **ρ ≈ 6 %, stable de 333 à 1000 ms** **[É]**.
- **% en cible** — part des gestes dans ±FEN, centré sur le biais.

### 9.3 Le biais s'affiche, il ne se note pas

Formulation imposée par le brief, à reprendre littéralement :

> « Tu poses en arrière — voulu ou subi ? »

Question posée à l'élève, jamais tranchée par la machine. Le placement en arrière est un
fait stylistique ; sans calibration il est de surcroît indissociable de la latence
matérielle. Il n'entre dans aucun calcul de note, jamais, même calibré.

---

## 10. Règle de notation

**La mesure propose. Jean valide.** La note est pré-cochée, modifiable en un geste, et
l'app ne l'applique pas seule.

### 10.1 Entrées autorisées

Deux, et deux seulement : **ρ** (dispersion relative) et **% en cible**. Rien d'autre.
Ni le biais, ni la dynamique, ni le nombre de gestes au-delà du seuil de validité.

### 10.2 Table de correspondance — **[V]** validé 2026-07-27

Ancrée sur la référence mesurée ρ ≈ 6 % — c'est-à-dire : « faire aussi bien que d'habitude »
tombe au milieu de la table, pas en haut. **Arbitrage retenu : ρ ≈ 6 % vaut « bien ».**
La table mesure donc l'écart à l'habitude, pas une qualité absolue.

| ρ = σ_locale / pas_grille | % en cible attendu | Note proposée |
|---|---|---|
| ≤ 4,5 % | ≳ 80 % | facile |
| 4,5 – 6,0 % | ≈ 68 – 80 % | bien |
| 6,0 – 8,0 % | ≈ 55 – 68 % | difficile |
| > 8,0 % | ≲ 55 % | à revoir |

Le % en cible sert de **contrôle de cohérence**, pas de second critère : si les deux
colonnes désignent des notes différentes de plus d'un rang, l'app propose la plus basse et
affiche « lecture discordante » — signe habituel d'une dérive de tempo ou d'un passage mal
découpé.

**Les libellés (« facile / bien / difficile / à revoir ») sont à aligner sur ceux déjà
présents dans `comping` Passe 2.2.** Ils sont ici des étiquettes de rang, pas une
proposition d'interface.

### 10.3 Ce qui ne change pas

Le moteur SM-2 simplifié de `comping` reste intact : intervalles, plafond 90 jours,
crédit de rappel ×1,15. La mesure alimente son entrée, elle ne le remplace pas.

---

## 11. Stockage — `comping_v2`

Ajouts au schéma existant, aucune suppression :

```js
{
  calibration: { "<empreinte>": { latence_ms, dispersion_ms, n, date, sr } },

  mesures: [{
    carte:     "ch03-c07",
    date:      "2026-07-27T21:14:02Z",
    contexte:  { tempo, subdivision, repere, soutien },   // §6
    n_gestes:  41,
    passage:   2,
    R:         0.79,
    p:         3.1e-9,
    sigma_locale_ms: 21.4,
    rho:       0.0571,
    cible_pct: 0.72,
    biais_ms:  187.9,          // brut, non corrigé
    calibre:   true,           // latence disponible au moment de la mesure
    fen_ms:    22.5,
    note_proposee: "bien",
    note_retenue:  "bien"      // ce que Jean a validé
  }]
}
```

**`note_proposee` et `note_retenue` sont toutes deux conservées.** L'écart entre les deux,
accumulé, est le seul moyen de savoir si la table du §10.2 est juste. C'est le journal de
bord de la règle de notation elle-même.

**Purge** : les mesures au-delà de 400 entrées sont élaguées par la plus ancienne, sauf
une par quadruplet, conservée comme point d'origine **[P]**.

---

## 12. Rendus

- Le graphique « Attaques détectées » d'`analyse-attaque` **tient lieu de bande de battement
  défilante**. Ne pas en développer une seconde.
- Seul le bandeau de flux est animé, plafonné à ~30 images/s. Le reste ne se redessine que
  sur `maj`. Redessiner l'ensemble à 60 Hz ne sert qu'à chauffer le téléphone.
- Palette et polices inchangées — elles sont déjà identiques dans les deux dépôts, le coût
  visuel de la fusion est nul.
- `prefers-reduced-motion` respecté, cibles ≥ 44 px.

---

## 13. Tests d'acceptation

À écrire **avant** le code, exécutables sous Node sans navigateur :

| # | Test | Attendu |
|---|---|---|
| 1 | Worklet headless sur signal synthétique, 5 tirages × 16 attaques, bruit −60 à −38 dB | 79/80 détectées minimum, σ ≤ 7 ms |
| 2 | Rejeu des 293 détections réelles d'`analyse-attaque` | mêmes gestes qu'en v1.6 avec `ecart_min_ms = 120` |
| 3 | Grille : changement d'échelon de soutien en cours de carte | ancre et `pas_grille` inchangés, `pas_clic` seul modifié |
| 4 | Cohérence FEN/σ : jeu synthétique à ρ = 6 % | % en cible dans [64 %, 72 %] |
| 5 | Mesure à tempo dérivant de 5 % | rejetée, motif « tempo », aucune note proposée |
| 6 | Carte `mesurable: false` | aucune note proposée, mention visible |
| 7 | Absence de calibration | biais masqué, note proposée quand même |
| 8 | Deux quadruplets différents dans l'historique | deux séries distinctes, jamais moyennées |
| 9 | `node --check` + intégrité des références DOM + parcours jsdom | sans erreur |

---

## 14. Ordre de réalisation proposé

1. **Calibration (§2)** — seule brique sans dépendance, et préalable à toute lecture du biais.
2. **Import du worklet et de la statistique (§3, §9)** dans `comping/index.html`, sans
   interface : vérifiable par les tests 1, 2, 9.
3. **Grille partagée et quadruplet (§1, §4, §6)** — tests 3, 8.
4. **Échelle de soutien (§7)** — tests 3, 6.
5. **Bilan et note proposée (§10)** — tests 4, 5, 7.
6. `FEN` relative activée **le jour où la seconde série confirme les 6 %**, pas avant.

---

## 15. Ce que cette spec laisse délibérément ouvert

| # | Question | Renvoi |
|---|---|---|
| a | Valeur de `COEF_FEN` | seconde série, points ouverts 1 à 4 |
| b | Seuils de l'échelle de soutien (§7.1) | point ouvert 10, trois répétitions C1/C2 |
| c | Vérification d'accord par chromagramme 8192 | point ouvert 6, spécifiée ailleurs |
| d | Ratio de swing dans `recalculer()` | chapitres 9–11, hors périmètre |
| e | Habillage de timbre | conditionné à une prise vérifiant σ insensible au timbre |
| f | Origine des doublons à 59–75 ms | point ouvert 7 ; sans effet sur cette spec, `ecart_min_ms = 120` les absorbe |
| g | Libellés exacts des notes SRS | à relever dans `comping` Passe 2.2 |
