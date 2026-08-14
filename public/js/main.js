const MIN_WINDOWS = 4;

const etalage = document.getElementById('etalage');
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');

async function loadStories() {
  try {
    const res = await fetch('/api/stories');
    const stories = await res.json();
    renderEtalage(stories);
  } catch (err) {
    etalage.innerHTML = '<p style="color:#fff">Kon de etalage niet laden.</p>';
  }
}

function renderEtalage(stories) {
  etalage.innerHTML = '';
  const windowCount = Math.max(MIN_WINDOWS, stories.length);

  for (let i = 0; i < windowCount; i += 1) {
    const story = stories[i];
    etalage.appendChild(story ? buildFilledWindow(story) : buildEmptyWindow());
  }
}

function buildEmptyWindow() {
  const card = document.createElement('div');
  card.className = 'window-card empty';
  card.innerHTML = `
    <div class="window empty">
      <div class="curtain"></div>
      <div class="window-content">
        <div class="empty-icon">🕯️</div>
      </div>
    </div>
    <div class="window-caption">
      <p class="empty-label">Nog geen verhaal</p>
    </div>
  `;
  return card;
}

function buildFilledWindow(story) {
  const card = document.createElement('div');
  card.className = 'window-card filled';
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', `Lees het verhaal: ${story.title}`);
  card.innerHTML = `
    <div class="window filled">
      <div class="window-content">
        <div class="book"></div>
      </div>
    </div>
    <div class="window-caption">
      <h3 class="story-title"></h3>
      <p class="story-teaser"></p>
      <span class="read-hint">Klik om te lezen</span>
    </div>
  `;
  card.querySelector('.story-title').textContent = story.title;
  card.querySelector('.story-teaser').textContent = story.teaser;

  const open = () => openStory(story.id);
  card.addEventListener('click', open);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open();
    }
  });

  return card;
}

async function openStory(id) {
  try {
    const res = await fetch(`/api/stories/${id}`);
    if (!res.ok) throw new Error('Verhaal niet gevonden.');
    const story = await res.json();
    modalTitle.textContent = story.title;
    modalBody.textContent = story.fullText;
    modalOverlay.hidden = false;
    modalClose.focus();
  } catch (err) {
    modalTitle.textContent = 'Oeps';
    modalBody.textContent = 'Dit verhaal kon niet geladen worden.';
    modalOverlay.hidden = false;
  }
}

function closeModal() {
  modalOverlay.hidden = true;
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modalOverlay.hidden) closeModal();
});

loadStories();
