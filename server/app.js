require('dotenv').config();

const express = require('express');
const cookieSession = require('cookie-session');
const multer = require('multer');
const bcrypt = require('bcryptjs');

const stories = require('./stories');
const mailbox = require('./mailbox');
const settings = require('./settings');
const { extractText, firstSentence } = require('./textExtract');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'sonja123';
const SESSION_SECRET = process.env.SESSION_SECRET || 'ontwikkel-geheime-sleutel';

// Wachtwoord-hash wordt eenmalig bij opstarten berekend, zodat we nooit
// het platte wachtwoord vergelijken.
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(ADMIN_PASSWORD, 10);

const app = express();

app.use(express.json());
app.use(
  cookieSession({
    name: 'session',
    secret: SESSION_SECRET,
    maxAge: 1000 * 60 * 60 * 4, // 4 uur
    httpOnly: true,
    sameSite: 'lax',
  })
);

function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  return res.status(401).json({ error: 'Niet ingelogd.' });
}

// De beheerder heeft altijd toegang tot het achterkamertje, ook zonder het
// clubwachtwoord apart in te typen.
function requireClubOrAdmin(req, res, next) {
  if (req.session && (req.session.clubAccess || req.session.isAdmin)) {
    return next();
  }
  return res.status(401).json({ error: 'Alleen clubleden kunnen hier iets toevoegen.' });
}

// Vangt fouten in async route-handlers op en geeft ze door aan Express'
// foutafhandeling, in plaats van dat ze de hele functie laten crashen.
function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const ok = /\.(docx|txt|jpg|jpeg|png|webp)$/i.test(file.originalname);
    if (!ok) {
      return cb(new Error('Alleen .docx, .txt, .jpg, .png of .webp bestanden zijn toegestaan.'));
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
  req.session = null;
  res.json({ ok: true });
});

app.get('/api/session', (req, res) => {
  res.json({ isAdmin: Boolean(req.session && req.session.isAdmin) });
});

// ---- Clubwachtwoord: toegang tot het achterkamertje ----
// Eén gedeeld wachtwoord voor alle clubleden, door de docent in te stellen.

app.post('/api/club-login', asyncHandler(async (req, res) => {
  const { password } = req.body || {};
  const clubPassword = await settings.getClubPassword();
  if (typeof password !== 'string' || password.trim().toLowerCase() !== clubPassword.trim().toLowerCase()) {
    return res.status(401).json({ error: 'Onjuist wachtwoord.' });
  }
  req.session.clubAccess = true;
  res.json({ ok: true });
}));

app.get('/api/club-access', (req, res) => {
  res.json({ access: Boolean(req.session && (req.session.clubAccess || req.session.isAdmin)) });
});

app.get('/api/club-password', requireAuth, asyncHandler(async (req, res) => {
  res.json({ password: await settings.getClubPassword() });
}));

app.put('/api/club-password', requireAuth, asyncHandler(async (req, res) => {
  const { password } = req.body || {};
  const updated = await settings.updateClubPassword(typeof password === 'string' ? password.slice(0, 60) : '');
  res.json({ password: updated });
}));

// ---- Story routes ----

app.get('/api/stories', asyncHandler(async (req, res) => {
  res.json(await stories.getAllForShowcase());
}));

app.get('/api/stories/:id', asyncHandler(async (req, res) => {
  const story = await stories.getFullStory(req.params.id);
  if (!story) return res.status(404).json({ error: 'Verhaal niet gevonden.' });
  // editToken en ownerToken zijn geheimen die alleen de plaatser kent
  // (bewaard in hun eigen browser) en mogen nooit naar anderen gestuurd worden.
  const { ownerToken, ...safeStory } = story;
  res.json({
    ...safeStory,
    comments: (story.comments || []).map(({ editToken, ...rest }) => rest),
  });
}));

// Alleen clubleden (via het clubwachtwoord op de deur) of de beheerder
// mogen een verhaal toevoegen — via de typemachine in het achterkamertje,
// of via het beheerpaneel.
app.post('/api/stories', requireClubOrAdmin, upload.single('file'), async (req, res) => {
  try {
    const { title, author, type, teaser: manualTeaser } = req.body || {};
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Titel is verplicht.' });
    }

    // Illustratie-verhaal: een afbeelding (bv. een scan van een getekend
    // verhaal) vult het raam, met een optioneel eigen zinnetje als preview —
    // zonder zinnetje toont het raam alleen de titel.
    if (type === 'image') {
      if (!req.file) {
        return res.status(400).json({ error: 'Kies een afbeelding.' });
      }
      const imageData = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      const story = await stories.addStory({
        title,
        author: (author || '').trim().slice(0, 80),
        teaser: (manualTeaser || '').trim().slice(0, 300),
        fullText: '',
        imageData,
        originalFilename: req.file.originalname,
      });
      return res.status(201).json(story);
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Bestand (.docx of .txt) is verplicht.' });
    }

    const text = await extractText(req.file.buffer, req.file.originalname);
    const teaser = firstSentence(text);
    if (!teaser) {
      return res.status(400).json({ error: 'Kon geen tekst uit het bestand halen.' });
    }

    const story = await stories.addStory({
      title,
      author: (author || '').trim().slice(0, 80),
      teaser,
      fullText: text.trim(),
      originalFilename: req.file.originalname,
    });

    // ownerToken wordt hier eenmalig meegestuurd, zodat de inzender 'm kan
    // bewaren om dit ene verhaal later zelf te kunnen verwijderen.
    res.status(201).json(story);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Er ging iets mis bij het verwerken van het bestand.' });
  }
});

app.delete('/api/stories/:id', asyncHandler(async (req, res) => {
  const isAdminUser = Boolean(req.session && req.session.isAdmin);
  const { ownerToken } = req.body || {};

  const removed = isAdminUser
    ? await stories.adminDeleteStory(req.params.id)
    : await stories.deleteStory(req.params.id, ownerToken);

  if (!removed) return res.status(404).json({ error: 'Verhaal niet gevonden.' });
  res.json({ ok: true });
}));

// ---- Reactie-routes ----

app.post('/api/stories/:id/comments', asyncHandler(async (req, res) => {
  const { name, text } = req.body || {};
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Vul een reactie in.' });
  }
  const safeName = (name || '').trim().slice(0, 60) || 'Anoniem';
  const safeText = text.trim().slice(0, 500);

  const comment = await stories.addComment(req.params.id, { name: safeName, text: safeText });
  if (!comment) return res.status(404).json({ error: 'Verhaal niet gevonden.' });
  // De editToken wordt hier eenmalig meegestuurd, zodat de plaatser 'm kan
  // bewaren om deze ene reactie later zelf te kunnen bewerken.
  res.status(201).json(comment);
}));

app.patch('/api/stories/:id/comments/:commentId', asyncHandler(async (req, res) => {
  const { text, editToken } = req.body || {};
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Vul een reactie in.' });
  }
  if (!editToken) {
    return res.status(403).json({ error: 'Je kunt alleen je eigen reactie bewerken.' });
  }

  const updated = await stories.updateComment(req.params.id, req.params.commentId, {
    text: text.trim().slice(0, 500),
    editToken,
  });
  if (!updated) {
    return res.status(403).json({ error: 'Je kunt alleen je eigen reactie bewerken.' });
  }

  const { editToken: _omit, ...safeComment } = updated;
  res.json(safeComment);
}));

app.delete('/api/stories/:id/comments/:commentId', asyncHandler(async (req, res) => {
  const isAdminUser = Boolean(req.session && req.session.isAdmin);
  const { editToken } = req.body || {};

  const removed = isAdminUser
    ? await stories.adminDeleteComment(req.params.id, req.params.commentId)
    : await stories.deleteComment(req.params.id, req.params.commentId, editToken);

  if (!removed) return res.status(404).json({ error: 'Reactie niet gevonden.' });
  res.json({ ok: true });
}));

// Alleen voor de beheerder: overzicht van alle reacties op alle verhalen,
// zodat ongewenste reacties op één plek verwijderd kunnen worden.
app.get('/api/admin/comments', requireAuth, asyncHandler(async (req, res) => {
  res.json(await stories.getAllComments());
}));

// ---- Brievenbus-routes ----
// Iedereen mag een berichtje posten (verzoek, compliment, opmerking) zonder
// in te loggen; alleen de beheerder kan de binnengekomen berichten lezen.

app.post('/api/mailbox', asyncHandler(async (req, res) => {
  const { name, text } = req.body || {};
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Vul een bericht in.' });
  }
  const safeName = (name || '').trim().slice(0, 60) || 'Anoniem';
  const safeText = text.trim().slice(0, 1000);

  const message = await mailbox.addMessage({ name: safeName, text: safeText });
  res.status(201).json({ ok: true, id: message.id });
}));

app.get('/api/mailbox', requireAuth, asyncHandler(async (req, res) => {
  res.json(await mailbox.getAllMessages());
}));

app.delete('/api/mailbox/:id', requireAuth, asyncHandler(async (req, res) => {
  const removed = await mailbox.deleteMessage(req.params.id);
  if (!removed) return res.status(404).json({ error: 'Bericht niet gevonden.' });
  res.json({ ok: true });
}));

// ---- Instellingen: kloktekstjes op de wandklok in het achterkamertje ----
// Publiek leesbaar (de klok moet ze kunnen tonen aan elke bezoeker), maar
// alleen de beheerder mag ze aanpassen.

app.get('/api/clock-messages', asyncHandler(async (req, res) => {
  res.json(await settings.getClockMessages());
}));

app.put('/api/clock-messages', requireAuth, asyncHandler(async (req, res) => {
  const { morning, afternoon, evening, night } = req.body || {};
  const fields = { morning, afternoon, evening, night };
  const updates = {};
  Object.entries(fields).forEach(([key, value]) => {
    if (typeof value === 'string' && value.trim()) {
      updates[key] = value.trim().slice(0, 200);
    }
  });
  const updated = await settings.updateClockMessages(updates);
  res.json(updated);
}));

// ---- Instellingen: boekentips bij het tikken op de boekenkast ----
// Publiek leesbaar, alleen de beheerder mag ze aanpassen.

app.get('/api/book-tips', asyncHandler(async (req, res) => {
  res.json(await settings.getBookTips());
}));

app.put('/api/book-tips', requireAuth, asyncHandler(async (req, res) => {
  const { tips } = req.body || {};
  const clean = Array.isArray(tips)
    ? tips.map((t) => (typeof t === 'string' ? t.trim() : '')).filter(Boolean).slice(0, 30).map((t) => t.slice(0, 200))
    : [];
  const updated = await settings.updateBookTips(clean);
  res.json(updated);
}));

// Clubleden mogen zelf een boekentip insturen, maar die komt eerst in een
// wachtrij terecht — de docent keurt 'm goed voordat 'm bij de boekenkast
// verschijnt.
app.post('/api/book-tips/submit', requireClubOrAdmin, asyncHandler(async (req, res) => {
  const { text, name } = req.body || {};
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Vul een boekentip in.' });
  }
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Vul je naam in.' });
  }
  const entry = await settings.addPendingBookTip(text.trim().slice(0, 200), name.trim().slice(0, 60));
  res.status(201).json({ ok: true, id: entry.id });
}));

app.get('/api/admin/book-tips/pending', requireAuth, asyncHandler(async (req, res) => {
  res.json(await settings.getPendingBookTips());
}));

app.post('/api/admin/book-tips/pending/:id/approve', requireAuth, asyncHandler(async (req, res) => {
  const approved = await settings.approvePendingBookTip(req.params.id);
  if (!approved) return res.status(404).json({ error: 'Tip niet gevonden.' });
  res.json({ ok: true });
}));

app.delete('/api/admin/book-tips/pending/:id', requireAuth, asyncHandler(async (req, res) => {
  const removed = await settings.rejectPendingBookTip(req.params.id);
  if (!removed) return res.status(404).json({ error: 'Tip niet gevonden.' });
  res.json({ ok: true });
}));

// Algemene foutafhandeling: multer-fouten en onverwachte fouten komen
// hier terecht in plaats van dat de hele functie crasht.
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message || 'Ongeldige aanvraag.' });
  }
  console.error(err);
  res.status(500).json({ error: 'Er ging iets mis op de server.' });
});

module.exports = app;
