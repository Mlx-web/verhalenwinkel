module.exports = process.env.USE_NETLIFY_BLOBS === 'true' ? require('./mailbox.blobs') : require('./mailbox.local');
