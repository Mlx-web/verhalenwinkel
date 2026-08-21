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
    typeMessage.innerHTML = `"${data.title}" is toegevoegd aan de etalage. <a href="index.html">Bekijk de etalage</a>`;
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
  if (e.target.closest('.bookshelf') || e.target.closest('.wall-clock')) return;
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

// ---- Wandklok: tik voor een boodschap voor de bezoeker, afhankelijk van tijdstip ----

const FALLBACK_CLOCK_MESSAGES = {
  morning: 'Goedemorgen! Mooi moment om een verhaal te beginnen.',
  afternoon: 'Een rustig middaguurtje... goed om even te schrijven.',
  evening: 'De dag is bijna om — tijd voor een laatste zin?',
  night: 'Zo laat nog hier? Misschien wacht er een verhaal om opgeschreven te worden.',
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
