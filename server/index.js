const path = require('path');
const express = require('express');
const app = require('./app');

const PORT = process.env.PORT || 3000;

// Statische frontend: alleen nodig voor lokaal draaien.
// Op Netlify serveert hun CDN de map "public" rechtstreeks.
app.use(express.static(path.join(__dirname, '..', 'public')));

app.listen(PORT, () => {
  console.log(`Sonja's Verhalenwinkel draait op http://localhost:${PORT}`);
});
