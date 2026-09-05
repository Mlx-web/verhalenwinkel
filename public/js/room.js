// ---- Clubwachtwoord: alleen clubleden mogen het achterkamertje in ----

const clubLockOverlay = document.getElementById('club-lock-overlay');
const clubLockForm = document.getElementById('club-lock-form');
const clubLockPassword = document.getElementById('club-lock-password');
const clubLockMessage = document.getElementById('club-lock-message');

async function checkClubAccess() {
  try {
    const res = await fetch('/api/club-access');
    const data = await res.json();
    if (data.access) clubLockOverlay.hidden = true;
  } catch {
    // overlay blijft zichtbaar, opnieuw proberen kan via het formulier
  }
}

clubLockForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clubLockMessage.hidden = true;
  try {
    const res = await fetch('/api/club-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: clubLockPassword.value }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      clubLockMessage.textContent = data.error || 'Onjuist wachtwoord.';
      clubLockMessage.hidden = false;
      return;
    }
    clubLockOverlay.hidden = true;
  } catch {
    clubLockMessage.textContent = 'Er ging iets mis, probeer het nog eens.';
    clubLockMessage.hidden = false;
  }
});

checkClubAccess();

const typewriter = document.getElementById('typewriter');
const typeOverlay = document.getElementById('type-overlay');
const typeClose = document.getElementById('type-close');
const typeForm = document.getElementById('type-form');
const typeStoryTitle = document.getElementById('type-story-title');
const typeStoryAuthor = document.getElementById('type-story-author');
const typeStoryText = document.getElementById('type-story-text');
const typeMessage = document.getElementById('type-message');

// Bewaart het ownerToken van een zelf ingetypt verhaal in de browser van de
// inzender, zodat die het later zelf kan verwijderen (zelfde patroon als de
// editToken-helpers voor reacties in main.js).
function saveMyStoryToken(id, token) {
  let tokens = {};
  try { tokens = JSON.parse(localStorage.getItem('myStoryTokens') || '{}'); } catch { /* leeg blijft leeg */ }
  tokens[id] = token;
  localStorage.setItem('myStoryTokens', JSON.stringify(tokens));
}

typewriter.addEventListener('click', () => {
  typeMessage.hidden = true;
  typeForm.reset();
  typeOverlay.hidden = false;
  typeStoryTitle.focus();
});

typeClose.addEventListener('click', () => {
  typeOverlay.hidden = true;
});

typeOverlay.addEventListener('click', (e) => {
  if (e.target === typeOverlay) typeOverlay.hidden = true;
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !typeOverlay.hidden) typeOverlay.hidden = true;
});

typeForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  typeMessage.hidden = true;

  const title = typeStoryTitle.value;
  const author = typeStoryAuthor.value;
  const text = typeStoryText.value;

  if (!author.trim()) {
    typeMessage.className = 'message error';
    typeMessage.textContent = 'Vul in wie het verhaal geschreven heeft.';
    typeMessage.hidden = false;
    return;
  }

  if (!text.trim()) {
    typeMessage.className = 'message error';
    typeMessage.textContent = 'Typ eerst een verhaal.';
    typeMessage.hidden = false;
    return;
  }

  // Hergebruikt de bestaande upload-route: de getypte tekst wordt verpakt
  // als een .txt-bestand, precies zoals een geüpload bestand.
  const blob = new Blob([text], { type: 'text/plain' });
  const body = new FormData();
  body.append('title', title);
  body.append('author', author);
  body.append('file', blob, 'getypt-verhaal.txt');

  try {
    const res = await fetch('/api/stories', { method: 'POST', body });
    const data = await res.json();

    if (!res.ok) {
      typeMessage.className = 'message error';
      typeMessage.textContent = data.error || 'Opslaan mislukt.';
      typeMessage.hidden = false;
      return;
    }

    if (data.ownerToken) saveMyStoryToken(data.id, data.ownerToken);

    typeMessage.className = 'message success';
    typeMessage.innerHTML = `"${data.title}" is toegevoegd aan de etalage. <a href="kris-kras-klup.html">Bekijk de etalage</a>`;
    typeMessage.hidden = false;
    typeForm.reset();
  } catch (err) {
    typeMessage.className = 'message error';
    typeMessage.textContent = 'Er ging iets mis. Probeer het opnieuw.';
    typeMessage.hidden = false;
  }
});

// ---- Wandklok: wijst de echte tijd aan, elke seconde bijgewerkt ----

const clockHour = document.getElementById('clock-hour');
const clockMinute = document.getElementById('clock-minute');
const clockSecond = document.getElementById('clock-second');

function updateClock() {
  const now = new Date();
  const hours = now.getHours() % 12;
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const hourDeg = hours * 30 + minutes * 0.5;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const secondDeg = seconds * 6;

  if (clockHour) clockHour.style.transform = `rotate(${hourDeg}deg)`;
  if (clockMinute) clockMinute.style.transform = `rotate(${minuteDeg}deg)`;
  if (clockSecond) clockSecond.style.transform = `rotate(${secondDeg}deg)`;
}

if (clockHour && clockMinute && clockSecond) {
  updateClock();
  setInterval(updateClock, 1000);
}

// ---- Gedeeld spreekbelletje, gebruikt door zowel de boekenkast als de klok ----

let bubbleTimeout = null;

function showBubble(anchor, text) {
  let bubble = document.getElementById('room-bubble');
  if (!bubble) {
    bubble = document.createElement('div');
    bubble.id = 'room-bubble';
    bubble.className = 'room-bubble';
    bubble.hidden = true;
    document.body.appendChild(bubble);
  }
  bubble.textContent = text;
  bubble.hidden = false;

  const rect = anchor.getBoundingClientRect();
  const top = rect.top + window.scrollY - bubble.offsetHeight - 16;
  const left = rect.left + window.scrollX + rect.width / 2;
  bubble.style.top = `${Math.max(8, top)}px`;
  bubble.style.left = `${left}px`;

  clearTimeout(bubbleTimeout);
  bubbleTimeout = setTimeout(() => {
    bubble.hidden = true;
  }, 4500);
}

document.addEventListener('click', (e) => {
  const bubble = document.getElementById('room-bubble');
  if (!bubble || bubble.hidden) return;
  if (e.target.closest('.bookshelf') || e.target.closest('.wall-clock') || e.target.closest('.room-cat')) return;
  bubble.hidden = true;
});

// ---- Boekenkast: tik voor een speelse boekentip ----

const FALLBACK_BOOK_TIPS = [
  '"De Kat die Nooit Loog" — een spannend verhaal over een kat met een groot geheim.',
  '"Het Meisje met de Regenparaplu" — soms is de mooiste avond een natte avond.',
  "Oma's Wonderlijke Kruidenkastje — niet elk kruid doet wat je verwacht.",
  '"De Laatste Trein naar Nergensland" — instappen kan, uitstappen is lastiger.',
  '"Het Dagboek van een Verdwaalde Wolk" — hij weet zelf ook niet waar hij heen gaat.',
  '"Drie Knopen en een Geheim" — een jasje met meer verhaal dan je zou denken.',
  '"De Sleutel die Niemand Paste" — tot iemand het juiste slot vond.',
  '"Zeven Zinnen over de Zee" — soms is kort genoeg.',
];

let bookTips = null;

async function loadBookTips() {
  try {
    const res = await fetch('/api/book-tips');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length) bookTips = data;
    }
  } catch {
    // val terug op FALLBACK_BOOK_TIPS hieronder
  }
}

const bookshelf = document.querySelector('.bookshelf');
if (bookshelf) {
  bookshelf.removeAttribute('aria-hidden');
  bookshelf.tabIndex = 0;
  bookshelf.setAttribute('role', 'button');
  bookshelf.setAttribute('aria-label', 'Boekenkast: tik voor een boekentip');

  const showBookTip = () => {
    const tips = bookTips || FALLBACK_BOOK_TIPS;
    const tip = tips[Math.floor(Math.random() * tips.length)];
    showBubble(bookshelf, tip);
  };

  bookshelf.addEventListener('click', showBookTip);
  bookshelf.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      showBookTip();
    }
  });

  loadBookTips();
}

// ---- Boekentip insturen: clubleden mogen zelf een tip voorstellen ----

const bookTipSubmitBtn = document.querySelector('.book-tip-submit-btn');
const bookTipOverlay = document.getElementById('book-tip-overlay');
const bookTipClose = document.getElementById('book-tip-close');
const bookTipForm = document.getElementById('book-tip-form');
const bookTipInput = document.getElementById('book-tip-input');
const bookTipNameInput = document.getElementById('book-tip-name');
const bookTipFormMessage = document.getElementById('book-tip-form-message');

if (bookTipSubmitBtn) {
  bookTipSubmitBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    bookTipFormMessage.hidden = true;
    bookTipForm.reset();
    bookTipOverlay.hidden = false;
    bookTipInput.focus();
  });

  bookTipClose.addEventListener('click', () => { bookTipOverlay.hidden = true; });
  bookTipOverlay.addEventListener('click', (e) => {
    if (e.target === bookTipOverlay) bookTipOverlay.hidden = true;
  });

  bookTipForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    bookTipFormMessage.hidden = true;

    try {
      const res = await fetch('/api/book-tips/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: bookTipInput.value, name: bookTipNameInput.value }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        bookTipFormMessage.className = 'message error';
        bookTipFormMessage.textContent = data.error || 'Insturen mislukt.';
        bookTipFormMessage.hidden = false;
        return;
      }

      bookTipFormMessage.className = 'message success';
      bookTipFormMessage.textContent = 'Bedankt! De docent bekijkt je tip.';
      bookTipFormMessage.hidden = false;
      bookTipForm.reset();
    } catch {
      bookTipFormMessage.className = 'message error';
      bookTipFormMessage.textContent = 'Er ging iets mis. Probeer het opnieuw.';
      bookTipFormMessage.hidden = false;
    }
  });
}

// ---- Wandklok: tik voor een boodschap voor de bezoeker, afhankelijk van tijdstip ----

const FALLBACK_CLOCK_MESSAGES = {
  morning: 'Goedemorgen, schrijver! Welk avontuur verzin jij vandaag?',
  afternoon: 'Tik-tak! Zin in een spannend verhaal deze middag?',
  evening: 'De zon gaat bijna onder... perfect voor een spannend slot!',
  night: 'Ssst, zo laat nog wakker? Ergens wacht een verhaal om ontdekt te worden!',
};

let clockMessages = null;

async function loadClockMessages() {
  try {
    const res = await fetch('/api/clock-messages');
    if (res.ok) clockMessages = await res.json();
  } catch {
    // val terug op FALLBACK_CLOCK_MESSAGES hieronder
  }
}

function clockMessageForNow() {
  const hour = new Date().getHours();
  const messages = clockMessages || FALLBACK_CLOCK_MESSAGES;
  if (hour >= 6 && hour < 12) return messages.morning;
  if (hour >= 12 && hour < 18) return messages.afternoon;
  if (hour >= 18 && hour < 23) return messages.evening;
  return messages.night;
}

const wallClock = document.querySelector('.wall-clock');
if (wallClock) {
  wallClock.tabIndex = 0;
  wallClock.setAttribute('role', 'button');
  wallClock.setAttribute('aria-label', 'Klok: tik voor een boodschap');

  const showClockMessage = () => showBubble(wallClock, clockMessageForNow());

  wallClock.addEventListener('click', showClockMessage);
  wallClock.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      showClockMessage();
    }
  });

  loadClockMessages();
}

// Op een telefoon staat het achterkamertje in een horizontale swipe-carousel
// (muur met klok | schrijftafel | boekenkast). De schrijftafel is de
// standaardweergave, zodat bezoekers meteen de typemachine zien.
const roomFloor = document.querySelector('.room-floor');
if (roomFloor) {
  const centerOnTable = () => {
    if (window.matchMedia('(max-width: 600px)').matches) {
      // De schrijftafel is het middelste paneel (muur | tafel | boekenkast),
      // dus één paneelbreedte naar rechts scrollen volstaat.
      roomFloor.scrollLeft = roomFloor.clientWidth;
    }
  };
  centerOnTable();
  window.addEventListener('resize', centerOnTable);
}

// Op mobiel wisselen de klok en de poes van paneel: de klok hangt boven de
// typemachine (in het tafelpaneel) en de poes zit onder de posters (in het
// muurpaneel). Op desktop staan ze weer terug op hun oorspronkelijke plek.
const mobileRoomLayout = (() => {
  const stage = document.querySelector('.room-stage');
  const tableArea = document.querySelector('.table-area');
  const tableWrap = document.querySelector('.room-table-wrap');
  const wallClockEl = document.querySelector('.wall-clock');
  const roomWallEl = document.querySelector('.room-wall');
  const roomCatEl = document.querySelector('.room-cat');
  const roomHintEl = document.querySelector('.room-hint');

  if (!stage || !tableArea || !tableWrap || !wallClockEl || !roomWallEl || !roomCatEl || !roomHintEl) return null;

  return () => {
    const isMobile = window.matchMedia('(max-width: 600px)').matches;
    if (isMobile) {
      if (wallClockEl.nextElementSibling !== tableWrap || wallClockEl.parentElement !== stage) {
        stage.insertBefore(wallClockEl, tableWrap);
      }
      // De hint komt tussen de klok en de tafel in te staan, dus boven de
      // typemachine in plaats van eronder.
      if (roomHintEl.nextElementSibling !== tableWrap || roomHintEl.parentElement !== stage) {
        stage.insertBefore(roomHintEl, tableWrap);
      }
      if (roomCatEl.parentElement !== roomWallEl) {
        roomWallEl.appendChild(roomCatEl);
      }
    } else {
      if (wallClockEl.parentElement !== roomWallEl) {
        roomWallEl.appendChild(wallClockEl);
      }
      if (roomHintEl.parentElement !== tableArea) {
        tableArea.appendChild(roomHintEl);
      }
      if (roomCatEl.parentElement !== stage) {
        stage.appendChild(roomCatEl);
      }
    }
  };
})();

if (mobileRoomLayout) {
  mobileRoomLayout();
  window.addEventListener('resize', mobileRoomLayout);
}

// ---- Poes: tik voor een miauw ----

const MEOWS = ['Miauw!', 'Mrrrauw~', 'Miaaauw!', 'Prrrt... miauw!'];

const roomCat = document.querySelector('.room-cat');
if (roomCat) {
  roomCat.tabIndex = 0;
  roomCat.setAttribute('role', 'button');
  roomCat.setAttribute('aria-label', 'Poes: tik voor een miauw');

  const showMeow = () => showBubble(roomCat, MEOWS[Math.floor(Math.random() * MEOWS.length)]);

  roomCat.addEventListener('click', showMeow);
  roomCat.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      showMeow();
    }
  });
}
