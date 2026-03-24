# Gen_IT

Gen_IT est une application Next.js de qualification commerciale B2B construite autour de donnees publiques francaises.

L'objectif est simple: rechercher des entreprises, enrichir leur lecture avec des signaux issus de sources officielles, puis aider a prioriser les comptes les plus interessants via un scoring et un reranking ICP.

## Fonctionnalites

- Recherche d'entreprises via SIRENE
- Filtres par secteur, localisation, effectif et forme juridique
- Scoring automatique base sur recence, activite, taille, stabilite, finances et signaux
- Fiche entreprise enrichie avec donnees SIRENE et BODACC
- Favoris en local
- Export CSV des resultats et des favoris
- Profils ICP predefinis
- ICP personnalise avec reranking partageable par URL

## Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- App Router
- APIs publiques francaises:
  - `recherche-entreprises.api.gouv.fr`
  - `bodacc-datadila.opendatasoft.com`

## Demarrage rapide

### Prerequis

- Node.js 20+
- npm

### Installation

```bash
npm install
```

### Variables d'environnement

Le projet contient un fichier `.env.example`.

Copier les variables si besoin:

```bash
cp .env.example .env.local
```

Variables presentes:

- `DATABASE_URL`
- `REDIS_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `SIRENE_API_URL`
- `BODACC_API_URL`
- `BAN_API_URL`
- `GEO_API_URL`

Dans l'etat actuel du projet, la partie recherche et enrichissement fonctionne principalement via les APIs publiques. Les variables base de donnees / auth sont prevues pour une extension future.

### Lancer le projet

```bash
npm run dev
```

Application disponible sur `http://localhost:3000`.

## Scripts utiles

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
```

## Structure du projet

```text
app/
  api/companies/
    search/route.ts        # Recherche et tri
    [siren]/route.ts       # Fiche entreprise enrichie
  companies/[siren]/page.tsx
  favorites/page.tsx
  search/page.tsx
  page.tsx

components/
  companies/               # Cartes entreprise
  layout/                  # Layout applicatif
  scoring/                 # Badges et breakdown du score
  search/                  # Filtres
  ui/                      # Composants UI simples

lib/
  bodacc.ts                # Recuperation et analyse BODACC
  export.ts                # Export CSV
  favorites.ts             # Favoris localStorage
  icp.ts                   # Reranking ICP
  naf.ts                   # Mapping NAF
  scoring.ts               # Moteur de scoring
  sirene.ts                # Recherche et normalisation SIRENE

tests/
  scoring.test.ts
  sirene-bodacc.test.ts
```

## Logique produit

### Recherche

La page `/search` combine:

- recherche texte
- filtres metier
- tri
- URL partageable
- mode favoris seulement
- reranking ICP

### Scoring

Le score repose sur plusieurs dimensions:

- recence de creation
- pertinence sectorielle
- taille de structure
- stabilite legale
- disponibilite financiere
- signaux business

Le calcul est centralise dans [`lib/scoring.ts`](./lib/scoring.ts).

### ICP

Le reranking ICP permet de reclasser les resultats selon:

- des profils predefinis
- ou un profil personnalise

Le moteur est implemente dans [`lib/icp.ts`](./lib/icp.ts).

## APIs exposees

### `GET /api/companies/search`

Parametres principaux:

- `query`
- `nafCode`
- `department`
- `postalCode`
- `employeeRange`
- `legalForm`
- `sort`
- `page`
- `limit`

Retour:

- liste d'entreprises normalisees
- score
- details de score
- pagination

### `GET /api/companies/:siren`

Retour:

- fiche entreprise normalisee
- score et signaux
- historique BODACC recent
- analyse BODACC agregée

## Qualite et tests

Le projet est tape en TypeScript et couvre le coeur metier avec des tests sur:

- le scoring
- la normalisation SIRENE
- l'analyse BODACC

Commande de verification:

```bash
npx tsc --noEmit
```

## Limites actuelles

- favoris stockes localement dans le navigateur
- pas encore de persistance serveur pour les recherches sauvegardees
- pas de back-office ou d'auth utilisateur active
- dependance aux sources publiques et a leur disponibilite

## Pistes d'evolution

- recherches sauvegardees
- persistance serveur des favoris et segments
- exports plus riches
- dashboard de suivi commercial
- scoring ICP configurable par persona
- monitoring et cache applicatif

## Positionnement

Gen_IT n'est pas une simple interface de recherche.

Le projet vise un usage de qualification commerciale: trouver, trier, expliquer et prioriser des entreprises a partir de signaux lisibles et exploitables.
