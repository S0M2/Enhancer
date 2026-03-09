/**
 * Generic Helper Functions
 * Reusable utility functions
 */

/**
 * Debounce function - returns debounced version
 * @param {Function} fn - Function to debounce
 * @param {number} ms - Delay in milliseconds
 * @returns {Function}
 */
export function debounce(fn, ms) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}

/**
 * Throttle function - returns throttled version
 * @param {Function} fn - Function to throttle
 * @param {number} ms - Interval in milliseconds
 * @returns {Function}
 */
export function throttle(fn, ms) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      fn(...args);
    }
  };
}

/**
 * Pad number with leading zeros
 * @param {number} n - Number to pad
 * @returns {string}
 */
export function pad2(n) {
  return String(n).padStart(2, '0');
}

/**
 * Capitalize first letter
 * @param {string} s
 * @returns {string}
 */
export function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Simple hash function for strings
 * @param {string} str
 * @returns {string}
 */
export function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

/**
 * Convert RGB object to rgba string
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @param {number} a - Alpha (0-1)
 * @returns {string}
 */
export function rgba(r, g, b, a) {
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * Convert hex color to RGB array
 * @param {string} hex - Hex color (#RRGGBB)
 * @returns {Array|null}
 */
export function hexToRgb(hex) {
  if (!/^#([A-Fa-f0-9]{3,6})$/.test(hex)) return null;
  let c = hex.slice(1);
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  return [
    parseInt(c.slice(0, 2), 16),
    parseInt(c.slice(2, 4), 16),
    parseInt(c.slice(4, 6), 16)
  ];
}

/**
 * Convert RGB to hex color
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {string}
 */
export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('').toUpperCase();
}

/**
 * Check if string is valid (not empty, at least 3 chars)
 * @param {string} str
 * @returns {boolean}
 */
export function isValid(str) {
  return str && str.length >= 3 && !/^\d+$/.test(str);
}

/**
 * Format date as DD/MM/YYYY
 * @param {Date} date
 * @returns {string}
 */
export function formatDate(date) {
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/**
 * Format time as HH:MM
 * @param {Date} date
 * @returns {string}
 */
export function formatTime(date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/**
 * Get day name (FR)
 * @param {number} day - 0-6
 * @returns {string}
 */
export function getDayName(day) {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  return days[day] || '';
}

/**
 * Get month name (FR)
 * @param {number} month - 0-11
 * @returns {string}
 */
export function getMonthName(month) {
  const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  return months[month] || '';
}

/**
 * Deep merge objects
 * @param {Object} target
 * @param {Object} source
 * @returns {Object}
 */
export function deepMerge(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (typeof source[key] === 'object' && source[key] !== null) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

/**
 * Clamp value between min and max
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Sleep/delay execution
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
