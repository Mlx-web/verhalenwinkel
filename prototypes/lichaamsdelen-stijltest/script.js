/* =========================================================================
   STIJLTEST — lichaamsdelen
   Vanilla JS, geen dependencies. Alles bouwt hieronder uit één array.
   ========================================================================= */

/* -------------------------------------------------------------------------
   HIER PAS JE ALLES AAN: kleuren, illustraties en teksten per lichaamsdeel.
   Elk object hieronder is één tegel + de bijbehorende detailweergave.

   - kleur:        de vlakke achtergrondkleur van de tegel (hex).
   - illustratie:  pad naar het SVG/PNG/GIF-bestand voor de KLEINE tegel-versie.
                   Staat nu in de map "illustraties/". Vervang gewoon het
                   bestand, of wijzig het pad naar je eigen bestand.
   - groteIllustratie: pad voor de GROTE versie in de detailweergave. Staat
                   standaard gelijk aan "illustratie", maar mag een aparte
                   (grotere / geanimeerde / GIF- of video-)versie zijn.
   - tekst:        het korte, persoonlijke tekstje in de detailweergave.

   Wil je een lichaamsdeel toevoegen of verwijderen? Voeg een object toe of
   haal er een weg -- de grid en de klik-logica passen zich vanzelf aan.

   LET OP -- illustraties/*.svg zijn nu nog RUWE, TIJDELIJKE placeholders
   (simpele vlakke lijntekeningen). Ze zijn puur bedoeld om de layout/het
   mechanisme te testen, niet als eindstijl. Zodra je de "echte" illustraties
   hebt (in de stijl van je referentiebeeld: personage met open jas en een
   "kijkgaatje" met het orgaan erin), vervang je gewoon het bestand met
   dezelfde naam in illustrations/ -- er hoeft verder niets in dit bestand
   te veranderen.
   ------------------------------------------------------------------------- */
const LICHAAMSDELEN = [
  {
    id: "hart",
    naam: "Hart",
    kleur: "#F23D6D",        // felroze
    illustratie: "illustrations/hart.svg",
    groteIllustratie: "illustrations/hart.svg", // <- vervang eventueel door eigen GIF/Lottie
    tekst: "Klopt harder bij een goed verhaal dan bij hardlopen — en dat zegt genoeg."
  },
  {
    id: "oog",
    naam: "Oog",
    kleur: "#2E6FF2",        // helder blauw
    illustratie: "illustrations/oog.svg",
    groteIllustratie: "illustrations/oog.svg",
    tekst: "Ziet details die anderen missen, en huilt stiekem bij bijna elke film."
  },
  {
    id: "darmen",
    naam: "Darmen",
    kleur: "#E8542C",        // baksteenrood / oranje
    illustratie: "illustrations/darmen.svg",
    groteIllustratie: "illustrations/darmen.svg",
    tekst: "Kronkelt rustig door, behalve die ene keer dat er iets heel geks werd gegeten."
  },
  {
    id: "maag",
    naam: "Slokdarm & maag",
    kleur: "#F2B705",        // mosterdgeel
    illustratie: "illustrations/slokdarm-maag.svg",
    groteIllustratie: "illustrations/slokdarm-maag.svg",
    tekst: "De eerste stop na een grote hap — en de plek waar vlinders het hardst fladderen."
  },
  {
    id: "ruggenwervels",
    naam: "Ruggenwervels",
    kleur: "#4CA64C",        // grasgroen
    illustratie: "illustrations/ruggenwervels.svg",
    groteIllustratie: "illustrations/ruggenwervels.svg",
    tekst: "Houdt alles overeind, kraakt soms veelbetekenend, en onthoudt elke slechte stoel."
  }
];

const grid = document.getElementById("grid");
const detail = document.getElementById("detail");
const detailNaam = document.getElementById("detail-naam");
const detailTekst = document.getElementById("detail-tekst");
const detailAnimatieSlot = document.getElementById("detail-animatie-slot");
const detailSluitenKnop = document.getElementById("detail-sluiten");

// ---- Grid opbouwen ---------------------------------------------------

LICHAAMSDELEN.forEach((deel) => {
  const tegel = document.createElement("button");
  tegel.className = "tegel";
  tegel.type = "button";
  tegel.style.setProperty("--kleur", deel.kleur);
  tegel.setAttribute("aria-label", `Bekijk ${deel.naam}`);
  tegel.dataset.id = deel.id;

  const img = document.createElement("img");
  img.className = "tegel__illustratie";
  img.src = deel.illustratie;
  img.alt = deel.naam;
  img.draggable = false;

  const label = document.createElement("span");
  label.className = "tegel__naam";
  label.textContent = deel.naam;

  tegel.append(img, label);
  tegel.addEventListener("click", () => open(deel));

  grid.appendChild(tegel);
});

// ---- Detailweergave openen/sluiten ------------------------------------

function open(deel) {
  detail.style.setProperty("--kleur", deel.kleur);
  detailNaam.textContent = deel.naam;
  detailTekst.textContent = deel.tekst;

  /* HIER KOMT EIGEN ANIMATIE VOOR [lichaamsdeel]
     Nu wordt hier gewoon een <img> met de grote illustratie ingezet.
     Wil je een GIF, video of Lottie-animatie gebruiken? Vervang het
     <img>-element hieronder door bijvoorbeeld:
       <video src="..." autoplay loop muted playsinline></video>
     of (met de Lottie-library erbij geladen):
       <lottie-player src="..." autoplay loop></lottie-player>
  */
  detailAnimatieSlot.innerHTML = "";
  const groteImg = document.createElement("img");
  groteImg.src = deel.groteIllustratie;
  groteImg.alt = deel.naam;
  detailAnimatieSlot.appendChild(groteImg);

  detail.classList.add("detail--open");
  detail.setAttribute("aria-hidden", "false");
  detailSluitenKnop.focus();
}

function sluiten() {
  detail.classList.remove("detail--open");
  detail.setAttribute("aria-hidden", "true");
}

detailSluitenKnop.addEventListener("click", sluiten);
detail.querySelector(".detail__terug-knop").addEventListener("click", sluiten);

// Klik naast het "papier" sluit de detailweergave ook
detail.addEventListener("click", (e) => {
  if (e.target === detail) sluiten();
});

// Escape-toets sluit de detailweergave
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && detail.classList.contains("detail--open")) {
    sluiten();
  }
});
