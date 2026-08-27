const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'settings.json');

const DEFAULT_CLOCK_MESSAGES = {
  morning: 'Goedemorgen, schrijver! Welk avontuur verzin jij vandaag?',
  afternoon: 'Tik-tak! Zin in een spannend verhaal deze middag?',
  evening: 'De zon gaat bijna onder... perfect voor een spannend slot!',
  night: 'Ssst, zo laat nog wakker? Ergens wacht een verhaal om ontdekt te worden!',
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

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(
        {
          clockMessages: DEFAULT_CLOCK_MESSAGES,
          bookTips: DEFAULT_BOOK_TIPS,
          clubPassword: DEFAULT_CLUB_PASSWORD,
          pendingBookTips: [],
        },
        null,
        2
      )
    );
  }
}

function readSettings() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  try {
    return JSON.parse(raw);
  } catch {
    return {
      clockMessages: DEFAULT_CLOCK_MESSAGES,
      bookTips: DEFAULT_BOOK_TIPS,
      clubPassword: DEFAULT_CLUB_PASSWORD,
      pendingBookTips: [],
    };
  }
}

function writeSettings(settings) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(settings, null, 2));
}

async function getClockMessages() {
  const settings = readSettings();
  return { ...DEFAULT_CLOCK_MESSAGES, ...(settings.clockMessages || {}) };
}

async function updateClockMessages(messages) {
  const settings = readSettings();
  const next = { ...DEFAULT_CLOCK_MESSAGES, ...(settings.clockMessages || {}), ...messages };
  writeSettings({ ...settings, clockMessages: next });
  return next;
}

async function getBookTips() {
  const settings = readSettings();
  const tips = settings.bookTips;
  return Array.isArray(tips) && tips.length ? tips : DEFAULT_BOOK_TIPS;
}

async function updateBookTips(tips) {
  const settings = readSettings();
  const next = Array.isArray(tips) && tips.length ? tips : DEFAULT_BOOK_TIPS;
  writeSettings({ ...settings, bookTips: next });
  return next;
}

async function getClubPassword() {
  const settings = readSettings();
  return settings.clubPassword || DEFAULT_CLUB_PASSWORD;
}

async function updateClubPassword(password) {
  const settings = readSettings();
  const next = (password || '').trim() || DEFAULT_CLUB_PASSWORD;
  writeSettings({ ...settings, clubPassword: next });
  return next;
}

async function getPendingBookTips() {
  const settings = readSettings();
  return Array.isArray(settings.pendingBookTips) ? settings.pendingBookTips : [];
}

async function addPendingBookTip(text, name) {
  const settings = readSettings();
  const pending = Array.isArray(settings.pendingBookTips) ? settings.pendingBookTips : [];
  const entry = { id: crypto.randomUUID(), text, name, submittedAt: new Date().toISOString() };
  writeSettings({ ...settings, pendingBookTips: [...pending, entry] });
  return entry;
}

// Keurt een ingestuurde tip goed: verwijdert 'm uit de wachtrij en voegt de
// tekst (met naam van de inzender) toe aan de live lijst die de boekenkast
// laat zien.
async function approvePendingBookTip(id) {
  const settings = readSettings();
  const pending = Array.isArray(settings.pendingBookTips) ? settings.pendingBookTips : [];
  const entry = pending.find((t) => t.id === id);
  if (!entry) return null;

  const remaining = pending.filter((t) => t.id !== id);
  const currentTips = Array.isArray(settings.bookTips) && settings.bookTips.length
    ? settings.bookTips
    : DEFAULT_BOOK_TIPS;
  const formatted = entry.name ? `Boekentip van ${entry.name}: ${entry.text}` : entry.text;
  const nextTips = [...currentTips, formatted];
  writeSettings({ ...settings, pendingBookTips: remaining, bookTips: nextTips });
  return entry;
}

async function rejectPendingBookTip(id) {
  const settings = readSettings();
  const pending = Array.isArray(settings.pendingBookTips) ? settings.pendingBookTips : [];
  const exists = pending.some((t) => t.id === id);
  if (!exists) return false;

  writeSettings({ ...settings, pendingBookTips: pending.filter((t) => t.id !== id) });
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
