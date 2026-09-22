# Ampoule suspendue — commutateur de thème et refonte de l'ambiance

Date : 2026-09-22
Statut : design validé, en attente du plan d'implémentation

## Intention

La lampe d'atelier disparaît. À sa place, **une ampoule suspendue dans l'angle
supérieur droit**, accrochée au bord haut par son fil, sous un abat-jour en
rotin tressé.

Elle n'éclaire plus une section : **elle commande le thème du site**.

- **Allumée** → thème clair.
- **Éteinte** → thème sombre.

L'ambiance visée est celle de la référence fournie par le propriétaire :
suspensions en rotin, lumière dorée tamisée, teintes terreuses, halo doux sur
le mur, marbrures de lumière à travers le tressage. Apaisant, intime,
organique.

## Annexes

Ce document porte les décisions. Les valeurs d'exécution vivent dans deux
annexes, produites par des agents spécialisés et adoptées telles quelles :

- `2026-09-22-ampoule-lumiere-annexe.md` — géométrie, tressage, couches de
  lumière, transitions, palettes, coût de rendu.
- `2026-09-22-typographie-annexe.md` — choix et mesure de la police.

En cas de contradiction, **le présent document tranche**.

---

## 1. Décisions

| Sujet | Décision |
|---|---|
| Portée de l'effet | **Complète**, ambiance globale comprise |
| Police | **Literata** pour le texte, **IBM Plex Mono** conservée pour les métadonnées |
| Thème par défaut | **Selon l'heure locale du visiteur** |
| Réglages du backoffice | Les cinq réglages de lampe sont **remplacés par un seul** |
| Ancienne charte | **Changement assumé** : dégradés et bords flous reviennent |

---

## 2. Le changement de charte, assumé

La charte d'origine du projet interdisait les dégradés et exigeait des bords
parfaitement nets. Cette refonte y renonce, en connaissance de cause. L'effet
repose sur **sept dégradés et quatre flous** ; aucun n'est substituable par un
aplat, et la « transition très douce vers l'ombre » de la référence **est** un
bord flou.

Quatre conséquences, qui dépassent l'angle de l'écran :

1. **Toutes les ombres portées du site sont à refaire**, en deux jeux : clair
   directionnel et teinté, sombre neutre. Une ombre oubliée en gris neutre se
   verra immédiatement comme une erreur d'éclairage.
2. **`mix-blend-mode` entre dans la base de code.** Il crée des contextes
   d'empilement et interagit mal avec `position: sticky` et `backdrop-filter`.
   Chaque `z-index` existant doit être audité.
3. **Les contrastes deviennent conditionnels au fond composé.** Aucun outil
   statique ne les vérifie une fois les couches de blend appliquées. Le
   garde-fou de l'annexe (variation de luminance ≤ ±0,04) doit être respecté, et
   la vérification finale passe par une capture d'écran, pas par un lint.
4. **Le rendu cesse d'être déterministe entre navigateurs.** Filtres SVG et
   blends diffèrent légèrement entre Chromium, Firefox et Safari.

Ce qui est préservé : la grille de 8 px pour la mise en page, le plafond de
66 caractères, les six sections en zigzag, et le registre « calme, leader,
professionnel » — la lumière est chaude mais basse, l'opacité maximale d'une
couche de fond est 0,30. Rien ne brille.

---

## 3. Ce qui disparaît

| Élément | Détail |
|---|---|
| `frontend/components/lamp/` | 4 fichiers |
| `frontend/lib/lamp/` | 6 fichiers, dont **40 tests** |
| Réglages en base | `lampEnabled`, `lampOnByDefault`, `lampBeamAngle`, `lampIntensity`, `lampDimLevel` |
| Backoffice | le groupe « Lampe d'atelier » de la page des réglages |
| Micro-interactions | le câblage de survol dans `section-shell`, `contact-section`, `footer` |

Le mécanisme de révélation par faisceau disparaît entièrement : une suspension
au plafond n'a pas de faisceau directionnel qui suit la lecture.

**Conséquence sur la vérification.** Le projet passe de 46 à 6 tests côté
frontend. Ce qui est construit à la place est presque entièrement visuel, donc
hors de portée d'un test automatique. La charge de vérification se déplace sur
l'inspection visuelle par le propriétaire du site.

---

## 4. Les deux palettes

Valeurs et ratios mesurés en annexe. Résumé :

### Clair — ampoule allumée

| Rôle | Valeur | Contraste sur le fond |
|---|---|---|
| Fond | `#F6F1E8` | — |
| Surface | `#FCF8F1` | — |
| Bordure décorative | `#DCD1BF` | 1,34:1 |
| Bordure signifiante | `#948263` | **3,31:1** |
| Texte secondaire | `#5E564A` | **6,42:1** |
| Texte principal | `#1F2320` | **14,15:1** |
| Accent | `#456040` | **6,22:1** |

### Sombre — ampoule éteinte

L'identité existante est conservée, avec **un ajustement imposé** : le jeton
`--texte-secondaire` passe de `#8b8f8a` à **`#9AA096`**. L'ancienne valeur donne
5,15:1 sur la surface — conforme mais sans marge, alors que les couches de blend
peuvent en retirer 0,5. La nouvelle donne 6,32:1.

| Rôle | Valeur | Contraste sur le fond |
|---|---|---|
| Fond | `#131518` | — |
| Surface | `#1A1D21` | — |
| Bordure signifiante | `#707780` | **4,04:1** |
| Texte secondaire | `#9AA096` | **6,83:1** |
| Texte principal | `#E4E5E3` | **14,47:1** |
| Accent | `#7E9B76` | **5,96:1** |

**Règle de vérification.** Le test de contraste existant est étendu : il doit
couvrir les deux palettes, et échouer si l'une des paires de texte passe sous
4,5:1 ou si une bordure signifiante passe sous 3:1.

---

## 5. Le thème par défaut, selon l'heure

À la première visite, sans préférence enregistrée :

| Heure locale | Ampoule | Thème |
|---|---|---|
| 07:00 – 18:59 | éteinte | **sombre** |
| 19:00 – 06:59 | allumée | **clair** |

Cette règle **inverse la convention courante**, où un site passe en sombre la
nuit. Elle suit la logique de l'objet plutôt que celle de l'écran : on allume
une lampe le soir, pas au réveil. Le propriétaire en a été averti et l'a
maintenue. Un visiteur arrivant à 10 h trouvera donc un site sombre.

Une fois que le visiteur a cliqué l'ampoule, **son choix prime et persiste** ;
la règle horaire ne s'applique plus.

### Contrainte technique

Le serveur ignore l'heure locale du visiteur. Un calcul au montage produirait
un basculement visible après le premier rendu.

**Décision : `next-themes` est retiré.** La bibliothèque ne permet pas de défaut
calculé, et elle ne servait plus qu'à ce seul commutateur. Elle est remplacée
par un script court, injecté dans `<head>` et exécuté avant le premier tracé,
qui lit la préférence enregistrée, retombe sur la règle horaire à défaut, et
pose la classe sur `<html>`. Le thème est donc juste dès le premier pixel,
sans divergence d'hydratation.

---

## 6. Les réglages du backoffice

Les cinq réglages de lampe sont supprimés et remplacés par **un seul** :

```prisma
/** auto | clair | sombre — « auto » applique la regle horaire. */
themeParDefaut  String  @default("auto")  @map("theme_par_defaut")
```

Borné par `@IsIn(['auto', 'clair', 'sombre'])`.

Rien d'autre n'est exposé. L'intensité, l'ouverture et l'assombrissement de
l'ancienne lampe n'ont pas d'équivalent : l'ampoule a une intensité juste, et
la rendre réglable inviterait à la dérégler.

Le témoin de contraste de la page des réglages, qui calculait l'effet de
l'assombrissement du faisceau, **disparaît avec lui**.

---

## 7. La typographie

**Literata** (TypeTogether, SIL OFL, servable par `next/font/google`) remplace
IBM Plex Sans. **IBM Plex Mono est conservée** pour les dates et les étiquettes.

Justification mesurée en annexe. L'essentiel : l'axe du délié à 98° donne les
8° d'inclinaison de plume qui font le caractère vintage sans le rendre voyant,
tandis que le contraste à 1,82:1 et les empattements à 2,63:1 tiennent le
registre corporate. **Son axe optique remplace une seconde famille** : titres en
`opsz 48 / wght 600`, corps en `opsz 12 / wght 400`.

### Correction d'une régression existante

Le code spécifie un tableau `weight` explicite pour IBM Plex Sans — quatre
graisses — et deux pour IBM Plex Mono. Cela force Next.js à servir des
**instances statiques** au lieu de la police variable.

**Mesuré sur le site en fonctionnement**, et non estimé :

| | Valeur |
|---|---|
| Déclarations `@font-face` | 36 |
| Fichiers `.woff2` distincts | 16 |
| Poids cumulé si tout était chargé | 197 Ko |
| **Réellement préchargé par la page** | **2 fichiers, 49 Ko** |

L'annexe typographique avance « 207,5 Ko en 6 requêtes ». Le total déclaré est
proche, mais **le chiffre des requêtes et le coût réel pour un visiteur sont
faux** : Next.js ne précharge que les sous-ensembles employés, et le reste n'est
récupéré que si la page contient les caractères correspondants.

Le gain attendu du passage à Literata porte donc sur la **surface déclarée** —
un axe variable au lieu de quatre graisses figées, donc nettement moins de
fichiers et de règles — et non sur une division du poids préchargé, qui restera
du même ordre. C'est une simplification réelle, pas la division par trois
annoncée.

### Incidence sur l'échelle

L'échelle modulaire de ratio 1,250 sur base 17 px est **inchangée** : la hauteur
d'x de Literata (0,507 em) est proche de celle de Plex Sans (0,516 em). Seul
l'interligne du corps passe à **1,60**.

---

## 8. Ce qui reste à vérifier à l'œil

Ce document et ses annexes garantissent que les valeurs sont justes et que les
contrastes calculés atteignent leurs seuils. Ils ne garantissent pas que le
résultat soit beau, ni que le tressage lise correctement à l'écran.

Points à regarder en priorité, dans l'ordre :

1. La silhouette du dôme et la densité du tressage sur les bords.
2. La crédibilité de l'allumage — une ampoule à incandescence monte en
   température, elle ne s'allume pas d'un coup.
3. L'ambiance de la page en thème clair : c'est le thème qui n'existait plus et
   qui est reconstruit de zéro.
4. Le rendu du texte en Literata sur fond sombre, où les déliés s'amincissent.

---

## Hors périmètre

- Le backoffice conserve son thème clair propre et n'adopte pas l'ampoule.
- Le blog hérite des jetons de couleur et de typographie, sans traitement
  particulier.
- Le générateur de CV n'est pas retouché.
