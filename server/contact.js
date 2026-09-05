module.exports = process.env.USE_NETLIFY_BLOBS === 'true' ? require('./contact.blobs') : require('./contact.local');
