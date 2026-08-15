const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'stories.json');

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

function writeAll(stories) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(stories, null, 2));
}

async function getAllForShowcase() {
  return readAll()
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map(({ id, title, teaser, createdAt }) => ({ id, title, teaser, createdAt }));
}

async function getFullStory(id) {
  return readAll().find((s) => s.id === id) || null;
}

async function addStory({ title, teaser, fullText, originalFilename }) {
  const stories = readAll();
  const story = {
    id: crypto.randomUUID(),
    title: title.trim(),
    teaser,
    fullText,
    originalFilename,
    createdAt: new Date().toISOString(),
  };
  stories.push(story);
  writeAll(stories);
  return story;
}

async function deleteStory(id) {
  const stories = readAll();
  const next = stories.filter((s) => s.id !== id);
  const changed = next.length !== stories.length;
  if (changed) writeAll(next);
  return changed;
}

module.exports = { getAllForShowcase, getFullStory, addStory, deleteStory };
