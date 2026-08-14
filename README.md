# Sonja's Verhalenwinkel

Een lokaal oefenproject: een etalage met korte verhalen. Elk raam toont een verhaal
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

- **Backend**: Node.js + Express. Sessies via `express-session`, wachtwoordcontrole via
  `bcryptjs`, bestandsupload via `multer`, tekst uit `.docx`-bestanden via `mammoth`.
- **Opslag**: verhalen worden lokaal weggeschreven in `data/stories.json` (geen
  database nodig).
- **Frontend**: losse HTML/CSS/JS-bestanden zonder build-stap, in de kleuren oxblood,
  ochre en sage.

## Projectstructuur

```
server/          Express-backend (routes, opslag, tekstextractie)
public/          Frontend (etalage, login, beheer)
data/            Lokale opslag van verhalen en geüploade bestanden (niet in git)
```
