const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'settings.json');

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

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify({ clockMessages: DEFAULT_CLOCK_MESSAGES, bookTips: DEFAULT_BOOK_TIPS }, null, 2)
    );
  }
}

function readSettings() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  try {
    return JSON.parse(raw);
  } catch {
    return { clockMessages: DEFAULT_CLOCK_MESSAGES, bookTips: DEFAULT_BOOK_TIPS };
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

module.exports = {
  getClockMessages,
  updateClockMessages,
  getBookTips,
  updateBookTips,
  DEFAULT_CLOCK_MESSAGES,
  DEFAULT_BOOK_TIPS,
};
