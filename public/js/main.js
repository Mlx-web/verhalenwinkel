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
  const win = document.createElement('div');
  win.className = 'window empty';
  win.innerHTML = `
    <div class="curtain"></div>
    <div class="window-content">
      <div class="empty-icon">🕯️</div>
      <p class="empty-label">Nog geen verhaal</p>
    </div>
    <span class="window-label">leeg raam</span>
  `;
  return win;
}

function buildFilledWindow(story) {
  const win = document.createElement('div');
  win.className = 'window filled';
  win.tabIndex = 0;
  win.setAttribute('role', 'button');
  win.setAttribute('aria-label', `Lees het verhaal: ${story.title}`);
  win.innerHTML = `
    <div class="window-content">
      <div class="book"></div>
      <h3 class="story-title"></h3>
      <p class="story-teaser"></p>
      <p class="read-hint">Klik om te lezen</p>
    </div>
  `;
  win.querySelector('.story-title').textContent = story.title;
  win.querySelector('.story-teaser').textContent = story.teaser;

  const open = () => openStory(story.id);
  win.addEventListener('click', open);
  win.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open();
    }
  });

  return win;
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
