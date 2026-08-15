// Zet dit hier expliciet, in plaats van te vertrouwen op Netlify's eigen
// omgevingsvariabelen (die tijdens het bouwen soms anders zijn dan tijdens
// het echt uitvoeren van de function). Dit bestand wordt alleen geladen
// wanneer we daadwerkelijk als Netlify Function draaien.
process.env.USE_NETLIFY_BLOBS = 'true';

const serverless = require('serverless-http');
const app = require('../../server/app');

exports.handler = serverless(app, {
  binary: ['multipart/form-data'],
});
