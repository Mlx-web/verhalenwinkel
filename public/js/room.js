const typewriter = document.getElementById('typewriter');
const typeOverlay = document.getElementById('type-overlay');
const typeClose = document.getElementById('type-close');
const typeForm = document.getElementById('type-form');
const typeStoryTitle = document.getElementById('type-story-title');
const typeStoryText = document.getElementById('type-story-text');
const typeMessage = document.getElementById('type-message');

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
