const storyForm = document.getElementById('story-form');
const formMessage = document.getElementById('form-message');
const logoutBtn = document.getElementById('logout-btn');
const manageList = document.getElementById('story-manage-list');
const emptyNote = document.getElementById('empty-note');
const mailboxList = document.getElementById('mailbox-manage-list');
const mailboxEmptyNote = document.getElementById('mailbox-empty-note');
const commentsList = document.getElementById('comments-manage-list');
const commentsEmptyNote = document.getElementById('comments-empty-note');
const clockMessagesForm = document.getElementById('clock-messages-form');
const clockMessagesNote = document.getElementById('clock-messages-note');
const clockMorning = document.getElementById('clock-morning');
const clockAfternoon = document.getElementById('clock-afternoon');
const clockEvening = document.getElementById('clock-evening');
const clockNight = document.getElementById('clock-night');
const bookTipsForm = document.getElementById('book-tips-form');
const bookTipsNote = document.getElementById('book-tips-note');
const bookTipsText = document.getElementById('book-tips-text');
const clubPasswordForm = document.getElementById('club-password-form');
const clubPasswordNote = document.getElementById('club-password-note');
const clubPasswordInput = document.getElementById('club-password');
const pendingTipsList = document.getElementById('pending-tips-list');
const pendingTipsEmptyNote = document.getElementById('pending-tips-empty-note');

async function requireSession() {
  const res = await fetch('/api/session');
  const data = await res.json();
  if (!data.isAdmin) {
    window.location.href = 'login.html';
  }
}

function showMessage(text, type) {
  formMessage.textContent = text;
  formMessage.className = `message ${type}`;
  formMessage.hidden = false;
}

async function loadManageList() {
  const res = await fetch('/api/stories');
  const stories = await res.json();

  manageList.innerHTML = '';
  emptyNote.hidden = stories.length > 0;

  stories.forEach((story) => {
    const li = document.createElement('li');

    const info = document.createElement('span');
    const titleEl = document.createElement('span');
    titleEl.className = 'story-manage-title';
    titleEl.textContent = story.title;
    const teaserEl = document.createElement('span');
    teaserEl.className = 'story-manage-teaser';
    teaserEl.textContent = story.teaser;
    info.appendChild(titleEl);
    info.appendChild(teaserEl);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn danger';
    deleteBtn.textContent = 'Verwijderen';
    deleteBtn.addEventListener('click', () => deleteStory(story.id));

    li.appendChild(info);
    li.appendChild(deleteBtn);
    manageList.appendChild(li);
  });
}

async function deleteStory(id) {
  if (!confirm('Dit verhaal verwijderen uit de etalage?')) return;
  const res = await fetch(`/api/stories/${id}`, { method: 'DELETE' });
  if (res.ok) {
    loadManageList();
  }
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

async function loadMailbox() {
  const res = await fetch('/api/mailbox');
  if (!res.ok) return;
  const messages = await res.json();

  mailboxList.innerHTML = '';
  mailboxEmptyNote.hidden = messages.length > 0;

  messages.forEach((message) => {
    const li = document.createElement('li');

    const info = document.createElement('span');
    const headerEl = document.createElement('span');
    headerEl.className = 'story-manage-title';
    headerEl.textContent = `${message.name} — ${formatDate(message.createdAt)}`;
    const textEl = document.createElement('span');
    textEl.className = 'story-manage-teaser';
    textEl.textContent = message.text;
    info.appendChild(headerEl);
    info.appendChild(textEl);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn danger';
    deleteBtn.textContent = 'Verwijderen';
    deleteBtn.addEventListener('click', () => deleteMailboxMessage(message.id));

    li.appendChild(info);
    li.appendChild(deleteBtn);
    mailboxList.appendChild(li);
  });
}

async function deleteMailboxMessage(id) {
  if (!confirm('Dit berichtje verwijderen?')) return;
  const res = await fetch(`/api/mailbox/${id}`, { method: 'DELETE' });
  if (res.ok) {
    loadMailbox();
  }
}

async function loadComments() {
  const res = await fetch('/api/admin/comments');
  if (!res.ok) return;
  const comments = await res.json();

  commentsList.innerHTML = '';
  commentsEmptyNote.hidden = comments.length > 0;

  comments.forEach((comment) => {
    const li = document.createElement('li');

    const info = document.createElement('span');
    const headerEl = document.createElement('span');
    headerEl.className = 'story-manage-title';
    headerEl.textContent = `${comment.name} — bij "${comment.storyTitle}" — ${formatDate(comment.createdAt)}`;
    const textEl = document.createElement('span');
    textEl.className = 'story-manage-teaser';
    textEl.textContent = comment.text;
    info.appendChild(headerEl);
    info.appendChild(textEl);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn danger';
    deleteBtn.textContent = 'Verwijderen';
    deleteBtn.addEventListener('click', () => deleteAdminComment(comment.storyId, comment.id));

    li.appendChild(info);
    li.appendChild(deleteBtn);
    commentsList.appendChild(li);
  });
}

async function deleteAdminComment(storyId, commentId) {
  if (!confirm('Deze reactie verwijderen?')) return;
  const res = await fetch(`/api/stories/${storyId}/comments/${commentId}`, { method: 'DELETE' });
  if (res.ok) {
    loadComments();
  }
}

const storyTypeSelect = document.getElementById('story-type');
const storyFileField = document.getElementById('story-file-field');
const storyTeaserField = document.getElementById('story-teaser-field');
const storyFileInput = document.getElementById('file');

storyTypeSelect.addEventListener('change', () => {
  const isImage = storyTypeSelect.value === 'image';
  storyTeaserField.hidden = !isImage;
  storyFileInput.accept = isImage ? '.jpg,.jpeg,.png,.webp' : '.docx,.txt';
  document.querySelector('#story-file-field label').textContent = isImage
    ? 'Afbeelding (.jpg, .png of .webp)'
    : 'Bestand (.docx of .txt)';
});

storyForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  formMessage.hidden = true;

  const title = document.getElementById('title').value;
  const author = document.getElementById('story-author').value;
  const type = storyTypeSelect.value;
  const file = storyFileInput.files[0];

  if (!author.trim()) {
    showMessage('Vul in wie het verhaal geschreven heeft.', 'error');
    return;
  }

  if (!file) {
    showMessage('Kies eerst een bestand.', 'error');
    return;
  }

  const body = new FormData();
  body.append('title', title);
  body.append('author', author);
  body.append('type', type);
  body.append('file', file);
  if (type === 'image') {
    body.append('teaser', document.getElementById('story-teaser').value);
  }

  try {
    const res = await fetch('/api/stories', { method: 'POST', body });
    const data = await res.json();

    if (!res.ok) {
      showMessage(data.error || 'Toevoegen mislukt.', 'error');
      return;
    }

    showMessage(`"${data.title}" is toegevoegd aan de etalage.`, 'success');
    storyForm.reset();
    loadManageList();
  } catch (err) {
    showMessage('Er ging iets mis. Probeer het opnieuw.', 'error');
  }
});

logoutBtn.addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = 'index.html';
});

async function loadClockMessages() {
  const res = await fetch('/api/clock-messages');
  if (!res.ok) return;
  const messages = await res.json();
  clockMorning.value = messages.morning || '';
  clockAfternoon.value = messages.afternoon || '';
  clockEvening.value = messages.evening || '';
  clockNight.value = messages.night || '';
}

clockMessagesForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clockMessagesNote.hidden = true;

  try {
    const res = await fetch('/api/clock-messages', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        morning: clockMorning.value,
        afternoon: clockAfternoon.value,
        evening: clockEvening.value,
        night: clockNight.value,
      }),
    });

    if (!res.ok) {
      clockMessagesNote.className = 'message error';
      clockMessagesNote.textContent = 'Opslaan mislukt.';
      clockMessagesNote.hidden = false;
      return;
    }

    clockMessagesNote.className = 'message success';
    clockMessagesNote.textContent = 'Opgeslagen!';
    clockMessagesNote.hidden = false;
  } catch (err) {
    clockMessagesNote.className = 'message error';
    clockMessagesNote.textContent = 'Er ging iets mis. Probeer het opnieuw.';
    clockMessagesNote.hidden = false;
  }
});

async function loadBookTips() {
  const res = await fetch('/api/book-tips');
  if (!res.ok) return;
  const tips = await res.json();
  bookTipsText.value = tips.join('\n');
}

bookTipsForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  bookTipsNote.hidden = true;

  const tips = bookTipsText.value
    .split('\n')
    .map((t) => t.trim())
    .filter(Boolean);

  try {
    const res = await fetch('/api/book-tips', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tips }),
    });

    if (!res.ok) {
      bookTipsNote.className = 'message error';
      bookTipsNote.textContent = 'Opslaan mislukt.';
      bookTipsNote.hidden = false;
      return;
    }

    const saved = await res.json();
    bookTipsText.value = saved.join('\n');
    bookTipsNote.className = 'message success';
    bookTipsNote.textContent = 'Opgeslagen!';
    bookTipsNote.hidden = false;
  } catch (err) {
    bookTipsNote.className = 'message error';
    bookTipsNote.textContent = 'Er ging iets mis. Probeer het opnieuw.';
    bookTipsNote.hidden = false;
  }
});

async function loadClubPassword() {
  const res = await fetch('/api/club-password');
  if (!res.ok) return;
  const data = await res.json();
  clubPasswordInput.value = data.password || '';
}

clubPasswordForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clubPasswordNote.hidden = true;

  try {
    const res = await fetch('/api/club-password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: clubPasswordInput.value }),
    });

    if (!res.ok) {
      clubPasswordNote.className = 'message error';
      clubPasswordNote.textContent = 'Opslaan mislukt.';
      clubPasswordNote.hidden = false;
      return;
    }

    const saved = await res.json();
    clubPasswordInput.value = saved.password;
    clubPasswordNote.className = 'message success';
    clubPasswordNote.textContent = 'Opgeslagen!';
    clubPasswordNote.hidden = false;
  } catch (err) {
    clubPasswordNote.className = 'message error';
    clubPasswordNote.textContent = 'Er ging iets mis. Probeer het opnieuw.';
    clubPasswordNote.hidden = false;
  }
});

async function loadPendingTips() {
  const res = await fetch('/api/admin/book-tips/pending');
  if (!res.ok) return;
  const tips = await res.json();

  pendingTipsList.innerHTML = '';
  pendingTipsEmptyNote.hidden = tips.length > 0;

  tips.forEach((tip) => {
    const li = document.createElement('li');

    const info = document.createElement('span');
    const textEl = document.createElement('span');
    textEl.className = 'story-manage-title';
    textEl.textContent = tip.text;
    info.appendChild(textEl);
    if (tip.name) {
      const nameEl = document.createElement('span');
      nameEl.className = 'story-manage-teaser';
      nameEl.textContent = `van ${tip.name}`;
      info.appendChild(nameEl);
    }

    const actions = document.createElement('span');
    actions.className = 'story-manage-actions';
    const approveBtn = document.createElement('button');
    approveBtn.className = 'btn';
    approveBtn.textContent = 'Goedkeuren';
    approveBtn.addEventListener('click', () => approvePendingTip(tip.id));

    const rejectBtn = document.createElement('button');
    rejectBtn.className = 'btn danger';
    rejectBtn.textContent = 'Afwijzen';
    rejectBtn.addEventListener('click', () => rejectPendingTip(tip.id));

    actions.appendChild(approveBtn);
    actions.appendChild(rejectBtn);

    li.appendChild(info);
    li.appendChild(actions);
    pendingTipsList.appendChild(li);
  });
}

async function approvePendingTip(id) {
  const res = await fetch(`/api/admin/book-tips/pending/${id}/approve`, { method: 'POST' });
  if (res.ok) {
    loadPendingTips();
    loadBookTips();
  }
}

async function rejectPendingTip(id) {
  if (!confirm('Deze tip afwijzen?')) return;
  const res = await fetch(`/api/admin/book-tips/pending/${id}`, { method: 'DELETE' });
  if (res.ok) {
    loadPendingTips();
  }
}

requireSession();
loadManageList();
loadMailbox();
loadComments();
loadClockMessages();
loadBookTips();
loadClubPassword();
loadPendingTips();
