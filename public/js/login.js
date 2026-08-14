const form = document.getElementById('login-form');
const messageEl = document.getElementById('login-message');

async function checkExistingSession() {
  const res = await fetch('/api/session');
  const data = await res.json();
  if (data.isAdmin) {
    window.location.href = 'admin.html';
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  messageEl.hidden = true;

  const password = document.getElementById('password').value;

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();

    if (!res.ok) {
      messageEl.textContent = data.error || 'Inloggen mislukt.';
      messageEl.hidden = false;
      return;
    }

    window.location.href = 'admin.html';
  } catch (err) {
    messageEl.textContent = 'Er ging iets mis. Probeer het opnieuw.';
    messageEl.hidden = false;
  }
});

checkExistingSession();
