const { getStore } = require('@netlify/blobs');

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

module.exports = {
  getClockMessages,
  updateClockMessages,
  getBookTips,
  updateBookTips,
  DEFAULT_CLOCK_MESSAGES,
  DEFAULT_BOOK_TIPS,
};
