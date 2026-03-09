/**
 * Parser Service
 * Functions for parsing course information from text
 */

/**
 * Parse course title to extract components
 * @param {string} text - Course title text
 * @returns {Object|null}
 */
export function parseTitle(text) {
  if (!text || typeof text !== 'string') return null;

  // Pattern: NAME (type: TH/LAB/AUTO) ROOM PROF [BAC n]
  const match = text.match(
    /^(.*?)\s*\(([^)]*?(?:TH|LAB|Labo|Autonomie|distance|À DISTANCE)[^)]*)\)\s*([^(]*?)(?:\[(.*?)\])?$/i
  );

  if (!match) return null;

  const [, name, typeRaw, rest, year] = match;
  const typeMap = { 'th': 'th', 'labo': 'lab', 'lab': 'lab', 'autonomie': 'auto' };
  const type = Object.keys(typeMap).find(k => typeRaw.toLowerCase().includes(k)) ? typeMap[Object.keys(typeMap).find(k => typeRaw.toLowerCase().includes(k))] : 'other';

  // Extract room and professor
  const parts = rest.split('/').map(s => s.trim()).filter(Boolean);
  const room = parts[0] || null;
  const prof = parts[1] || null;

  return {
    name: name.trim(),
    type,
    room,
    prof,
    year: year ? year.trim() : null
  };
}

/**
 * Extract course name from title
 * @param {string} text
 * @returns {string|null}
 */
export function extractName(text) {
  const parsed = parseTitle(text);
  if (!parsed) return text ? text.slice(0, 30) : null;
  return parsed.year ? `${parsed.name} [${parsed.year}]` : parsed.name;
}

/**
 * Extract course type from title
 * @param {string} text
 * @returns {string}
 */
export function extractType(text) {
  const parsed = parseTitle(text);
  return parsed?.type || 'other';
}

/**
 * Extract room from title
 * @param {string} text
 * @returns {string|null}
 */
export function extractRoom(text) {
  const parsed = parseTitle(text);
  return parsed?.room || null;
}

/**
 * Extract professor from title
 * @param {string} text
 * @returns {string|null}
 */
export function extractProf(text) {
  const parsed = parseTitle(text);
  return parsed?.prof || null;
}

/**
 * Check if course is online/distance
 * @param {string} text
 * @returns {boolean}
 */
export function isDistanceCourse(text) {
  return /À DISTANCE|A DISTANCE|distance|online/i.test(text);
}

/**
 * Extract BAC level from course name
 * @param {string} text
 * @returns {number|null}
 */
export function extractBACLevel(text) {
  const match = text.match(/\[BAC\s*(\d)\]/i);
  return match ? parseInt(match[1]) : null;
}

/**
 * Normalize course name for comparison
 * @param {string} name
 * @returns {string}
 */
export function normalizeCourseName(name) {
  return name
    .toLowerCase()
    .replace(/\s*\[BAC\s*\d\]/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parse HTML event data
 * @param {Element} el
 * @returns {Object}
 */
export function parseEventElement(el) {
  const title = el.innerText || el.textContent || '';
  const dataset = el.dataset || {};

  return {
    id: dataset.eventId,
    title: title.trim(),
    parsed: parseTitle(title),
    original: title,
    ...dataset
  };
}

/**
 * Parse date string
 * @param {string} dateStr - Format: YYYY-MM-DD
 * @returns {Date|null}
 */
export function parseDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(`${dateStr}T12:00:00`);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Format date for display
 * @param {Date} date
 * @returns {string}
 */
export function formatDateFR(date) {
  if (!date) return '';
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
}
