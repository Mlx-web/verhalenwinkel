require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const multer = require('multer');
const bcrypt = require('bcryptjs');

const stories = require('./stories');
const { extractText, firstSentence } = require('./textExtract');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'sonja123';
const SESSION_SECRET = process.env.SESSION_SECRET || 'ontwikkel-geheime-sleutel';

// Wachtwoord-hash wordt eenmalig bij opstarten berekend, zodat we nooit
// het platte wachtwoord vergelijken.
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(ADMIN_PASSWORD, 10);

app.use(express.json());
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 4, // 4 uur
    },
  })
);

function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  return res.status(401).json({ error: 'Niet ingelogd.' });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const ok = /\.(docx|txt)$/i.test(file.originalname);
    if (!ok) {
      return cb(new Error('Alleen .docx en .txt bestanden zijn toegestaan.'));
    }
    cb(null, true);
  },
});

// ---- Auth routes ----

app.post('/api/login', (req, res) => {
  const { password } = req.body || {};
  if (typeof password !== 'string' || !bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)) {
    return res.status(401).json({ error: 'Onjuist wachtwoord.' });
  }
  req.session.isAdmin = true;
  res.json({ ok: true });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

app.get('/api/session', (req, res) => {
  res.json({ isAdmin: Boolean(req.session && req.session.isAdmin) });
});

// ---- Story routes ----

app.get('/api/stories', (req, res) => {
  res.json(stories.getAllForShowcase());
});

app.get('/api/stories/:id', (req, res) => {
  const story = stories.getFullStory(req.params.id);
  if (!story) return res.status(404).json({ error: 'Verhaal niet gevonden.' });
  res.json(story);
});

app.post('/api/stories', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const { title } = req.body || {};
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Titel is verplicht.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Bestand (.docx of .txt) is verplicht.' });
    }

    const text = await extractText(req.file.buffer, req.file.originalname);
    const teaser = firstSentence(text);
    if (!teaser) {
      return res.status(400).json({ error: 'Kon geen tekst uit het bestand halen.' });
    }

    const story = stories.addStory({
      title,
      teaser,
      fullText: text.trim(),
      originalFilename: req.file.originalname,
    });

    res.status(201).json(story);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Er ging iets mis bij het verwerken van het bestand.' });
  }
});

app.delete('/api/stories/:id', requireAuth, (req, res) => {
  const removed = stories.deleteStory(req.params.id);
  if (!removed) return res.status(404).json({ error: 'Verhaal niet gevonden.' });
  res.json({ ok: true });
});

// Multer / algemene foutafhandeling voor de upload-route
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err) {
    return res.status(400).json({ error: err.message || 'Ongeldige aanvraag.' });
  }
  next();
});

// ---- Statische frontend ----
app.use(express.static(path.join(__dirname, '..', 'public')));

app.listen(PORT, () => {
  console.log(`Sonja's Verhalenwinkel draait op http://localhost:${PORT}`);
});
