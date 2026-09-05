const contactForm = document.getElementById('contact-form');
const contactNote = document.getElementById('contact-note');

contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  contactNote.hidden = true;

  const body = {
    name: document.getElementById('contact-name').value,
    email: document.getElementById('contact-email').value,
    category: document.getElementById('contact-category').value,
    text: document.getElementById('contact-text').value,
  };

  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (!res.ok) {
      contactNote.className = 'contact-note error';
      contactNote.textContent = data.error || 'Versturen mislukt.';
      contactNote.hidden = false;
      return;
    }

    contactForm.reset();
    contactNote.className = 'contact-note success';
    contactNote.textContent = 'Bedankt, je bericht is verstuurd. Sonja neemt zo snel mogelijk contact op.';
    contactNote.hidden = false;
  } catch (err) {
    contactNote.className = 'contact-note error';
    contactNote.textContent = 'Er ging iets mis. Probeer het opnieuw.';
    contactNote.hidden = false;
  }
});
