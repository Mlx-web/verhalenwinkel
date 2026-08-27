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
    .map(({ id, title, author, teaser, imageData, createdAt }) => ({
      id,
      title,
      author,
      teaser,
      imageData: imageData || null,
      createdAt,
    }));
}

async function getFullStory(id) {
  const story = readAll().find((s) => s.id === id) || null;
  if (story && !Array.isArray(story.comments)) story.comments = [];
  return story;
}

async function addStory({ title, teaser, fullText, originalFilename, author, imageData }) {
  const stories = readAll();
  const story = {
    id: crypto.randomUUID(),
    title: title.trim(),
    author: (author || '').trim() || null,
    teaser,
    fullText,
    originalFilename,
    imageData: imageData || null,
    createdAt: new Date().toISOString(),
    comments: [],
    ownerToken: crypto.randomUUID(),
  };
  stories.push(story);
  writeAll(stories);
  return story;
}

// Vereist altijd een kloppend token — wordt gebruikt als de inzender zelf
// verwijdert. Geen enkele waarde van ownerToken (ook niet "leeg") mag ooit
// een verhaal zonder geldig token kunnen verwijderen.
async function deleteStory(id, ownerToken) {
  const stories = readAll();
  const story = stories.find((s) => s.id === id);
  if (!story || !ownerToken || story.ownerToken !== ownerToken) return false;
  const next = stories.filter((s) => s.id !== id);
  writeAll(next);
  return true;
}

// Alleen voor de beheerder: verwijdert altijd, ongeacht token.
async function adminDeleteStory(id) {
  const stories = readAll();
  const next = stories.filter((s) => s.id !== id);
  const changed = next.length !== stories.length;
  if (changed) writeAll(next);
  return changed;
}

async function addComment(storyId, { name, text }) {
  const stories = readAll();
  const story = stories.find((s) => s.id === storyId);
  if (!story) return null;
  if (!Array.isArray(story.comments)) story.comments = [];
  const comment = {
    id: crypto.randomUUID(),
    name,
    text,
    createdAt: new Date().toISOString(),
    editToken: crypto.randomUUID(),
  };
  story.comments.push(comment);
  writeAll(stories);
  return comment;
}

// Vereist altijd een kloppend token — wordt gebruikt als de plaatser zelf
// verwijdert. Geen enkele waarde van editToken (ook niet "leeg") mag ooit
// een reactie zonder geldig token kunnen verwijderen.
async function deleteComment(storyId, commentId, editToken) {
  const stories = readAll();
  const story = stories.find((s) => s.id === storyId);
  if (!story || !Array.isArray(story.comments)) return false;
  const comment = story.comments.find((c) => c.id === commentId);
  if (!comment || !editToken || comment.editToken !== editToken) return false;
  const before = story.comments.length;
  story.comments = story.comments.filter((c) => c.id !== commentId);
  const changed = story.comments.length !== before;
  if (changed) writeAll(stories);
  return changed;
}

// Alleen voor de beheerder: alle reacties van alle verhalen op een rijtje,
// zodat ze op één plek beheerd (verwijderd) kunnen worden.
async function getAllComments() {
  const stories = readAll();
  const comments = [];
  stories.forEach((story) => {
    (story.comments || []).forEach((comment) => {
      comments.push({
        storyId: story.id,
        storyTitle: story.title,
        id: comment.id,
        name: comment.name,
        text: comment.text,
        createdAt: comment.createdAt,
        editedAt: comment.editedAt || null,
      });
    });
  });
  return comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// Alleen voor de beheerder: verwijdert altijd, ongeacht token.
async function adminDeleteComment(storyId, commentId) {
  const stories = readAll();
  const story = stories.find((s) => s.id === storyId);
  if (!story || !Array.isArray(story.comments)) return false;
  const before = story.comments.length;
  story.comments = story.comments.filter((c) => c.id !== commentId);
  const changed = story.comments.length !== before;
  if (changed) writeAll(stories);
  return changed;
}

async function updateComment(storyId, commentId, { text, editToken }) {
  const stories = readAll();
  const story = stories.find((s) => s.id === storyId);
  if (!story || !Array.isArray(story.comments)) return null;
  const comment = story.comments.find((c) => c.id === commentId);
  if (!comment || comment.editToken !== editToken) return null;
  comment.text = text;
  comment.editedAt = new Date().toISOString();
  writeAll(stories);
  return comment;
}

module.exports = {
  getAllForShowcase,
  getFullStory,
  addStory,
  deleteStory,
  adminDeleteStory,
  addComment,
  deleteComment,
  adminDeleteComment,
  getAllComments,
  updateComment,
};
