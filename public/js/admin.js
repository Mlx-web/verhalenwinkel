const storyForm = document.getElementById('story-form');
const formMessage = document.getElementById('form-message');
const logoutBtn = document.getElementById('logout-btn');
const manageList = document.getElementById('story-manage-list');
const emptyNote = document.getElementById('empty-note');

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
