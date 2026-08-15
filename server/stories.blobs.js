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
    .map(({ id, title, teaser, createdAt }) => ({ id, title, teaser, createdAt }));
}

async function getFullStory(id) {
  const story = await store().get(id, { type: 'json' });
  if (story && !Array.isArray(story.comments)) story.comments = [];
  return story;
}

async function addStory({ title, teaser, fullText, originalFilename }) {
  const story = {
    id: crypto.randomUUID(),
    title: title.trim(),
    teaser,
    fullText,
    originalFilename,
    createdAt: new Date().toISOString(),
    comments: [],
  };
  await store().setJSON(story.id, story);
  return story;
}

async function deleteStory(id) {
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
  };
  story.comments.push(comment);
  await store().setJSON(storyId, story);
  return comment;
}

async function deleteComment(storyId, commentId) {
  const story = await store().get(storyId, { type: 'json' });
  if (!story || !Array.isArray(story.comments)) return false;
  const before = story.comments.length;
  story.comments = story.comments.filter((c) => c.id !== commentId);
  const changed = story.comments.length !== before;
  if (changed) await store().setJSON(storyId, story);
  return changed;
}

module.exports = {
  getAllForShowcase,
  getFullStory,
  addStory,
  deleteStory,
  addComment,
  deleteComment,
};
