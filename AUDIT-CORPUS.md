# Audit du corpus — 46 cartes, chapitres 0 à 5

> Établi le 2026-07-28, sur `index.html` relu depuis `nmulongo-sys/comping@main`
> (172 749 octets, `const CORPUS` l. 741). Audit automatisé (graphe, presets,
> durées) puis relecture manuelle des consignes et critères.
> Périmètre : les 46 cartes existantes. Les chapitres 6 à 11 (vides) sont hors champ.

---

## 1. Ce qui est sain

Le graphe de prérequis est **propre** : 0 identifiant en double, 0 prérequis
cassé, 0 auto-référence, 0 cycle, 0 dépendance « en avant » (aucune carte
n'exige une carte d'un chapitre ultérieur). 16 dépendances inter-chapitres
existent et vont toutes dans le bon sens.

Les 4 cartes `mesurable:false` portent chacune leur motif (§3.2 × 3, point
ouvert k × 1), conformément à la règle. La notation française est tenue
partout. Les quatre cartes pièce des chapitres écrits pointent vers du domaine
public, comme annoncé.

---

## 2. Constats, du plus grave au plus léger

### A. Les critères et la fenêtre de mesure ne parlent pas de la même durée

**19 cartes mesurables exigent plus longtemps que les 45 s de la fenêtre de
mesure.** Recalcul avec le `temps` réel du preset :

| Carte | Critère | Durée réelle |
|---|---|---|
| med-tenue | 2 minutes | 120 s |
| ar-vide | 32 mesures | 110 s |
| noires, six-huit | 32 / 16 mesures | 96 s |
| ar-triolets, ar-saut, med-pression | 16 mesures | 64 s |
| ar-inside, hybride | 16 mesures | 59 s |
| deux-quatre, seuls-24, med-angle, ar-outside, patron-trou, syncope-24 | 16 mesures | 55 s |
| ar-24, croches, accent-1 | 16 mesures | 51 s |

Seules **pendule** (27 s) et **anticipation** (27 s) tiennent dans la fenêtre.
Conséquence : la mesure ne peut **jamais** certifier un critère — elle
échantillonne 45 s d'un exercice dont la réussite se joue sur 51 à 120 s.
Ce n'est pas un bug du moteur, c'est une incohérence de contenu. Trois issues
possibles, à trancher : (a) raccourcir les critères à ≤ 45 s ; (b) assumer que
la mesure échantillonne et le dire dans le critère ; (c) allonger la fenêtre —
mais c'est rouvrir la mesure, exclu dans ce fil.

### B. Le chapitre 4 est deux chapitres qui ne se rencontrent pas

Le chapitre s'appelle « Le trou et la syncope », sa pièce est en **6/8**.
Or les quatre cartes qui portent le trou et la syncope — `croches`,
`patron-trou`, `anticipation`, `syncope-24` — sont toutes en **4/4**
(`temps:4, sub:2`). Seules `six-huit` et `rising-sun` sont en 6/8, et elles ne
travaillent ni le trou ni la syncope : c'est un arpège régulier.

Les compétences qui donnent son titre au chapitre ne sont donc jamais
appliquées à sa pièce. `anticipation` (4/4) est prérequis de `rising-sun`
(6/8) : l'idée transfère, la mesure non.

Au passage, **le point ouvert « seuls24 en 6/8 » se dissout** : `syncope-24`
est configurée en 4/4. La vraie question devient : ce chapitre doit-il être
scindé (syncope binaire d'un côté, 6/8 de l'autre), ou faut-il écrire des
cartes de syncope en 6/8 ?

### C. Le swing n'est enseigné nulle part

`shuffle-mi` est la seule carte du corpus avec `swing:true`. C'est une carte
**pièce**, à **90 bpm** — le maximum du corpus — et ses trois prérequis
(`pm-alterne`, `accent-1`, `ar-vide`) sont tous binaires. La première fois que
la croche swinguée apparaît, c'est dans l'examen final du chapitre, au tempo le
plus haut. Il manque au moins une carte : croches swinguées seules, sur un
accord, à tempo modéré. Elle conditionnera aussi les chapitres jazz (8, 9, 11).

### D. Le 3/4 du chapitre 3, même motif en plus doux

Huit cartes techniques en 4/4, et une seule carte en 3/4 : `scarborough`,
la pièce. Défendable — l'aller-retour s'apprend sur corde à vide — mais le
`pourquoi` du chapitre annonce précisément que le 3/4 empêche l'alternance de
se caler paresseusement. Une carte intermédiaire en 3/4 (alternance en croches,
`temps:3`) ferait le pont.

### E. Racines asymétriques au chapitre 1

`mi-la`, `la-re`, `re-sol`, `sol-do` exigent `noires` ; `do-lam`, `lam-mim`,
`mim-re`, `si7-mim` n'exigent **rien**. Aucune raison visible : mêmes
transitions, même geste. À harmoniser (tout exiger `noires`, probablement).
`six-huit` est aussi racine — défendable (mesure neuve), mais `noires` ne lui
ferait pas de mal.

### F. Les cartes pièce sont des culs-de-sac

Aucune des cinq cartes pièce (`blues-la`, `med-melodie`, `scarborough`,
`rising-sun`, `shuffle-mi`) n'est prérequis de quoi que ce soit. Normal tant
que les chapitres 6 à 11 sont vides — mais à brancher dès qu'ils s'écrivent :
le chapitre 6 (blues en Sol, barrés) devrait exiger `blues-la`, dont il est la
transposition déclarée.

### G. Impasses techniques

Sept cartes non-pièce ne nourrissent rien : `economie`, `tempo-interne`,
`crescendo`, `hybride`, `ar-triolets`, `ar-doubles`, `syncope-24`.
Cas notable : `ar-doubles` est la **seule** carte du corpus qui dépasse 90 bpm
(ramp 60 → 100) et rien ne s'appuie dessus. Ces impasses sont autant de points
d'accroche naturels pour les chapitres 6 à 11 — à garder en tête au moment de
les écrire, plutôt qu'à « corriger » maintenant.

### H. Divers

- `med-tenue` est le seul critère exprimé en minutes ; tout le reste compte en
  mesures, grilles, cycles ou tours. À unifier.
- Le champ `r` (rythme affiché) n'est porté que par 5 cartes ; les cartes
  `rythme` du chapitre 5 (`accent-1`, `crescendo`) n'en ont pas.
- `ramp` par défaut plafonne à `bpm+30` ; une seule carte l'utilise, avec un
  plafond explicite. Cohérent, rien à faire.

---

## 3. Tempos — la bande confirmée

| Ch. | bpm des cartes | étendue |
|---|---|---|
| 0 | 70×4, 80×2 | 70–80 |
| 1 | 65×2, 70×6, 75×2, 80×2 | 65–80 |
| 2 | 60×3, 65×2, 70×2 | 60–70 |
| 3 | 60×3, 65, 70×3, 75, 80 | 60–80 (+ ramp → 100) |
| 4 | 60, 65, 70×3, 75 | 60–75 |
| 5 | 65, 70×2, 75×2, 90 | 65–90 |

Bande globale **60–90**, un seul point à 100 via ramp. La progression
inter-chapitres est quasi plate : le chapitre 5 culmine à peine au-dessus du
chapitre 0. Si la bande doit s'ouvrir, c'est vers le haut des chapitres déjà
acquis (des paliers de tempo sur les mêmes gestes), pas en accélérant les
cartes d'entrée.

---

## 4. Décisions à prendre (dans l'ordre)

1. **Critère vs 45 s** : raccourcir les critères, ou assumer l'échantillonnage ?
2. **Chapitre 4** : scinder, ou écrire la syncope en 6/8 ?
3. **Carte swing intermédiaire** : où la placer (ch. 5, ou en tête d'un futur
   ch. 8/9) ?
4. **Harmoniser les racines du chapitre 1** (tout exiger `noires`).
5. **Carte 3/4 intermédiaire au chapitre 3** : oui / non.
6. La bande 60–90 : intentionnelle, ou à ouvrir par paliers de tempo ?

Les points F et G ne se décident pas maintenant : ils se règlent en écrivant
les chapitres 6 à 11.

---

## 5. Prochaine étape — le vocabulaire de compétences

L'audit le confirme : les prérequis relient des cartes entre elles, mais
**aucune compétence n'est nommée**. Ébauche tirée des 46 cartes, à valider :

`pulsation-continue` (pendule, tempo-interne) · `accent-24` (deux-quatre,
seuls-24) · `noires-doigts` (noires) · `transitions-ouvertes` (mi-la … sol7-do)
· `cadence-V-I` (mi7-la, la7-re, si7-mim, sol7-do) · `blues-12-doigts`
(blues-la) · `tenue-mediator` (med-tenue … med-angle) · `etouffement-cible`
(med-etouffe) · `traversee-cordes` (med-traversee) · `aller-retour-croches`
(ar-vide … ar-gamme) · `ar-subdivisions` (ar-triolets, ar-doubles) ·
`saut-de-corde` (ar-saut) · `mesure-3-4` (scarborough) · `patron-a-trou`
(patron-trou) · `anticipation-harmonique` (anticipation) · `mesure-6-8`
(six-huit, rising-sun) · `palm-mute` (pm-base, pm-alterne) · `dynamique`
(accent-1, crescendo) · `hybride-mediator-doigts` (hybride) · `swing-8`
(shuffle-mi — et la carte manquante du constat C).

Vingt étiquettes. C'est elles que les chansons du répertoire réclameront
(`exige`), et c'est leur croisement avec les chapitres 6 à 11 qui dira quelles
cartes manquent vraiment.
