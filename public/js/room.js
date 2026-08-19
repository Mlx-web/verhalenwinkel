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
