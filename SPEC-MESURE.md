# comping — spécification du moteur de mesure intégré

> Version 0.13 — 2026-07-28. La lecture du code avant l'écriture de 7e a trouvé un
> **garde-fou non alimenté** : le §9.1 exige que l'écart du tempo joué au tempo réglé
> reste sous 3 %, et **rien dans `comping` ne produit ce tempo joué**. `tempoJoue()`
> existe dans `analyse-attaque` v1.5 et n'a jamais été porté. La ligne écrite est
> `if(o.tempo_regle > 0 && o.tempo_joue > 0 && …)` : sans la grandeur, la condition est
> fausse et le garde-fou est **sauté sans un mot**. Une prise à +5 % — celle où B4/B5
> montrent 5 à 7 tours de phase — serait déclarée concluante et recevrait une note, et
> T5 testerait une règle que rien n'exécute. Aggravant : `concluante` est **stocké,
> jamais recalculé** (§11), donc chaque entrée écrite avant le port porterait un verdict
> rendu sous une règle plus faible, indistinguable des autres. D'où une étape **7e-0**
> au §14, avant le branchement, et un §9.2 qui nomme l'origine de la grandeur. Le §12.1
> consigne les trois décisions que 7e impose et que la spec ne tranchait pas : qui est la
> cible du Moteur pendant la mesure, comment une détection devient un geste, où vit le
> bouton.
> Version 0.12 — 2026-07-28. Étape **7d** livrée : la géométrie de la barre (§10.4.1) est
> pure et testée, et le §10.4.2 acte que ses quatre plages sont **construites** depuis les
> bornes du §10.2 (`RHO_RANGS`) au lieu d'en être une seconde copie — la note aurait dit
> « Bien » et la barre aurait placé le trait dans « En progrès », sans que rien ne dise
> laquelle a tort. Un seul jeu de libellés pour les boutons et les plages. Le masquage du
> biais (§2.3) tient en un endroit, `biaisAffichable()` — mais le point ouvert **j** n'est
> **pas** clos : la fonction n'aura d'appelant qu'à 7e. Le §14 gagne une étape **7e —
> branchement** : 7a, 7c et 7d déposent chacune des pièces sans appelant, et le nommer vaut
> mieux que le laisser se répéter.
> Version 0.11 — 2026-07-28. Étape **7c** livrée : le cycle du §8 est écrit en réducteur
> pur et le §8.2 en consigne les huit décisions. La première commande la plomberie : les
> évènements `clic` viennent de la **file d'ordonnancement**, jamais de `Moteur.clic()` — à
> `repere:"seuls24"` le temps 1 ne sonne pas, et l'ancre ne se serait **jamais** posée sur
> ces cartes, sans erreur visible. Le décompte se compte depuis le premier temps 1 **vu**,
> avec `>=` et non `===`. `GESTES_MIN` remplace le `24` en clair de `concluante` (§9.1).
> Version 0.10 — 2026-07-28. Fondations de l'étape 7, posées après lecture du code :
> quatre manques relevés dans `index.html`, tranchés ici. Le quadruplet ne se lit pas tel
> quel sur la carte — §6.1 en donne la dérivation —, et la comparabilité passe au **palier
> de 4 bpm** (§6.2), sans quoi le moindre mouvement du curseur de tempo fragmentait
> l'historique et le §10 n'aurait jamais rien montré. L'échelon **se lit, il ne se stocke
> pas** (§7.4) : `soutien` et `repere` disaient la même chose et auraient divergé au
> premier réglage manuel. Le cycle du §8 devient un **réducteur pur** (§8.1), donc
> testable sous Node malgré l'étape 7. §11 réécrit : `S.mesures` n'existait pas, et son
> schéma ne portait pas les champs que `serieAcquise` lit. §10.7 reçoit trois décisions de
> plus — numérotation 1–4 affichée, `mesurable` par défaut à `true`, libellés alignés.
> Version 0.9.1 — 2026-07-28. §14 rafraîchi : les deux points de `pasClic` n'y figurent
> plus comme « à arbitrer » (ils le sont, §7.3), le compte de tests est à jour, et
> l'étape 7 — branchement du moteur dans l'interface — est nommée au lieu d'être
> mentionnée en creux.
> Version 0.9 — 2026-07-28. Les deux points de `pasClic` arbitrés (§7.3) : la
> subdivision devient **obligatoire** à l'échelon 0 — plus de défaut silencieux, qui
> était faux pour deux cartes du corpus — et l'échelon 3 reçoit sa règle exacte, qui
> dépend du nombre de temps et pas seulement du 4/4. Table du §7 corrigée.
> Version 0.8 — 2026-07-28. Étape 5 du §14 livrée : `noteProposee` et le compteur
> partagé `serieAcquise` (§10.3 / §7.2) écrits dans le bloc de fonctions pures, les six
> tests en attente passés au vert. §10.7 consigne les quatre choix que les §10.2 et §10.3
> laissaient ouverts : bornes de la colonne « % en cible », ordre des trois règles, échec
> fermé sur la concluance, lecture de l'historique. Étapes 3 et 4 marquées faites au §14.
> Version 0.7.1 — 2026-07-27. Calibration **enregistrée** sur l'appareil de référence
> (200 ms, dispersion 3 ms, 24/24) — point ouvert h soldé jusqu'à la valeur. Étape 2 du
> §14 livrée : `regrouper` porté à l'identique (T2 vert contre la séance libre),
> statistique circulaire portée, σ_locale défini (écart-type d'échantillon des
> intervalles successifs), % en cible passé en différence circulaire (§4.3), `concluante`
> avec ses quatre motifs ordonnés.
> Version 0.7.0 — 2026-07-27. Première calibration de terrain (point ouvert h) : latence
> de boucle **200 ms, ±3 ms** — mais six refus d'affilée, causés par l'appariement et non
> par l'appareil. §2.4 point 3 remplacé (appariement par consensus), §2.5 consignant le
> terrain, réfractaire abaissé à 30 ms pendant la calibration seule.
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
3. **Appariement — remplacé en v0.7.0, voir §2.5.** La règle initiale — la **première**
   détection dans `[t − 50 ms, t + 500 ms]`, une détection ne servant qu'une fois —
   visait la résonance (point ouvert f), qui produit ses doublons *après* l'attaque.
   Elle est sans défense contre un bruit ambiant qui précède l'arrivée du clic, et le
   terrain l'a mise en échec six fois de suite. Règle en vigueur : **appariement par
   consensus** (§2.5). Le corollaire testé demeure : **un clic manqué ne décale pas le
   suivant d'un cran** — un appariement par simple ordre injecterait une erreur de
   1000 ms dans la médiane.

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

Le masquage est décidé par `biaisAffichable()` et **là seulement** (§10.4.2 point 5) :
un second test « la calibration existe-t-elle ? » ailleurs dans le rendu finirait par
répondre autrement que le premier.

### 2.5 Appariement par consensus — **[É]** imposé par le terrain du 2026-07-27

**Le terrain.** Première calibration réelle : six refus consécutifs, dispersions
affichées de 88,7 à 193,8 ms. Le relevé détaillé de la sixième session
(`tests/fixtures/calibration-2026-07-27-refus.json`) montre **136 détections brutes pour
24 clics** — un environnement à ≈ 4,7 détections parasites par seconde — et, dessous, une
boucle acoustique **parfaitement saine : 21 clics sur 24 arrivés à +197…+203 ms**. Latence
200 ms, écart interquartile 3 ms. L'appareil n'a jamais été le problème.

**Le mécanisme de l'échec.** L'appariement glouton prend la *première* détection de la
fenêtre : presque toujours un bruit antérieur à l'arrivée du clic. Les retards appariés
étaient du bruit (−43 à +67 ms mêlés aux vrais +200), la médiane de 9 ms ne mesurait
rien, et l'écart interquartile explosait — c'est lui qui refusait, à raison, mais pour la
mauvaise cause apparente. Trois clics (6, 10, 11) étaient de surcroît **masqués** : un
bruit tombé 40 à 48 ms avant l'arrivée déclenche le réfractaire de 55 ms, qui avale la
vraie détection.

**La règle en vigueur.** `apparier(programmes, detections)` renvoie désormais
`{paires, consensus_ms, support}` :

1. pour chaque clic, tous les **candidats** dans `[t − 50 ms, t + 500 ms]` ;
2. le **consensus** est le retard de support maximal — le nombre de clics ayant au moins
   un candidat à ±10 ms **[P]** de ce retard ; à support égal, le plus petit retard
   l'emporte (dégénère en « première détection » quand il n'y a qu'un clic, ce qui
   conserve la sémantique du point ouvert f pour la résonance) ;
3. chaque clic est apparié à sa détection **la plus proche du consensus**, à ±20 ms
   **[P]**, une détection ne servant toujours qu'une fois ;
4. un clic sans candidat dans ce rayon reste non apparié — le verdict du §2.1 point 5
   (≥ 20 clics, IQR ≤ 15 ms) est inchangé et suffit.

Un bruit périodique verrouillé sur la seconde à ±10 ms près pendant 24 s serait
indiscernable d'un clic ; il n'existe pas dans une pièce.

**Réfractaire abaissé pendant la calibration seule.** `minIOI` passe de 55 à **30 ms
[P]** pour la durée de la procédure — les clics sont à 1000 ms, le coût est nul, et cela
récupère les arrivées masquées par un bruit à 30–55 ms. Le paramètre de travail
`ECART_MIN_MS = 55` ne change pas. Sur la session de référence, le consensus seul rend
21/24 ; le réfractaire abaissé aurait rendu les clics 6, 10 et 11 (bruit à 40–48 ms).

**Conséquence pratique.** Le silence ambiant aide mais n'est plus une condition : la
procédure tolère l'environnement qui l'a mise en échec. Rejouée sur la session de
référence, elle rend **latence 200,0 ms, dispersion 3,0 ms, n = 21 → acceptée**.

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
  repere:       "accent24",  // ce qui est entendu → pas_clic (§6.1)
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

### 6.1 Dérivation depuis la carte — **[V]** 2026-07-28

Le quadruplet **n'est pas stocké** sur la carte : il se dérive de son préréglage, et la
dérivation n'est l'identité pour aucun de ses quatre termes.

| Terme | Source | Conversion |
|---|---|---|
| `tempo` | `carte.bpmTravail` | jamais `bpmCible`, qui est la consigne et non ce qui a été joué. Conservé exact au journal, comparé au palier (§6.2). |
| `subdivision` | `carte.preset.sub` (1…4) | table **inverse** de `SUBDIVISIONS` : 1 → `noires`, 2 → `croches`, 3 → `triolets`, 4 → `doubles` |
| `repere` | `carte.preset.repere` | aucune. Les trois valeurs réelles du code sont `tous`, `accent24`, `seuls24` — l'exemple `"temps"` de la v0.9.1 ne correspondait à rien. |
| `soutien` | `echelonDe(carte.preset)` | **calculé**, jamais stocké (§7.4) |

`quadrupletDe(carte)` est **pure**, entre au bloc de mesure et à la liste `EXPORTES`. Elle
renvoie `null` dès qu'un terme manque — jamais un quadruplet partiel, qui ferait comparer
en silence deux mesures non comparables, exactement ce que le §6 interdit.

### 6.2 Comparabilité par palier de tempo — **[V]** 2026-07-28

Relevé dans le code, pas supposé : `carte.bpmTravail` est réécrit **à chaque mouvement du
curseur** du métronome embarqué, et le mode progressif le fait dériver seul en cours de
séance. Comparer les tempos à l'unité près rendait l'égalité du quadruplet pratiquement
inatteignable — trois mesures concluantes au même bpm exact sont un événement rare.
Conséquence : le plafond du §10.3 ne se serait presque jamais levé, le marqueur fantôme du
§10.4 aurait été presque toujours absent. **Le §10 aurait fonctionné sans jamais rien
montrer.**

**Règle retenue : la mesure enregistre le tempo exact, la comparabilité se fait au palier
de 4 bpm** — `palierTempo(bpm) = Math.round(bpm/4)*4`.

- 4 bpm est déjà le pas de progression du §7.2 : aucune grandeur nouvelle n'entre.
- C'est un **partitionnement**, donc une relation d'équivalence, et le regroupement en
  séries reste transitif. Une tolérance de ±2 bpm ne l'aurait pas été : elle aurait produit
  des « séries » qui ne se ferment pas, où A comparable à B et B à C sans que A le soit à C.
- `memeQuadruplet` compare désormais `palierTempo(a.tempo)` à `palierTempo(b.tempo)`, et
  non plus `a.tempo === b.tempo`. Les trois autres termes restent comparés à l'identique.

Le tempo exact reste au journal : c'est lui, et non le palier, qui sert au garde-fou des
3 % du §9.1.

---

## 7. Échelle de soutien

Nouvel axe de difficulté, à côté du tempo. Une carte a un **couple** (tempo, soutien), pas
un objectif unique.

| Échelon | Nom | Entendu | `pas_clic` |
|---|---|---|---|
| 0 | soutien plein | temps + subdivision | `pas_grille` — subdivision requise, §7.3 |
| 1 | temps seuls | chaque temps | noire |
| 2 | `accent24` | tous les temps, 2 et 4 accentués | noire |
| 3 | `seuls24` | 2 et 4 seulement | blanche en 4/4, sinon voir §7.3 |
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

### 7.3 `pas_clic` — deux points arbitrés le 2026-07-28

Deux points que le code avait posés seuls, l'un et l'autre faux sur des cartes du corpus
existant. Ils sont tranchés ici avant d'être corrigés.

**1. La subdivision est obligatoire à l'échelon 0.** L'échelon 0 vaut « temps +
subdivision », donc `pas_clic = pas_grille`, qui dépend de la subdivision. La signature à
trois arguments ne la portait pas ; le code avait posé un défaut à 2 (croches). Ce défaut
est faux pour deux cartes qui existent :

| Carte | Subdivision | Tempo | Échelon de départ (§7.1) |
|---|---|---|---|
| `ar-triolets` | 3 | 60 | **0** |
| `ar-doubles` | 4 | 60 | **0** |

Toutes deux démarrent à l'échelon 0 avec un clic en croches contre une grille en triolets
ou en doubles : le §7 est contredit, et rien ne le signale. **Arbitrage retenu : plus de
défaut.** `pasClic(bpm, echelon, tempsParMesure, subdivision)` renvoie `null` à l'échelon 0
si la subdivision manque. Une réponse fausse devient une absence visible — c'est la règle
suivie partout ailleurs dans ce document. L'appelant l'a de toute façon : le quadruplet du
§6 la porte, `facteurSubdivision()` fait le pont du libellé au facteur.

Le test T3 ne l'avait pas vu parce qu'il est écrit avec `sub = 2` : le défaut satisfaisait
exactement l'hypothèse du test. Il passe désormais la subdivision explicitement.

**2. L'échelon 3 ne dépend pas du 4/4, mais du nombre de temps.** « Régulier seulement en
4/4 » était trop grossier. En `seuls24`, seuls les temps 2 et 4 sonnent ; en deçà de
quatre temps le temps 4 n'existe pas, et il ne reste qu'un clic par mesure — parfaitement
régulier.

| Mesure | Clics entendus | Intervalles | Régulier | `pas_clic` |
|---|---|---|---|---|
| 1 temps | aucun | — | — | `null` |
| 2/4 | temps 2 | 2 noires | oui | 2 × noire |
| 3/4 | temps 2 | 3 noires | oui | 3 × noire |
| 4/4 | temps 2 et 4 | 2, 2 | oui | 2 × noire |
| 5/4 | temps 2 et 4 | 2, 3 | **non** | `null` |
| 6/8 | temps 2 et 4 | 2, 4 | **non** | `null` |

**Arbitrage retenu :** `T ≤ 3` → `T × noire` · `T = 4` → `2 × noire` · `T ≥ 5` → `null`.

Le cas n'est pas théorique : `scarborough` est en 3/4, et la progression du §7.2 l'amènera
à l'échelon 3. Le métronome y clique bel et bien une fois par mesure, pendant que
`pasClic` répondait qu'il n'y avait pas de clic — une carte soutenue traitée comme une
carte sans soutien.

**Ce que ces deux points ne tranchent pas.** L'échelon 3 en 6/8 reste sans pas de clic
régulier : la grille interne continue seule et la mesure reste possible (§7, échelons 4 et
5), mais la question de savoir si `seuls24` a un sens musical en 6/8 n'est pas une question
de mesure, et n'est pas tranchée ici.

### 7.4 L'échelon se lit, il ne se stocke pas — **[V]** 2026-07-28

`soutien` et `repere` décrivent la même réalité : le tableau du §7 le dit lui-même —
l'échelon 2 **est** `accent24`, l'échelon 3 **est** `seuls24`. Stocker `carte.soutien` à
côté de `carte.preset.repere`, c'était deux vérités à tenir synchronisées, qui auraient
divergé au premier réglage manuel du métronome. **Aucun champ n'est ajouté à la carte :
l'échelon est une lecture du préréglage**, par `echelonDe(preset)`, pure.

Ordre de lecture, et il n'est pas commutatif :

| Test, dans cet ordre | Échelon |
|---|---|
| `preset.muet` | 5 — sans clic, grille interne maintenue |
| `preset.gap` | 4 — clic troué |
| `repere === "seuls24"` | 3 |
| `repere === "accent24"` | 2 |
| `sub > 1` | 0 — temps + subdivision |
| sinon | 1 — temps seuls |

**Le repère se lit avant la subdivision, et c'est cet ordre qui rend la dérivation
correcte.** Le corpus contient des cartes réglées à `sub:2` **et** `repere:"seuls24"` : les
croches y sont réglées mais **inaudibles**, `Moteur.clic()` les écarte avant d'émettre.
Lire `sub` d'abord aurait donné l'échelon 0 — donc un `pas_clic` en croches — pour une
carte où l'on n'entend que 2 et 4. Le champ `sub` ment sur ce qui est entendu ; seule la
lecture croisée donne le bon échelon, donc le bon `pas_clic` (§7.3).

Un seul champ manque au préréglage pour couvrir l'échelle entière : **`preset.muet`**
(booléen, défaut `false`), qui porte l'échelon 5. Il coupe l'émission, jamais la grille (§1).

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

### 8.1 Le cycle est un réducteur pur — **[V]** 2026-07-28

L'étape 7 est la première à toucher le DOM ; la règle « tests avant code » (§13) ne
s'abandonne pas pour autant. Le cycle ci-dessus s'écrit donc comme une **transition pure**,
`cycleMesure(etat, evt) → etat′`, sans référence au DOM, à `window`, à `ctx` ni à `S`.
Elle entre dans le bloc extrait et devient testable sous Node comme le reste. Ce qui reste
dehors — minuteries, audio, écritures d'écran — est de la **plomberie**, couverte par le
test 9 et par elle seule.

**États** : `presentation` · `decompte` · `mesure` · `bilan` · `abandon`.

**Évènements**, tous porteurs de leur temps en secondes d'horloge audio — la seule du
projet (§1) :

| Évènement | Effet |
|---|---|
| `{type:"demarrer"}` | `presentation` → `decompte` |
| `{type:"clic", mesure, temps, sub, t}` | en `decompte` seulement. Au temps 1 (`temps===0 && sub===0`) de la **troisième** mesure : pose `ancre = t`, passe en `mesure`. |
| `{type:"geste", t}` | en `mesure` seulement : empile. Ignoré ailleurs — un geste joué pendant le décompte n'existe pas. |
| `{type:"horloge", t}` | en `mesure` : si `t - ancre >= DUREE_MESURE_S`, passe en `bilan`. |
| `{type:"arret"}` | `bilan` si `gestes.length >= GESTES_MIN`, sinon `abandon`. |

**Invariants — tenus par les tests avant de l'être par le code :**

1. `ancre` n'est jamais posée sur le décompte. Deux mesures entières sont consommées, quel
   que soit le nombre de temps et la subdivision.
2. Aucun geste n'est retenu avant `ancre`, ni après `ancre + DUREE_MESURE_S`.
3. `abandon` ne produit **aucune note et aucune entrée au journal** : la carte revient en
   main, notée à la main (§8). Ce n'est pas une mauvaise note, c'est une mesure qui n'a pas
   eu lieu — même distinction qu'au §10.5.
4. La transition est **totale** : un évènement inattendu dans un état donné renvoie l'état
   inchangé. Jamais d'exception, jamais d'état intermédiaire.

**Constantes** : `DUREE_MESURE_S = 45`, `MESURES_DECOMPTE = 2`, `GESTES_MIN = 24` **[P]**.

`GESTES_MIN` remplace le `24` écrit en clair dans `concluante`. Le seuil d'abandon du §8 et
le seuil de concluance du §9.1 sont **le même nombre** ; écrit à deux endroits, l'un des
deux finirait par bouger seul. Même discipline que `serieAcquise`, compteur unique du
§10.3 et du §7.2.

### 8.2 Décisions d'implémentation — livrées le 2026-07-28 (étape 7c)

1. **Les évènements `clic` viennent de la file d'ordonnancement, jamais de `Moteur.clic()`.**
   À `repere:"seuls24"`, le temps 1 **ne sonne pas** : `clic()` écarte tout ce qui n'est pas
   2 ou 4 avant d'émettre. Compter les clics *audibles* ferait que l'ancre ne se poserait
   **jamais** sur ces cartes — et sans erreur visible : la carte resterait en décompte
   indéfiniment. `Moteur.file` porte **toute** position, y compris les mesures muettes du
   mode gap, et c'est la seule source correcte. Même famille de piège que le §7.4 : ce qui
   s'entend et ce qui se joue ne sont pas la même chose.
2. **Le décompte se compte depuis `mesure0`**, indice de la première mesure dont le temps 1
   est vu, et la comparaison est `evt.mesure − mesure0 >= MESURES_DECOMPTE`, **pas `===`**.
   Le Moteur tourne déjà quand la carte s'ouvre : le premier clic reçu peut tomber au
   3ᵉ temps, et compter à partir de lui donnerait moins de deux mesures de décompte
   (test 14b). Le `>=` est un garde-fou : si un temps 1 se perd, l'ancre se pose une mesure
   trop tard — avec `===` elle ne se poserait plus du tout, et l'attente ne produirait
   aucune erreur.
3. **`etat.gestes` porte des objets `{temps_s}`**, la forme que `stats()` attend déjà.
   Aucune couche d'adaptation entre le cycle et la statistique : une conversion de plus est
   une divergence de plus.
4. **`fin = ancre + DUREE_MESURE_S`, posé à l'ancre.** `{type:"arret"}` ne porte pas de
   temps : `fin` ne peut donc pas être l'instant d'arrêt réel. C'est la fin **prévue** de la
   fenêtre — celle dont le décompte à l'écran a besoin, et elle est connue dès l'ancre.
5. **Bornes inclusives** : un geste est retenu si `ancre <= t <= fin` ; l'horloge ferme la
   mesure dès `t − ancre >= DUREE_MESURE_S`. À l'instant exact de la frontière, les deux
   sont vraies ; l'ordre d'arrivée tranche, et l'écart porté est d'un geste au plus.
6. **`presentation` n'écoute que `demarrer`.** Fermer la carte avant le départ ne passe pas
   par le cycle : c'est de la plomberie, et le cycle n'a rien à en dire.
7. **`arret` pendant le décompte → `abandon`, motif `"gestes"`** : zéro geste collecté, la
   règle du §8.1 s'applique sans cas particulier.
8. **`bilan` et `abandon` sont terminaux.** Aucun évènement n'en sort. Reprendre une mesure,
   c'est repartir de `cycleInitial()` — il n'y a pas de retour en arrière à écrire, donc
   pas de retour en arrière à tester.

---

## 9. Statistiques et conditions d'affichage

### 9.1 Conditions de validité — une mesure est *concluante* si

| Condition | Seuil | Statut |
|---|---|---|
| Nombre de gestes du passage retenu | ≥ `GESTES_MIN` (24) | **[P]** — lu depuis la constante du §8.1 depuis le 2026-07-28, plus écrit en clair |
| Test de Rayleigh | p < 0,001 | **[É]** (déjà en place v1.3+) |
| Accroche | R > 0,25 | **[É]** |
| Écart du tempo joué au tempo réglé | ≤ 3 % | **[É]** — garde-fou du protocole. Au-delà, B4/B5 montrent 5 à 7 tours de phase sur 30 s : l'accroche s'effondre mécaniquement et la mesure ne dit plus rien du jeu. Alimenté par `tempoJoue()` depuis l'étape **7e-0** ; avant elle, **il ne l'était pas** — voir ci-dessous. |

Une mesure non concluante n'affiche **ni biais, ni régularité, ni profil d'accentuation**,
et ne propose **aucune note**. Elle affiche son motif de rejet, en clair, et la carte
retourne à la notation manuelle.

**Le garde-fou du tempo doit être alimenté, sinon il ment par omission** — relevé le
2026-07-28, avant l'écriture de 7e. `concluante()` ne teste l'écart que si
`o.tempo_joue > 0` ; appelée sans la grandeur, elle **saute la condition et renvoie
`{ok:true}`** comme si elle l'avait vérifiée. Ce n'est pas une valeur par défaut
prudente, c'est un quatrième garde-fou qui disparaît en silence — la forme de panne que
la règle permanente du projet interdit, « quand une donnée manque, renvoyer `null` et le
dire », et la cinquième de la série.

Deux conséquences fixent l'ordre des travaux :

1. **Le port précède le branchement** (§14, étape 7e-0). Brancher d'abord reviendrait à
   écrire des entrées de journal sous une règle amputée.
2. **Aucune reprise n'est possible après coup.** `concluante` est stocké et jamais
   recalculé (§11), parce que le tempo réglé au moment de la prise n'est plus
   disponible ensuite. Une entrée écrite sans le garde-fou reste fausse pour toujours,
   et rien ne la distingue d'une entrée saine.

**Pas de raccourci sur l'estimation.** Ancrer la recherche sur l'intervalle médian est
exactement ce que faisait `analyse-attaque` v1.3, et c'est faux : dès que le jeu mêle
des valeurs rythmiques, la médiane glisse vers les courtes et la pulsation sort de la
plage — session à 40 bpm, médiane 1067 ms, réponse 58,7 bpm. Le port est **verbatim**,
comme `regrouper` (§3.0) : une reconstitution qui colle aux données s'est déjà révélée
fausse une fois.

### 9.2 Grandeurs calculées

Statistique circulaire sur les phases `2π · dev / pas_grille`, déjà implémentée :

- **R** — accroche à la grille, longueur du vecteur résultant ;
- **Rayleigh** — `z = nR²`, p-valeur ;
- **biais** — angle moyen ;
- **σ_grille** = `pas_grille / 2π · √(−2 ln R)` ;
- **σ_locale** — écart-type **d'échantillon** (n−1) des intervalles entre gestes
  successifs, sur le passage mesuré. **Immune à la dérive**, c'est elle qui nourrit la
  note (§10), pas σ_grille. v1.5 ne la calculait pas — son « Régularité (σ) » affichait
  σ_grille ;
- **ρ = σ_locale / pas_grille** — dispersion relative, la seule grandeur comparable d'un
  tempo à l'autre. Référence mesurée : **ρ ≈ 6 %, stable de 333 à 1000 ms** **[É]**.
- **% en cible** — part des gestes dans ±FEN, centré sur le biais.
- **tempo joué** — période réellement jouée, convertie en bpm par la subdivision
  déclarée. **Portée de `analyse-attaque` v1.5, fonction `tempoJoue()`, étape 7e-0.**
  Estimation par étages et non par intervalle médian : balayage logarithmique grossier
  sur une portée courte (500 pas de 0,2 s à `pMax`), puis deux affinages à ±6 % en
  élargissant la portée à 60 s puis à tout le passage. Les deux pièges sont documentés
  dans le source d'origine et le port ne les redécouvre pas — l'ancrage médian (v1.3) et
  le balayage large à résolution fixe, qui manque le vrai maximum par accumulation de
  dérive. Elle ne nourrit **que** le garde-fou du §9.1 : ni la note (§10.1), ni la barre,
  ni l'affichage du placement.

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

#### 10.4.1 Géométrie, écrite une fois — **[V]** 2026-07-28

La position sur la barre est une fonction pure, `positionBarre(rho)`, qui renvoie une
fraction de 0 (bord gauche) à 1 (bord droit) :

`positionBarre(ρ) = (0,12 − ρ) / (0,12 − 0,03)`, bornée à `[0, 1]`.

Elle renvoie `null` si ρ n'est pas un nombre fini — **jamais 0**, qui se dessinerait au
bord gauche et se lirait « très dispersé » là où il n'y a pas de mesure.

Points remarquables, calculés une fois, jamais recalculés à la main dans le rendu :

| Repère | ρ | Position |
|---|---|---|
| bord gauche | 12 % | 0 |
| frontière Débuts / En progrès | 8 % | 0,444 |
| « ton habitude », pointillé fixe | 6 % | 0,667 |
| frontière Bien / Acquis, début de la zone hachurée | 4,5 % | 0,833 |
| bord droit | 3 % | 1 |

Le sens de lecture est celui du progrès, et c'est **le même que celui de la numérotation
des boutons** (§10.7 point 5) : les deux montent vers la droite. Une seule direction à
apprendre, pas deux.

#### 10.4.2 Décisions d'implémentation — livrées le 2026-07-28 (étape 7d)

1. **Les plages de la barre sont CONSTRUITES depuis les bornes du §10.2, pas réécrites.**
   `rangRho` portait 4,5 %, 6 % et 8 % en clair ; la barre en aurait eu une seconde copie.
   La divergence aurait été **muette et visible à la fois** : la note aurait dit « Bien » et
   la barre aurait placé le trait dans « En progrès », sans que rien ne signale laquelle
   des deux a tort. Une seule table, `RHO_RANGS`, lue par `rangRho` **et** par
   `PLAGES_BARRE`. Même discipline que `LIBELLES_SUBDIVISION` (§6.1) et `GESTES_MIN`
   (§8.1).
2. **Un seul jeu de libellés, `LIBELLES_NOTE`**, servi aux quatre boutons (§10.7 point 7)
   et aux quatre plages de la barre (§10.4). Deux jeux auraient dérivé, et l'élève aurait
   lu deux mots différents pour un même rang, à dix centimètres d'écart.
3. **Le pointillé « ton habitude » n'est pas un repère ajouté** : 6 % est **déjà** la
   frontière En progrès / Bien du §10.2. C'est le même nombre vu deux fois, donc il n'y a
   rien à tenir en accord — il est lu, lui aussi, dans `RHO_RANGS`.
4. **La plage « Acquis » se ferme à `0`, pas à `−∞`**, et la plage « Débuts » s'ouvre au
   bord de la barre : les deux extrémités se **calculent** par `positionBarre` au lieu de
   s'écrire à la main. `positionBarre` borne déjà à [0, 1] ; c'est elle qui décide où est
   un bord, pas le rendu.
5. **Le masquage du biais (§2.3) se décide en UN seul endroit**, `biaisAffichable()`, qui
   lit `calibrationCourante()`. Sans calibration : ni le biais, ni la question du §9.3 — et
   le **motif écrit en clair**, jamais un champ vide ni un zéro. σ, % en cible, R et la
   note restent affichés : la note ne dépend jamais de la latence (§10.1). Le point ouvert
   **j** n'est pas clos pour autant : la règle est écrite et tient en un seul endroit, mais
   `biaisAffichable()` n'aura d'appelant qu'à l'étape **7e**. Dire « soldé » ici aurait
   reproduit exactement le défaut que **j** signale.
6. **La barre ne s'anime pas** sous `prefers-reduced-motion` : la règle globale de la
   feuille de style (`*{transition:none}`) couvre déjà le marqueur, aucune exception à
   écrire.

---

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

### 10.7 Décisions d'implémentation — livrées le 2026-07-28

Sept choix que les §10.2 et §10.3 laissaient ouverts. Les quatre premiers ont été
tranchés à l'écriture du code et sont tenus par les six tests T5, T5d, T8b, T8c, §10.2 et
§10.2b ; les trois derniers sont arbitrés le 2026-07-28, avant l'étape 7.

1. **Bornes de la colonne « % en cible ».** La table les donne en approximatif
   (≳ 80, ≈ 68–80, ≈ 55–68, ≲ 55) parce qu'elles décrivent une attente, pas un critère.
   Le code, lui, doit trancher : **80, 68 et 55**, bornes basses incluses. Elles ne
   servent qu'au contrôle de cohérence — aucune note n'est jamais décidée par cette
   colonne seule. Elles restent **[P]** tant que le point ouvert i (σ de phase contre
   σ_locale) n'est pas soldé : c'est lui qui dit ce que le % en cible mesure vraiment.
2. **Ordre des trois règles.** §10.5 d'abord (une mesure non concluante ne pré-coche
   rien), §10.2 ensuite (rang de ρ, corrigé par la discordance), §10.3 en dernier
   (plafond). Conséquence utile, et non un accident : une lecture discordante ne peut
   jamais retenir « Acquis », puisqu'elle retient la plus basse des deux lectures — le
   plafond ne se pose alors même pas.
3. **Échec fermé sur la concluance.** `noteProposee` ne propose rien tant qu'elle n'a pas
   reçu un `{ok: true}` explicite. Un appelant qui oublierait de passer le verdict du
   §9.1 obtient `note: null` et le motif « non concluante », jamais une note. Le §10.5
   est une règle de sûreté : elle ne peut pas dépendre de la discipline de l'appelant.
4. **Lecture de l'historique (§10.3).** `historique` est la liste des mesures
   **antérieures**, la plus récente en dernier ; la mesure du jour n'y figure pas. Le
   plafond ne se lève que si les **trois dernières** entrées sont toutes concluantes,
   toutes au quadruplet courant et toutes à ρ ≤ 4,5 %. Moins de trois entrées, ou une
   seule qui rompt la série, et le plafond tient. La lecture est isolée dans
   `serieAcquise(historique, quadruplet)` : c'est **le** compteur du §7.2, appelé au même
   endroit par les deux règles, et non deux comptages à tenir synchronisés.

5. **Numérotation affichée, 1 à 4.** Les quatre boutons portent leur rang devant le
   libellé — **1 Débuts · 2 En progrès · 3 Bien · 4 Acquis** —, croissant de gauche à
   droite, dans le même sens que la barre du §10.4. Quatre libellés seuls ne disent pas
   lequel est au-dessus de l'autre ; le rang le dit sans commentaire. Le `q` 0–3 du moteur
   SM-2 reste **interne et jamais affiché** : deux numérotations visibles pour quatre
   boutons vaudraient moins qu'aucune. Correspondance directe et fixe — rang affiché =
   indice dans `NOTES` + 1 = `q` + 1.
6. **`mesurable` par défaut à `true`.** Le champ vit dans le corpus, pas dans la
   progression ; seules les cartes qui ne se mesurent pas le déclarent à `false`. Motif :
   une carte oubliée doit tomber du côté mesurable, où l'anomalie se voit dès la première
   prise, et non du côté muet, où elle ne se verrait jamais. Le test 6 porte sur les cartes
   déclarées `false`, pas sur un défaut.
7. **Libellés alignés sur le §10.2.** `index.html` affichait encore « Encore · Dur · Bien ·
   Facile », qui qualifie **la tentative** ; le §10.2 impose « Débuts · En progrès · Bien ·
   Acquis », qui qualifie **la carte**. L'app suit la spec. L'indice dans `NOTES` tombait
   déjà juste sur `q`, par coïncidence : pré-cocher `debuts` aurait allumé un bouton nommé
   « Encore ».

Ce que ces sept points ne tranchent pas : la latence n'entre toujours dans aucun calcul
(§10.1), et le motif renvoyé reste `null` dès que la mesure est concluante — il ne porte
que le motif de rejet du §9.1, jamais une explication de la note.

---

## 11. Stockage — clé `comping_v2`, schéma v3

> **La clé de `localStorage` reste `comping_v2`. Seul le champ `version` passe à 3.**
> Le titre « `comping_v3` » de la v0.10 était un piège : renommer la clé viderait la
> progression enregistrée de Jean — cartes, journal, calibration — sans le moindre
> message. Une session qui appliquerait la spec à la lettre aurait effacé des mois de
> travail. Corrigé le 2026-07-28, avant l'écriture de 7a.


**Rien de ce qui suit n'existe encore dans `index.html`** : `etatNeuf()` s'arrête à
`calibration:{}`. C'est le premier morceau de l'étape 7, et ce n'est pas un hasard —
`serieAcquise` est écrite et testée depuis le 2026-07-28 mais **n'a aucun appelant
possible** tant que `S.mesures` n'existe pas. Sans lui, le plafond du §10.3 ne se lève
jamais et le marqueur fantôme du §10.4 est toujours absent : rien du §10 ne s'observe.

Ajouts au schéma existant, aucune suppression :

```js
{
  version: 3,
  calibration: { "<empreinte>": { latence_ms, dispersion_ms, n, date, sr } },

  mesures: [{
    carte:      "ch03-c07",
    date:       "2026-07-27T21:14:02Z",
    quadruplet: { tempo, subdivision, repere, soutien },   // §6, §6.1
    concluante: true,          // verdict du §9.1, STOCKÉ — jamais recalculé
    motif:      null,          // motif de rejet si concluante === false
    n_gestes:   41,
    R:          0.79,
    p:          3.1e-9,
    sigma_locale_ms: 21.4,
    rho:        0.0571,
    pct_cible:  72.0,
    biais_ms:   187.9,         // brut, non corrigé
    calibre:    true,          // latence disponible au moment de la mesure
    fen_ms:     22.5,
    note_proposee: "bien",
    note_retenue:  "bien"      // ce que Jean a validé
  }]
}
```

**Trois noms corrigés depuis la v0.9.1**, et ce ne sont pas des détails de forme : le
schéma d'origine écrivait `contexte` et `cible_pct`, et ne portait aucun champ
`concluante`. Or `serieAcquise` lit `m.quadruplet`, `m.concluante` et `m.rho`, et `stats()`
renvoie `pct_cible`. Le schéma et le code ne se seraient rencontrés nulle part : chaque
entrée aurait été lue comme non concluante, le plafond du §10.3 aurait tenu pour toujours,
et **aucune erreur ne se serait affichée**. C'est la forme de panne que le §14 « rien :
renvoyer `null` et le dire » cherche justement à écarter.

**`concluante` est stocké, jamais recalculé à la lecture** : le verdict du §9.1 dépend du
tempo réglé au moment de la prise, qui n'est plus disponible ensuite.

**Champs ajoutés hors de `mesures`** :

| Champ | Défaut | Motif |
|---|---|---|
| `carte.mesurable` | `true` (§10.7 point 6) | vient du corpus, recopié par `fusionner()` comme les autres champs de contenu |
| `carte.preset.muet` | `false` | porte l'échelon 5 (§7.4) |

**Aucun champ `carte.soutien`** : l'échelon se lit (§7.4).

**Migration v2.2 → v2.3**, dans le style des précédentes, idempotente :

- `if(!Array.isArray(S.mesures)) S.mesures = [];`
- `muet` initialisé à `false` s'il est absent, sur `S.metro` et sur chaque `carte.preset` ;
- `mesurable` recopié depuis le corpus dans `fusionner()`, par `m.mesurable !== false`.

**Purge** : les mesures au-delà de 400 entrées sont élaguées par la plus ancienne, sauf une
par quadruplet, conservée comme point d'origine **[P]**.

**`note_proposee` et `note_retenue` sont toutes deux conservées.** L'écart entre les deux,
accumulé, est le seul moyen de savoir si la table du §10.2 est juste. C'est le journal de
bord de la règle de notation elle-même.

---

## 12. Rendus

- Le graphique « Attaques détectées » d'`analyse-attaque` **tient lieu de bande de battement
  défilante**. Ne pas en développer une seconde.
- Seul le bandeau de flux est animé, plafonné à ~30 images/s. Le reste ne se redessine que
  sur `maj`. Redessiner l'ensemble à 60 Hz ne sert qu'à chauffer le téléphone.
- Palette et polices inchangées — elles sont déjà identiques dans les deux dépôts, le coût
  visuel de la fusion est nul.
- `prefers-reduced-motion` respecté, cibles ≥ 44 px.

### 12.1 Décisions d'implémentation — étape 7e (branchement)

Trois points que la spec ne tranchait pas et que le câblage impose. Consignés ici plutôt
que dans un commentaire de code : un choix arbitré dans le code seul redevient une
question au fil suivant.

1. **La carte de mesure devient la cible du Moteur, elle ne se greffe pas sur celle du
   métronome embarqué.** `Moteur.cible` est unique — `demarrer()` l'écrase, `arreter()`
   la met à `null` — et le métronome de l'exercice l'occupe déjà. Deux consommateurs
   auraient demandé une diffusion à plusieurs cibles, donc une notion nouvelle dans le
   Moteur, pour la durée d'une carte. La mesure prend donc la main : elle démarre le
   Moteur sur le preset de la carte, dessine son propre décompte, et **rend la main en
   sortant**, quel que soit le chemin de sortie — bilan, abandon ou fermeture.

   Le tap reste celui du §8.2 point 1 : `cible.surTemps(ev)`, alimenté par `Moteur.file`
   dans `boucle()`. Vérifié à la lecture, et c'est ce qui rend le branchement correct :
   `boucle()` ne filtre **pas** sur `muet`, et livre `{temps, sub, t, muet, mesure}` pour
   toute position à `sub === 0`, y compris les temps 1 qui ne sonnent pas à
   `repere:"seuls24"` et les mesures muettes du mode gap.

2. **Une détection devient un geste par `regrouper`, jamais par un second groupeur.**
   `regrouper` prend une liste et le cycle attend un évènement : la tentation est
   d'écrire un groupeur en flux à côté. Deux implémentations de la même règle divergent,
   et la divergence serait muette.

   Le branchement garde donc un **tampon des détections reçues depuis l'ancre**, appelle
   `regrouper(tampon, FUSION_MS)` à chaque détection, et n'émet `{type:"geste", t}` que
   pour les groupes **nouvellement apparus**, au temps de leur chef. C'est exact parce
   que le groupement est **causal** : le chef d'un groupe est sa première détection et
   son temps ne change jamais quand le groupe s'allonge. Seuls `etalement_ms` et
   `intensite_db` sont révisés a posteriori, et le cycle ne stocke que `temps_s`
   (§8.2 point 3).

   Nourrir le cycle en **détections brutes** est l'erreur que cette règle écarte :
   `tests/fixtures/attaques-2026-07-27-02-19-28.json` donne 82 détections pour 52 gestes.
   `GESTES_MIN` serait franchi à 60 % du compte réel, et `stats()` compterait plusieurs
   fois la même attaque.

   Le tampon **repart de zéro à l'ancre** : le groupement porte sur la fenêtre mesurée,
   pas sur le flux depuis l'ouverture de la carte. Un geste à cheval sur l'ancre est donc
   coupé — conséquence assumée, et cohérente avec l'invariant 2 du §8.1, qui ne retient
   rien avant l'ancre.

3. **Le bouton vit dans `rendreExercice`, sous le métronome, avant « Voir le critère ».**
   La mesure se lance après le réglage du tempo et avant le jugement : c'est l'ordre du
   §8, et l'emplacement le rend sans le dire. Il n'apparaît **que** sur une carte
   `mesurable`.

   Sur une carte `mesurable: false`, l'emplacement porte à la place une mention qui dit
   pourquoi il n'y a pas de mesure. Le §3.2 l'exige littéralement — « L'app doit le dire
   sur la carte, pas le laisser deviner » — et rien ne l'affichait jusqu'ici.

4. **La barre de mesure porte la classe `barre`, la jauge de séance est renommée
   `jauge-bloc`.** Relevé en écrivant 7e, et c'est le genre de défaut que seul le premier
   affichage réel révèle : `rendreBarre` posait `class="barre"` sur son conteneur, et la
   feuille de style portait **déjà** une règle `.barre` — celle de la jauge de progression
   du bloc de séance, `height:4px; overflow:hidden`. Les deux sélecteurs ont la même
   spécificité ; la règle de 7d n'ajoutait qu'un `margin-top`, donc la hauteur de 4 px et
   le `overflow:hidden` de la jauge s'appliquaient à la barre de mesure. Piste de 26 px,
   légendes, σ, ρ et la ligne de placement : **tout était rogné dans un ruban de 4 px**,
   sans une erreur, sans un avertissement.

   C'est la même famille que le point ouvert **j** et que le garde-fou du §9.1 : une
   pièce écrite, testée sur ce qui se teste, et fausse dès qu'un consommateur arrive.
   `positionBarre` et ses cinq points remarquables restaient justes au chiffre près
   pendant que rien n'était visible.

   La barre de mesure garde `barre` — c'est le mot de la spec (§10.4, `PLAGES_BARRE`,
   `positionBarre`, « la barre » partout) — et la jauge de séance, qui n'était nommée
   nulle part, prend `jauge-bloc`, dans la famille de `#calib-jauge`. Les classes
   introduites par la carte de mesure sont toutes préfixées `mes-`, pour que la
   prochaine ne se pose pas.

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


Tests ajoutés par l'étape 7 — tous sur des fonctions **pures**, donc écrits avant le
branchement et rouges jusqu'à ce que le code existe (§13, règle inchangée) :

| # | Test | Attendu |
|---|---|---|
| 10 | `quadrupletDe` sur une carte à `sub:2, repere:"seuls24"` | `soutien: 3`, jamais 0 — le repère se lit avant la subdivision (§7.4) |
| 11 | `quadrupletDe` sur une carte à laquelle un terme manque | `null`, jamais un quadruplet partiel |
| 12 | `memeQuadruplet` à 78 et 80 bpm, autres termes égaux | `true` — même palier (§6.2) |
| 13 | `memeQuadruplet` à 76 et 80 bpm | `false` — paliers voisins mais distincts |
| 14 | `cycleMesure` : décompte de 2 mesures, en 3/4 puis en 4/4 | `ancre` posée au temps 1 de la 3ᵉ mesure dans les deux cas, jamais avant |
| 15 | `cycleMesure` : gestes émis pendant le décompte, puis après `ancre + 45 s` | ni les uns ni les autres n'entrent au bilan |
| 16 | `cycleMesure` : `arret` à 23 gestes, puis à 24 | `abandon`, puis `bilan` — la frontière est `GESTES_MIN`, pas un nombre écrit deux fois |
| 17 | `positionBarre` aux cinq points remarquables du §10.4.1 | 0 · 0,444 · 0,667 · 0,833 · 1, et `null` sur ρ non fini |
| 18 | `echelonDe` sur les six lignes du tableau du §7.4 | l'échelon annoncé, pour chacune |
| 19 | Rejeu de T8 après le passage au palier | les séries d'origine restent distinctes : le palier élargit la comparabilité, il ne la casse pas |
| 20 | `tempoJoue` sur une série synthétique à 90 bpm en croches, gigue de ρ = 6 % | bpm rendu à ±1 %, et `null` sous 10 gestes — jamais une estimation faite sur rien |
| 21 | `tempoJoue` sur un jeu mêlant noires et croches à 40 bpm | la pulsation reste dans la plage : c'est le cas où l'intervalle médian de v1.3 répondait 58,7 bpm |
| 22 | `tempoJoue` **puis** `concluante` sur une série jouée 5 % au-dessus du tempo réglé | motif « tempo », aucune note — la chaîne du chemin réel, et la seule preuve sous Node que le garde-fou est effectivement alimenté. La première rédaction de cette ligne visait l'appelant du branchement, qui ne se teste pas sous Node ; corrigée avant l'écriture des tests |

---

## 14. Ordre de réalisation proposé

1. ~~**Calibration (§2)**~~ — **faite** le 2026-07-27 (`94a208d`). L'annonce « seule brique
   sans dépendance » était fausse : la procédure §2.1 passe par le worklet, donc l'étape 2
   a été entamée en même temps. 20 tests verts, dont le test 9.
2. ~~**Import du worklet et de la statistique (§3, §9)**~~ — **fait**. Worklet embarqué
   verbatim (vérifié par `diff`) ; `regrouper`, statistique circulaire et `concluante`
   portés le 2026-07-27, T2/T4/T5b/T5c verts. L'ordre des motifs de rejet est fixé :
   gestes, tempo, Rayleigh, accroche — le tempo avant Rayleigh, parce qu'une dérive
   couche R mécaniquement et que le motif utile est la cause, pas le symptôme. Test 1
   (worklet headless sur signal synthétique) exige un banc audio hors navigateur, non
   couvert par la suite actuelle.
3. ~~**Grille partagée et quadruplet (§1, §4, §6)**~~ — **fait**. `pasGrille`, `fen` et
   `memeQuadruplet` écrits, tests 3 et 8 verts. Les deux points que `pasClic` avait posés
   seuls — subdivision à l'échelon 0, échelon 3 hors 4/4 — sont **arbitrés et corrigés**
   le 2026-07-28 (§7.3), avec T3d et T3e.
4. ~~**Échelle de soutien (§7)**~~ — **fait**. `echelonDepart` écrit sur les seuils
   provisoires de 76 et 132 bpm. La règle de progression du §7.2 est portée par le même
   compteur que le plafond du §10.3, `serieAcquise`.
5. ~~**Bilan et note proposée (§10)**~~ — **fait** le 2026-07-28. `noteProposee` et
   `serieAcquise` écrites, décisions d'implémentation au §10.7. Suite de mesure à
   **23 sur 23**, calibration à 23 sur 23. Le bloc de fonctions pures est complet : tout
   ce qui suit touche l'interface ou le terrain, plus la mesure elle-même.
6. `FEN` relative activée **le jour où la seconde série confirme les 6 %**, pas avant.
   Une seule ligne à changer, `FEN_RELATIVE`. Conditionnée à la capture, pas au calendrier.
7. **Branchement du moteur dans l'interface** — la seule étape entièrement neuve qui
   reste, et la première qui ne soit pas une fonction pure. La lecture du code, le
   2026-07-28, y a ajouté **quatre prérequis** que la rédaction initiale ne voyait pas,
   dont trois sont bloquants. Ordre imposé, chacun inutilisable sans le précédent :

   **7a — stockage (§11).** `S.mesures` n'existe pas. Tant qu'il n'existe pas,
   `serieAcquise` n'a aucun appelant possible, le plafond du §10.3 ne se lève jamais, le
   marqueur fantôme est toujours absent : **rien du §10 ne s'observe.** Premier morceau,
   sans discussion.

   **7b — dérivation (§6.1, §6.2, §7.4).** Trois fonctions pures, trois entrées de plus à
   `EXPORTES` : `quadrupletDe`, `palierTempo`, `echelonDe`. Aucun champ ajouté à la carte
   hors `mesurable` et `preset.muet`. `memeQuadruplet` passe au palier.

   **7c — cycle de mesure (§8, §8.1).** Écrit en réducteur pur, donc couvert par la suite
   Node ; seule la plomberie reste dehors. `GESTES_MIN` remplace le `24` en clair de
   `concluante`.

   **7d — barre graduée (§10.4, §10.4.1) et masquage du biais (§2.3).** La géométrie est
   pure ; le rendu ne l'est pas. Le masquage solde le point ouvert **j** :
   `calibrationCourante()` est exposée depuis le 2026-07-27 et n'a toujours aucun appelant.
   Seul morceau qui touche vraiment l'écran.

   **7e-0 — tempo joué (port de v1.5).** Étape **ajoutée le 2026-07-28**, à la lecture du
   code qui précède 7e, et **bloquante pour elle**. `concluante` porte quatre garde-fous
   (§9.1) et le troisième n'est alimenté par rien : `tempoJoue()` n'a jamais été porté.
   Sans lui la condition est sautée **sans erreur visible**, et comme `concluante` est
   stocké et jamais recalculé (§11), les entrées écrites entre-temps resteraient fausses
   pour toujours. Fonction **pure** : elle entre dans le bloc extrait et dans `EXPORTES`,
   et la règle « tests avant code » du §13 s'y applique pleinement — contrairement à 7e.
   Port **verbatim**, comme `regrouper` ; le cache d'estimation de v1.5 ne se porte pas,
   il servait une boucle d'affichage et `comping` n'estime qu'une fois, au bilan.

   **7e — branchement (plomberie).** Étape **ajoutée le 2026-07-28**, à l'écriture de 7d :
   7a, 7c et 7d déposent chacun des pièces qui n'ont **aucun appelant** —
   `enregistrerMesure`, `historiqueDe`, `cycleMesure`, `rendreBarre`. C'est le même défaut
   que le point ouvert **j** reprochait à `calibrationCourante()`, et le nommer vaut mieux
   que le laisser se répéter. 7e est ce qui les relie : file d'ordonnancement du Moteur
   (§8.2 point 1) → `cycleMesure` → `stats` → `concluante` → `noteProposee` → barre et
   note pré-cochée → `enregistrerMesure`. Que du câblage, et il ne se teste pas sous
   Node — mais **pas « rien à décider »** : la rédaction du 2026-07-28 le disait, et la
   lecture du code a trouvé trois points que la spec ne tranchait pas. Ils sont au
   §12.1 : qui est la cible du Moteur pendant la mesure, comment une détection devient un
   geste, où vit le bouton. Il reste à écrire deux morceaux d'interface : la carte de
   mesure (présentation → décompte → 45 s → bilan) et le bouton qui la lance.

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
| h | Première calibration réelle | **clos et soldé** (§2.5) : **200 ms, dispersion 3 ms, 24/24, enregistrée le 2026-07-27** sur l'appareil de référence — bien au-dessus des 20 ms, le son passe par l'air |
| i | σ de phase contre σ_locale (§4.4) | conditionne la colonne « % en cible » du §10.2 |
| j | Consommateurs du §2.3 | `calibrationCourante()` est exposée, rien ne l'appelle encore : le masquage du biais arrive en **7d** (§14) |
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
