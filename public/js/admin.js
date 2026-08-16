const storyForm = document.getElementById('story-form');
const formMessage = document.getElementById('form-message');
const logoutBtn = document.getElementById('logout-btn');
const manageList = document.getElementById('story-manage-list');
const emptyNote = document.getElementById('empty-note');
const mailboxList = document.getElementById('mailbox-manage-list');
const mailboxEmptyNote = document.getElementById('mailbox-empty-note');
const commentsList = document.getElementById('comments-manage-list');
const commentsEmptyNote = document.getElementById('comments-empty-note');

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

storyForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  formMessage.hidden = true;

  const title = document.getElementById('title').value;
  const fileInput = document.getElementById('file');
  const file = fileInput.files[0];

  if (!file) {
    showMessage('Kies eerst een bestand.', 'error');
    return;
  }

  const body = new FormData();
  body.append('title', title);
  body.append('file', file);

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

requireSession();
loadManageList();
loadMailbox();
loadComments();
