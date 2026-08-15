// Lokaal (npm start) gebruikt een JSON-bestand op schijf.
// Op Netlify (waar process.env.NETLIFY === 'true') gebruiken we Netlify Blobs,
// omdat functies daar geen bestanden op schijf kunnen bewaren tussen aanroepen.
module.exports = process.env.NETLIFY === 'true' ? require('./stories.blobs') : require('./stories.local');
