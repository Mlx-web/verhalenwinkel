const MIN_WINDOWS = 3;
const CURTAIN_HEIGHTS = ['24%', '34%', '44%', '54%'];
let curtainIndex = 0;

const etalage = document.getElementById('etalage');
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');
const commentsList = document.getElementById('comments-list');
const commentForm = document.getElementById('comment-form');
const commentNameInput = document.getElementById('comment-name');
const commentTextInput = document.getElementById('comment-text');
const commentMessage = document.getElementById('comment-message');

let currentStoryId = null;
let isAdmin = false;

async function loadStories() {
  try {
    const res = await fetch('/api/stories');
    const stories = await res.json();
    renderEtalage(stories);
  } catch (err) {
    etalage.innerHTML = '<p style="color:#fff">Kon de etalage niet laden.</p>';
  }
}

async function loadSession() {
  try {
    const res = await fetch('/api/session');
    const data = await res.json();
    isAdmin = Boolean(data.isAdmin);
  } catch (err) {
    isAdmin = false;
  }
}

function renderEtalage(stories) {
  etalage.innerHTML = '';
  const windowCount = Math.max(MIN_WINDOWS, stories.length);

  for (let i = 0; i < windowCount; i += 1) {
    const story = stories[i];
    etalage.appendChild(story ? buildFilledWindow(story) : buildEmptyWindow());
  }

  // De deur is een vast onderdeel van de winkel, los van het aantal
  // verhalen, en staat altijd als laatste — op een telefoon (één kolom)
  // is dat dus vanzelf het onderste raam.
  etalage.appendChild(buildDoor());
}

function buildDoor() {
  const win = document.createElement('div');
  win.className = 'window door';
  win.tabIndex = 0;
  win.setAttribute('role', 'button');
  win.setAttribute('aria-label', 'Open de deur en ga naar het achterkamertje');
  win.innerHTML = `
    <div class="door-sign">
      <span>Sonja's</span>
      <span>Verhalen</span>
      <span>Winkel</span>
    </div>
    <div class="door-panel"></div>
    <span class="doorknob"></span>
  `;

  const open = () => {
    win.classList.add('opening');
    setTimeout(() => {
      window.location.href = 'room.html';
    }, 380);
  };

  win.addEventListener('click', open);
  win.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open();
    }
  });

  return win;
}

function buildEmptyWindow() {
  const win = document.createElement('div');
  win.className = 'window empty';
  const curtainHeight = CURTAIN_HEIGHTS[curtainIndex % CURTAIN_HEIGHTS.length];
  curtainIndex += 1;
  win.innerHTML = `
    <div class="curtain" style="height: ${curtainHeight}"></div>
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

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

function renderComments(comments) {
  commentsList.innerHTML = '';

  if (!comments || comments.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'comment-empty';
    empty.textContent = 'Nog geen reacties. Wees de eerste!';
    commentsList.appendChild(empty);
    return;
  }

  comments.forEach((comment) => {
    const li = document.createElement('li');
    li.className = 'comment-item';

    const header = document.createElement('div');
    header.className = 'comment-header';
    const name = document.createElement('span');
    name.className = 'comment-name';
    name.textContent = comment.name;
    const date = document.createElement('span');
    date.className = 'comment-date';
    date.textContent = formatDate(comment.createdAt);
    header.appendChild(name);
    header.appendChild(date);

    const text = document.createElement('p');
    text.className = 'comment-text';
    text.textContent = comment.text;

    li.appendChild(header);
    li.appendChild(text);

    if (isAdmin) {
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'comment-delete';
      deleteBtn.type = 'button';
      deleteBtn.textContent = 'Verwijderen';
      deleteBtn.addEventListener('click', () => deleteComment(comment.id));
      li.appendChild(deleteBtn);
    }

    commentsList.appendChild(li);
  });
}

async function deleteComment(commentId) {
  if (!currentStoryId) return;
  const res = await fetch(`/api/stories/${currentStoryId}/comments/${commentId}`, { method: 'DELETE' });
  if (res.ok) {
    const story = await fetch(`/api/stories/${currentStoryId}`).then((r) => r.json());
    renderComments(story.comments || []);
  }
}

async function openStory(id) {
  try {
    const res = await fetch(`/api/stories/${id}`);
    if (!res.ok) throw new Error('Verhaal niet gevonden.');
    const story = await res.json();
    currentStoryId = id;
    modalTitle.textContent = story.title;
    modalBody.textContent = story.fullText;
    renderComments(story.comments || []);
    commentForm.reset();
    commentMessage.hidden = true;
    modalOverlay.hidden = false;
    modalClose.focus();
  } catch (err) {
    currentStoryId = null;
    modalTitle.textContent = 'Oeps';
    modalBody.textContent = 'Dit verhaal kon niet geladen worden.';
    commentsList.innerHTML = '';
    modalOverlay.hidden = false;
  }
}

function closeModal() {
  modalOverlay.hidden = true;
}

commentForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentStoryId) return;
  commentMessage.hidden = true;

  const name = commentNameInput.value;
  const text = commentTextInput.value;

  if (!text.trim()) {
    commentMessage.textContent = 'Vul een reactie in.';
    commentMessage.hidden = false;
    return;
  }

  try {
    const res = await fetch(`/api/stories/${currentStoryId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, text }),
    });
    const data = await res.json();

    if (!res.ok) {
      commentMessage.textContent = data.error || 'Reactie plaatsen mislukt.';
      commentMessage.hidden = false;
      return;
    }

    const story = await fetch(`/api/stories/${currentStoryId}`).then((r) => r.json());
    renderComments(story.comments || []);
    commentForm.reset();
  } catch (err) {
    commentMessage.textContent = 'Er ging iets mis. Probeer het opnieuw.';
    commentMessage.hidden = false;
  }
});

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modalOverlay.hidden) closeModal();
});

loadSession();
loadStories();
