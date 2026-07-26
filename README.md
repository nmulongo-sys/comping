# comping

Application d'entraînement quotidien à la guitare rythmique : le temps disponible est
le seul réglage, tout le reste — plan de séance, quantité de nouveautés, file de
révision — en découle.

**En ligne** : https://nmulongo-sys.github.io/comping/
**Statut** : Passe 2.2 — séance autonome sur un seul écran, piste médiator, chapitres, récursivité. Fichier HTML unique, aucune dépendance, fonctionne hors ligne.

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
- **Journal** — historique, série de jours consécutifs, état de l'entretien, export JSON.

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
{ version, dureeSeance, metro{…}, cartes[…], journal[…], introJour{date,n} }
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

## Journal de développement

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
