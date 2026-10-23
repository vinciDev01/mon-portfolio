# La section contact, plan d'implementation

> **Pour les executants agentiques :** SOUS-COMPETENCE REQUISE : employer
> superpowers:subagent-driven-development (recommande) ou
> superpowers:executing-plans pour mettre en oeuvre ce plan tache par tache.
> Les etapes emploient la syntaxe a cases (`- [ ]`) pour le suivi.

**But :** refaire la section contact en deux volets, ses coordonnees a cote de
son formulaire, sur les jetons du site et sans aucune couleur neuve.

**Architecture :** les regles pures d'abord, dans un module sans React qui dit
quels canaux existent et comment chacun devient un `href` ; le rendu ensuite, en
trois composants aux responsabilites separees. La regle `https:` n'est pas
reecrite : elle est extraite de `parchemin.ts` vers un module neutre que les
deux chantiers partagent, parce que deux copies d'une regle de securite
divergent toujours.

**Pile :** Next.js 16 App Router, React 19.2.4, Tailwind, vitest avec jsdom.

**Spec :** `docs/superpowers/specs/2026-10-23-section-contact-design.md`

## Contraintes globales

- Deux mouvements seulement sur tout le site, l'incandescence de l'ampoule et la
  transition entre sections. **Ce chantier n'en consomme AUCUN** : aucun
  `transform`, `transition`, `animation`, `@keyframes`, `scroll-behavior`.
- **Aucun degrade**, d'aucune sorte.
- **4,5:1 pour le texte et 3:1 pour les bordures signifiantes, dans les DEUX
  palettes**, calcules depuis les jetons et jamais epingles.
- **Aucune couleur neuve** n'entre dans la palette : ni vert, ni rouge, ni jeton
  d'alerte. Un etat se dit par une bordure `--bordure-signifiante`, un glyphe
  DESSINE et un texte.
- Cibles d'au moins **24 par 24 pixels** (critere 2.5.8). Les liens en ligne
  dans un paragraphe en sont exemptes.
- **La couleur n'est jamais le seul porteur** d'une information (critere 1.4.1).
- **Francais partout**, dans le code et les commentaires. **Aucun tiret
  cadratin, aucun emoji, aucun trace de boite** : une garde de depot les refuse
  et nomme le fichier et la ligne.
- **Messages de commit sans accents.** Les accents sont normaux ailleurs.
- **Jamais `npm run lint` depuis la racine** : le script racine passe par
  `--workspaces` et celui du backend est `eslint ... --fix`, donc un appel
  racine ECRIT dans `backend/src`. Toujours `npm run lint --workspace frontend`.
- Tests et typecheck **depuis la racine du depot** : `npm run test -w frontend`
  echoue depuis `frontend/`.
- Les trois dictionnaires `frontend/lib/i18n/{fr,en,de}.json` restent en
  **parite exacte**. 72 cles au depart, **76 a l'arrivee** : trois libelles de canaux en
  tache 3, et `contact.errorFallback` en tache 4.

**Etat de reference au depart :** frontend 614 tests sur 27 fichiers, backend 91
sur 7, typecheck propre, lint frontend a **exactement un probleme**,
`i18n-context.tsx:35`, anterieur et hors de ce chantier.

## Faits mesures, a ne pas redecouvrir

- `renseigne` et `lienSur` sont **prives au module** dans
  `frontend/lib/parcours/parchemin.ts` (lignes 8 et 45). `contact.ts` ne peut
  donc pas les importer : la tache 1 les extrait.
- `email` est declare `string` et non `string | null` dans
  `packages/shared-types/src/personal-info.ts:5` : **non nul mais pouvant valoir
  la chaine vide.** Il suit donc la regle du blanc comme les trois autres.
- `ContactSection` ne prend **aucune prop** aujourd'hui. `app/page.tsx` est un
  composant **SERVEUR** : il ne peut passer que des donnees, jamais une fonction.
- `SectionShell` (`frontend/components/portfolio/section-shell.tsx`) fournit deja
  le numero, le titre et le zigzag. La section ne rend que son corps.
- `t(cle, params)` interpole `{nom}` depuis un `Record<string, string>`
  (`i18n-context.tsx:52-59`).
- **`renderToStaticMarkup` n'imprime AUCUN gestionnaire d'evenement** : toute
  garde sur un `onClick` ou sur un envoi exige jsdom.
- `className` d'un `<svg>` est un `SVGAnimatedString`, non une chaine.
- Le fuseau de vitest est `America/Los_Angeles`.
- Le motif maison a deux colonnes est `grid grid-cols-1 sm:grid-cols-2 gap-6`
  (vu dans `services-section.tsx:44`).
- `frontend/lib/parcours/feuille-test.ts` exporte deja `bloc`, `valeur`, `px`,
  `proprietes`, `cssNu`, `sansCommentaires` : employer ces outils, ne pas en
  ecrire d'autres.
- Un test maison verifie que **chaque classe posee dans le TSX existe dans la
  feuille** : toute classe neuve doit etre declaree dans `globals.css`.
- `frontend/lib/parcours/journal.test.ts:494` fixe le compte de cles a **72** :
  la tache 4 le passe a 76.

## Points de vigilance

Cinq cas que la spec implique sans qu'aucune tache ne les exerce d'elle-meme.
Chacun recoit son test dans la tache nommee.

1. **Une fiche dont les QUATRE canaux sont vides ou blancs.** Le volet ne rend
   alors rien : il ne doit pas laisser un titre orphelin, le defaut exact qui a
   coute une ronde au parchemin. Test en **tache 3**.
2. **Un telephone contenant des espaces ou des points** (`+33 6 12 34 56 78`).
   Le `tel:` doit rester composable, donc les blancs sont retires de l'`href`
   tout en restant affiches dans le texte. Test en **tache 2**.
3. **Un envoi qui echoue par le reseau et non par un code HTTP.** Aujourd'hui
   seul `!res.ok` leve ; une promesse rejetee tombe dans le meme `catch`. Les
   DEUX chemins doivent donner l'etat d'erreur. Test en **tache 4**.
4. **Un double envoi rapide.** Le bouton se desactive, mais les champs restent
   modifiables : deux soumissions ne doivent pas produire deux requetes. Test en
   **tache 4**.
5. **Un message tres long.** La zone grandit a la saisie, et la decision « le
   formulaire tient dans l'ecran » ne doit pas se perdre : la croissance est
   bornee, et au-dela c'est la zone qui defile, pas la section. Test en
   **tache 4**.

---

### Tache 1 : extraire la regle des liens

**Fichiers :**
- Creer : `frontend/lib/parcours/liens.ts`
- Modifier : `frontend/lib/parcours/parchemin.ts` (retirer les lignes 8-10 et
  44-53, importer a la place)
- Test : `frontend/lib/parcours/liens.test.ts`

**Interfaces :**
- Consomme : rien.
- Produit :
  ```ts
  export function renseigne(v: string | null | undefined): boolean
  export function lienSur(v: string | null | undefined): string | null
  ```

**Pourquoi un module neutre plutot qu'un export depuis `parchemin.ts` :** la
section contact ne doit pas dependre du parchemin. Et dupliquer la regle `https:`
dans un second fichier recreerait l'asymetrie qui a deja laisse passer un lien
non filtre sur une page publique.

- [ ] **Etape 1 : ecrire les tests qui echouent**

```ts
describe("lienSur (regle partagee des liens)", () => {
  it("n accepte que https:", () => {
    expect(lienSur("https://exemple.test/a")).toBe("https://exemple.test/a");
    expect(lienSur("http://exemple.test/a")).toBeNull();
    expect(lienSur("javascript:alert(1)")).toBeNull();
    expect(lienSur("JavaScript:alert(1)")).toBeNull();
    expect(lienSur("data:text/html,x")).toBeNull();
    expect(lienSur("exemple.test")).toBeNull();
    expect(lienSur("https:")).toBeNull();
  });

  it("rogne les blancs autour de l URL", () => {
    expect(lienSur("  https://exemple.test/a  ")).toBe("https://exemple.test/a");
  });

  it("traite le blanc comme une absence", () => {
    for (const v of ["", "   ", null, undefined]) expect(lienSur(v)).toBeNull();
  });
});

describe("renseigne", () => {
  it("est faux pour le vide, le blanc, le nul et l indefini", () => {
    for (const v of ["", "   ", null, undefined]) expect(renseigne(v)).toBe(false);
    expect(renseigne("x")).toBe(true);
  });
});
```

- [ ] **Etape 2 : lancer les tests pour les voir echouer**

Lancer : `npm run test -w frontend -- liens`
Attendu : ECHEC, le module `liens.ts` n'existe pas.

- [ ] **Etape 3 : creer `liens.ts` avec les deux fonctions**

Deplacer le corps exact des deux fonctions depuis `parchemin.ts`, en les
exportant. Ne rien changer a leur logique : elles sont verrouillees par les
tests du parchemin.

- [ ] **Etape 4 : faire importer `parchemin.ts`**

Retirer les deux definitions locales et ajouter
`import { lienSur, renseigne } from "./liens";`.

- [ ] **Etape 5 : verifier que RIEN du parchemin n a bouge**

Lancer : `npm run test -w frontend` puis `npm run typecheck -w frontend`
Attendu : **28 fichiers**, et un total d'AU MOINS 614, les tests du fichier
neuf s'ajoutant aux 614 d'avant. Le typecheck est propre. Si un test du parchemin tombe,
l'extraction a change un comportement : la reverser et dire lequel.

- [ ] **Etape 6 : prouver que les gardes mordent**

Pour chaque mutation : l'introduire, constater l'echec en nommant la bonne
chose, la retirer. Verifier fichiers ET tests collectes apres chacune.
- `protocol === "https:"` devient `protocol !== "javascript:"`
- `.trim()` retire de `const url = v!.trim()`
- `renseigne` rend `typeof v === "string"` sans le test du blanc

- [ ] **Etape 7 : commit**

```bash
git add frontend/lib/parcours/liens.ts frontend/lib/parcours/liens.test.ts \
        frontend/lib/parcours/parchemin.ts
git commit -m "refactor(liens): la regle https partagee sort de parchemin"
```

---

### Tache 2 : les regles pures des canaux

**Fichiers :**
- Creer : `frontend/lib/parcours/contact.ts`
- Test : `frontend/lib/parcours/contact.test.ts`

**Interfaces :**
- Consomme : `renseigne`, `lienSur` de `./liens` (tache 1).
- Produit :
  ```ts
  export type CleCanal = "courriel" | "telephone" | "linkedin" | "github";
  export type Canal = {
    cle: CleCanal;
    cleLibelle: string;   // cle i18n, jamais un libelle resolu
    valeur: string;       // ce qui s affiche
    href: string;
  };
  export function canaux(infos: PersonalInfoDto): Canal[]
  ```

**Pourquoi `cleLibelle` et non un libelle :** ce module est pur et sans React ;
il ne peut pas appeler `t()`. Il rend la CLE, et le composant la resout. C'est
le meme partage que `SectionShell`, qui recoit `cleTitre` et non un titre.

**L'ordre de lecture est fixe** par la section 3.1 de la spec : courriel,
telephone, LinkedIn, GitHub.

- [ ] **Etape 1 : ecrire les tests qui echouent**

```ts
describe("canaux (spec section 3.1)", () => {
  it("rend les quatre canaux dans l ordre de lecture", () => {
    expect(canaux(fiche({
      email: "a@exemple.test", phone: "+33 6 12 34 56 78",
      linkedinUrl: "https://linkedin.test/in/a",
      githubUrl: "https://github.test/a",
    })).map((c) => c.cle)).toEqual(["courriel", "telephone", "linkedin", "github"]);
  });

  it("ne rend AUCUN canal quand les quatre sont vides ou blancs", () => {
    expect(canaux(fiche({ email: "", phone: "   ", linkedinUrl: null, githubUrl: "" })))
      .toEqual([]);
  });

  it("traite le blanc comme une absence sur les QUATRE champs", () => {
    for (const champ of ["email", "phone", "linkedinUrl", "githubUrl"] as const) {
      const c = canaux(fiche({ ...toutPlein, [champ]: "   " }));
      expect(c.map((x) => x.cle), champ).not.toContain(cleAttendue[champ]);
      expect(c, champ).toHaveLength(3);
    }
  });

  it("n accepte que https: pour LinkedIn et GitHub", () => {
    for (const mauvais of ["http://x.test", "javascript:alert(1)", "x.test", "https:"]) {
      const c = canaux(fiche({ ...toutPlein, linkedinUrl: mauvais, githubUrl: mauvais }));
      expect(c.map((x) => x.cle), mauvais).toEqual(["courriel", "telephone"]);
    }
  });

  it("compose le courriel en mailto: et le telephone en tel:", () => {
    const c = canaux(fiche({ ...toutPlein, email: "  a@exemple.test  " }));
    expect(c[0].href).toBe("mailto:a@exemple.test");
    expect(c[0].valeur).toBe("a@exemple.test");
  });

  // Point de vigilance 2 : le tel: doit rester composable.
  it("retire les blancs de l href du telephone mais les garde a l affichage", () => {
    const c = canaux(fiche({ ...toutPlein, phone: "+33 6 12 34 56 78" }));
    const tel = c.find((x) => x.cle === "telephone")!;
    expect(tel.href).toBe("tel:+33612345678");
    expect(tel.valeur).toBe("+33 6 12 34 56 78");
  });

  it("affiche le nom du service et non l URL entiere", () => {
    const c = canaux(fiche(toutPlein));
    expect(c.find((x) => x.cle === "linkedin")!.valeur).not.toContain("https://");
  });
});
```

L'aide `fiche(partiel)` construit un `PersonalInfoDto` complet en enumerant ses
champs, sans cast qui masquerait un champ obligatoire ajoute plus tard.

- [ ] **Etape 2 : lancer les tests pour les voir echouer**

Lancer : `npm run test -w frontend -- contact`
Attendu : ECHEC, `canaux` n'existe pas.

- [ ] **Etape 3 : implementer `canaux(infos: PersonalInfoDto): Canal[]`**

Un canal n'entre dans la liste que si sa valeur est exploitable : `renseigne`
pour le courriel et le telephone, `lienSur` pour les deux profils. Les cles
i18n a employer sont `contact.email` pour le courriel ; les trois autres
demandent des cles qui n'existent pas encore et que la tache 3 cree, donc
nommer ici les constantes et laisser la tache 3 les declarer.

- [ ] **Etape 4 : lancer les tests pour les voir passer**

Lancer : `npm run test -w frontend -- contact`
Attendu : PASSE.

- [ ] **Etape 5 : prouver que les gardes mordent**

- `lienSur(infos.linkedinUrl)` devient `infos.linkedinUrl`
- `renseigne(infos.email)` devient `infos.email` nu
- l'ordre : `github` pousse avant `linkedin`
- le `.replace(/\s/g, "")` du `tel:` retire
- le `.trim()` du courriel retire

- [ ] **Etape 6 : commit**

```bash
git add frontend/lib/parcours/contact.ts frontend/lib/parcours/contact.test.ts
git commit -m "feat(contact): les regles pures des canaux directs"
```

---

### Tache 3 : le volet des coordonnees

**Fichiers :**
- Creer : `frontend/components/portfolio/coordonnees.tsx`
- Modifier : `frontend/app/globals.css` (classes du volet)
- Modifier : `frontend/lib/i18n/{fr,en,de}.json` (trois cles de libelle)
- Test : `frontend/lib/parcours/contact-dom.test.ts`

**Interfaces :**
- Consomme : `canaux`, `Canal`, `CleCanal` de `@/lib/parcours/contact`
  (tache 2).
- Produit : `export function Coordonnees({ infos }: { infos: PersonalInfoDto })`

**Les trois cles de libelle** a creer dans les trois dictionnaires, en parite :
`contact.phone`, `contact.linkedin`, `contact.github`. `contact.email` existe
deja. Valeurs francaises : « Telephone », « LinkedIn », « GitHub ». Le compte
passe donc de 72 a 75 ici, et la tache 4 ajoutera la 76e.

Le test de `journal.test.ts:494` n'est mis a jour qu'**une seule fois**, en
tache 4, quand les quatre cles existent : le modifier ici le ferait tomber a la
tache suivante.

- [ ] **Etape 1 : ecrire les tests qui echouent**

```ts
describe("le volet des coordonnees (spec section 3.1)", () => {
  it("rend un lien par canal present, dans l ordre", () => { /* DOM rendu */ });

  it("compose mailto: et tel: sur les bons liens", () => { /* href exacts */ });

  // Point de vigilance 1 : aucun titre orphelin.
  it("ne rend NI titre NI liste quand aucun canal n est exploitable", () => {
    monter(<Coordonnees infos={fiche({ email: "", phone: "   ",
                                       linkedinUrl: null, githubUrl: "" })} />);
    expect(document.querySelectorAll("a")).toHaveLength(0);
    expect(document.body.textContent).not.toContain(fr["contact.email"]);
  });

  it("le nom accessible de chaque lien contient son libelle ET sa valeur", () => {
    // critere 2.5.3 et 2.4.4 : jamais « Lien » seul repete
  });
});
```

Les libelles attendus sont **lus dans `fr.json`**, accents compris, jamais
recopies a la main : une assertion sur une chaine recopiee est vide par
construction, et ce defaut s'est produit douze fois sur cette branche.

La fixture porte **au moins un canal present et un absent**, sinon la moitie des
gardes ne voit jamais son cas.

- [ ] **Etape 2 : lancer les tests pour les voir echouer**

Lancer : `npm run test -w frontend -- contact-dom`
Attendu : ECHEC, `Coordonnees` n'existe pas.

- [ ] **Etape 3 : implementer `Coordonnees`**

Une liste sans puces, un element par canal, chacun montrant son libelle resolu
par `t(c.cleLibelle)` puis sa valeur, le tout dans un lien vers `c.href`. Le
titre du volet et la liste ne sont rendus QUE si `canaux(infos)` n'est pas vide.

- [ ] **Etape 4 : declarer les classes dans `globals.css`**

Les cibles font au moins 24 px en bloc comme en ligne. Aucun mouvement, aucun
degrade, aucune couleur hors jetons.

- [ ] **Etape 5 : lancer les tests, le typecheck et le lint**

Lancer : `npm run test -w frontend`, `npm run typecheck -w frontend`,
`npm run lint --workspace frontend`
Attendu : tout passe, lint a **exactement un probleme**.

- [ ] **Etape 6 : prouver que les gardes mordent**

- la condition du titre retiree, donc un titre orphelin pour la fiche vide
- `href={c.href}` devient `href="#"`
- le libelle retire du contenu du lien, ne laissant que la valeur
- `min-block-size` de la cible passe de 24px a 16px

- [ ] **Etape 7 : commit**

```bash
git add frontend/components/portfolio/coordonnees.tsx frontend/app/globals.css \
        frontend/lib/i18n frontend/lib/parcours/contact-dom.test.ts
git commit -m "feat(contact): le volet des coordonnees, un canal absent ne parait pas"
```

---

### Tache 4 : le formulaire, son etat et ses annonces

**Fichiers :**
- Creer : `frontend/components/portfolio/formulaire-contact.tsx`
- Modifier : `frontend/app/globals.css` (bloc d'etat, glyphes)
- Modifier : `frontend/lib/i18n/{fr,en,de}.json` (`contact.errorFallback`)
- Modifier : `frontend/lib/parcours/journal.test.ts:494` (72 devient 76)
- Test : `frontend/lib/parcours/contact-dom.test.ts` (etendu)

**Interfaces :**
- Consomme : rien des taches precedentes.
- Produit : `export function FormulaireContact()`

**Le point d'envoi ne change pas :** `POST {NEXT_PUBLIC_API_URL}/api/contact-messages`
avec `firstName`, `lastName`, `email`, `subject`, `message`.

**Ce qui change par rapport a l'existant**, selon la section 3.2 et 4 de la spec :
prenom et nom sur une ligne ; zone de message a trois lignes qui grandit ;
`autoComplete` en `given-name`, `family-name`, `email` ; champs obligatoires
marques autrement que par la couleur ; le message d'etat **au-dessus du
formulaire CONSERVE**, en region `aria-live="polite"` qui recoit le focus ;
glyphes dessines en SVG, `aria-hidden`, teintes par `currentColor` ; aucune
couleur neuve.

- [ ] **Etape 1 : ecrire les tests qui echouent**

```ts
describe("le formulaire de contact (spec sections 3.2 et 4)", () => {
  it("le formulaire SURVIT a un envoi reussi", async () => {
    // apres succes : les cinq champs sont toujours dans le document
  });

  it("annonce l etat dans une region aria-live qui recoit le focus", async () => {
    // role/aria-live present, document.activeElement === la region
  });

  // Point de vigilance 3 : les deux chemins d echec.
  it("donne l etat d erreur pour un code HTTP comme pour un rejet reseau", async () => {
    // cas A : fetch resout avec { ok: false }
    // cas B : fetch rejette
    // les deux montrent contact.error ET contact.errorFallback
  });

  // Point de vigilance 4 : pas de double requete.
  it("deux soumissions rapides ne produisent qu une requete", async () => {
    expect(appels).toBe(1);
  });

  // Point de vigilance 5 : la croissance est bornee.
  it("la zone de message grandit mais sa hauteur est bornee", () => {
    // la feuille declare un max-block-size sur la zone
  });

  it("porte les trois attributs d auto-remplissage", () => { /* DOM */ });

  // Spec section 5 : le bouton ne devient pas une roue muette.
  it("le bouton d envoi reste identifiable et annonce son etat pendant l envoi", () => {
    // pendant l envoi : un texte accessible non vide, et non un seul picto
  });

  it("marque les champs obligatoires autrement que par la couleur", () => { /* DOM */ });
});
```

- [ ] **Etape 2 : lancer les tests pour les voir echouer**

Lancer : `npm run test -w frontend -- contact-dom`
Attendu : ECHEC, `FormulaireContact` n'existe pas.

- [ ] **Etape 3 : creer la cle `contact.errorFallback`**

Dans les trois dictionnaires, en parite. Valeur francaise : un renvoi vers le
canal direct, du genre « Vous pouvez aussi m'ecrire directement. » Puis passer
`journal.test.ts:494` de 72 a **76**.

- [ ] **Etape 4 : implementer `FormulaireContact`**

Un `useRef` sur la region d'etat pour y porter le focus. Un drapeau d'envoi en
cours qui garde la fonction d'envoi, et non le seul `disabled` du bouton : c'est
lui qui empeche la seconde requete du point de vigilance 4.

- [ ] **Etape 5 : declarer le bloc d etat dans `globals.css`**

Bordure `--bordure-signifiante`, aucune couleur neuve, aucun mouvement, aucun
`forced-color-adjust`, et le `max-block-size` de la zone de message.

- [ ] **Etape 6 : lancer les tests, le typecheck et le lint**

Attendu : tout passe, lint a exactement un probleme, les trois dictionnaires a
**76 cles** en parite.

- [ ] **Etape 7 : prouver que les gardes mordent**

- le formulaire remplace par le message au succes, comme avant
- `aria-live` retire de la region
- le focus non porte sur la region
- le drapeau d'envoi retire, donc deux requetes
- `contact.errorFallback` non rendu dans l'etat d'erreur
- un `autoComplete` retire
- le libelle du bouton remplace par un picto seul pendant l envoi
- `max-block-size` retire de la zone de message

- [ ] **Etape 8 : commit**

```bash
git add frontend/components/portfolio/formulaire-contact.tsx \
        frontend/app/globals.css frontend/lib/i18n \
        frontend/lib/parcours/journal.test.ts \
        frontend/lib/parcours/contact-dom.test.ts
git commit -m "feat(contact): le formulaire survit a l envoi et annonce son etat"
```

---

### Tache 5 : la coquille, les deux volets et la migration des jetons

**Fichiers :**
- Modifier : `frontend/components/portfolio/contact-section.tsx` (reecrit)
- Modifier : `frontend/app/page.tsx` (passer `personalInfo`)
- Modifier : `frontend/app/globals.css` (disposition des deux volets)
- Test : `frontend/lib/parcours/contact-dom.test.ts` (etendu)

**Interfaces :**
- Consomme : `Coordonnees` (tache 3), `FormulaireContact` (tache 4).
- Produit :
  ```ts
  export function ContactSection({ personalInfo }: { personalInfo: PersonalInfoDto })
  ```

**`app/page.tsx` est un composant SERVEUR.** Il rend deja
`<ContactSection />` dans un `<SectionShell cleTitre="nav.contact" ...>` : il
passe desormais `personalInfo={data.personalInfo}`, une donnee et jamais une
fonction.

**La migration des jetons est le coeur de cette tache.** Tout ce qui reste de
`text-muted-foreground`, `border-border` et `bg-background` dans la section
passe aux jetons du site, et le vert et le rouge de Tailwind disparaissent avec
l'ancien corps du fichier.

- [ ] **Etape 1 : ecrire les tests qui echouent**

```ts
describe("la section contact (spec sections 2 et 3)", () => {
  it("rend les deux volets, les coordonnees AVANT le formulaire", () => {
    // l ordre du document decide l ordre sur telephone
  });

  it("n emploie AUCUN jeton shadcn ni couleur Tailwind", () => {
    const corps = bloc(/\.contact-volets\s*\{/);
    for (const interdit of ["muted-foreground", "border-border", "bg-background",
                            "green", "red"]) {
      expect(corps, interdit).not.toContain(interdit);
    }
    // et sur le source rendu : aucune classe de couleur Tailwind
  });

  it("n introduit aucun mouvement et aucun degrade", () => { /* balayage du bloc */ });

  it("les contrastes tiennent dans les DEUX palettes", () => {
    // calcules depuis les jetons, jamais epingles
  });
});
```

- [ ] **Etape 2 : lancer les tests pour les voir echouer**

Lancer : `npm run test -w frontend -- contact-dom`
Attendu : ECHEC sur l'ordre des volets et sur les jetons.

- [ ] **Etape 3 : reecrire `ContactSection`**

Deux volets en `grid grid-cols-1 md:grid-cols-2 gap-6`, les coordonnees en
premier dans l'ordre du document. Le titre allege, la section ne rendant que son
corps puisque `SectionShell` porte deja le titre et le numero.

- [ ] **Etape 4 : brancher `page.tsx`**

- [ ] **Etape 5 : lancer tout**

Lancer : `npm run test -w frontend`, `npm run typecheck -w frontend`,
`npm run lint --workspace frontend`, puis `npm run test -w backend`
Attendu : tout passe, lint frontend a exactement un probleme, backend inchange
a 91 tests sur 7 fichiers.

- [ ] **Etape 6 : prouver que les gardes mordent**

- les deux volets inverses dans l'ordre du document
- `md:grid-cols-2` retire
- `text-muted-foreground` remis sur un paragraphe
- `transition: opacity 1s` ajoutee au bloc des volets
- un jeton de contraste modifie dans `tokens.ts`, **puis restaure**

- [ ] **Etape 7 : commit**

```bash
git add frontend/components/portfolio/contact-section.tsx frontend/app/page.tsx \
        frontend/app/globals.css frontend/lib/parcours/contact-dom.test.ts
git commit -m "feat(contact): deux volets sur les jetons du site"
```

---

## Verification finale

- `npm run test -w frontend` : **tous verts**, 27 fichiers au depart plus les
  deux fichiers neufs.
- `npm run test -w backend` : **91 sur 7, inchange**. Ce chantier ne touche pas
  au backend.
- `npm run typecheck -w frontend` : propre.
- `npm run lint --workspace frontend` : **exactement un probleme**,
  `i18n-context.tsx:35`.
- Les trois dictionnaires a **76 cles** en parite exacte.
- `git status` ne montre que `?? .claude/settings.json`.
- La garde de depot contre le tiret cadratin et le trace de boite passe.

**Ce que nul test ne remplace, et qui revient au proprietaire :** le rendu des
deux volets a l'ecran, la lisibilite du bloc d'etat, et le fait que le
formulaire tienne vraiment dans une section de la hauteur de l'ecran. jsdom ne
met rien en page.
