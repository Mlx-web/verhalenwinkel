module.exports = process.env.USE_NETLIFY_BLOBS === 'true' ? require('./settings.blobs') : require('./settings.local');
