const MIN_WINDOWS = 3;
const CURTAIN_HEIGHTS = ['24%', '34%', '44%', '54%'];
let curtainIndex = 0;

const etalage = document.getElementById('etalage');
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalAuthor = document.getElementById('modal-author');
const modalBody = document.getElementById('modal-body');
const modalDeleteStory = document.getElementById('modal-delete-story');
const modalClose = document.getElementById('modal-close');
const commentsList = document.getElementById('comments-list');
const commentForm = document.getElementById('comment-form');
const commentNameInput = document.getElementById('comment-name');
const commentTextInput = document.getElementById('comment-text');
const commentMessage = document.getElementById('comment-message');

let currentStoryId = null;
let isAdmin = false;
let currentComments = [];
let editingCommentId = null;

// Bewaart per reactie/verhaal een geheim token in deze browser, zodat de
// plaatser dat ene item later zelf kan bewerken/verwijderen. Wordt nooit
// naar anderen gestuurd.
function getMyTokens(storageKey) {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || '{}');
  } catch {
    return {};
  }
}

function saveMyToken(storageKey, id, token) {
  const tokens = getMyTokens(storageKey);
  tokens[id] = token;
  localStorage.setItem(storageKey, JSON.stringify(tokens));
}

function getMyToken(storageKey, id) {
  return getMyTokens(storageKey)[id];
}

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
  // Er staat altijd minstens 1 leeg raam bij, ook als de etalage al vol
  // verhalen staat — dat nodigt uit om zelf ook iets in te leveren.
  const windowCount = Math.max(MIN_WINDOWS, stories.length + 1);
  const windows = [];

  for (let i = 0; i < windowCount; i += 1) {
    const story = stories[i];
    windows.push(story ? buildFilledWindow(story) : buildEmptyWindow());
  }

  // De deur en het laatste raam horen bij elkaar in één groep, zodat er op
  // desktop altijd minstens 1 raam naast de deur staat (nooit alleen op een
  // eigen rij), ongeacht hoeveel verhalen er zijn. Op een telefoon valt deze
  // groep juist weer uit elkaar, zodat elk raam los blijft swipen.
  const lastWindow = windows.pop();
  windows.forEach((win) => etalage.appendChild(win));

  const doorGroup = document.createElement('div');
  doorGroup.className = 'door-group';
  doorGroup.appendChild(lastWindow);
  doorGroup.appendChild(buildDoor());
  etalage.appendChild(doorGroup);
}

function buildDoor() {
  const win = document.createElement('div');
  win.className = 'window door';
  win.tabIndex = 0;
  win.setAttribute('role', 'button');
  win.setAttribute('aria-label', 'Open de deur en ga naar het achterkamertje');
  win.innerHTML = `
    <div class="door-title">
      <span>Sonja's</span>
      <span>verhalen</span>
      <span>winkel</span>
    </div>
    <p class="door-subtitle">Neem gerust een kijkje in de winkel</p>
    <div class="door-panel"></div>
    <span class="doorknob"></span>
    <button type="button" class="mail-slot" aria-label="Stuur een briefje aan Sonja"></button>
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

  const mailSlot = win.querySelector('.mail-slot');
  mailSlot.addEventListener('click', (e) => {
    e.stopPropagation();
    openMailbox();
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
  currentComments = comments || [];
  commentsList.innerHTML = '';

  if (currentComments.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'comment-empty';
    empty.textContent = 'Nog geen reacties. Wees de eerste!';
    commentsList.appendChild(empty);
    return;
  }

  currentComments.forEach((comment) => {
    const li = document.createElement('li');
    li.className = 'comment-item';

    const header = document.createElement('div');
    header.className = 'comment-header';
    const name = document.createElement('span');
    name.className = 'comment-name';
    name.textContent = comment.name;
    const date = document.createElement('span');
    date.className = 'comment-date';
    date.textContent = comment.editedAt
      ? `${formatDate(comment.createdAt)} (bewerkt)`
      : formatDate(comment.createdAt);
    header.appendChild(name);
    header.appendChild(date);
    li.appendChild(header);

    const myToken = getMyToken('myCommentTokens', comment.id);

    if (editingCommentId === comment.id) {
      const editForm = document.createElement('div');
      editForm.className = 'comment-edit-form';

      const textarea = document.createElement('textarea');
      textarea.className = 'comment-edit-textarea';
      textarea.maxLength = 500;
      textarea.value = comment.text;

      const actions = document.createElement('div');
      actions.className = 'comment-edit-actions';

      const saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.className = 'btn';
      saveBtn.textContent = 'Opslaan';
      saveBtn.addEventListener('click', () => saveCommentEdit(comment.id, textarea.value));

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'comment-delete';
      cancelBtn.textContent = 'Annuleren';
      cancelBtn.addEventListener('click', () => {
        editingCommentId = null;
        renderComments(currentComments);
      });

      actions.appendChild(saveBtn);
      actions.appendChild(cancelBtn);
      editForm.appendChild(textarea);
      editForm.appendChild(actions);
      li.appendChild(editForm);
    } else {
      const text = document.createElement('p');
      text.className = 'comment-text';
      text.textContent = comment.text;
      li.appendChild(text);

      if (myToken) {
        const editBtn = document.createElement('button');
        editBtn.className = 'comment-edit';
        editBtn.type = 'button';
        editBtn.textContent = 'Bewerken';
        editBtn.addEventListener('click', () => {
          editingCommentId = comment.id;
          renderComments(currentComments);
        });
        li.appendChild(editBtn);
      }

      if (isAdmin || myToken) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'comment-delete';
        deleteBtn.type = 'button';
        deleteBtn.textContent = 'Verwijderen';
        deleteBtn.addEventListener('click', () => deleteComment(comment.id));
        li.appendChild(deleteBtn);
      }
    }

    commentsList.appendChild(li);
  });
}

async function saveCommentEdit(commentId, text) {
  if (!currentStoryId) return;
  if (!text.trim()) return;

  const res = await fetch(`/api/stories/${currentStoryId}/comments/${commentId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, editToken: getMyToken('myCommentTokens', commentId) }),
  });

  if (res.ok) {
    editingCommentId = null;
    const story = await fetch(`/api/stories/${currentStoryId}`).then((r) => r.json());
    renderComments(story.comments || []);
  }
}

async function deleteComment(commentId) {
  if (!currentStoryId) return;
  if (!isAdmin && !confirm('Deze reactie verwijderen?')) return;
  const res = await fetch(`/api/stories/${currentStoryId}/comments/${commentId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ editToken: getMyToken('myCommentTokens', commentId) }),
  });
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
    editingCommentId = null;
    modalTitle.textContent = story.title;
    if (story.author) {
      modalAuthor.textContent = `door ${story.author}`;
      modalAuthor.hidden = false;
    } else {
      modalAuthor.hidden = true;
    }
    modalBody.textContent = story.fullText;

    const myStoryToken = getMyToken('myStoryTokens', story.id);
    modalDeleteStory.hidden = !myStoryToken;

    renderComments(story.comments || []);
    commentForm.reset();
    commentMessage.hidden = true;
    modalOverlay.hidden = false;
    modalClose.focus();
  } catch (err) {
    currentStoryId = null;
    modalTitle.textContent = 'Oeps';
    modalAuthor.hidden = true;
    modalDeleteStory.hidden = true;
    modalBody.textContent = 'Dit verhaal kon niet geladen worden.';
    commentsList.innerHTML = '';
    modalOverlay.hidden = false;
  }
}

async function deleteOwnStory() {
  if (!currentStoryId) return;
  if (!confirm('Weet je zeker dat je dit verhaal wilt verwijderen?')) return;
  const res = await fetch(`/api/stories/${currentStoryId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ownerToken: getMyToken('myStoryTokens', currentStoryId) }),
  });
  if (res.ok) {
    closeModal();
    loadStories();
  }
}

modalDeleteStory.addEventListener('click', deleteOwnStory);

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

    if (data.editToken) {
      saveMyToken('myCommentTokens', data.id, data.editToken);
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
  if (e.key === 'Escape' && mailboxOverlay && !mailboxOverlay.hidden) closeMailbox();
});

// ---- Brievenbus ----

const mailboxOverlay = document.getElementById('mailbox-overlay');
const mailboxClose = document.getElementById('mailbox-close');
const mailboxForm = document.getElementById('mailbox-form');
const mailboxNameInput = document.getElementById('mailbox-name');
const mailboxTextInput = document.getElementById('mailbox-text');
const mailboxMessage = document.getElementById('mailbox-message');

function openMailbox() {
  mailboxMessage.hidden = true;
  mailboxForm.reset();
  mailboxOverlay.hidden = false;
  mailboxNameInput.focus();
}

function closeMailbox() {
  mailboxOverlay.hidden = true;
}

mailboxClose.addEventListener('click', closeMailbox);
mailboxOverlay.addEventListener('click', (e) => {
  if (e.target === mailboxOverlay) closeMailbox();
});

mailboxForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  mailboxMessage.hidden = true;

  const name = mailboxNameInput.value;
  const text = mailboxTextInput.value;

  if (!text.trim()) {
    mailboxMessage.className = 'message error';
    mailboxMessage.textContent = 'Vul een bericht in.';
    mailboxMessage.hidden = false;
    return;
  }

  try {
    const res = await fetch('/api/mailbox', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, text }),
    });
    const data = await res.json();

    if (!res.ok) {
      mailboxMessage.className = 'message error';
      mailboxMessage.textContent = data.error || 'Versturen mislukt.';
      mailboxMessage.hidden = false;
      return;
    }

    mailboxMessage.className = 'message success';
    mailboxMessage.textContent = 'Verstuurd! Sonja leest het gauw.';
    mailboxMessage.hidden = false;
    mailboxForm.reset();
  } catch (err) {
    mailboxMessage.className = 'message error';
    mailboxMessage.textContent = 'Er ging iets mis. Probeer het opnieuw.';
    mailboxMessage.hidden = false;
  }
});

loadSession();
loadStories();
