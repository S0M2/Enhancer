/**
 * Main Extension Entry Point
 * Initialize all services and listeners
 */

import * as storage from './services/storage.js';
import * as theme from './services/theme.js';
import * as parser from './services/parser.js';
import * as dom from './utils/dom.js';
import * as helpers from './utils/helpers.js';
import * as agendaUI from './ui/agenda.js';
import * as modalUI from './ui/modal.js';

/**
 * Initialize extension
 */
async function init() {
  console.log('🚀 Enhancer Extension v3.5.0 initializing...');

  try {
    // Check current page
    const url = window.location.href;
    const portal = 'portail.henallux.be';
    const moodle = 'moodle.henallux.be';

    if (url.includes(portal)) {
      console.log('📚 Portal detected');
      initPortal();
    } else if (url.includes(moodle)) {
      console.log('📝 Moodle detected');
      initMoodle();
    }

    // Setup global listeners
    setupListeners();
  } catch (error) {
    console.error('❌ Initialization error:', error);
  }
}

/**
 * Initialize Portal
 */
async function initPortal() {
  // Load and apply theme
  const {theme: themeName = 'darkPremium', accentColor = '#6366f1'} = await storage.getSettings();
  applyPortalTheme(themeName, accentColor);

  // Inject dashboard CSS
  injectDashboardStyles();

  // Setup Portal hide toggles
  applyPortalHides();

  // Initialize agenda if on home
  if (!window.location.href.includes('agenda=')) {
    initAgenda();
  }
}

/**
 * Initialize Moodle
 */
async function initMoodle() {
  // Apply Moodle theme
  injectMoodleStyles();

  // Setup next course timeline
  initNextCourseTimeline();
}

/**
 * Apply portal theme
 */
async function applyPortalTheme(themeName, accent) {
  if (typeof THEMES === 'undefined') {
    console.warn('⚠️  Theme system not loaded');
    return;
  }

  if (!THEMES[themeName]) {
    console.warn(`⚠️  Theme not found: ${themeName}`);
    return;
  }

  const themeCSS = theme.buildPortalThemeCSS(THEMES[themeName], accent);
  dom.injectStyle('ccee-portal-theme', themeCSS);
  console.log(`✅ Theme applied: ${themeName}`);
}

/**
 * Inject dashboard styles
 */
function injectDashboardStyles() {
  const css = theme.getDashboardCSS() + theme.getResponsiveCSS();
  dom.injectStyle('ccee-dashboard', css);
}

/**
 * Inject Moodle styles
 */
function injectMoodleStyles() {
  // Moodle theme CSS (dark mode, etc.)
  const moodleCSS = `
    body { background: #0f172a !important; color: #e2e8f0 !important; }
    .footer { background: #0d1117 !important; }
  `;
  dom.injectStyle('ccee-moodle', moodleCSS);
}

/**
 * Apply portal hide toggles
 */
async function applyPortalHides() {
  const settings = await storage.getSettings();
  
  const hideMap = {
    hideNavbar: '.navbar, #navbar, header.navbar',
    hideFooter: 'footer, .footer',
    hideSidebar: '.sidebar, aside',
  };

  Object.entries(hideMap).forEach(([setting, selector]) => {
    if (settings[setting]) {
      document.querySelectorAll(selector).forEach(el => {
        el.style.setProperty('display', 'none', 'important');
      });
    }
  });
}

/**
 * Initialize agenda
 */
async function initAgenda() {
  // TODO: Implement agenda initialization
  console.log('📅 Agenda initialization placeholder');
}

/**
 * Initialize next course timeline
 */
async function initNextCourseTimeline() {
  // TODO: Implement next course display
  console.log('⏭️  Next course timeline placeholder');
}

/**
 * Setup storage listeners
 */
function setupListeners() {
  // Listen for settings changes
  storage.onAnyChange((changes) => {
    console.log('💾 Settings changed:', changes);

    // Reapply theme if changed
    if (changes.theme || changes.accentColor) {
      location.reload();
    }
  });

  // Listen for message from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Message received:', request);
    // Handle messages from popup
    sendResponse({ status: 'ok' });
  });
}

// Start extension
document.addEventListener('DOMContentLoaded', init);
if (document.readyState !== 'loading') {
  init();
}
