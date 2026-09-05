const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'contact.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
  }
}

function readAll() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeAll(messages) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(messages, null, 2));
}

async function getAllMessages() {
  return readAll().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function addMessage({ name, email, category, text }) {
  const messages = readAll();
  const message = {
    id: crypto.randomUUID(),
    name,
    email,
    category,
    text,
    createdAt: new Date().toISOString(),
  };
  messages.push(message);
  writeAll(messages);
  return message;
}

async function deleteMessage(id) {
  const messages = readAll();
  const next = messages.filter((m) => m.id !== id);
  const changed = next.length !== messages.length;
  if (changed) writeAll(next);
  return changed;
}

module.exports = { getAllMessages, addMessage, deleteMessage };
