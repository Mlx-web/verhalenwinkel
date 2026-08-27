const crypto = require('crypto');
const { getStore } = require('@netlify/blobs');

function store() {
  // Expliciete inloggegevens in plaats van automatische detectie: die bleek
  // in de praktijk niet altijd betrouwbaar te werken voor deze function.
  return getStore({
    name: 'stories',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_API_TOKEN,
  });
}

async function readAll() {
  const { blobs } = await store().list();
  const stories = await Promise.all(blobs.map((b) => store().get(b.key, { type: 'json' })));
  return stories.filter(Boolean);
}

async function getAllForShowcase() {
  const stories = await readAll();
  return stories
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
  const story = await store().get(id, { type: 'json' });
  if (story && !Array.isArray(story.comments)) story.comments = [];
  return story;
}

async function addStory({ title, teaser, fullText, originalFilename, author, imageData }) {
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
  await store().setJSON(story.id, story);
  return story;
}

// Vereist altijd een kloppend token — wordt gebruikt als de inzender zelf
// verwijdert. Geen enkele waarde van ownerToken (ook niet "leeg") mag ooit
// een verhaal zonder geldig token kunnen verwijderen.
async function deleteStory(id, ownerToken) {
  const existing = await store().get(id, { type: 'json' });
  if (!existing || !ownerToken || existing.ownerToken !== ownerToken) return false;
  await store().delete(id);
  return true;
}

// Alleen voor de beheerder: verwijdert altijd, ongeacht token.
async function adminDeleteStory(id) {
  const existing = await store().get(id, { type: 'json' });
  if (!existing) return false;
  await store().delete(id);
  return true;
}

async function addComment(storyId, { name, text }) {
  const story = await store().get(storyId, { type: 'json' });
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
  await store().setJSON(storyId, story);
  return comment;
}

// Vereist altijd een kloppend token — wordt gebruikt als de plaatser zelf
// verwijdert. Geen enkele waarde van editToken (ook niet "leeg") mag ooit
// een reactie zonder geldig token kunnen verwijderen.
async function deleteComment(storyId, commentId, editToken) {
  const story = await store().get(storyId, { type: 'json' });
  if (!story || !Array.isArray(story.comments)) return false;
  const comment = story.comments.find((c) => c.id === commentId);
  if (!comment || !editToken || comment.editToken !== editToken) return false;
  const before = story.comments.length;
  story.comments = story.comments.filter((c) => c.id !== commentId);
  const changed = story.comments.length !== before;
  if (changed) await store().setJSON(storyId, story);
  return changed;
}

// Alleen voor de beheerder: alle reacties van alle verhalen op een rijtje,
// zodat ze op één plek beheerd (verwijderd) kunnen worden.
async function getAllComments() {
  const stories = await readAll();
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
  const story = await store().get(storyId, { type: 'json' });
  if (!story || !Array.isArray(story.comments)) return false;
  const before = story.comments.length;
  story.comments = story.comments.filter((c) => c.id !== commentId);
  const changed = story.comments.length !== before;
  if (changed) await store().setJSON(storyId, story);
  return changed;
}

async function updateComment(storyId, commentId, { text, editToken }) {
  const story = await store().get(storyId, { type: 'json' });
  if (!story || !Array.isArray(story.comments)) return null;
  const comment = story.comments.find((c) => c.id === commentId);
  if (!comment || comment.editToken !== editToken) return null;
  comment.text = text;
  comment.editedAt = new Date().toISOString();
  await store().setJSON(storyId, story);
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
