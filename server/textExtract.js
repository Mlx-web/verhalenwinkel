const mammoth = require('mammoth');

/**
 * Haalt platte tekst uit een geüpload bestand op basis van de extensie.
 * Ondersteunt .docx (via mammoth) en .txt (platte tekst).
 */
async function extractText(buffer, originalName) {
  const lower = originalName.toLowerCase();

  if (lower.endsWith('.docx')) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (lower.endsWith('.txt')) {
    return buffer.toString('utf8');
  }

  throw new Error('Alleen .docx en .txt bestanden worden ondersteund.');
}

/**
 * Bepaalt de eerste zin van een tekst, voor gebruik als teaser.
 * Valt terug op de eerste regel (ingekort) als er geen duidelijke
 * zin-einde-leestekens gevonden worden.
 */
function firstSentence(text) {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (!trimmed) return '';

  const match = trimmed.match(/[^.!?]+[.!?]+/);
  if (match) {
    return match[0].trim();
  }

  return trimmed.length > 160 ? `${trimmed.slice(0, 160).trim()}…` : trimmed;
}

module.exports = { extractText, firstSentence };
