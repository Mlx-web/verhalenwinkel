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
   ------------------------------------------------------------------------- */
const LICHAAMSDELEN = [
  {
    id: "hoofd",
    naam: "Hoofd",
    kleur: "#F2B705",        // mosterdgeel
    illustratie: "illustrations/hoofd.svg",
    groteIllustratie: "illustrations/hoofd.svg", // <- vervang eventueel door eigen GIF/Lottie
    tekst: "Vol met ideeën, dagdromen en dat ene liedje dat je niet meer uit je hoofd krijgt."
  },
  {
    id: "hand",
    naam: "Hand",
    kleur: "#E8542C",        // baksteenrood / oranje
    illustratie: "illustrations/hand.svg",
    groteIllustratie: "illustrations/hand.svg",
    tekst: "Schrijft, wenkt, wijst de weg en klapt net iets te hard mee met muziek."
  },
  {
    id: "hart",
    naam: "Hart",
    kleur: "#F23D6D",        // felroze
    illustratie: "illustrations/hart.svg",
    groteIllustratie: "illustrations/hart.svg",
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
    id: "voet",
    naam: "Voet",
    kleur: "#4CA64C",        // grasgroen
    illustratie: "illustrations/voet.svg",
    groteIllustratie: "illustrations/voet.svg",
    tekst: "Staat het liefst op blote grond en tikt ongeduldig mee als het te lang duurt."
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
