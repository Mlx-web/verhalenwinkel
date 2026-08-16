# Sonja's Verhalenwinkel

Een oefenproject: een etalage met korte verhalen. Elk raam toont een verhaal
zodra het is toegevoegd; klik op een raam om het hele verhaal te lezen. Een beheerder
kan via een apart, met wachtwoord beveiligd scherm nieuwe verhalen toevoegen door een
titel in te typen en een `.docx`- of `.txt`-bestand te uploaden.

## Starten

1. Installeer de dependencies:

   ```bash
   npm install
   ```

2. Kopieer `.env.example` naar `.env` en pas eventueel het wachtwoord aan:

   ```bash
   cp .env.example .env
   ```

   Standaardwachtwoord voor de beheerder: `sonja123`.

3. Start de server:

   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in je browser.

## Gebruik

- **Etalage** (`/`): toont standaard 4 ramen. Een leeg raam ziet er dof/gesloten uit;
  een gevuld raam toont de titel en de eerste zin (teaser) van het verhaal en licht op
  bij het klikken. Zijn er meer dan 4 verhalen, dan komt er automatisch een extra raam
  bij per verhaal.
- **Beheer** (`/login.html`): log in met het wachtwoord om verhalen toe te voegen of
  te verwijderen via `/admin.html`.

## Techniek

- **Backend**: Node.js + Express. Sessies via een ondertekende cookie (`cookie-session`),
  wachtwoordcontrole via `bcryptjs`, bestandsupload via `multer`, tekst uit
  `.docx`-bestanden via `mammoth`.
- **Opslag**: lokaal in `data/stories.json` (geen database nodig). Op Netlify wordt
  automatisch overgeschakeld naar **Netlify Blobs**, omdat Netlify Functions geen
  bestanden op schijf kunnen bewaren tussen aanroepen.
- **Frontend**: losse HTML/CSS/JS-bestanden zonder build-stap, in de kleuren oxblood,
  ochre en sage.

## Projectstructuur

```
server/               Express-app (routes, opslag, tekstextractie)
  app.js               de Express-app zelf (gedeeld tussen lokaal en Netlify)
  index.js             lokale start (npm start): voegt statische bestanden toe + luistert
  stories.js           kiest automatisch lokale opslag of Netlify Blobs
  stories.local.js      opslag in data/stories.json
  stories.blobs.js      opslag via Netlify Blobs
netlify/functions/    Netlify Function die app.js hergebruikt (serverless-http)
netlify.toml          Netlify-configuratie (routing /api/* naar de function)
public/               Frontend (etalage, login, beheer)
data/                 Lokale opslag van verhalen (niet in git, alleen voor npm start)
```

## Live zetten op Netlify

1. Log in op [app.netlify.com](https://app.netlify.com) en klik **"Add new site" →
   "Import an existing project"**.
2. Kies GitHub, en selecteer de repository `mlx-web/verhalenwinkel` en de branch
   `claude/sonjas-verhalenwinkel-dxjqhz`.
3. Netlify herkent de instellingen automatisch via `netlify.toml` (publish-map `public`,
   functions-map `netlify/functions`). Klik **"Deploy"**.
4. Ga na het deployen naar **Site settings → Environment variables** en voeg toe:
   - `ADMIN_PASSWORD` — een eigen, geheim wachtwoord (niet het standaardwachtwoord
     laten staan voor een publiek toegankelijke site!)
   - `SESSION_SECRET` — een willekeurige lange tekenreeks
5. Doe daarna nog een **"Trigger deploy"** zodat de nieuwe variabelen worden meegenomen.

Netlify Blobs hoeft nergens apart aangezet te worden — dat werkt automatisch zodra de
site op Netlify draait.
