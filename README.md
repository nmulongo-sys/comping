# comping

Application d'entraînement quotidien à la guitare rythmique : le temps disponible est
le seul réglage, tout le reste — plan de séance, quantité de nouveautés, file de
révision — en découle.

**En ligne** : https://nmulongo-sys.github.io/comping/
**Statut** : Passe 2.2 — séance autonome sur un seul écran, piste médiator, chapitres, récursivité. Fichier HTML unique, aucune dépendance, fonctionne hors ligne.
**En chantier** : moteur de mesure du jeu (calibration de latence, détection d'attaques, note proposée). Spécifié dans `SPEC-MESURE.md`, étapes 1 à 5 livrées, pas encore branché dans l'interface.

## Utilisation

Ouvrir `index.html` dans un navigateur, ou l'installer via GitHub Pages sur mobile.
Aucun compte, aucune installation ; toutes les données restent dans le navigateur.

Cinq onglets :

- **Séance** — régler la durée (8 à 75 min), puis lancer. Une séance en cours affiche
  **sur un seul écran** : l'exercice concret du bloc, son métronome déjà réglé, le
  décompte du bloc, les jalons des cinq blocs et le temps restant sur la séance
  entière. Aucun changement d'onglet n'est nécessaire pendant qu'on joue.
- **Chapitres** — le programme complet, par difficulté croissante. Chaque chapitre
  affiche sa difficulté isolée, ses cartes et **sa pièce d'application**, avec la raison
  technique du choix de cette pièce.
- **Métronome** — cadran de mesure, accent sur 2 et 4, croches swinguées, trous
  silencieux, tempo progressif, tap tempo. Verrouillage de veille écran.
- **Cartes** — file de révision espacée. **Chaque exercice embarque son propre
  métronome**, déjà réglé (mesure, subdivision, swing, accents, trous, rampe) ; le
  tempo de travail est mémorisé par carte.
- **Journal** — historique, série de jours consécutifs, état de l'entretien, export JSON,
  et **calibration de latence** de l'appareil (« Calibrer cet appareil »). Calibrer est une
  opération unique par appareil, d'où l'absence de sixième onglet.

## Architecture & conventions

Fichier unique `index.html` : styles, balisage et script dans l'ordre. Le script est
découpé en sept sections numérotées en commentaire (état, navigation, audio, SRS,
séance, journal, démarrage).

### Persistance

Une seule clé `localStorage` : `comping_v2`. Écriture différée de 250 ms.
Au chargement, le corpus du code fait autorité sur le **contenu** des cartes (titre,
consigne, critère, prérequis, préréglages) et la sauvegarde sur la **progression**
(statut, intervalle, échéance, records) : ajouter des cartes dans le source ne détruit
pas l'historique.

```
{ version, dureeSeance, metro{…}, cartes[…], journal[…], introJour{date,n},
  calibration{ <empreinte>: {latence_ms, dispersion_ms, n, date, sr} } }
```

**Carte** : `{ id, chapitre, type, main, titre, consigne, critere, rythme, preset,
requiert[], bpmCible, bpmTravail, bpmRecord, statut, ef, interval, due, reps, lapses,
rappels, dernierVu }`
`type` ∈ `transition | rythme | mediator | notion | piece | voicing`
`main` ∈ `mediator | doigts | indifferent` — sert de piste technique et de filtre
`statut` ∈ `neuf | apprise` · les `id` du corpus sont des slugs stables, car `requiert[]`
les référence
`due` est une date locale `AAAA-MM-JJ`, jamais un horodatage UTC — l'arithmétique de
dates passe par `plusJours()` / `ecartJours()` qui construisent des `Date` locales,
pour éviter la dérive de fuseau sur les intervalles longs.

**Journal** : `{ date, minutes, blocs }`, plus récent en tête, plafonné à 400 entrées.
Deux séances le même jour sont cumulées sur une seule entrée.

### Métronome

Ordonnanceur anticipé, pas de `setInterval` audio : une boucle de 25 ms programme
toutes les attaques tombant dans les 120 ms à venir (`prochainTemps`, `avancer()`,
`ordonnancer()`). Le visuel est découplé — les événements programmés sont empilés dans
`fileVisuelle` et dépilés par `requestAnimationFrame` quand `ctx.currentTime` les
rattrape. C'est ce qui garantit que le cadran ne dérive pas du son.

Conventions :
- **Swing** : en subdivision croches, la croche forte occupe 2/3 du temps, la faible 1/3.
- **Repère** (`repere`), trois valeurs, trois exercices distincts :
  `tous` — chaque temps sonne, 1 accentué ;
  `accent24` — chaque temps sonne, 2 et 4 à 1180 Hz / gain 0,30 contre 700 Hz / 0,09 pour 1 et 3 ;
  `seuls24` — 1 et 3 **ne produisent aucun son**, subdivisions comprises ; le compteur tourne.
  Un temps silencieux est dessiné en contour vide, sur le cadran comme dans le bandeau.
- **Trous silencieux** : `mesure % (jouées + muettes) >= jouées` coupe l'audio mais pas
  le compteur — le cadran continue de tourner, en pointillé et en gris.
- **Tempo progressif** : évalué en fin de mesure uniquement.

### Révision espacée

SM-2 simplifié, quatre notes (0 Encore, 1 Dur, 2 Bien, 3 Facile). Facilité `ef` bornée
à [1.3 ; 2.8]. Un « Encore » remet l'intervalle à 0 et replace la carte en fin de file
du jour. Progression typique en « Bien » : 1 → 3 → 8 → 20 → 50 → 125 jours.

### Couplage durée ↔ progression

C'est le point de conception central. La durée de séance détermine le bloc « cartes »
(20 % du total), qui détermine une capacité (≈ 45 s par carte), qui détermine le quota
de nouveautés du jour : `min(5, capacité / 2)`. Les cartes du corpus naissent au statut
`neuf` et ne sont introduites qu'à ce rythme. Une séance courte n'est donc pas une
séance tronquée : c'est une progression plus lente, mais dont la dette de révision
reste remboursable.

### Métronome embarqué

Le moteur audio est un **singleton** (`Moteur`) qui reçoit un objet de réglages et une
*cible d'affichage* `{ id, surTemps, surTempo, surArret }`. Deux cibles existent : le
cadran de l'onglet Métronome (`id:"cadran"`) et les bandeaux embarqués dans les
exercices (`id:"embN"`). Un seul clic peut sonner à la fois — `Moteur.basculer()`
arrête la cible précédente avant de démarrer la nouvelle, et rebascule le bouton de
l'onglet Métronome sur « Démarrer ».

Chaque carte porte un `preset` complet. Ouvrir un exercice construit son bandeau, qui
affiche en clair ce qui est préréglé (« trous 2 jouées / 2 muettes », « accent 2 et 4 »,
« progressif +4 toutes les 8 mes. »). Les boutons ± écrivent dans `bpmTravail`, valeur
reprise à la révision suivante ; `bpmRecord` retient le meilleur tempo atteint.

### Récursivité : quatre mécanismes

Le point de conception de cette passe. Objectif : qu'un acquis ne quitte jamais la
rotation.

1. **Plafond d'intervalle** — `interval` est borné à `PLAFOND_INTERVALLE` (90 j).
   Aucune carte ne peut sortir du calendrier, même parfaitement maîtrisée.
2. **Rappel contextuel** — chaque carte déclare `requiert[]`. Une note ≥ « Bien »
   déclenche `crediterPrerequis()` : chaque prérequis voit son intervalle étendu de
   `CREDIT_RAPPEL` (×1,15) et son échéance repoussée, parce qu'il vient d'être joué
   *à l'intérieur* de l'exercice réussi. Compté dans `rappels`, affiché à l'écran.
3. **Entrelacement** — `entrelacer()` réordonne la file pour que deux cartes voisines
   ne partagent pas leur `type`, par répartition depuis les paquets les plus gros.
4. **Brassage** — s'il reste de la capacité, `brassage()` repêche jusqu'à 2 cartes
   apprises non dues, triées par `dernierVu` le plus ancien.

Un prérequis non acquis **verrouille** la carte : `debloquee()` filtre les nouveautés,
donc l'ordre d'introduction suit le graphe, pas seulement le numéro de chapitre.

### Chapitres et pièce d'application

`CHAPITRES` est ordonné par difficulté (`palier` 0 à 6). Chaque entrée porte un `focus`
— la difficulté unique isolée — et une `piece` : titre, grille, mesure, et surtout
`pourquoi`, la justification technique du choix. Les chapitres marqués `avenir:true`
sont affichés mais sans cartes ; ils annoncent la suite du programme.

Les pièces des chapitres ouverts sont des **formes traditionnelles ou du domaine
public** (blues 12 mesures, « Ah ! vous dirai-je, maman », « Scarborough Fair »,
« House of the Rising Sun », shuffle en Mi). Les chapitres avancés renvoient au recueil
personnel de l'utilisateur : l'app ne reproduit aucune partition sous droits.

### Piste médiator

22 cartes sur 46 portent `main:"mediator"`, réparties sur les chapitres 2, 3 et 5, et
filtrables. La progression est écrite pour un guitariste **venant du classique** : la
carte pivot est `med-appui`, qui présente l'attaque au médiator comme un transfert du
geste de butée déjà connu, et le glossaire nomme explicitement l'atout (l'appui) et le
piège (l'étouffement des cordes voisines, que les doigts assuraient gratuitement).

### Notation rythmique

`↓` frappe descendante · `↑` frappe montante · `·` la main passe sans toucher les cordes.
Les groupes sont séparés par une espace, un groupe = un temps. Exemple du patron à
trou : `↓ ↓↑ ·↑ ↓↑`.

### Paliers

Portés par les chapitres, de 0 à 6 : 0 socle mécanique · 1 accords ouverts et prise du
médiator · 2 aller-retour, syncope, dynamique · 3 barrés et shell voicings ·
4 Freddie Green et comping · 5 drop 2 / drop 3 · 6 modes et improvisation.
Chapitres 0 à 5 peuplés (46 cartes) ; 6 à 11 déclarés avec leur pièce, sans cartes.

### Style

Sépia / crème / ocre-or, Cormorant Garamond (titres, chiffres) et Work Sans (texte),
chargées depuis Google Fonts avec repli système — l'app reste fonctionnelle hors ligne,
seule la typographie dégrade. Mobile d'abord : onglets bas fixes, cibles tactiles ≥ 44 px,
`prefers-reduced-motion` respecté, focus clavier visible.

## Moteur de mesure (en chantier)

`comping` mesure le jeu et **propose** une note ; il ne la décide pas. Cette phrase
gouverne tout le reste du moteur.

**`SPEC-MESURE.md` est le document qui fait autorité** (v0.8). Le code ne le précède
jamais : spec d'abord, tests ensuite, code en dernier. Un test rouge tant que la fonction
n'existe pas n'est pas une panne — c'est l'ordre de marche.

### Calibration de latence (§2)

Boucle acoustique : l'app émet 24 clics par le haut-parleur et les réentend par le micro.
Le clic de calibration est le clic de travail **non accentué** (900 Hz, gain 0,18, carrée,
décroissance 55 ms), synthétisé par `emettreClic()` partagée avec le métronome — l'accent
de premier temps est une autre attaque, donc une autre latence.

**Appariement par consensus** (`apparier`, §2.5), imposé par le terrain : la règle
naïve — première détection de la fenêtre — visait la résonance, qui *suit* l'attaque, et
n'a aucune défense contre un bruit ambiant qui la *précède*. Six refus d'affilée le
2026-07-27, 136 détections brutes pour 24 clics, alors que la boucle donnait 200 ms à
±3 ms. Le retard retenu est désormais celui sur lequel les clics **s'accordent** : support
maximal à ±10 ms, puis chaque clic prend sa détection la plus proche du consensus à ±20 ms.

**Verdict** (`verdictCalibration`) : rejet en deçà de 20 clics entendus ou au-delà de 15 ms
d'écart interquartile — l'interquartile, pas l'écart-type, parce qu'il résiste aux clics
manqués ou doublés. Rien n'est enregistré en cas de rejet : une calibration douteuse est
pire que pas de calibration, elle déplacerait le biais affiché sans le dire.

Le registre est **indexé par appareil** (`empreinteAppareil()`, hachage djb2 grossier sur
agent + fréquence + latence déclarée) : il évite de réutiliser la latence d'un autre
téléphone, il n'identifie pas une machine.

Sans calibration l'app **fonctionne** : σ, ρ, % en cible, accroche et note restent
disponibles. Seule la lecture du placement en avant / en arrière est masquée, faute de
pouvoir distinguer le jeu du matériel.

### Chaîne de détection (§3)

Le détecteur est un `AudioWorkletProcessor` **embarqué verbatim** depuis
`analyse-attaque` v1.5, dans `#src-detecteur` : aucune ligne n'en a été retouchée, et un
test le vérifie. Trois constantes, non exposées à l'utilisateur :

| Constante | Valeur | Rôle |
|---|---|---|
| `SENS_DETECTION` | 2,5 | seuil de déclenchement. Suffisant pour des clics isolés (24/24 à la calibration), **trop haut pour le jeu rapide et nuancé** — point ouvert. |
| `ECART_MIN_MS` | 55 | temps réfractaire **du détecteur**. |
| `FUSION_MS` | 120 | regroupement des détections en **gestes**, après coup. |

Les deux derniers se confondent facilement ; ils ne mesurent pas la même chose.
`regrouper()` est **porté à l'identique** depuis v1.5, pas reconstruit : un groupe s'ouvre
sur un chef, absorbe toute détection à ≤ `fusion` de la **dernière** du groupe et à
≤ 2,5 × `fusion` du chef, porte le temps du chef et l'intensité **maximale** du groupe.

### Deux pas, jamais le même (§4.1)

- **`pasGrille(bpm, subdivision)`** — la grille d'évaluation, imposée par la carte. C'est
  contre elle que les phases sont calculées, et elle ne dépend pas de ce qui est entendu :
  couper le clic ne coupe pas la grille.
- **`pasClic(bpm, echelon, tempsParMesure, subdivision)`** — ce qui est entendu, imposé
  par l'échelon de soutien. Renvoie `null` quand il n'y a pas de clic à intervalle
  constant ; la grille interne continue seule et la mesure reste possible.

La subdivision est **obligatoire à l'échelon 0** — « temps + subdivision » veut dire
`pas_clic = pas_grille`, et sans elle la fonction ne peut pas répondre : elle renvoie
`null` plutôt qu'une valeur plausible. À l'échelon 3 (`seuls24`), le pas dépend du nombre
de temps et non du seul 4/4 : en deçà de quatre temps le temps 4 n'existe pas, il ne reste
qu'un clic par mesure, et un clic par mesure est régulier.

| Mesure | Clics | `pas_clic` à l'échelon 3 |
|---|---|---|
| 2/4, 3/4 | temps 2 | `T × noire` |
| 4/4 | temps 2 et 4 | `2 × noire` |
| 5/4, 6/8 | temps 2 et 4 | `null` — intervalles inégaux |

### Grandeurs (§9.2)

Statistique circulaire sur les phases : **R** (accroche), **Rayleigh** (p-valeur),
**biais** (angle moyen), **σ_grille**. Deux ajouts propres à `comping` :

- **σ_locale** — écart-type d'**échantillon** (n−1) des intervalles entre gestes
  successifs. Immune à la dérive, c'est elle qui nourrit la note. v1.5 ne la calculait
  pas : son « Régularité (σ) » affichait σ_grille.
- **ρ = σ_locale / pas_grille** — la seule grandeur comparable d'un tempo à l'autre.
  Référence mesurée : **ρ ≈ 6 %, stable de 333 à 1000 ms**.

Le **% en cible** est calculé par différence **circulaire** autour du biais : sans repli,
les gestes qui enjambent ±pas/2 étaient perdus (observé à 215 ms de biais pour 166 ms de
demi-pas).

Le biais **s'affiche, il ne se note pas**. Il ouvre une question posée à l'élève —
« tu poses en arrière — voulu ou subi ? » — jamais tranchée par la machine.

### Concluance et note (§9.1, §10)

Une mesure est *concluante* si elle passe quatre garde-fous, **dans cet ordre** : ≥ 24
gestes, tempo joué à ≤ 3 % du tempo réglé, Rayleigh p < 0,001, accroche R > 0,25. Le tempo
**avant** Rayleigh : une dérive de 5 % couche R mécaniquement, et le motif utile est la
cause, pas le symptôme.

La note ne connaît que **deux entrées** : ρ et % en cible. Ni le biais, ni la dynamique, ni
la latence — jamais, même calibrée.

| ρ | % en cible attendu | Note pré-cochée |
|---|---|---|
| ≤ 4,5 % | ≳ 80 % | **Acquis**, sous réserve du plafond |
| 4,5 – 6,0 % | 68 – 80 % | **Bien** ← jeu de référence |
| 6,0 – 8,0 % | 55 – 68 % | **En progrès** |
| > 8,0 % | ≲ 55 % | **Débuts** |

La table est ancrée sur ρ ≈ 6 % = « Bien » : elle mesure l'**écart à l'habitude**, pas une
qualité absolue. Le % en cible n'est qu'un contrôle de cohérence — au-delà d'un rang
d'écart, l'app propose la plus basse des deux et affiche « lecture discordante ».

Deux règles de sûreté encadrent la table :

- **Jamais « Acquis » sur une prise isolée.** Les quatre libellés qualifient une *carte*,
  pas une *tentative* ; l'acquis est une propriété d'un historique. La proposition
  plafonne à « Bien » tant que les trois dernières mesures au même quadruplet ne sont pas
  toutes concluantes et à ρ ≤ 4,5 %. `serieAcquise()` est **le** compteur : la montée
  d'échelon le lit au même endroit, il n'y en a pas deux à synchroniser.
- **Une mesure non concluante ne retombe jamais sur « Débuts ».** « Débuts » est une note,
  pas un constat d'échec de mesure : elle ne pré-coche rien et expose son motif de rejet.
  Sinon un micro qui décroche devient une punition, et l'historique enregistre un échec
  qui n'a pas eu lieu.

### Bloc de fonctions pures, et son extraction

Les fonctions du moteur vivent dans `index.html`, entre les marqueurs
`/* ── fonctions pures de mesure, testables sous Node ─` et
`/* ── fin des fonctions pures de mesure ─`. Elles ne sont **jamais recopiées** ailleurs :
`tests/mesure-pur.js` les **extrait** du HTML à l'exécution et les exporte en CommonJS.
Une copie dériverait en silence ; un extrait ne le peut pas.

Conséquence contraignante : **aucune référence au DOM, à `window`, à `ctx` ni à l'état `S`
ne doit entrer dans ce bloc**, sinon l'extraction casse. Toute fonction ajoutée au bloc
doit l'être aussi à la liste `EXPORTES` de `tests/mesure-pur.js` — c'est la seule
frontière.

### Tests

```
node tests/mesure-tests.js        # 21 tests — moteur de mesure
node tests/calibration-tests.js   # 23 tests — calibration
```

Aucune dépendance : ni npm, ni navigateur, ni `AudioContext`. Les deux suites lisent
`index.html` directement. `tests/fixtures/` porte des captures réelles — séance libre
(82 détections / 52 gestes), protocole complet (14 prises, 1913 détections), session de
calibration refusée — qui servent de références reproductibles : `regrouper` est vérifié
contre la sortie réelle de v1.5, pas contre une reconstitution.

Deux tests n'y figurent pas et le resteront tant qu'il n'y aura pas de banc audio hors
navigateur : le worklet sur signal synthétique, et la boucle acoustique de bout en bout.

## Journal de développement

### 2026-07-28 — `pasClic` : les deux points posés par le code sont arbitrés
- Deux comportements que le code avait fixés seuls, faute d'arbitrage, et qui se sont
  révélés **faux tous les deux sur des cartes du corpus existant**. Consignés en
  `SPEC-MESURE.md` §7.3 avant correction.
- **Subdivision obligatoire à l'échelon 0.** Le défaut à 2 (croches) donnait un clic en
  croches contre une grille en triolets pour `ar-triolets` et en doubles pour
  `ar-doubles` — toutes deux à 60 bpm, donc à l'échelon 0 de départ. `pasClic` renvoie
  désormais `null` quand la subdivision manque : une absence visible plutôt qu'une réponse
  plausible et fausse. Le test T3 ne l'avait pas vu parce qu'il est écrit avec `sub = 2`,
  ce que le défaut satisfaisait exactement ; il passe maintenant la subdivision.
- **Échelon 3 : le pas dépend du nombre de temps, pas du seul 4/4.** En deçà de quatre
  temps, le temps 4 n'existe pas et il ne reste qu'un clic par mesure — parfaitement
  régulier. `scarborough` est en 3/4 et la progression du §7.2 l'y amènera : le métronome
  y cliquait bel et bien une fois par mesure pendant que `pasClic` répondait qu'il n'y
  avait pas de clic. Règle retenue : `T ≤ 3` → `T × noire`, `T = 4` → `2 × noire`,
  `T ≥ 5` → `null`.
- Deux tests ajoutés (T3d, T3e), écrits avant la correction et rouges jusqu'à elle.
  Suite de mesure portée à **23/23**.
- Reste ouvert, et non tranché ici : `seuls24` a-t-il un sens musical en 6/8 ? Ce n'est
  pas une question de mesure.

### 2026-07-28 — Moteur de mesure, étape 5 : la note proposée
- `noteProposee()` écrite, avec `rangRho()`, `rangCible()` et `serieAcquise()` — dernier
  morceau de fonction pure avant le branchement dans l'interface. Les six tests en attente
  passent : la suite de mesure est à **21/21**, la calibration reste à **23/23**.
- `serieAcquise(historique, quadruplet)` est le compteur **unique** du plafond « Acquis »
  et de la montée d'échelon : une seule lecture, appelée au même endroit par les deux
  règles, plutôt que deux comptages à tenir synchronisés.
- Quatre décisions d'implémentation consignées en `SPEC-MESURE.md` §10.7 plutôt que
  laissées dans le code : bornes de la colonne « % en cible » (80 / 68 / 55, bornes basses
  incluses, marquées provisoires), ordre des trois règles, échec fermé sur la concluance,
  lecture de l'historique.
- **Échec fermé** : sans `{ok:true}` explicite, aucune note n'est proposée. La règle « une
  mesure non concluante ne pré-coche rien » est une règle de sûreté — elle ne doit pas
  dépendre de la discipline de l'appelant.
- Conséquence non fortuite de l'ordre retenu : une lecture discordante ne peut jamais
  retenir « Acquis », puisqu'elle prend déjà la plus basse des deux lectures.
- `index.html` modifié de façon **purement additive** : 92 lignes ajoutées, 0 supprimée.
  Worklet intact.

### 2026-07-27 — Moteur de mesure, étapes 1 à 4 : calibration, détection, statistique
- **Spécification d'abord.** `SPEC-MESURE.md` rédigé et validé avant toute ligne de code,
  puis porté de v0.1 à v0.7.1 au fil des arbitrages. Les tests sont écrits avant le code
  et restent rouges jusqu'à ce qu'il existe.
- **Calibration de latence livrée** : boucle acoustique de 24 clics, appariement,
  verdict, registre indexé par appareil, migration `comping_v2.1 → v2.2`. Entrée dans le
  Journal, pas de sixième onglet.
- **Première calibration de terrain, et son enseignement.** Six refus d'affilée
  (dispersions de 88,7 à 193,8 ms) attribués à tort à l'appareil : sous le bruit, la
  boucle était saine — 21 clics à +197…+203 ms. Le coupable était l'**appariement
  glouton**, qui prenait la première détection de la fenêtre, presque toujours un bruit
  antérieur à l'arrivée du clic. Remplacé par l'appariement par consensus (§2.5),
  réfractaire abaissé à 30 ms pendant la calibration seule. Résultat sur l'appareil de
  référence : **200 ms, dispersion 3 ms, 24 clics sur 24**, enregistré.
- **Worklet importé verbatim** depuis `analyse-attaque` v1.5, vérifié par `diff` et par un
  test dédié. `regrouper()` porté à l'identique et vérifié contre la sortie réelle de
  v1.5 : 82 détections → les 52 gestes, exacts. Une reconstitution qui collait aux données
  s'était déjà révélée fausse.
- **Statistique circulaire portée**, plus deux ajouts propres à `comping` : σ_locale
  (écart-type d'échantillon des intervalles successifs) et le % en cible en différence
  circulaire — v1.5 comparait sans repli et perdait les gestes enjambant ±pas/2.
- **Ordre des motifs de rejet fixé** : gestes, tempo, Rayleigh, accroche. Le tempo avant
  Rayleigh, parce qu'une dérive couche R mécaniquement et que le motif utile est la cause.
- **Deux points instruits et laissés ouverts, plutôt que masqués** : `fusion_ms = 120`
  n'est pas justifiable par le comptage (les erreurs sont de signes opposés — sur-détection
  par résonance d'un côté, sous-détection de l'autre, que nul regroupement ne corrige), et
  la sensibilité de 2,5 est trop haute pour le jeu rapide et nuancé.
- Fixtures versionnées (séance libre, protocole complet, session de calibration refusée)
  pour que les tests s'appuient sur des références reproductibles.

### 2026-07-26 — Passe 2.2 : la séance devient autonome sur un seul écran
- **Défaut de conception corrigé.** Le déroulé de séance n'affichait qu'un nom de bloc,
  un décompte et un conseil générique : le contenu était dans l'onglet Cartes et le
  métronome dans l'onglet Métronome. Il fallait donc changer d'onglet en pleine séance,
  guitare en main, et le décompte disparaissait dès qu'on le faisait.
- Le rendu d'un exercice (consigne, notation rythmique, métronome préréglé, critère,
  boutons de notation) est factorisé dans `rendreExercice(carte, hôte, options)`, servant
  désormais l'onglet Cartes **et** le déroulé de séance. L'ancien balisage statique
  `#rev-*` est supprimé.
- `contenuBloc(id)` choisit l'exercice concret de chaque bloc : échauffement — le repère
  le plus exigeant déjà acquis, sinon le pendule ; drill — la carte médiator ou notion en
  tête de file, à défaut la carte du chapitre au plus faible record ; nouveauté — la
  première carte débloquée, notée sur place ; application — la pièce du chapitre avec sa
  grille et sa mesure (carte de type `piece` du chapitre, ou carte volatile via
  `cartePiece()`) ; cartes dues — la file du jour jouée en ligne, avec notation.
- Ajout des jalons de séance (cinq segments) et du temps restant global, rafraîchis à
  chaque seconde. Le métronome s'arrête à chaque changement de bloc et en fin de séance.
- Garde-fou sur `scrollIntoView`, absent de certains contextes d'exécution.
- Validation headless jsdom : chargement sans erreur, parcours des cinq blocs, présence
  de l'exercice et du métronome préréglé dans chacun, démarrage et arrêt du métronome
  depuis la page de séance, révision de l'onglet Cartes intacte, aucune erreur runtime.

### 2026-07-26 — Passe 2.1 : le repère devient un réglage à trois valeurs
- **Défaut corrigé.** Le booléen `jazz` accentuait 2 et 4 mais laissait sonner tous les
  temps, alors que le libellé, le glossaire et la consigne de la carte annonçaient un clic
  sur 2 et 4 *seulement*. Le texte promettait un exercice que le code ne produisait pas.
- Remplacement par `repere` à trois valeurs — `tous`, `accent24`, `seuls24` — dans le
  moteur, le cadran, le bandeau embarqué et l'onglet Métronome (case à cocher remplacée
  par un sélecteur). En `seuls24`, les temps 1 et 3 sont réellement muets, subdivisions
  comprises, et s'affichent en contour vide.
- Carte `deux-quatre` scindée en deux exercices distincts : « Accent sur 2 et 4 »
  (`accent24`) puis « Sur 2 et 4 seulement » (`seuls24`), le second ayant le premier pour
  prérequis. `ar-24` et `syncope-24` basculent en `seuls24` et dépendent désormais du
  second ; `shuffle-mi` reste en `accent24`, un shuffle ayant besoin de sa pulsation.
- Entrée de glossaire réécrite : « Les trois repères », qui présente les trois réglages
  comme trois exercices de difficulté croissante plutôt que comme une option cosmétique.
- Migration transparente à l'ouverture : `jazz:true` devient `accent24`, `jazz:false`
  devient `tous`. Corpus porté à 46 cartes ; graphe de prérequis revalidé (aucun cycle,
  toutes atteignables).

### 2026-07-26 — Passe 2 : médiator, chapitres, récursivité, métronome par exercice
- **Piste médiator** ajoutée (22 cartes) : tenue, pression, angle, appui présenté comme
  transfert de la butée classique, étouffement des voisines, traversée, aller-retour,
  inside/outside, triolets, doubles, saut de corde, palm mute, hybride médiator + doigts.
  Nouvelle entrée de glossaire « Venir de la guitare classique » nommant l'atout et le piège.
- **Chapitres** : 12 chapitres ordonnés par difficulté, chacun avec une difficulté isolée
  et une pièce d'application justifiée techniquement. Chapitres 0 à 5 peuplés.
  Pièces choisies dans le domaine public ou les formes traditionnelles ; les chapitres
  avancés renvoient au recueil personnel plutôt que de reproduire une partition sous droits.
- **Récursivité** : plafond d'intervalle à 90 j, rappel contextuel via `requiert[]`
  (+15 % sur les prérequis d'un exercice réussi), entrelacement par type, brassage des
  items les plus anciennement revus. Verrouillage des cartes dont les prérequis manquent.
- **Métronome embarqué** : refonte du moteur audio en singleton à cible d'affichage
  interchangeable. Chaque carte porte un `preset` complet et affiche son propre transport
  dans la vue de révision et dans le tiroir de détail ; 24 cartes sur 45 ont un préréglage
  non standard (2 avec trous silencieux, 4 avec accent 2 et 4, 1 swing, 1 tempo progressif,
  3 en mesure autre que 4/4).
- Migration de clé `comping_v1` → `comping_v2`, avec fusion : le corpus fait autorité sur
  le contenu des cartes, la sauvegarde sur la progression.
- Validation : syntaxe JS, références DOM, graphe de prérequis (45 cartes, aucun cycle,
  toutes atteignables, aucun prérequis en chapitre postérieur), puis simulation de
  180 jours de séances à 25 min — 45/45 cartes introduites, écart maximal depuis la
  dernière révision 12 jours pour un plafond théorique de 90, aucune carte abandonnée.

### 2026-07-26 — révision initiale (Passe 1 : socle)
- Création de l'app : métronome Web Audio, moteur de révision espacée, générateur de
  séance piloté par la durée, journal.
- Décision de conception : la durée de séance est le seul paramètre d'entrée ; le rythme
  d'introduction des nouveautés en est dérivé plutôt que choisi par l'utilisateur.
- Ordonnanceur audio anticipé (25 ms / 120 ms) retenu contre `setInterval`, avec file
  visuelle découplée.
- Corpus initial : 21 cartes, paliers 0 à 2 (4 notions, 12 transitions, 5 patrons rythmiques).
- Calibrage du quota de nouveautés : première formule (`capacité / 4`) donnait 1 item
  par jour à 25 min, soit 21 jours pour couvrir le socle — corrigé en `capacité / 2`,
  ce qui donne 3 items par jour à 25 min.
- Validation : syntaxe JS, cohérence des références DOM, répartition des blocs vérifiée
  exhaustivement de 8 à 75 min (somme exacte, aucun bloc sous 1 min), arithmétique de
  dates sur changement de mois et année bissextile, courbe SRS.
- Reste à faire (Passe 2) : diagrammes d'accords, bande de battement défilante
  synchronisée au métronome, corpus des paliers 0-2 complété.

## Licence

Aucun fichier `LICENSE` dans le dépôt à ce stade : tous droits réservés par défaut.
