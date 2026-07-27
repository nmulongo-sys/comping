# comping — spécification du moteur de mesure intégré

> Version 0.6.1 — 2026-07-27. Collision de numérotation corrigée : « Gestes exclus »
> passe de §3.1 à §3.2.
> Version 0.6 — 2026-07-27. Capture complète versionnée : test 2 recadré sur une
> référence reproductible, point ouvert g instruit et rouvert autrement, point ouvert k
> sur la sous-détection, §16 corrigé.
> Version 0.5 — 2026-07-27. Étape 1 livrée (calibration + worklet), §2.4 consignant
> les trois décisions d'implémentation, §4.4 sur l'ambiguïté σ_locale / σ de phase,
> points ouverts g à j, §16 sur la consolidation du développement.
> Version 0.4 — 2026-07-27. Correction de version (v1.5, pas v1.6), §3.0 séparant
> `ecart_min_ms` de `fusion_ms` et fixant la règle de regroupement d'après le source,
> contrainte réseau levée, point ouvert f tranché.
> Version 0.3 — 2026-07-27. Libellés définitifs, plafond sur « Acquis », échelle graduée.
> Version 0.2 — 2026-07-27. §7.1, §7.2 et §10.2 arbitrés.
> Version 0.1 — 2026-07-27. **Document de spécification, à valider avant toute ligne de code.**
> Couvre le point ouvert 5 du brief de reprise (2) : grille partagée, calibration,
> quadruplet de contexte, échelle de soutien, règle de notation.
> Ne couvre pas : l'étape 2 (vérification d'accord), le swing, l'habillage de timbre.

---

## 0. Ce que la spec engage, et ce qu'elle laisse ouvert

| | |
|---|---|
| **Objet** | Fusionner la chaîne de mesure d'`analyse-attaque` v1.5 dans `comping/index.html`, de sorte qu'une carte travaillée produise une mesure comparable dans le temps, et une **proposition** de note SRS. |
| **Contrainte** | Fichier HTML unique, zéro dépendance de code, mobile d'abord. **Contrainte réseau levée le 2026-07-27** (arbitrage Jean, app à usage personnel) : les trois balises de polices Google de `comping/index.html` restent. Seule sortie réseau admise ; hors ligne, l'app se rabat sur les polices système sans perte de fonction. Aucune autre requête. |
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

### 2.4 Décisions d'implémentation — livrées le 2026-07-27, commit `94a208d`

Trois choix que le §2.1 laissait ouverts, tranchés à l'écriture et testés :

1. **Emplacement.** Pas de sixième onglet : calibrer est une opération unique par
   appareil. L'entrée est dans le Journal, à côté d'Export / Import, et ouvre un écran
   plein le temps de la procédure.
2. **Timbre du clic de calibration.** Le clic de travail **non accentué** — 900 Hz,
   gain 0,18, onde carrée, décroissance 55 ms. L'accent de premier temps (1500 Hz,
   gain 0,34) est une autre attaque, donc une autre latence. La synthèse est extraite
   dans `emettreClic()`, partagée avec le métronome, pour que les deux ne puissent plus
   diverger silencieusement.
3. **Appariement.** Pour chaque clic programmé, la **première** détection dans
   `[t − 50 ms, t + 500 ms]`, et une détection ne sert qu'une fois. Conséquence directe
   du point ouvert f : au haut-parleur, un clic produit deux à trois détections par
   résonance. Sans cette règle, 24 clics en donnent une soixantaine et la médiane est
   sans objet. Corollaire testé : **un clic manqué ne décale pas le suivant d'un cran** —
   un appariement par simple ordre injecterait une erreur de 1000 ms dans la médiane.

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

Reprise **telle quelle** d'`analyse-attaque` **v1.5**, worklet compris (Blob depuis
`<script type="text/plain">`) : `N = 1024`, `HOP = 256`, trame 5,33 ms à 48 kHz,
blanchiment adaptatif, flux spectral, seuil adaptatif médian sur 45 trames.

> **Correction de version, 2026-07-27.** Cette spec a d'abord écrit « v1.6 ». `index.html`
> n'a jamais eu de v1.6 : le dernier commit touchant l'app est la **v1.5** (`7febc61`), la
> v1.6 n'ayant livré que `protocole.html`, `PROTOCOLE.md` et le README. Le fichier de
> référence est donc l'`index.html` v1.5, 57 382 octets.

### 3.0 Deux paramètres distincts, à ne jamais confondre

Le code et l'export en distinguent deux ; la première rédaction de cette spec les avait
fondus sous un seul nom, ce qui aurait figé le mauvais.

| Paramètre | Où | Valeur observée | Rôle |
|---|---|---|---|
| `ecart_min_ms` (`minIOI`) | dans le worklet | 55 ms | temps réfractaire du détecteur : deux montées plus rapprochées ne produisent qu'une détection. |
| `fusion_ms` | après le worklet, `regrouper()` | 120 ms | regroupement des détections en **gestes**. C'est celui que cette spec fige. |

**Règle de regroupement, relevée dans le source v1.5** (`regrouper()`), à reprendre à
l'identique — une reconstitution qui colle aux données peut être fausse, c'est arrivé :

```js
nouveau geste  si   t − geste.tFin > fusion_ms      // écart à la DERNIÈRE détection du geste
               ou   t − geste.t    > 2,5 × fusion_ms // plafond d'étalement, mesuré depuis le chef
```

- le geste porte le temps de son **chef** (première détection) ;
- son intensité est le **maximum** du groupe, **jamais celle du chef** — divergent sur 15
  des 52 gestes de la séance libre du 27, soit 29 % ;
- son étalement est `tFin − t`.

### 3.1 Ce que la capture du 27 dit de `fusion_ms` — **[É]**

Balayage de 120 à 800 ms sur les 13 prises propres, gestes comparés au nombre d'attaques
réellement jouées, fenêtre utile seule :

| `fusion_ms` | écart moyen au nombre attendu | prises à ±10 % |
|---|---|---|
| 120 ms | +41,6 % | 0 / 13 |
| 200 ms | +29,3 % | 3 / 13 |
| 300 ms | +26,3 % | 4 / 13 |
| 500 ms | +31,9 % | 6 / 13 |
| 800 ms | +53,6 % | 0 / 13 |

**Aucune valeur ne convient, et l'optimum apparent est un artefact.** Les erreurs sont de
signes opposés selon la série : en A — une attaque par seconde, corde à vide — 116
détections brutes pour 48 attaques, sur-détection par résonance, que le regroupement
corrige ; en B et C — jeu plus rapide, nuancé — B5 ne produit que 84 détections brutes pour
120 attaques, **sous-détection, que le regroupement ne peut pas corriger** : on ne regroupe
pas ce qui n'a pas été détecté. Le minimum vers 300 ms compense l'une par l'autre sur des
prises différentes, et détruit au passage de vraies attaques rapprochées.

Conséquence pour la note : à 120 ms, la série A porte environ **+33 % de gestes parasites**,
chacun injectant un intervalle court dans `σ_locale`. **ρ est donc surestimé aujourd'hui**,
et ρ est la seule entrée de la table du §10.2. La valeur reste figée à 120 ms faute de
mieux, mais elle n'est pas justifiée — points ouverts **g** et **k**.

Trois changements, et trois seulement :

1. **`fusion_ms = 120`, figé, non exposé** **[P]**. Balayé de 30 à 600 ms sur treize
   prises : l'accroche R ne bouge pas, seul le comptage change — **[É]** pour cette
   invariance. Mais la conclusion « paramètre d'affichage » ne vaut que pour R. Elle est
   **fausse pour le moteur v2** : ρ = σ_locale / pas_grille est bâti sur les intervalles
   successifs et constitue la seule entrée de la note (§10.1). Abaisser le seuil injecte
   des intervalles parasites de quelques dizaines de millisecondes ; ρ enfle et la note
   s'effondre sans que le jeu ait changé. La valeur reste figée à 120 ms et invisible pour
   l'élève, mais **sa justification est à refaire contre ρ, pas contre R** — point ouvert.
2. **Distinction détection / geste conservée.** Toutes les statistiques portent sur les
   gestes. Un accord plaqué produit 1,1 détection par geste, une corde nylon pincée au
   doigt jusqu'à 3,6 : le regroupement n'est pas cosmétique.
3. **Casque verrouillant.** Sans confirmation explicite, pas de mesure. Seule exception :
   l'écran de calibration du §2.

### 3.2 Gestes exclus du parcours de mesure **[É]**

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

### 4.4 σ de phase et σ_locale ne sont pas la même grandeur — **[P]**, point ouvert i

Le test de cohérence interne du §4.2 — « σ = FEN implique ≈ 68 % en cible » — porte sur
l'écart-type de la **phase** : la dispersion des attaques autour de la grille. ρ, lui, est
bâti sur `σ_locale`, écart-type des **intervalles** successifs (§9.2). Les deux ne
coïncident pas.

Pour des écarts indépendants, `σ_IOI = √2 · σ_phase` : un ρ de 6 % correspond alors à un
σ de phase de 4,2 %, donc à ≈ 84 % en cible, pas 68 %. Que l'accord empirique du 27 tienne
(ρ = 6,4 % pour 67 % en cible) signifie donc que **les écarts successifs sont fortement
corrélés** — jeu à dérive dominante plutôt qu'à bruit blanc. C'est une propriété mesurée du
jeu, pas une coïncidence, et elle est intéressante en soi.

Conséquence à ne pas perdre : la colonne « % en cible attendu » de la table du §10.2 n'est
calibrée **que pour ce régime de corrélation**. Sur un jeu à écarts indépendants, les deux
colonnes désigneraient systématiquement des notes différentes et le contrôle de cohérence
crierait « lecture discordante » à tort. Le test 4 porte donc, en attendant l'arbitrage, sur
le σ de phase — la grandeur que la relation concerne réellement.

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

| ρ = σ_locale / pas_grille | % en cible attendu | Bouton pré-coché |
|---|---|---|
| ≤ 4,5 % | ≳ 80 % | **Acquis** — sous réserve du §10.3 |
| 4,5 – 6,0 % | ≈ 68 – 80 % | **Bien** ← jeu de référence |
| 6,0 – 8,0 % | ≈ 55 – 68 % | **En progrès** |
| > 8,0 % | ≲ 55 % | **Débuts** |

Le % en cible sert de **contrôle de cohérence**, pas de second critère : si les deux
colonnes désignent des notes différentes de plus d'un rang, l'app propose la plus basse et
affiche « lecture discordante » — signe habituel d'une dérive de tempo ou d'un passage mal
découpé.

**Libellés définitifs, relevés dans `comping` Passe 2.2 : Débuts · En progrès · Bien ·
Acquis.** Ils qualifient **la carte**, pas la tentative — ce qui impose le plafond du §10.3.

### 10.3 Plafond sur « Acquis » — **[V]** validé 2026-07-27

Les quatre libellés de `comping` décrivent l'état d'une **carte**, pas la qualité d'une
**tentative**. Une prise de 45 s peut légitimement dire « cette tentative était dure » ;
elle ne peut pas établir qu'une carte est acquise — l'acquis est une propriété d'un
historique.

D'où la règle : **la mesure ne pré-coche jamais « Acquis » sur une prise isolée.** Elle
plafonne à « Bien » tant que la condition n'est pas remplie :

> trois mesures **concluantes** (§9.1) consécutives à quadruplet constant (§6),
> toutes à ρ ≤ 4,5 %.

C'est exactement le seuil qui déclenche déjà la montée d'échelon (§7.2) : un seul compteur
sert aux deux, il n'y en a pas deux à tenir synchronisés.

Jean peut évidemment cocher « Acquis » à la main à tout moment. Le plafond porte sur la
*proposition*, jamais sur la décision.

### 10.4 Échelle graduée — **[V]** validé 2026-07-27

Quatre boutons perdent la position *dans* le rang : ρ = 5,9 % et ρ = 4,6 % cochent tous
deux « Bien » et ne sont pas la même prise. Une barre graduée est donc affichée **sous** les
boutons, sans les remplacer.

| Élément | Spécification |
|---|---|
| Axe | linéaire en ρ, **12 % à gauche → 3 % à droite**. Sens de lecture = sens du progrès. Légende « plus régulier → » sous l'axe. |
| Trait plein | la mesure du jour. **σ en millisecondes au-dessus** (grandeur tangible), **ρ en pourcentage en dessous** (seule grandeur comparable d'un tempo à l'autre). |
| Repère fixe | pointillé à **6 %**, libellé « ton habitude ». La barre montre l'écart à la référence, pas une note absolue. |
| Marqueur fantôme | la mesure précédente **au même quadruplet**. Absent s'il n'y en a pas — jamais de zéro par défaut. |
| Zone hachurée | plage « Acquis » hachurée tant que le plafond du §10.3 n'est pas levé. |
| Mesure non concluante | barre en trame pâle, aucun marqueur, motif de rejet écrit. Ni « Débuts », ni 0. |

Deux contraintes fermes : les quatre plages portent leur libellé **écrit** sous la barre —
jamais la couleur seule —, et le marqueur ne s'anime pas sous `prefers-reduced-motion`.

### 10.5 Le cas non concluant n'est pas une mauvaise note

Distinction à ne pas rater à l'implémentation. « Débuts » signifie *représenter tout de
suite* : c'est le bon comportement pour un jeu réellement dispersé. Une mesure **non
concluante** (§9.1 — moins de 24 gestes, Rayleigh non significatif, tempo hors des 3 %)
ne doit **jamais** retomber sur « Débuts » par défaut : elle ne pré-coche rien et rend la
main. Sinon un micro qui décroche se transforme en punition, et l'historique de la carte
enregistre un échec qui n'a pas eu lieu.

### 10.6 Ce qui ne change pas

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
| 2 | Rejeu de `tests/fixtures/protocole-2026-07-27-03-17-23.json` | **1913 détections → 987 gestes** à `fusion_ms = 120`, et le détail des 14 prises. La référence « 293 → 162 » du commentaire de `regrouper()` est **irréproductible** : aucun sous-ensemble de la capture ni de la séance libre ne la donne, le jeu de données d'origine est perdu. |
| 3 | Grille : changement d'échelon de soutien en cours de carte | ancre et `pas_grille` inchangés, `pas_clic` seul modifié |
| 4 | Cohérence FEN/σ : jeu synthétique à ρ = 6 % | % en cible dans [64 %, 72 %] |
| 5 | Mesure à tempo dérivant de 5 % | rejetée, motif « tempo », aucune note proposée |
| 6 | Carte `mesurable: false` | aucune note proposée, mention visible |
| 7 | Absence de calibration | biais masqué, note proposée quand même |
| 8 | Deux quadruplets différents dans l'historique | deux séries distinctes, jamais moyennées |
| 9 | `node --check` + intégrité des références DOM + parcours jsdom | sans erreur |

---

## 14. Ordre de réalisation proposé

1. ~~**Calibration (§2)**~~ — **faite** le 2026-07-27 (`94a208d`). L'annonce « seule brique
   sans dépendance » était fausse : la procédure §2.1 passe par le worklet, donc l'étape 2
   a été entamée en même temps. 20 tests verts, dont le test 9.
2. **Import du worklet et de la statistique (§3, §9)** — worklet **fait** (embarqué
   verbatim, vérifié par `diff`) ; la statistique circulaire reste à porter. Test 1
   (worklet headless sur signal synthétique) exige un banc audio hors navigateur, non
   couvert par la suite actuelle.
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
| g | Justification de `fusion_ms = 120` | **instruit, non clos** — voir §3.1. Ne peut pas se faire par comparaison au nombre d'attaques attendues ; à reprendre contre ρ, sur les seules prises où la détection est saine |
| k | Sensibilité de 2,5 trop haute pour le jeu rapide et nuancé | B5 : 84 détections brutes pour 120 attaques jouées. La sous-détection ne se corrige par aucun regroupement. Conditionne la validité de toute mesure hors corde à vide |
| h | Première calibration réelle | aucune valeur de terrain à ce jour. À relever : nombre de clics entendus sur 24, et ordre de grandeur de la latence — sous 20 ms, le micro capte par le boîtier et non par l'air |
| i | σ de phase contre σ_locale (§4.4) | conditionne la colonne « % en cible » du §10.2 |
| j | Consommateurs du §2.3 | `calibrationCourante()` est exposée, rien ne l'appelle encore : le masquage du biais arrive à l'étape 5 |
| f | Origine des doublons à 59–75 ms | **tranché** : redéclenchement sur la résonance du corps à la sortie du temps réfractaire, pas le balayage des cordes — un accord plaqué ne produit que 1,1 détection par geste. `fusion_ms = 120` les absorbe. |

---

## 16. Consolidation du développement — 2026-07-27

Le moteur de mesure et `analyse-attaque` étaient développés dans deux fils séparés. Ils ne
le sont plus : **tout se fait désormais dans le projet `comping`**. Motif immédiat — deux
sessions ont travaillé le même dépôt sur des bases différentes, l'une écrivant une v1.6
d'`index.html` qui n'a jamais existé, l'autre s'apprêtant à écraser un README enrichi
entre-temps.

Ce que la consolidation exige, et qui n'est pas encore en place :

**Corrigé le 2026-07-27 : les trois pièces sont en place.** Le `README.md` fusionné
(43 498 o) et `CDC-PROTOCOLE-V2.md` (10 713 o) étaient déjà dans `analyse-attaque` ; la
capture complète du protocole a été versée dans `comping/tests/fixtures/` (`9e55357`,
239 821 o, 14 prises, 1913 détections).

Inventaire vérifié par l'API le 2026-07-27 :

- **`comping`** : `index.html`, `SPEC-MESURE.md`, `README.md`, `tests/mesure-tests.js`,
  `tests/calibration-tests.js`, `tests/fixtures/` (séance libre + protocole).
- **`analyse-attaque`** : `index.html` v1.5, `README.md`, `PROTOCOLE.md`,
  `CDC-PROTOCOLE-V2.md`, `protocole.html`.

Aucun fichier du moteur ne vit désormais ailleurs que dans les dépôts. **Une session
ne doit plus travailler sur une copie** : elle lit le dépôt par l'API, avec la clé
demandée à Jean au démarrage.
