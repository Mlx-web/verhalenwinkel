const crypto = require('crypto');
const { getStore } = require('@netlify/blobs');

function store() {
  return getStore('stories');
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
  return store().get(id, { type: 'json' });
}

async function addStory({ title, teaser, fullText, originalFilename }) {
  const story = {
    id: crypto.randomUUID(),
    title: title.trim(),
    teaser,
    fullText,
    originalFilename,
    createdAt: new Date().toISOString(),
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

module.exports = { getAllForShowcase, getFullStory, addStory, deleteStory };
