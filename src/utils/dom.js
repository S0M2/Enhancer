/**
 * DOM Utilities
 * Clean helper functions for DOM manipulation
 */

/**
 * Set HTML content by parsing and appending DOM nodes (safe from XSS)
 * @param {Element} el - Target element
 * @param {string} h - HTML string to set
 */
export function setH(el, h) {
  el.textContent = '';
  const dp = new DOMParser().parseFromString(h, 'text/html');
  while (dp.body.firstChild) el.appendChild(dp.body.firstChild);
}

/**
 * Add HTML content by parsing and appending DOM nodes
 * @param {Element} el - Target element
 * @param {string} h - HTML string to add
 */
export function addH(el, h) {
  const dp = new DOMParser().parseFromString(h, 'text/html');
  while (dp.body.firstChild) el.appendChild(dp.body.firstChild);
}

/**
 * Query selector shorthand
 * @param {string} selector
 * @param {Element} scope - Optional scope element
 * @returns {Element|null}
 */
export function q(selector, scope = document) {
  return scope.querySelector(selector);
}

/**
 * Query selector all shorthand
 * @param {string} selector
 * @param {Element} scope - Optional scope element
 * @returns {NodeList}
 */
export function qa(selector, scope = document) {
  return scope.querySelectorAll(selector);
}

/**
 * Create element with optional attributes
 * @param {string} tag - HTML tag name
 * @param {Object} attrs - Attributes object
 * @param {string} content - Optional text content
 * @returns {Element}
 */
export function createElement(tag, attrs = {}, content = '') {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'class') el.className = value;
    else if (key === 'style') Object.assign(el.style, value);
    else el.setAttribute(key, value);
  });
  if (content) el.textContent = content;
  return el;
}

/**
 * Insert style element into document
 * @param {string} id - Unique style ID
 * @param {string} css - CSS content
 */
export function injectStyle(id, css) {
  if (document.getElementById(id)) return;
  const s = document.createElement('style');
  s.id = id;
  s.textContent = css;
  document.head.appendChild(s);
}

/**
 * Remove element if exists
 * @param {string|Element} selector
 */
export function remove(selector) {
  const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
  el?.remove();
}

/**
 * Toggle class on element
 * @param {Element} el
 * @param {string} className
 * @param {boolean} force - Optional force state
 */
export function toggleClass(el, className, force) {
  el.classList.toggle(className, force);
}

/**
 * Wait for element to appear in DOM
 * @param {string} selector
 * @param {number} timeout - Max wait time in ms
 * @returns {Promise<Element>}
 */
export function waitFor(selector, timeout = 3000) {
  return new Promise((resolve, reject) => {
    const el = document.querySelector(selector);
    if (el) return resolve(el);

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element not found: ${selector}`));
    }, timeout);
  });
}
