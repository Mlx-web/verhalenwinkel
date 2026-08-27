const { getStore } = require('@netlify/blobs');
const crypto = require('crypto');

const DEFAULT_CLOCK_MESSAGES = {
  morning: 'Goedemorgen! Mooi moment om een verhaal te beginnen.',
  afternoon: 'Een rustig middaguurtje... goed om even te schrijven.',
  evening: 'De dag is bijna om — tijd voor een laatste zin?',
  night: 'Zo laat nog hier? Misschien wacht er een verhaal om opgeschreven te worden.',
};

const DEFAULT_BOOK_TIPS = [
  '"De Kat die Nooit Loog" — een spannend verhaal over een kat met een groot geheim.',
  '"Het Meisje met de Regenparaplu" — soms is de mooiste avond een natte avond.',
  "Oma's Wonderlijke Kruidenkastje — niet elk kruid doet wat je verwacht.",
  '"De Laatste Trein naar Nergensland" — instappen kan, uitstappen is lastiger.',
  '"Het Dagboek van een Verdwaalde Wolk" — hij weet zelf ook niet waar hij heen gaat.',
  '"Drie Knopen en een Geheim" — een jasje met meer verhaal dan je zou denken.',
  '"De Sleutel die Niemand Paste" — tot iemand het juiste slot vond.',
  '"Zeven Zinnen over de Zee" — soms is kort genoeg.',
];

const DEFAULT_CLUB_PASSWORD = 'kriskras';

function store() {
  return getStore({
    name: 'settings',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_API_TOKEN,
  });
}

async function getClockMessages() {
  const stored = await store().get('clockMessages', { type: 'json' });
  return { ...DEFAULT_CLOCK_MESSAGES, ...(stored || {}) };
}

async function updateClockMessages(messages) {
  const existing = await store().get('clockMessages', { type: 'json' });
  const next = { ...DEFAULT_CLOCK_MESSAGES, ...(existing || {}), ...messages };
  await store().setJSON('clockMessages', next);
  return next;
}

async function getBookTips() {
  const stored = await store().get('bookTips', { type: 'json' });
  return Array.isArray(stored) && stored.length ? stored : DEFAULT_BOOK_TIPS;
}

async function updateBookTips(tips) {
  const next = Array.isArray(tips) && tips.length ? tips : DEFAULT_BOOK_TIPS;
  await store().setJSON('bookTips', next);
  return next;
}

async function getClubPassword() {
  const stored = await store().get('clubPassword', { type: 'text' });
  return stored || DEFAULT_CLUB_PASSWORD;
}

async function updateClubPassword(password) {
  const next = (password || '').trim() || DEFAULT_CLUB_PASSWORD;
  await store().set('clubPassword', next);
  return next;
}

async function getPendingBookTips() {
  const stored = await store().get('pendingBookTips', { type: 'json' });
  return Array.isArray(stored) ? stored : [];
}

async function addPendingBookTip(text) {
  const pending = await getPendingBookTips();
  const entry = { id: crypto.randomUUID(), text, submittedAt: new Date().toISOString() };
  await store().setJSON('pendingBookTips', [...pending, entry]);
  return entry;
}

// Keurt een ingestuurde tip goed: verwijdert 'm uit de wachtrij en voegt de
// tekst toe aan de live lijst die de boekenkast laat zien.
async function approvePendingBookTip(id) {
  const pending = await getPendingBookTips();
  const entry = pending.find((t) => t.id === id);
  if (!entry) return null;

  const remaining = pending.filter((t) => t.id !== id);
  const currentTips = await getBookTips();
  await store().setJSON('pendingBookTips', remaining);
  await store().setJSON('bookTips', [...currentTips, entry.text]);
  return entry;
}

async function rejectPendingBookTip(id) {
  const pending = await getPendingBookTips();
  const exists = pending.some((t) => t.id === id);
  if (!exists) return false;

  await store().setJSON('pendingBookTips', pending.filter((t) => t.id !== id));
  return true;
}

module.exports = {
  getClockMessages,
  updateClockMessages,
  getBookTips,
  updateBookTips,
  getClubPassword,
  updateClubPassword,
  getPendingBookTips,
  addPendingBookTip,
  approvePendingBookTip,
  rejectPendingBookTip,
  DEFAULT_CLOCK_MESSAGES,
  DEFAULT_BOOK_TIPS,
  DEFAULT_CLUB_PASSWORD,
};
