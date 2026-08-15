// Lokaal (npm start) gebruikt een JSON-bestand op schijf.
// Op Netlify gebruiken we Netlify Blobs, omdat functies daar geen bestanden
// op schijf kunnen bewaren tussen aanroepen. USE_NETLIFY_BLOBS wordt expliciet
// gezet in netlify/functions/api.js, zodat dit nooit per ongeluk verkeerd raadt.
module.exports = process.env.USE_NETLIFY_BLOBS === 'true' ? require('./stories.blobs') : require('./stories.local');
