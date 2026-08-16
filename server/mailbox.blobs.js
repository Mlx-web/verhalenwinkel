const crypto = require('crypto');
const { getStore } = require('@netlify/blobs');

function store() {
  return getStore({
    name: 'mailbox',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_API_TOKEN,
  });
}

async function getAllMessages() {
  const { blobs } = await store().list();
  const messages = await Promise.all(blobs.map((b) => store().get(b.key, { type: 'json' })));
  return messages.filter(Boolean).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function addMessage({ name, text }) {
  const message = {
    id: crypto.randomUUID(),
    name,
    text,
    createdAt: new Date().toISOString(),
  };
  await store().setJSON(message.id, message);
  return message;
}

async function deleteMessage(id) {
  const existing = await store().get(id, { type: 'json' });
  if (!existing) return false;
  await store().delete(id);
  return true;
}

module.exports = { getAllMessages, addMessage, deleteMessage };
