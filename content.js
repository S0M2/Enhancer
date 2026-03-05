// ═══════════════════════════════════════════════════
//  ENHANCER — content.js v3.3
// ═══════════════════════════════════════════════
function setH(el, h) { el.textContent = ''; const dp = new DOMParser().parseFromString(h, 'text/html'); while (dp.body.firstChild) el.appendChild(dp.body.firstChild); }
function addH(el, h) { const dp = new DOMParser().parseFromString(h, 'text/html'); while (dp.body.firstChild) el.appendChild(dp.body.firstChild); }
const isMoodle = location.hostname.includes('moodle.henallux.be');
const isPortal = location.hostname.includes('portail.henallux.be');
const isAgenda = isPortal && location.search.includes('mod=horaire');
const isHome = isPortal && !location.search.includes('mod=');

let enabled = true, courseSettings = {}, moodleSettings = {}, portalSettings = {}, customCSS = {};
let knownCourses = new Set(), currentView = 'list';
let fcReady = false, lastFCHash = '', lastRenderHash = '', agendaObserver = null, moodleObserver = null, fcObserver = null, refreshTimer = null, agendaInterval = null;
let _mutationPaused = false, lastPersistHash = '';

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

const defMoodle = () => ({ dark: true, accentColor: '#6366f1', compactCards: false, hideBanners: false, noAnimations: false, timeline: true, calendar: true, recent: true, showNextTimeline: true, hideNavbar: false, hideSidebar: false, hidePageHeader: false, hideNotifs: false, hideEditMode: false, hideFooter: false, showCourseCategory: true, showFavourite: true, showPagination: true });

const defPortal = () => ({ theme: 'default', accentColor: '#6366f1', hideNavbar: false, hideFooter: false, hideSidebar: false });

function normPS(s) {
  const d = defPortal();
  if (!s) return d;
  return {
    theme: s.theme || d.theme,
    accentColor: s.accentColor || d.accentColor,
    hideNavbar: s.hideNavbar ?? d.hideNavbar,
    hideFooter: s.hideFooter ?? d.hideFooter,
    hideSidebar: s.hideSidebar ?? d.hideSidebar,
  };
}

chrome.storage.local.get(['courseSettings', 'knownCourses', 'moodleSettings', 'portalSettings', 'customCSS', 'extensionEnabled'], res => {
  if (chrome.runtime.lastError) return;
  if (res.courseSettings) courseSettings = res.courseSettings;
  if (res.knownCourses) res.knownCourses.forEach(c => knownCourses.add(c));
  moodleSettings = normMS(res.moodleSettings);
  portalSettings = normPS(res.portalSettings);
  customCSS = res.customCSS || {};
  enabled = res.extensionEnabled !== false;
  replaceLogo();
  if (!enabled) return;
  if (isMoodle) initMoodle();
  else if (isPortal) {
    applyPortalTheme();
    if (isAgenda) waitForFC();
    else if (isHome) initHome();
  }
  applyCustomCSS();
});

chrome.storage.onChanged.addListener((changes, ns) => {
  if (ns !== 'local') return;
  if (changes.knownCourses?.newValue) changes.knownCourses.newValue.forEach(c => knownCourses.add(c));
  if (changes.courseSettings?.newValue) { courseSettings = changes.courseSettings.newValue; if (enabled) isMoodle ? applyMoodleStyle() : scheduleRefresh(300); }
  if (changes.moodleSettings?.newValue) { moodleSettings = normMS(changes.moodleSettings.newValue); if (enabled && isMoodle) applyMoodleStyle(); }
  if (changes.portalSettings?.newValue) { portalSettings = normPS(changes.portalSettings.newValue); if (enabled && isPortal) applyPortalTheme(); }
  if (changes.customCSS?.newValue) { customCSS = changes.customCSS.newValue; applyCustomCSS(); }
  if (changes.agendaEvents?.newValue) {
    if (_mutationPaused) return;
    if (isMoodle) buildNextTimeline(changes.agendaEvents.newValue);
    else if (isHome) renderFromEvents(changes.agendaEvents.newValue, readFCTitle());
  }
});

chrome.runtime.onMessage.addListener((msg, _s, reply) => {
  if (msg.action === 'get_courses') { reply({ courses: collectCourses() }); return true; }
  if (msg.action === 'apply_settings') {
    courseSettings = msg.settings;
    if (msg.moodleSettings) moodleSettings = normMS(msg.moodleSettings);
    if (msg.portalSettings) portalSettings = normPS(msg.portalSettings);
    if (msg.customCSS) customCSS = msg.customCSS;
    if (enabled) { isMoodle ? applyMoodleStyle() : scheduleRefresh(300); if (isPortal) applyPortalTheme(); applyCustomCSS(); }
    return true;
  }
  if (msg.action === 'set_enabled') { setEnabled(msg.enabled); return true; }
  return false;
});

function normMS(s) {
  const d = defMoodle();
  if (!s) return d;
  return {
    dark: s.darkEnabled ?? s.dark ?? d.dark,
    accentColor: s.accentColor || d.accentColor,
    compactCards: s.compactCards ?? d.compactCards,
    hideBanners: s.hideBanners ?? d.hideBanners,
    noAnimations: s.noAnimations ?? d.noAnimations,
    timeline: s.showTimeline ?? s.timeline ?? d.timeline,
    calendar: s.showCalendar ?? s.calendar ?? d.calendar,
    recent: s.showRecent ?? s.recent ?? d.recent,
    showNextTimeline: s.showNextTimeline ?? d.showNextTimeline,
    hideNavbar: s.hideNavbar ?? d.hideNavbar,
    hideSidebar: s.hideSidebar ?? d.hideSidebar,
    hidePageHeader: s.hidePageHeader ?? d.hidePageHeader,
    hideNotifs: s.hideNotifs ?? d.hideNotifs,
    hideEditMode: s.hideEditMode ?? d.hideEditMode,
    hideFooter: s.hideFooter ?? d.hideFooter,
    showCourseCategory: s.showCourseCategory !== false,
    showFavourite: s.showFavourite !== false,
    showPagination: s.showPagination !== false,
  };
}


function setEnabled(val) {
  enabled = val;
  if (val) {
    replaceLogo(); applyCustomCSS();
    if (isMoodle) initMoodle();
    else if (isAgenda) fcReady ? refreshAgenda() : waitForFC();
    else if (isHome) initHome();
  } else {
    [agendaObserver, moodleObserver, fcObserver].forEach(o => o?.disconnect());
    agendaObserver = moodleObserver = fcObserver = null;
    clearInterval(agendaInterval); agendaInterval = null;
    ['cce-next-timeline', 'cce-moodle-css', 'cce-moodle-vars', 'cce-custom-css-moodle', 'cce-custom-css-portal', 'cce-portal-theme', 'cce-css', 'cce-agenda'].forEach(id => document.getElementById(id)?.remove());
    document.body.classList.remove('cce-dark', 'cce-portal-dark', 'cce-portal-light');
    document.querySelectorAll('.course-card').forEach(c => c.style.cssText = '');
    document.querySelectorAll('.cce-next-badge').forEach(b => b.remove());
    const fc = document.querySelector('.fc'); if (fc) fc.style.cssText = '';
    fcReady = false; lastFCHash = ''; lastRenderHash = ''; lastPersistHash = ''; lastHomeRenderHash = '';
  }
}

// ── Logo ──
function replaceLogo() {
  const logo = document.getElementById('logo') || document.querySelector('.site-name img');
  if (!logo) return;
  logo.src = chrome.runtime.getURL('icons/icon128.png'); logo.srcset = '';
  Object.entries({ width: '42px', height: '42px', 'min-width': '42px', 'min-height': '42px', 'max-width': '42px', 'max-height': '42px', 'border-radius': '50%', 'object-fit': 'cover', 'border': '2px solid rgba(255,255,255,0.2)', 'box-shadow': '0 2px 8px rgba(0,0,0,0.4)', display: 'block' })
    .forEach(([k, v]) => logo.style.setProperty(k, v, 'important'));
}

// ── Custom CSS ──
function applyCustomCSS() {
  const inject = (id, css, cond) => {
    if (!cond) return;
    let el = document.getElementById(id);
    if (!el) { el = document.createElement('style'); el.id = id; document.head.appendChild(el); }
    el.textContent = css || '';
  };
  inject('cce-custom-css-moodle', customCSS?.moodle, isMoodle);
  inject('cce-custom-css-portal', customCSS?.portal, isPortal);
}

// ── Portal Theme ──
function applyPortalTheme() {
  if (!isPortal) return;
  const theme = portalSettings.theme || 'default';
  const accent = portalSettings.accentColor || '#6366f1';

  // Remove old theme classes
  document.body.classList.remove('cce-portal-dark', 'cce-portal-light');

  // Inject/update theme CSS
  let el = document.getElementById('cce-portal-theme');
  if (!el) { el = document.createElement('style'); el.id = 'cce-portal-theme'; document.head.appendChild(el); }

  if (theme === 'default') { el.textContent = ''; return; }

  const acc = accent;
  const accRgb = hexToRgb(acc);
  const accStr = accRgb ? `${accRgb.r},${accRgb.g},${accRgb.b}` : '99,102,241';

  if (theme === 'dark') {
    document.body.classList.add('cce-portal-dark');
    el.textContent = portalDarkCSS(acc, accStr);
  } else if (theme === 'light') {
    document.body.classList.add('cce-portal-light');
    el.textContent = portalLightCSS(acc, accStr);
  }

  // Structural hides
  applyPortalHides();
}

function applyPortalHides() {
  const hide = (sel, flag) => document.querySelectorAll(sel).forEach(el => el.style.setProperty('display', flag ? 'none' : '', 'important'));
  hide('.navbar, #navbar, header.navbar', portalSettings.hideNavbar);
  hide('footer, #footer, .footer', portalSettings.hideFooter);
  hide('.sidebar, #sidebar, .aside', portalSettings.hideSidebar);
}

function hexToRgb(hex) {
  const m = hex.replace('#', '').match(/.{2}/g);
  if (!m || m.length < 3) return null;
  return { r: parseInt(m[0], 16), g: parseInt(m[1], 16), b: parseInt(m[2], 16) };
}

function portalDarkCSS(acc, accStr) {
  return `
/* ═══ PORTAL DARK THEME ═══ */
:root {
  --pd-bg:      #07090f;
  --pd-bg1:     #0d1017;
  --pd-bg2:     #131722;
  --pd-bg3:     #1a1f2e;
  --pd-glass:   rgba(10,13,22,.85);
  --pd-border:  rgba(255,255,255,.07);
  --pd-text:    #e8eaf0;
  --pd-muted:   #8892b0;
  --pd-acc:     ${acc};
  --pd-acc-rgb: ${accStr};
  --pd-glow:    rgba(${accStr},.22);
}

/* Base */
html, body {
  background: var(--pd-bg) !important;
  color: var(--pd-text) !important;
}

/* Main containers */
#page, #page-wrapper, #region-main-box, .region_main,
main, [role="main"], #maincontent,
.container, .container-fluid,
.page-content, #page-content {
  background: var(--pd-bg) !important;
  color: var(--pd-text) !important;
}

/* Cards / panels */
.card, .box, .well, .panel, .block,
.course-summary-item, .coursebox,
.fp-filename-field, [class*="card"],
.list-group-item, .activity-item,
.section-item, .course-item {
  background: var(--pd-bg2) !important;
  border-color: var(--pd-border) !important;
  color: var(--pd-text) !important;
  box-shadow: 0 2px 12px rgba(0,0,0,.3) !important;
}

/* Navbar */
.navbar, nav.navbar, header, .fixed-top, .sticky-top,
#page-header, .page-header-wrapper {
  background: rgba(7,9,15,.9) !important;
  backdrop-filter: blur(16px) !important;
  border-bottom: 1px solid var(--pd-border) !important;
  box-shadow: 0 1px 20px rgba(0,0,0,.4) !important;
}
.navbar-brand, .site-name, .navbar-brand * { color: #fff !important; }
.nav-link, .navbar-nav .nav-link {
  color: var(--pd-muted) !important;
  font-weight: 600 !important;
}
.nav-link:hover { color: #fff !important; }
.nav-link.active, .navbar-nav .active .nav-link {
  color: var(--pd-acc) !important;
}

/* Breadcrumb */
.breadcrumb, .breadcrumb-item { background: transparent !important; }
.breadcrumb-item a { color: var(--pd-acc) !important; }
.breadcrumb-item.active { color: var(--pd-muted) !important; }
.breadcrumb-item + .breadcrumb-item::before { color: var(--pd-muted) !important; }

/* Dropdowns */
.dropdown-menu {
  background: var(--pd-glass) !important;
  border: 1px solid var(--pd-border) !important;
  backdrop-filter: blur(20px) !important;
  box-shadow: 0 8px 30px rgba(0,0,0,.5) !important;
}
.dropdown-item { color: var(--pd-text) !important; }
.dropdown-item:hover { background: rgba(var(--pd-acc-rgb),.12) !important; color: #fff !important; }

/* Tables */
table, .table { color: var(--pd-text) !important; }
.table th { background: var(--pd-bg3) !important; color: var(--pd-muted) !important; border-color: var(--pd-border) !important; font-weight: 700 !important; letter-spacing: .5px; font-size: 11px; text-transform: uppercase; }
.table td { border-color: var(--pd-border) !important; background: var(--pd-bg2) !important; }
.table-striped tbody tr:nth-of-type(odd) td { background: var(--pd-bg3) !important; }
.table tr:hover td { background: rgba(var(--pd-acc-rgb),.06) !important; }

/* Forms & inputs */
input, select, textarea,
.form-control, .form-select {
  background: var(--pd-bg3) !important;
  border-color: var(--pd-border) !important;
  color: var(--pd-text) !important;
}
input:focus, select:focus, textarea:focus,
.form-control:focus, .form-select:focus {
  border-color: var(--pd-acc) !important;
  box-shadow: 0 0 0 3px rgba(${accStr},.18) !important;
  outline: none !important;
}
input::placeholder, textarea::placeholder { color: var(--pd-muted) !important; opacity: .6 !important; }

/* Buttons */
.btn-primary, .btn.btn-primary {
  background: var(--pd-acc) !important;
  border-color: var(--pd-acc) !important;
  box-shadow: 0 2px 10px var(--pd-glow) !important;
}
.btn-primary:hover { box-shadow: 0 4px 18px rgba(${accStr},.4) !important; transform: translateY(-1px); }
.btn-secondary, .btn-outline-secondary {
  background: var(--pd-bg3) !important;
  border-color: var(--pd-border) !important;
  color: var(--pd-muted) !important;
}
.btn-secondary:hover { color: var(--pd-text) !important; border-color: var(--pd-acc) !important; }
.btn-link { color: var(--pd-acc) !important; }

/* Links */
a { color: var(--pd-acc) !important; }
a:hover { color: #fff !important; }

/* Sidebar / drawers */
.drawer, [data-region="drawer"], .block-region,
#nav-drawer, aside {
  background: var(--pd-bg1) !important;
  border-right: 1px solid var(--pd-border) !important;
}

/* Badges */
.badge { font-weight: 700 !important; letter-spacing: .3px !important; }
.badge-primary, .badge.bg-primary { background: rgba(${accStr},.2) !important; color: var(--pd-acc) !important; border: 1px solid rgba(${accStr},.3) !important; }

/* Footer */
footer, #page-footer {
  background: var(--pd-bg1) !important;
  border-top: 1px solid var(--pd-border) !important;
  color: var(--pd-muted) !important;
}
footer a { color: var(--pd-muted) !important; }
footer a:hover { color: var(--pd-acc) !important; }

/* Headings */
h1,h2,h3,h4,h5,h6 { color: #fff !important; }
.text-muted { color: var(--pd-muted) !important; }

/* Modals */
.modal-content {
  background: var(--pd-bg2) !important;
  border: 1px solid var(--pd-border) !important;
  box-shadow: 0 20px 60px rgba(0,0,0,.6) !important;
}
.modal-header { border-bottom-color: var(--pd-border) !important; }
.modal-footer { border-top-color: var(--pd-border) !important; }

/* Alerts */
.alert { border-radius: 10px !important; border: none !important; }
.alert-info    { background: rgba(59,130,246,.12) !important; color: #93c5fd !important; }
.alert-success { background: rgba(34,197,94,.12)  !important; color: #86efac !important; }
.alert-warning { background: rgba(245,158,11,.12) !important; color: #fcd34d !important; }
.alert-danger  { background: rgba(239,68,68,.12)  !important; color: #fca5a5 !important; }

/* Scrollbar */
::-webkit-scrollbar { width: 7px; height: 7px; }
::-webkit-scrollbar-track { background: var(--pd-bg); }
::-webkit-scrollbar-thumb { background: var(--pd-bg3); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: rgba(${accStr},.4); }

/* Selection */
::selection { background: rgba(${accStr},.3); color: #fff; }
`;
}

function portalLightCSS(acc, accStr) {
  return `
/* ═══ PORTAL LIGHT THEME ═══ */
:root {
  --pl-bg:     #f8f9ff;
  --pl-bg1:    #ffffff;
  --pl-bg2:    #f1f3fb;
  --pl-bg3:    #e8eaf6;
  --pl-border: rgba(0,0,0,.08);
  --pl-text:   #1a1d2e;
  --pl-muted:  #64748b;
  --pl-acc:    ${acc};
  --pl-acc-rgb:${accStr};
  --pl-glow:   rgba(${accStr},.18);
  --pl-shadow: rgba(0,0,0,.08);
}

html, body {
  background: var(--pl-bg) !important;
  color: var(--pl-text) !important;
}

#page, #page-wrapper, #region-main-box, .region_main,
main, [role="main"], #maincontent,
.container, .container-fluid,
.page-content, #page-content {
  background: var(--pl-bg) !important;
  color: var(--pl-text) !important;
}

.card, .box, .well, .panel, .block,
.course-summary-item, .coursebox,
[class*="card"], .list-group-item,
.activity-item, .section-item {
  background: var(--pl-bg1) !important;
  border-color: var(--pl-border) !important;
  color: var(--pl-text) !important;
  box-shadow: 0 2px 12px var(--pl-shadow) !important;
}

.navbar, nav.navbar, header, .fixed-top, .sticky-top,
#page-header, .page-header-wrapper {
  background: rgba(255,255,255,.92) !important;
  backdrop-filter: blur(14px) !important;
  border-bottom: 1px solid var(--pl-border) !important;
  box-shadow: 0 1px 16px var(--pl-shadow) !important;
}
.navbar-brand, .site-name { color: var(--pl-text) !important; }
.nav-link { color: var(--pl-muted) !important; font-weight: 600 !important; }
.nav-link:hover { color: var(--pl-acc) !important; }
.nav-link.active { color: var(--pl-acc) !important; }

.breadcrumb { background: transparent !important; }
.breadcrumb-item a { color: var(--pl-acc) !important; }
.breadcrumb-item.active { color: var(--pl-muted) !important; }

.dropdown-menu {
  background: var(--pl-bg1) !important;
  border: 1px solid var(--pl-border) !important;
  box-shadow: 0 8px 24px var(--pl-shadow) !important;
}
.dropdown-item { color: var(--pl-text) !important; }
.dropdown-item:hover { background: var(--pl-bg2) !important; color: var(--pl-acc) !important; }

table, .table { color: var(--pl-text) !important; }
.table th { background: var(--pl-bg2) !important; color: var(--pl-muted) !important; border-color: var(--pl-border) !important; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; }
.table td { border-color: var(--pl-border) !important; background: var(--pl-bg1) !important; }
.table-striped tbody tr:nth-of-type(odd) td { background: var(--pl-bg2) !important; }
.table tr:hover td { background: rgba(${accStr},.05) !important; }

input, select, textarea, .form-control, .form-select {
  background: #fff !important;
  border: 1px solid var(--pl-border) !important;
  color: var(--pl-text) !important;
  border-radius: 8px !important;
}
input:focus, .form-control:focus {
  border-color: var(--pl-acc) !important;
  box-shadow: 0 0 0 3px rgba(${accStr},.12) !important;
}

.btn-primary {
  background: var(--pl-acc) !important;
  border-color: var(--pl-acc) !important;
  box-shadow: 0 2px 8px var(--pl-glow) !important;
  color: #fff !important;
}
.btn-primary:hover { box-shadow: 0 4px 16px rgba(${accStr},.35) !important; transform: translateY(-1px); }
.btn-secondary { background: var(--pl-bg2) !important; border-color: var(--pl-border) !important; color: var(--pl-muted) !important; }
.btn-secondary:hover { color: var(--pl-acc) !important; border-color: var(--pl-acc) !important; }
.btn-link { color: var(--pl-acc) !important; }

a { color: var(--pl-acc) !important; }
a:hover { opacity: .8; }

.drawer, [data-region="drawer"], #nav-drawer, aside {
  background: var(--pl-bg1) !important;
  border-right: 1px solid var(--pl-border) !important;
  box-shadow: 2px 0 12px var(--pl-shadow) !important;
}

.badge.bg-primary { background: rgba(${accStr},.12) !important; color: var(--pl-acc) !important; }

footer, #page-footer {
  background: var(--pl-bg2) !important;
  border-top: 1px solid var(--pl-border) !important;
  color: var(--pl-muted) !important;
}

h1,h2,h3,h4,h5,h6 { color: var(--pl-text) !important; }
.text-muted { color: var(--pl-muted) !important; }

.modal-content {
  background: #fff !important;
  border: 1px solid var(--pl-border) !important;
  box-shadow: 0 16px 50px var(--pl-shadow) !important;
}
.modal-header { border-bottom-color: var(--pl-border) !important; }
.modal-footer { border-top-color: var(--pl-border) !important; }

.alert { border-radius: 10px !important; border: none !important; }
.alert-info    { background: rgba(59,130,246,.08)  !important; color: #1d4ed8 !important; }
.alert-success { background: rgba(34,197,94,.08)   !important; color: #15803d !important; }
.alert-warning { background: rgba(245,158,11,.08)  !important; color: #b45309 !important; }
.alert-danger  { background: rgba(239,68,68,.08)   !important; color: #b91c1c !important; }

::-webkit-scrollbar { width: 7px; height: 7px; }
::-webkit-scrollbar-track { background: var(--pl-bg); }
::-webkit-scrollbar-thumb { background: var(--pl-bg3); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: rgba(${accStr},.3); }

::selection { background: rgba(${accStr},.2); color: var(--pl-text); }
`;
}

// ── Title parser ──
function parseTitle(text) {
  if (!text) return null;
  let s = text.replace(/<br\s*\/?>/gi, ' - ').replace(/<[^>]*>/g, ' ')
    .replace(/Enseignant\s*:\s*/gi, '').replace(/Nom du cours\s*/gi, '')
    .replace(/Catégorie de cours\s*/gi, '').replace(/\s+/g, ' ').trim();
  let year = null;
  const mc = s.match(/([A-Z]{2,}-[A-Z]{2,}-B([1-3]))-[A-Z0-9]+/i);
  if (mc) { year = 'BAC ' + mc[2]; s = s.replace(mc[0], '').replace(/^[-\s]+/, ''); }
  const rooms = [];
  s = s.replace(/\bIE-(?:L\.)?\d+[^(]*(\(\d+\s*pl\.\))?|\bIESN\b/gi, m => { rooms.push(m.trim()); return ' __R__ '; });
  const regroups = [];
  s = s.replace(/\[[^\]]+\]/g, m => { regroups.push(m); return ' __G__ '; });
  s = s.replace(/\b([A-Z]{2,4}-)?[A-Z]{2,}-[1-3](B|B-[A-Z])\b/gi, ' __C__ ');
  s = s.replace(/\b\d+\s*pl\b\.?|\b\d+\s*places?\b|\(\d+\s*pl\.\)/gi, '');
  let parts = s.split(/\s*[-–—*|]\s*/).map(p => p.replace(/__R__|__G__|__C__/g, '').trim()).filter(p => p.length > 0 && !/^[A-Z0-9\-,.\s]+$/.test(p));
  let name = parts[0] || 'Inconnu', prof = parts[1] || '';
  if (parts.length > 1 && parts[1].toLowerCase().startsWith(parts[0].toLowerCase())) { name = parts[1]; prof = parts[2] || ''; }
  else if (name.length < 3 && parts.length > 1) { name = parts[1]; prof = parts[2] || ''; }
  if (prof && name.toLowerCase().endsWith(prof.toLowerCase())) name = name.slice(0, name.length - prof.length).trim();
  if (text.includes('Remédiations') && !name.includes('Remédiations')) name = 'Remédiations ' + name;
  name = name.replace(/\s*[-]?\s*Q[12](\/Q[12])?$/i, '').replace(/\s+[A-Z0-9-]{1,3}$/i, '').replace(/[:\s-]+$/, '').trim();
  if (!year) regroups.forEach(r => { const m = r.match(/\[([1-3])/); if (m) year = 'BAC ' + m[1]; });
  const lo = text.toLowerCase(); let type = 'other';
  if (/\blabo\b|\blaboratoire\b|\btp\b/.test(lo)) type = 'lab';
  else if (/\bautonomie\b/.test(lo)) type = 'auto';
  else if (/\bcours\b|\bthéorie\b|\btheorie\b/.test(lo)) type = 'th';
  return { name: name.replace(/\s+/g, ' ').trim(), prof: prof.replace(/\s+/g, ' ').trim(), type, room: rooms.join(', '), year };
}
function extractName(text) { const p = parseTitle(text); if (!p) return text ? text.slice(0, 30) : null; return p.year ? `${p.name} [${p.year}]` : p.name; }
function isValid(n) { return n && n.length >= 3 && !/^\d+$/.test(n); }
function getSetting(name) { if (!name) return null; if (courseSettings[name]) return courseSettings[name]; const c = name.replace(/\s*\[BAC\s*\d\]/i, '').trim(); return courseSettings[c] || null; }
function getLink(name) { return getSetting(name)?.link || null; }

function collectCourses() {
  if (isMoodle) document.querySelectorAll('.coursename').forEach(el => { const n = extractName((el.innerText || el.textContent).trim()); if (isValid(n)) knownCourses.add(n); });
  else { const fc = document.querySelector('.fc'); if (fc) fc.querySelectorAll('.fc-list-event-title a,.fc-event-title').forEach(el => { const n = extractName(el.textContent.replace(/\s+/g, ' ').trim()); if (isValid(n)) knownCourses.add(n); }); }

  if (knownCourses.size > 0) {
    chrome.storage.local.get(['knownCourses'], (res) => {
      const existing = res.knownCourses || [];
      const merged = [...new Set([...existing, ...knownCourses])].sort();
      chrome.storage.local.set({ knownCourses: merged });
    });
  }
  return [...knownCourses].sort();
}

// ══════════════════════════════════════════════════
//  MOODLE
// ══════════════════════════════════════════════════
function initMoodle() {
  injectMoodleCSS(); applyCustomCSS();
  chrome.storage.local.get(['agendaEvents'], res => { applyMoodleStyle(); buildNextTimeline(res.agendaEvents || []); });
  moodleObserver?.disconnect();
  const _debouncedMoodle = debounce(() => {
    if (_mutationPaused || !enabled) return;
    chrome.storage.local.get(['agendaEvents'], res => {
      applyMoodleStyle();
      buildNextTimeline(res.agendaEvents || []);
    });
  }, 500);
  moodleObserver = new MutationObserver(_debouncedMoodle);
  moodleObserver.observe(document.body, { childList: true, subtree: true });
}

function applyMoodleStyle() {
  if (!enabled) return;
  const accent = moodleSettings.accentColor || '#6366f1';
  let vs = document.getElementById('cce-moodle-vars');
  if (!vs) { vs = document.createElement('style'); vs.id = 'cce-moodle-vars'; document.head.appendChild(vs); }
  vs.textContent = `:root{--cce-accent:${accent};--cce-glow:${rgba(accent, 0.25)};}`;

  // ── Dark mode ──
  if (moodleSettings.dark) document.body.classList.add('cce-dark'); else document.body.classList.remove('cce-dark');

  // ── Visible blocks ──
  const blockMap = { timeline: moodleSettings.timeline, calendar_month: moodleSettings.calendar, recentlyaccessedcourses: moodleSettings.recent };
  for (const [k, show] of Object.entries(blockMap)) { const el = document.querySelector(`[data-block="${k}"]`); if (el) el.style.display = show ? '' : 'none'; }

  // ── CCE next timeline ──
  const ntEl = document.getElementById('cce-next-timeline');
  if (ntEl) ntEl.style.display = moodleSettings.showNextTimeline === false ? 'none' : '';

  // ── Helper ──
  const hide = (sel, flag) => document.querySelectorAll(sel).forEach(el => el.style.display = flag ? 'none' : '');
  const show = (sel, flag) => document.querySelectorAll(sel).forEach(el => el.style.display = flag === false ? 'none' : '');

  // ── Hide elements ──
  hide('.navbar.fixed-top, nav.navbar', moodleSettings.hideNavbar);
  if (moodleSettings.hideNavbar) {
    document.body.style.paddingTop = '0';
  } else {
    document.body.style.paddingTop = '';
  }
  hide('#usernavigation,.usermenu', moodleSettings.hideNotifs);
  hide('.drawer.drawer-left,.drawer-primary,[data-region="fixed-drawer"]', moodleSettings.hideSidebar);
  hide('#page-header,.page-context-header,.page-header-headings', moodleSettings.hidePageHeader);
  hide('.editmode-switch-form', moodleSettings.hideEditMode);
  hide('#page-footer,footer', moodleSettings.hideFooter);

  // ── No animations ──
  let aniStyle = document.getElementById('cce-no-ani');
  if (moodleSettings.noAnimations) {
    if (!aniStyle) { aniStyle = document.createElement('style'); aniStyle.id = 'cce-no-ani'; document.head.appendChild(aniStyle); }
    aniStyle.textContent = '*,*::before,*::after{animation-duration:0s!important;transition-duration:0s!important;}';
  } else {
    aniStyle?.remove();
  }

  // ── Per-card tweaks ──
  document.querySelectorAll('[data-region="card-deck"] .course-card,.block_recentlyaccessedcourses .course-card').forEach(card => {
    const te = card.querySelector('.coursename,.text-truncate'); if (!te) return;
    const name = extractName(te.textContent.trim()), setting = getSetting(name);

    // Course color border
    if (setting?.color) {
      card.style.setProperty('border-left', `4px solid ${setting.color}`, 'important');
      card.style.setProperty('background', 'rgba(17,24,39,0.5)', 'important');
      card.style.setProperty('backdrop-filter', 'blur(12px)', 'important');
    }

    // Compact cards
    if (moodleSettings.compactCards) {
      card.style.setProperty('min-height', '0', 'important');
      const img = card.querySelector('.card-img-top');
      if (img) img.style.setProperty('height', '60px', 'important');
    } else {
      card.style.removeProperty('min-height');
      const img = card.querySelector('.card-img-top');
      if (img && !moodleSettings.hideBanners) img.style.removeProperty('height');
    }

    // Hide banners
    const img = card.querySelector('.card-img-top');
    if (img) img.style.display = moodleSettings.hideBanners ? 'none' : '';

    // Course category (.text-muted inside .course-info-container)
    const cat = card.querySelector('.text-muted,.muted');
    if (cat) cat.style.display = moodleSettings.showCourseCategory === false ? 'none' : '';

    // Favourite icon
    const fav = card.querySelector('[data-region="favourite-icon"]');
    if (fav) fav.style.display = moodleSettings.showFavourite === false ? 'none' : '';
  });

  // ── Pagination ──
  hide('[data-region="paging-bar-container"],.paging-bar-container', moodleSettings.showPagination === false);
}

// ── Next Course Timeline ──
function buildNextTimeline(events = []) {
  if (!enabled) return;
  document.getElementById('cce-next-timeline')?.remove();
  const now = Date.now(), today = new Date().toLocaleDateString('en-CA');
  const sorted = [...events].filter(ev => ev.date >= today)
    .map(ev => ({ ...ev, startMs: +new Date(`${ev.date}T${p2(ev.sh)}:${p2(ev.sm)}:00`), endMs: +new Date(`${ev.date}T${p2(ev.eh)}:${p2(ev.em)}:00`) }))
    .sort((a, b) => a.startMs - b.startMs);
  const current = sorted.find(ev => ev.startMs <= now && ev.endMs > now);
  const upcoming = sorted.filter(ev => ev.startMs > now);
  const nextMs = upcoming[0]?.startMs, nextGroup = nextMs ? upcoming.filter(ev => ev.startMs === nextMs) : [];
  const after = upcoming.filter(ev => ev.startMs > nextMs).slice(0, 5);
  if (nextGroup.length) highlightNextCourses(nextGroup);

  let container = document.getElementById('cce-next-timeline');
  if (!container) {
    container = document.createElement('div'); container.id = 'cce-next-timeline';
    const target = document.querySelector('[role="main"]') || document.querySelector('#region-main');
    if (target) target.prepend(container); else return;
  }
  let html = '';

  if (current) {
    const p = current.parsed || {}, color = getSetting(current.courseName)?.color || 'var(--cce-accent)', link = getLink(current.courseName);
    const prog = Math.min(100, Math.round(((now - current.startMs) / (current.endMs - current.startMs)) * 100));
    html += `<div class="cct-section"><div class="cct-lbl cct-live"><span class="cct-dot"></span>EN COURS</div>
      <div class="cct-card cct-card-live" style="--c:${color}">
        <div class="cct-bar" style="background:${color}"></div>
        <div class="cct-body">
          <div class="cct-time">${p2(current.sh)}:${p2(current.sm)} → ${p2(current.eh)}:${p2(current.em)}</div>
          <div class="cct-name">${current.courseName}</div>
          <div class="cct-meta">📍 ${p.room || '—'}${p.prof ? ' · 👤 ' + p.prof : ''}</div>
          <div class="cct-prog"><div class="cct-prog-fill" style="width:${prog}%;background:${color}"></div></div>
        </div>
        ${link ? `<a href="${link}" target="_blank" class="cct-link">→</a>` : ''}
      </div></div>`;
  }

  if (nextGroup.length) {
    const d = new Date(nextGroup[0].date + 'T12:00:00'), isToday = nextGroup[0].date === today;
    const label = isToday ? "Aujourd'hui" : cap(d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }));
    html += `<div class="cct-section"><div class="cct-lbl cct-next">⏭ PROCHAIN — ${label}</div>
      <div class="cct-group">${nextGroup.map(ev => tCard(ev, true)).join('')}</div></div>`;
  }

  if (after.length) {
    html += `<div class="cct-section"><div class="cct-lbl cct-soon">🔜 À VENIR</div><div class="cct-tl">`;
    let ld = null;
    after.forEach(ev => {
      if (ev.date !== ld) {
        const d = new Date(ev.date + 'T12:00:00'), isT = ev.date === today;
        html += `<div class="cct-tl-date">${isT ? "Aujourd'hui" : cap(d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }))}</div>`;
        ld = ev.date;
      }
      html += tCard(ev, false);
    });
    html += `</div></div>`;
  }

  if (!current && !nextGroup.length) html = `<div class="cct-empty">🎉 <span>Aucun cours à venir — synchronise ton agenda sur le Portail</span></div>`;
  setH(container, `<div class="cct-wrap">${html}</div>`);
}

function tCard(ev, prom) {
  const p = ev.parsed || {}, color = getSetting(ev.courseName)?.color || 'var(--cce-accent)', link = getLink(ev.courseName);
  const bm = { th: 'cct-bth', lab: 'cct-blab', auto: 'cct-bauto', other: 'cct-bo' };
  if (prom) return `<div class="cct-card cct-card-next" style="--c:${color}"><div class="cct-bar" style="background:${color}"></div><div class="cct-body"><div class="cct-time">${p2(ev.sh)}:${p2(ev.sm)} → ${p2(ev.eh)}:${p2(ev.em)}</div><div class="cct-name">${ev.courseName}</div><div class="cct-meta">📍 ${p.room || '—'}${p.prof ? ' · 👤 ' + p.prof : ''} <span class="cct-badge ${bm[p.type] || 'cct-bo'}">${{ th: 'TH', lab: 'LAB', auto: 'AUTO', other: '—' }[p.type] || '—'}</span></div></div>${link ? `<a href="${link}" target="_blank" class="cct-link cct-link-txt">Ouvrir →</a>` : ''}</div>`;
  return `<div class="cct-tl-row" style="border-left-color:${color}"><span class="cct-tl-t">${p2(ev.sh)}:${p2(ev.sm)}</span><span class="cct-tl-n">${ev.courseName}</span><span class="cct-tl-r">📍 ${p.room || '—'}</span>${link ? `<a href="${link}" target="_blank" class="cct-tl-link">→</a>` : ''}</div>`;
}

function highlightNextCourses(evs) {
  document.querySelectorAll('.cce-next-badge').forEach(b => b.remove());
  document.querySelectorAll('.course-card.is-next').forEach(c => { c.classList.remove('is-next'); c.style.removeProperty('--nc'); });
  evs.forEach(ev => {
    const color = getSetting(ev.courseName)?.color || 'var(--cce-accent)';
    const evCore = ev.courseName.replace(/\s*\[BAC\s*\d\]/i, '').trim().toLowerCase();
    document.querySelectorAll('.course-card').forEach(card => {
      const te = card.querySelector('.coursename,.text-truncate'); if (!te) return;
      const cn = (extractName(te.textContent.trim()) || '').replace(/\s*\[BAC\s*\d\]/i, '').trim().toLowerCase();
      if (cn === evCore || cn.includes(evCore) || evCore.includes(cn)) {
        card.classList.add('is-next'); card.style.setProperty('--nc', color);
        if (!card.querySelector('.cce-next-badge')) { const b = document.createElement('span'); b.className = 'cce-next-badge'; b.textContent = 'PROCHAIN'; card.appendChild(b); }
      }
    });
  });
}

function injectMoodleCSS() {
  if (document.getElementById('cce-moodle-css')) return;
  const s = document.createElement('style'); s.id = 'cce-moodle-css';
  s.textContent = `
:root{--cce-bg:#060912;--cce-card:rgba(17,24,39,.45);--cce-text:#f3f4f6;--cce-muted:#9ca3af;--cce-border:rgba(255,255,255,.08);--cce-accent:#6366f1;--cce-glow:rgba(99,102,241,.25);--cce-glass:rgba(8,12,22,.88);}
body.cce-dark{background:var(--cce-bg)!important;color:var(--cce-text)!important;}
body.cce-dark #page-wrapper,body.cce-dark #page,body.cce-dark #region-main{background:var(--cce-bg)!important;}
body.cce-dark .bg-white,body.cce-dark .card,body.cce-dark .card-body,body.cce-dark .list-group-item{background:transparent!important;color:var(--cce-text)!important;border-color:var(--cce-border)!important;}
body.cce-dark #page-content,body.cce-dark .block_recentlyaccessedcourses,body.cce-dark .block_timeline,body.cce-dark .block_calendar_month{background:var(--cce-glass)!important;backdrop-filter:blur(20px)!important;border-radius:20px!important;padding:18px!important;margin-bottom:20px!important;border:1px solid var(--cce-border)!important;}
body.cce-dark .coursename{color:#fff!important;font-weight:700!important;}
body.cce-dark .text-muted{color:var(--cce-muted)!important;}
body.cce-dark h1,body.cce-dark h2,body.cce-dark h3,body.cce-dark .card-title{color:#fff!important;font-weight:700!important;}
/* Fix page header / dashboard title */
body.cce-dark #page-header{background:var(--cce-bg)!important;border-bottom:1px solid var(--cce-border)!important;}
body.cce-dark #page-header .page-header-headings h1,
body.cce-dark #page-header .page-header-headings h2,
body.cce-dark .page-header-headings,
body.cce-dark .page-context-header,
body.cce-dark .page-context-header h1{color:#fff!important;background:transparent!important;}
body.cce-dark .page-context-header .pull-left,
body.cce-dark .page-context-header .pull-right{background:transparent!important;}
body.cce-dark .tertiary-navigation,body.cce-dark .secondary-navigation{background:var(--cce-bg)!important;border-color:var(--cce-border)!important;}
body.cce-dark .secondary-navigation .nav-tabs{border-color:var(--cce-border)!important;}
body.cce-dark .secondary-navigation .nav-link{color:var(--cce-muted)!important;}
body.cce-dark .secondary-navigation .nav-link.active{color:#fff!important;border-color:var(--cce-accent)!important;}
body.cce-dark .navbar{background:rgba(4,6,14,.88)!important;backdrop-filter:blur(16px)!important;border-bottom:1px solid var(--cce-border)!important;}
body.cce-dark .nav-link{color:var(--cce-muted)!important;font-weight:600!important;}
body.cce-dark .nav-link:hover{color:#fff!important;}
body.cce-dark .dropdown-menu{background:var(--cce-glass)!important;border:1px solid var(--cce-border)!important;backdrop-filter:blur(20px)!important;}
body.cce-dark .dropdown-item{color:var(--cce-text)!important;}
body.cce-dark .dropdown-item:hover{background:rgba(99,102,241,.12)!important;}
body.cce-dark .course-card{background:var(--cce-card)!important;border:1px solid var(--cce-border)!important;border-radius:16px!important;box-shadow:0 4px 20px rgba(0,0,0,.25)!important;transition:all .35s cubic-bezier(.16,1,.3,1)!important;position:relative!important;overflow:hidden!important;}
body.cce-dark .course-card:hover{transform:translateY(-6px)!important;border-color:var(--cce-accent)!important;box-shadow:0 16px 36px rgba(0,0,0,.4),0 0 16px var(--cce-glow)!important;}
body.cce-dark .course-card.is-next{border-color:var(--nc,var(--cce-accent))!important;box-shadow:0 0 0 2px var(--nc,var(--cce-accent)),0 8px 24px rgba(0,0,0,.3)!important;animation:cce-nc-pulse 3s ease-in-out infinite;}
@keyframes cce-nc-pulse{0%,100%{box-shadow:0 0 0 1px var(--nc,var(--cce-accent)),0 8px 24px rgba(0,0,0,.3);}50%{box-shadow:0 0 0 3px var(--nc,var(--cce-accent)),0 12px 32px rgba(0,0,0,.4),0 0 25px var(--cce-glow);}}
.cce-next-badge{position:absolute;top:10px;right:10px;background:var(--cce-accent);color:#fff!important;padding:3px 9px;border-radius:6px;font-size:9px!important;font-weight:900!important;letter-spacing:.06em;box-shadow:0 2px 10px var(--cce-glow);z-index:5;animation:nbpulse 2s ease-in-out infinite;}
@keyframes nbpulse{0%,100%{opacity:1;}50%{opacity:.65;}}

/* ── NEXT TIMELINE ── */
#cce-next-timeline{margin:0 0 24px;font-family:'Sora','Inter',system-ui,sans-serif;}
.cct-wrap{display:flex;flex-direction:column;gap:14px;}
.cct-section{display:flex;flex-direction:column;gap:8px;}
.cct-lbl{font-size:9px;font-weight:900;letter-spacing:2px;text-transform:uppercase;display:flex;align-items:center;gap:7px;padding:0 2px;}
.cct-live{color:#ef4444;}.cct-next{color:var(--cce-accent);}.cct-soon{color:var(--cce-muted);}
.cct-dot{width:8px;height:8px;border-radius:50%;background:#ef4444;flex-shrink:0;animation:livepulse 2s ease-in-out infinite;}
@keyframes livepulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(239,68,68,.5);}50%{opacity:.6;box-shadow:0 0 0 8px rgba(239,68,68,0);}}
.cct-card{display:flex;align-items:stretch;background:var(--cce-glass);backdrop-filter:blur(20px);border:1px solid var(--cce-border);border-radius:14px;overflow:hidden;transition:all .25s;position:relative;}
.cct-card:hover{border-color:var(--c,var(--cce-accent));transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.3);}
.cct-bar{width:4px;flex-shrink:0;}
.cct-body{flex:1;padding:12px 14px;min-width:0;}
.cct-time{font-family:'SF Mono','Fira Code',monospace;font-size:11px;font-weight:700;color:var(--cce-accent);margin-bottom:4px;}
.cct-name{font-size:14px;font-weight:700;color:#f1f5f9;margin-bottom:4px;line-height:1.3;}
.cct-meta{font-size:11px;color:var(--cce-muted);display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.cct-link{display:flex;align-items:center;justify-content:center;padding:0 16px;color:var(--cce-muted)!important;font-size:16px;text-decoration:none!important;border-left:1px solid var(--cce-border);transition:all .2s;flex-shrink:0;}
.cct-link:hover{color:#fff!important;background:rgba(99,102,241,.1);}
.cct-link-txt{font-size:12px;font-weight:700;padding:0 14px;white-space:nowrap;color:var(--cce-accent)!important;}
.cct-link-txt:hover{color:#fff!important;}
.cct-card-live .cct-body{padding:14px 16px;}.cct-card-live .cct-name{font-size:15px;}
.cct-prog{margin-top:8px;height:3px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden;}
.cct-prog-fill{height:100%;border-radius:2px;transition:width 60s linear;}
.cct-group{display:flex;flex-direction:column;gap:6px;}
.cct-tl{display:flex;flex-direction:column;gap:3px;}
.cct-tl-date{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:1.2px;color:var(--cce-muted);padding:8px 4px 3px;margin-top:4px;}
.cct-tl-date:first-child{margin-top:0;padding-top:0;}
.cct-tl-row{display:flex;align-items:center;gap:10px;padding:7px 10px 7px 12px;background:rgba(255,255,255,.02);border-radius:8px;border-left:3px solid transparent;transition:all .18s;}
.cct-tl-row:hover{background:rgba(255,255,255,.05);transform:translateX(3px);}
.cct-tl-t{font-family:'SF Mono',monospace;font-size:11px;font-weight:700;color:var(--cce-accent);min-width:42px;}
.cct-tl-n{font-size:12px;font-weight:600;color:#e2e8f0;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.cct-tl-r{font-size:10px;color:var(--cce-muted);}
.cct-tl-link{color:var(--cce-muted)!important;font-size:12px;text-decoration:none!important;padding:2px 6px;border-radius:4px;transition:all .2s;}
.cct-tl-link:hover{color:#fff!important;background:rgba(99,102,241,.12);}
.cct-badge{display:inline-flex;align-items:center;font-size:8px;font-weight:800;letter-spacing:.8px;padding:1px 6px;border-radius:4px;text-transform:uppercase;}
.cct-bth{background:rgba(59,130,246,.2);color:#60a5fa;border:1px solid rgba(59,130,246,.25);}
.cct-blab{background:rgba(249,115,22,.2);color:#fb923c;border:1px solid rgba(249,115,22,.25);}
.cct-bauto{background:rgba(34,197,94,.2);color:#4ade80;border:1px solid rgba(34,197,94,.25);}
.cct-bo{background:rgba(139,92,246,.2);color:#a78bfa;border:1px solid rgba(139,92,246,.25);}
.cct-empty{display:flex;align-items:center;gap:10px;padding:18px;background:var(--cce-glass);border:1px solid var(--cce-border);border-radius:14px;color:var(--cce-muted);font-size:13px;backdrop-filter:blur(20px);}
  `;
  document.head.appendChild(s);
}

// ══════════════════════════════════════════════════
//  PORTAL HOME
// ══════════════════════════════════════════════════
function initHome() {
  applyCustomCSS(); applyPortalTheme();
  // Try to mount immediately; if #section-plannings doesn't exist yet, wait for it with a simple retry
  if (!mountHome()) {
    let retries = 0;
    const waitForSection = setInterval(() => {
      retries++;
      if (mountHome() || retries > 20) clearInterval(waitForSection);
    }, 500);
  }
}

function mountHome() {
  if (!enabled) return false;
  const section = document.querySelector('#section-plannings'); if (!section) return false;
  if (!document.getElementById('cce-agenda')) { injectCSS(); buildShell(section); }
  hideFC();
  const fc = document.querySelector('#planning.fc, .fc');
  if (fc && !agendaInterval) {
    // Initial load: sync and render once
    syncFromFC();
    chrome.storage.local.get(['agendaEvents'], res => renderFromEvents(res.agendaEvents || [], readFCTitle()));
    // Then update every 10 minutes only
    agendaInterval = setInterval(() => {
      if (!enabled || _mutationPaused) return;
      syncFromFC();
      chrome.storage.local.get(['agendaEvents'], res => renderFromEvents(res.agendaEvents || [], readFCTitle()));
    }, 10 * 60 * 1000);
  }
  return true;
}

// ── FC ──
function waitForFC() {
  const ok = () => { const fc = document.querySelector('.fc'); const has = fc && (fc.querySelector('.fc-list-event') || fc.querySelector('.fc-event') || fc.querySelector('.fc-timegrid-event')); if (has) { initAgendaPage(); return true; } return false; };
  if (ok()) return; fcObserver?.disconnect(); fcObserver = new MutationObserver(() => { if (ok()) { fcObserver.disconnect(); fcObserver = null; } });
  fcObserver.observe(document.body, { childList: true, subtree: true }); setTimeout(ok, 1000);
}

function initAgendaPage() {
  if (fcReady) return; fcReady = true; syncFCView();
  setTimeout(() => {
    if (!enabled) return; injectCSS(); hideFC(); buildShell(); refreshAgenda();
    // Replace MutationObserver with 10-minute interval to avoid scroll-breaking re-renders
    agendaObserver?.disconnect(); agendaObserver = null;
    clearInterval(agendaInterval);
    agendaInterval = setInterval(() => {
      if (!enabled || _mutationPaused) return;
      refreshAgenda();
    }, 10 * 60 * 1000); // 10 minutes
  }, 400);
}

function readFCEvents() {
  const fc = document.querySelector('.fc'); if (!fc) return []; const map = new Map();
  const add = (date, timeText, original, color = null) => {
    const m = timeText.match(/(\d{1,2})[:h](\d{2})\s*[-–]\s*(\d{1,2})[:h](\d{2})/);
    const name = extractName(original), parsed = parseTitle(original), setting = getSetting(name);
    if (setting?.visible === false) return;
    const key = `${date}|${timeText}|${name}`;
    if (map.has(key)) { const ex = map.get(key); if (parsed?.prof && ex.parsed?.prof && !ex.parsed.prof.includes(parsed.prof)) ex.parsed.prof += ', ' + parsed.prof; return; }
    map.set(key, { date, timeText, original, courseName: name, parsed, sh: m ? +m[1] : 0, sm: m ? +m[2] : 0, eh: m ? +m[3] : 0, em: m ? +m[4] : 0, color: setting?.color || color, link: getLink(name) });
  };
  const lt = fc.querySelector('.fc-list-table');
  if (lt) { let cd = null; lt.querySelectorAll('tr').forEach(tr => { if (tr.classList.contains('fc-list-day')) cd = tr.getAttribute('data-date'); else if (tr.classList.contains('fc-list-event')) { const t = tr.querySelector('.fc-list-event-time'), n = tr.querySelector('.fc-list-event-title a') || tr.querySelector('.fc-list-event-title'); if (t && n && cd) add(cd, t.textContent.trim(), n.textContent.replace(/\s+/g, ' ').trim()); } }); if (map.size) return [...map.values()]; }
  fc.querySelectorAll('.fc-day[data-date]').forEach(day => { const date = day.getAttribute('data-date'); day.querySelectorAll('.fc-event').forEach(ev => { const t = ev.querySelector('.fc-event-time'), n = ev.querySelector('.fc-event-title'); if (t && n) add(date, t.textContent.trim(), n.textContent.replace(/\s+/g, ' ').trim(), ev.style.backgroundColor || ev.style.borderColor); }); });
  if (map.size) return [...map.values()];
  fc.querySelectorAll('.fc-timegrid-col[data-date]').forEach(col => { const date = col.getAttribute('data-date'); col.querySelectorAll('.fc-timegrid-event').forEach(ev => { const t = ev.querySelector('.fc-event-title'), ti = ev.querySelector('.fc-event-time'); if (t) add(date, ti ? ti.textContent.trim() : '', t.textContent.replace(/\s+/g, ' ').trim(), ev.style.backgroundColor || ev.style.borderColor); }); });
  return [...map.values()];
}
function readFCTitle() { return document.querySelector('.fc .fc-toolbar-title')?.textContent.trim() || ''; }
function hideFC() { const fc = document.querySelector('.fc'); if (fc) { _mutationPaused = true; fc.style.cssText = 'position:fixed!important;top:-20000px!important;left:-20000px!important;opacity:0!important;pointer-events:none!important;width:100%!important;'; requestAnimationFrame(() => { _mutationPaused = false; }); } }
function syncFCView() { const fc = document.querySelector('.fc'); if (!fc) return; let t = '.fc-listWeek-button'; if (currentView === 'month') t = fc.querySelector('.fc-dayGridMonth-button') ? '.fc-dayGridMonth-button' : '.fc-listMonth-button'; else if (!fc.querySelector('.fc-listWeek-button') && fc.querySelector('.fc-timeGridWeek-button')) t = '.fc-timeGridWeek-button'; const btn = fc.querySelector(t); if (btn && !btn.classList.contains('fc-button-active')) btn.click(); }
function navFC(action) { const btn = document.querySelector(`.fc .fc-${action}-button`); if (btn) { btn.click(); scheduleRefresh(350); } }
function syncFromFC() { const events = readFCEvents(); if (!events.length) return; const title = readFCTitle(); const h = hash(JSON.stringify(events) + title); if (h === lastFCHash) return; lastFCHash = h; persistAgenda(events); }
function persistAgenda(events) { if (!events.length) return; const h = hash(JSON.stringify(events)); if (h === lastPersistHash) return; lastPersistHash = h; const today = new Date().toLocaleDateString('en-CA'); const ts = [...new Set(events.filter(e => e.date === today).map(e => e.courseName).filter(isValid))]; chrome.storage.local.set({ todayCourses: ts, agendaEvents: events }); }

// ── Shell + Views ──
function buildShell(mt = null) {
  if (document.getElementById('cce-agenda')) return;
  const fc = document.querySelector('.fc'), shell = document.createElement('div'); shell.id = 'cce-agenda';
  setH(shell, `<div class="cce-bar"><div class="cce-bar-nav"><button class="cce-btn cce-ico" id="cce-prev">‹</button><button class="cce-btn cce-today-btn" id="cce-today">Aujourd'hui</button><button class="cce-btn cce-ico" id="cce-next">›</button></div><h2 class="cce-bar-title" id="cce-title"></h2><div class="cce-views"><button class="cce-vbtn active" data-view="list">☰</button><button class="cce-vbtn" data-view="week">▦</button><button class="cce-vbtn" data-view="month">📅</button></div></div><div id="cce-banner"></div><div id="cce-events"></div>`);
  if (mt) mt.appendChild(shell); else if (fc?.parentNode) fc.parentNode.insertBefore(shell, fc); else document.body.appendChild(shell);
  document.getElementById('cce-prev').onclick = () => navFC('prev'); document.getElementById('cce-next').onclick = () => navFC('next'); document.getElementById('cce-today').onclick = () => navFC('today');
  shell.querySelectorAll('.cce-vbtn').forEach(btn => btn.onclick = () => { if (btn.dataset.view === currentView) return; currentView = btn.dataset.view; shell.querySelectorAll('.cce-vbtn').forEach(b => b.classList.toggle('active', b === btn)); syncFCView(); scheduleRefresh(80); });
}
function scheduleRefresh(d = 300) { clearTimeout(refreshTimer); refreshTimer = setTimeout(() => { if (!enabled) return; if (isHome) { syncFromFC(); chrome.storage.local.get(['agendaEvents'], res => renderFromEvents(res.agendaEvents || [], readFCTitle())); } else if (isAgenda) { if (!fcReady) waitForFC(); else refreshAgenda(); } }, Math.max(d, 300)); }
function refreshAgenda() { if (!enabled) return; const events = readFCEvents(), title = readFCTitle(); const h = hash(JSON.stringify(events) + title + currentView); if (h === lastRenderHash) return; lastRenderHash = h; _mutationPaused = true; const te = document.getElementById('cce-title'); if (te && title) te.textContent = title; events.forEach(ev => { if (isValid(ev.courseName)) knownCourses.add(ev.courseName); }); persistAgenda(events); render(events); requestAnimationFrame(() => { _mutationPaused = false; }); }
let lastHomeRenderHash = '';
function renderFromEvents(events = [], title = '') { if (!enabled || !document.getElementById('cce-agenda')) return; const h = hash(JSON.stringify(events) + title); if (h === lastHomeRenderHash) return; lastHomeRenderHash = h; _mutationPaused = true; const te = document.getElementById('cce-title'); if (te && title) te.textContent = title; events.forEach(ev => { if (isValid(ev?.courseName)) knownCourses.add(ev.courseName); }); render(events); requestAnimationFrame(() => { _mutationPaused = false; }); }
function render(ev) { buildBanner(ev); if (currentView === 'week') buildWeekView(ev); else if (currentView === 'month') buildMonthView(ev); else buildListView(ev); }
function detectConflicts(events) { const c = new Set(), bd = {}; events.forEach(ev => { (bd[ev.date] = bd[ev.date] || []).push(ev); }); for (const day of Object.values(bd)) for (let i = 0; i < day.length; i++)for (let j = i + 1; j < day.length; j++) { const [a, b] = [day[i], day[j]]; if (a.sh * 60 + a.sm < b.eh * 60 + b.em && b.sh * 60 + b.sm < a.eh * 60 + a.em) { c.add(a); c.add(b); } } return c; }

function buildBanner(events) {
  const el = document.getElementById('cce-banner'); if (!el) return; el.textContent = '';
  const now = Date.now(); const evts = events.map(ev => ({ ...ev, start: +new Date(`${ev.date}T${p2(ev.sh)}:${p2(ev.sm)}:00`), end: +new Date(`${ev.date}T${p2(ev.eh)}:${p2(ev.em)}:00`) })).sort((a, b) => a.start - b.start);
  let cur = null, nxt = null; for (const ev of evts) { if (ev.start <= now && ev.end > now) cur = ev; else if (ev.start > now && !nxt) nxt = ev; }
  el.appendChild(mBC(cur, 'En cours', 'cce-bc-cur')); el.appendChild(mBC(nxt, 'Suivant', 'cce-bc-nxt'));
}
function mBC(ev, label, cls) {
  const card = document.createElement('div'); card.className = `cce-bc ${cls}`;
  const lbl = document.createElement('div'); lbl.className = 'cce-bc-lbl'; if (cls === 'cce-bc-cur') { const d = document.createElement('span'); d.className = 'cce-pulse'; lbl.appendChild(d); } lbl.appendChild(document.createTextNode(label)); card.appendChild(lbl);
  if (!ev) { const e = document.createElement('div'); e.className = 'cce-bc-empty'; e.textContent = 'Aucun cours'; card.appendChild(e); return card; }
  const p = ev.parsed || {}, t = `${p2(ev.sh)}:${p2(ev.sm)} – ${p2(ev.eh)}:${p2(ev.em)}`;
  const n = document.createElement('div'); n.className = 'cce-bc-name'; n.appendChild(mkBadge(p.type)); n.appendChild(document.createTextNode(' ' + ev.courseName)); card.appendChild(n);
  const m = document.createElement('div'); m.className = 'cce-bc-meta'; setH(m, `<span>🕐 ${t}</span><span>📍 ${p.room || '—'}</span>${p.prof ? `<span>👤 ${p.prof}</span>` : ''}`); card.appendChild(m);
  if (ev.link) { const a = document.createElement('a'); a.href = ev.link; a.target = '_blank'; a.className = 'cce-bc-link'; a.textContent = '🔗 Ouvrir'; card.appendChild(a); }
  return card;
}

function buildListView(events) {
  const ct = document.getElementById('cce-events'); if (!ct) return; ct.textContent = '';
  if (!events.length) { setH(ct, '<div class="cce-empty">Aucun événement — navigue sur le calendrier</div>'); return; }
  const cf = detectConflicts(events), ts = new Date().toISOString().slice(0, 10), gr = {};
  events.forEach(ev => { (gr[ev.date] = gr[ev.date] || []).push(ev); });
  for (const date of Object.keys(gr).sort()) {
    const d = new Date(`${date}T12:00:00`), iT = date === ts;
    const dd = document.createElement('div'); dd.className = `cce-day${iT ? ' is-today' : ''}`;
    const dh = document.createElement('div'); dh.className = 'cce-day-head';
    setH(dh, `<span class="cce-day-name">${cap(d.toLocaleDateString('fr-FR', { weekday: 'long' }))}</span>${iT ? '<span class="cce-today-pill">Aujourd\'hui</span>' : ''}<span class="cce-day-date">${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>`);
    dd.appendChild(dh);
    for (const ev of gr[date]) {
      const s = getSetting(ev.courseName), col = s?.color || null, p = ev.parsed || {}, iC = cf.has(ev);
      const card = document.createElement('div'); card.className = `cce-card${iC ? ' conflict' : ''}`; card.dataset.original = ev.original; card.dataset.dateLabel = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      card.style.background = col ? rgba(col, 0.1) : 'rgba(255,255,255,.025)'; card.style.borderLeft = `3px solid ${col || 'rgba(255,255,255,.08)'}`;
      const te = document.createElement('div'); te.className = `cce-time${iC ? ' conflict' : ''}`; te.textContent = (iC ? '⚠ ' : '') + ev.timeText;
      const dot = document.createElement('div'); dot.className = 'cce-dot'; if (col) { dot.style.background = col; dot.style.boxShadow = `0 0 8px ${rgba(col, 0.4)}`; }
      const body = document.createElement('div'); body.className = 'cce-body'; body.appendChild(mkBadge(p.type));
      if (p.room) { const r = document.createElement('span'); r.className = 'cce-room'; r.textContent = p.room; const sep = document.createElement('span'); sep.className = 'cce-sep'; sep.textContent = '·'; body.appendChild(r); body.appendChild(sep); }
      const nm = document.createElement('span'); nm.className = 'cce-name'; nm.textContent = ev.courseName; body.appendChild(nm);
      if (p.prof) { const pr = document.createElement('span'); pr.className = 'cce-prof'; pr.textContent = `— ${p.prof}`; body.appendChild(pr); }
      card.append(te, dot, body); if (ev.link) { const a = document.createElement('a'); a.href = ev.link; a.target = '_blank'; a.className = 'cce-link'; a.textContent = '🔗'; card.appendChild(a); }
      card.addEventListener('click', e => { if (!e.target.closest('.cce-link')) openModal(card); });
      dd.appendChild(card);
    }
    ct.appendChild(dd);
  }
}

const GS = 7, GE = 20, HPX = 64;
function getWeekDates(events) { if (!events.length) return []; const first = new Date(`${events[0].date}T12:00:00`), dow = first.getDay(), mon = new Date(first); mon.setDate(first.getDate() - (dow === 0 ? 6 : dow - 1)); return Array.from({ length: 6 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d.toISOString().slice(0, 10); }); }
function layoutDay(de) { if (!de.length) return de; const s = [...de].sort((a, b) => a.sh * 60 + a.sm - b.sh * 60 - b.sm); const gs = []; let cur = [s[0]], ce = s[0].eh * 60 + s[0].em; for (let i = 1; i < s.length; i++) { const eS = s[i].sh * 60 + s[i].sm; if (eS < ce) { cur.push(s[i]); ce = Math.max(ce, s[i].eh * 60 + s[i].em); } else { gs.push(cur); cur = [s[i]]; ce = s[i].eh * 60 + s[i].em; } } gs.push(cur); gs.forEach(g => { const cols = []; g.forEach(ev => { const eS = ev.sh * 60 + ev.sm; let p = false; for (let c = 0; c < cols.length; c++) { if (eS >= cols[c]) { cols[c] = ev.eh * 60 + ev.em; ev._col = c; p = true; break; } } if (!p) { ev._col = cols.length; cols.push(ev.eh * 60 + ev.em); } }); g.forEach(ev => ev._cols = cols.length); }); return s; }

function buildWeekView(events) {
  const ct = document.getElementById('cce-events'); if (!ct) return;
  const dates = getWeekDates(events); if (!dates.length) { setH(ct, '<div class="cce-empty">Aucun événement</div>'); return; }
  ct.textContent = ''; const bd = {}; events.forEach(ev => { (bd[ev.date] = bd[ev.date] || []).push(ev); });
  const cf = detectConflicts(events), ts = new Date().toISOString().slice(0, 10), gH = (GE - GS) * HPX;
  const now = new Date(), nt = ((now.getHours() - GS) * 60 + now.getMinutes()) * (HPX / 60), sn = now.getHours() >= GS && now.getHours() < GE;
  const wk = document.createElement('div'); wk.className = 'cce-week';
  const hd = document.createElement('div'); hd.className = 'cce-wk-head'; setH(hd, '<div class="cce-wk-gutter"></div>');
  dates.forEach(d => { const dt = new Date(`${d}T12:00:00`), iT = d === ts; addH(hd, `<div class="cce-wk-dh${iT ? ' today' : ''}"><span class="cce-wk-dn">${cap(dt.toLocaleDateString('fr-FR', { weekday: 'short' }))}</span><span class="cce-wk-dd${iT ? ' today-n' : ''}">${dt.getDate()}</span></div>`); });
  wk.appendChild(hd); const body = document.createElement('div'); body.className = 'cce-wk-body';
  const times = document.createElement('div'); times.className = 'cce-wk-times';
  for (let h = GS; h < GE; h++) { const l = document.createElement('div'); l.className = 'cce-wt'; l.style.height = `${HPX}px`; l.textContent = `${p2(h)}:00`; times.appendChild(l); }
  body.appendChild(times); const grid = document.createElement('div'); grid.className = 'cce-wk-grid'; grid.style.height = `${gH}px`;
  for (let h = GS; h < GE; h++) { const l = document.createElement('div'); l.className = 'cce-wk-line'; l.style.top = `${(h - GS) * HPX}px`; grid.appendChild(l); }
  dates.forEach(d => {
    const iT = d === ts, col = document.createElement('div'); col.className = `cce-wk-col${iT ? ' today' : ''}`;
    if (iT && sn) { const nl = document.createElement('div'); nl.className = 'cce-now'; nl.style.top = `${nt}px`; setH(nl, '<div class="cce-now-dot"></div>'); col.appendChild(nl); }
    layoutDay(bd[d] || []).forEach(ev => {
      const tm = (ev.sh - GS) * 60 + ev.sm, dm = (ev.eh - ev.sh) * 60 + (ev.em - ev.sm), top = tm * (HPX / 60), height = Math.max(dm * (HPX / 60), 20);
      const color = getSetting(ev.courseName)?.color || '#6366f1', cs = ev._cols || 1, c = ev._col || 0, p = ev.parsed || {};
      const el = document.createElement('div'); el.className = `cce-we${cf.has(ev) ? ' conflict' : ''}`;
      el.dataset.original = ev.original; el.dataset.dateLabel = new Date(`${d}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      el.style.cssText = `top:${top}px;height:${height}px;left:${c * 100 / cs}%;width:calc(${100 / cs}% - 3px);background:${rgba(color, 0.22)};border-left:3px solid ${color}`;
      setH(el, `<div class="cce-we-time">${p2(ev.sh)}:${p2(ev.sm)}–${p2(ev.eh)}:${p2(ev.em)}</div><div class="cce-we-name">${ev.courseName}</div>${height > 50 ? `<div class="cce-we-room">${p.room || ''}</div>` : ''}${height > 70 && p.prof ? `<div class="cce-we-prof">${p.prof}</div>` : ''}`);
      el.addEventListener('click', () => openModal(el)); col.appendChild(el);
    });
    grid.appendChild(col);
  });
  body.appendChild(grid); wk.appendChild(body); ct.appendChild(wk);
}

function buildMonthView(events) {
  const ct = document.getElementById('cce-events'); if (!ct) return; ct.textContent = '';
  const ref = events.length ? new Date(`${events[0].date}T12:00:00`) : new Date();
  const [y, m] = [ref.getFullYear(), ref.getMonth()], ts = new Date().toISOString().slice(0, 10);
  const first = new Date(y, m, 1); let sd = first.getDay() - 1; if (sd < 0) sd = 6;
  const days = new Date(y, m + 1, 0).getDate(), bd = {}; events.forEach(ev => { (bd[ev.date] = bd[ev.date] || []).push(ev); });
  const cf = detectConflicts(events), wrap = document.createElement('div'); wrap.className = 'cce-month';
  setH(wrap, `<div class="cce-month-lbl">${cap(first.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }))}</div><div class="cce-month-head">${['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => `<div>${d}</div>`).join('')}</div><div class="cce-month-grid" id="cce-mgrid"></div><div class="cce-month-detail" id="cce-mdetail"></div>`);
  ct.appendChild(wrap); const mg = document.getElementById('cce-mgrid');
  for (let i = 0; i < sd; i++) { const e = document.createElement('div'); e.className = 'cce-mc empty'; mg.appendChild(e); }
  for (let day = 1; day <= days; day++) {
    const ds = `${y}-${p2(m + 1)}-${p2(day)}`, iT = ds === ts, de = bd[ds] || [], hC = de.some(ev => cf.has(ev));
    const cols = [...new Set(de.map(ev => getSetting(ev.courseName)?.color || '#6366f1'))];
    const cell = document.createElement('div'); cell.className = `cce-mc${iT ? ' today' : ''}${de.length ? ' has-evs' : ''}${hC ? ' conflict' : ''}`; cell.dataset.date = ds;
    setH(cell, `<div class="cce-mc-n${iT ? ' tnow' : ''}">${day}</div>`);
    if (cols.length) { const d = document.createElement('div'); d.className = 'cce-mc-dots'; cols.slice(0, 4).forEach(c => { const dot = document.createElement('div'); dot.className = 'cce-mc-dot'; dot.style.cssText = `background:${c};box-shadow:0 0 6px ${rgba(c, 0.5)}`; d.appendChild(dot); }); cell.appendChild(d); }
    if (de.length) { const cnt = document.createElement('div'); cnt.className = 'cce-mc-cnt'; cnt.textContent = `${de.length} cours`; cell.appendChild(cnt); }
    if (de.length) {
      cell.addEventListener('click', () => {
        const det = document.getElementById('cce-mdetail'); if (!det) return;
        const ia = det.dataset.active === ds; document.querySelectorAll('.cce-mc.sel').forEach(c => c.classList.remove('sel'));
        if (ia) { det.textContent = ''; det.dataset.active = ''; return; }
        cell.classList.add('sel'); det.dataset.active = ds;
        const dl = new Date(`${ds}T12:00:00`), dlabel = dl.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
        setH(det, `<div class="cce-md-head"><span class="cce-md-day">${cap(dl.toLocaleDateString('fr-FR', { weekday: 'long' }))}</span><span class="cce-md-date">${dlabel}</span></div>`);
        de.forEach(ev => {
          const color = getSetting(ev.courseName)?.color || '#6366f1', p = ev.parsed || {}, iC = cf.has(ev);
          const card = document.createElement('div'); card.className = `cce-card${iC ? ' conflict' : ''}`; card.dataset.original = ev.original; card.dataset.dateLabel = dlabel;
          card.style.background = rgba(color, 0.1); card.style.borderLeft = `3px solid ${color}`;
          const te = document.createElement('div'); te.className = `cce-time${iC ? ' conflict' : ''}`; te.textContent = (iC ? '⚠ ' : '') + ev.timeText;
          const dot = document.createElement('div'); dot.className = 'cce-dot'; dot.style.cssText = `background:${color};box-shadow:0 0 8px ${rgba(color, 0.4)}`;
          const body = document.createElement('div'); body.className = 'cce-body'; body.appendChild(mkBadge(p.type));
          if (p.room) { const r = document.createElement('span'); r.className = 'cce-room'; r.textContent = p.room; const sep = document.createElement('span'); sep.className = 'cce-sep'; sep.textContent = '·'; body.appendChild(r); body.appendChild(sep); }
          const nm = document.createElement('span'); nm.className = 'cce-name'; nm.textContent = ev.courseName; body.appendChild(nm);
          if (p.prof) { const pr = document.createElement('span'); pr.className = 'cce-prof'; pr.textContent = `— ${p.prof}`; body.appendChild(pr); }
          card.append(te, dot, body); if (ev.link) { const a = document.createElement('a'); a.href = ev.link; a.target = '_blank'; a.className = 'cce-link'; a.textContent = '🔗'; card.appendChild(a); }
          card.addEventListener('click', e => { if (!e.target.closest('.cce-link')) openModal(card); });
          det.appendChild(card);
        });
        det.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
    mg.appendChild(cell);
  }
  const tot = sd + days, rem = tot % 7; if (rem > 0) for (let i = 0; i < 7 - rem; i++) { const e = document.createElement('div'); e.className = 'cce-mc empty'; mg.appendChild(e); }
}

function openModal(card) {
  const orig = card.dataset.original, dl = card.dataset.dateLabel, p = parseTitle(orig); if (!p) return;
  const name = extractName(orig), link = getLink(name);
  const time = card.querySelector('.cce-time,.cce-we-time')?.innerText?.replace('⚠ ', '') || '';
  const isDist = /A DISTANCE/i.test(orig), color = getSetting(name)?.color || '#6366f1';
  const tl = { th: '📖 Théorie', lab: '🔬 Labo', auto: '📝 Autonomie', other: '📌 Cours' }[p.type] || '📌 Cours';
  const tc = { th: 'type-th', lab: 'type-lab', auto: 'type-auto', other: 'type-other' }[p.type] || 'type-other';
  let modal = document.getElementById('cce-modal');
  if (!modal) { modal = document.createElement('dialog'); modal.id = 'cce-modal'; document.body.appendChild(modal); modal.addEventListener('click', e => { if (e.target === modal) modal.close(); }); }
  setH(modal, `<div class="cce-m"><button class="cce-m-x" id="cce-m-close">✕</button><div class="cce-m-hero" style="border-left:4px solid ${color}"><div class="cce-m-room${isDist ? ' dist' : ''}">${isDist ? '🌐 À distance' : (p.room || '—')}</div><div><div class="cce-m-name">${p.name}</div>${p.prof ? `<div class="cce-m-prof">👤 ${p.prof}</div>` : ''}</div></div><div class="cce-m-badges"><span class="cce-m-badge ${tc}">${tl}</span></div><div class="cce-m-grid"><div class="cce-m-cell"><span class="cce-m-lbl">📅 Date</span><span class="cce-m-val">${dl}</span></div><div class="cce-m-cell"><span class="cce-m-lbl">🕐 Horaire</span><span class="cce-m-val">${time}</span></div><div class="cce-m-cell wide"><span class="cce-m-lbl">🏫 Salle</span><span class="cce-m-val">${p.room || '—'}</span></div></div>${link ? `<a href="${link}" target="_blank" class="cce-m-action">🔗 Ouvrir le cours</a>` : `<div class="cce-m-nolink">Aucun lien — ajoutez-le dans l'extension</div>`}</div>`);
  modal.querySelector('#cce-m-close').onclick = () => modal.close(); modal.showModal();
}

// ─── Helpers ───
function p2(n) { return String(n).padStart(2, '0'); }
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function hash(str) { let h = 0x811c9dc5; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(16); }
function rgba(hex, a) { if (!/^#([A-Fa-f0-9]{3,6})$/.test(hex)) return hex; let c = hex.slice(1); if (c.length === 3) c = c.split('').map(x => x + x).join(''); const [r, g, b] = [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)]; return `rgba(${r},${g},${b},${a})`; }
function mkBadge(type) { const b = document.createElement('span'); const m = { th: ['TH', 'cce-badge-th'], lab: ['LAB', 'cce-badge-lab'], auto: ['AUTO', 'cce-badge-auto'] }; const [text, cls] = m[type] || ['—', 'cce-badge-other']; b.className = `cce-badge ${cls}`; b.textContent = text; return b; }

function injectCSS() {
  if (document.getElementById('cce-css')) return;
  const s = document.createElement('style'); s.id = 'cce-css';
  s.textContent = `
#cce-agenda,#cce-agenda *{box-sizing:border-box}
#cce-agenda{color:#e2e8f0;font-family:'Sora','Inter',system-ui,sans-serif;max-width:1080px;margin:0 auto;padding:24px 16px}
.cce-bar{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;gap:12px;flex-wrap:wrap}
.cce-bar-nav{display:flex;align-items:center;gap:6px}
.cce-btn{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);color:#94a3b8;border-radius:10px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;font-family:inherit}
.cce-btn:hover{background:rgba(99,102,241,.15);color:#c7d2fe;border-color:rgba(99,102,241,.3)}
.cce-ico{width:36px;padding:8px 0;text-align:center;font-size:17px}
.cce-today-btn{background:linear-gradient(135deg,#6366f1,#4f46e5);border-color:#6366f1;color:#fff;box-shadow:0 2px 10px rgba(99,102,241,.3)}
.cce-today-btn:hover{transform:translateY(-1px);box-shadow:0 4px 18px rgba(99,102,241,.45)}
.cce-bar-title{font-size:20px;font-weight:800;letter-spacing:-.5px;color:#f1f5f9;margin:0}
.cce-views{display:flex;gap:2px;background:rgba(255,255,255,.04);border-radius:10px;padding:3px}
.cce-vbtn{background:transparent;border:none;color:#64748b;font-size:14px;padding:6px 12px;border-radius:7px;cursor:pointer;font-family:inherit;transition:all .2s}
.cce-vbtn:hover{color:#94a3b8}.cce-vbtn.active{background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;box-shadow:0 2px 8px rgba(99,102,241,.3)}
#cce-banner{display:flex;gap:12px;margin-bottom:28px}
.cce-bc{flex:1;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06);border-radius:14px;padding:14px 16px;transition:all .25s;min-width:0}
.cce-bc:hover{border-color:rgba(99,102,241,.2)}
.cce-bc-cur{border-color:rgba(99,102,241,.22);background:rgba(99,102,241,.04);border-left:3px solid #6366f1}
.cce-bc-nxt{border-color:rgba(139,92,246,.15);background:rgba(139,92,246,.03);border-left:3px solid #8b5cf6}
.cce-bc-lbl{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;display:flex;align-items:center;gap:6px}
.cce-bc-cur .cce-bc-lbl{color:#818cf8}.cce-bc-nxt .cce-bc-lbl{color:#a78bfa}
.cce-pulse{width:7px;height:7px;background:#6366f1;border-radius:50%;flex-shrink:0;animation:cce-pulse 2s ease-in-out infinite}
@keyframes cce-pulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(99,102,241,.5)}50%{opacity:.5;box-shadow:0 0 0 8px rgba(99,102,241,0)}}
.cce-bc-name{font-size:14px;font-weight:700;color:#f1f5f9;margin-bottom:6px;line-height:1.3}
.cce-bc-meta{font-size:11px;color:#94a3b8;display:flex;flex-wrap:wrap;gap:4px 10px;margin-bottom:8px}
.cce-bc-link{display:inline-flex;align-items:center;gap:5px;padding:6px 14px;font-size:11px;font-weight:600;color:#fff!important;background:linear-gradient(135deg,#6366f1,#4f46e5);border-radius:7px;text-decoration:none!important;box-shadow:0 2px 8px rgba(99,102,241,.2);transition:all .2s}
.cce-bc-link:hover{box-shadow:0 4px 18px rgba(99,102,241,.4);transform:translateY(-1px)}
.cce-bc-empty{color:#334155;font-size:12px;font-style:italic;padding:6px 0}
.cce-day{margin-bottom:20px}
.cce-day-head{display:flex;align-items:center;gap:10px;padding:8px 4px 8px 14px;border-bottom:1px solid rgba(255,255,255,.06);margin-bottom:8px;position:relative}
.cce-day-head::before{content:'';position:absolute;left:0;top:6px;bottom:6px;width:3px;background:linear-gradient(#6366f1,#818cf8);border-radius:2px}
.cce-day.is-today .cce-day-head::before{background:linear-gradient(#22c55e,#4ade80);box-shadow:0 0 8px rgba(34,197,94,.4)}
.cce-day-name{font-size:14px;font-weight:700;color:#f1f5f9}
.cce-day-date{font-size:11px;color:#475569;margin-left:auto}
.cce-today-pill{font-size:9px;font-weight:800;color:#4ade80;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.2);padding:2px 8px;border-radius:20px;text-transform:uppercase}
.cce-card{display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:10px;margin-bottom:4px;cursor:pointer;transition:all .2s;border:1px solid transparent}
.cce-card:hover{transform:translateX(4px);box-shadow:0 4px 16px rgba(0,0,0,.15);border-color:rgba(99,102,241,.15)}
.cce-time{min-width:108px;font-size:12px;font-weight:700;font-family:'SF Mono','Fira Code',monospace;color:#818cf8;letter-spacing:.3px}
.cce-dot{width:9px;height:9px;border-radius:50%;flex-shrink:0;background:#6366f1}
.cce-body{flex:1;font-size:12.5px;color:#e2e8f0;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.cce-room{font-weight:700;color:#c7d2fe}.cce-sep{color:#334155}.cce-name{font-weight:500}.cce-prof{color:#64748b;font-style:italic}
.cce-link{text-decoration:none;font-size:15px;padding:4px 8px;border-radius:6px;transition:all .2s;flex-shrink:0}
.cce-link:hover{background:rgba(99,102,241,.12);transform:scale(1.15)}
.cce-empty{text-align:center;color:#334155;font-size:13px;padding:60px 0;font-style:italic}
.cce-card.conflict{border-color:rgba(239,68,68,.3)!important}.cce-time.conflict{color:#ef4444!important;font-weight:800!important}
.cce-badge{display:inline-flex;align-items:center;font-size:9px;font-weight:800;letter-spacing:.8px;padding:2px 6px;border-radius:4px;text-transform:uppercase;flex-shrink:0}
.cce-badge-th{background:rgba(59,130,246,.2);color:#60a5fa;border:1px solid rgba(59,130,246,.25)}
.cce-badge-lab{background:rgba(249,115,22,.2);color:#fb923c;border:1px solid rgba(249,115,22,.25)}
.cce-badge-auto{background:rgba(34,197,94,.2);color:#4ade80;border:1px solid rgba(34,197,94,.25)}
.cce-badge-other{background:rgba(139,92,246,.2);color:#a78bfa;border:1px solid rgba(139,92,246,.25)}
.cce-week{border:1px solid rgba(255,255,255,.06);border-radius:16px;overflow:hidden;background:rgba(255,255,255,.012)}
.cce-wk-head{display:flex;border-bottom:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.025)}
.cce-wk-gutter{width:52px;flex-shrink:0;border-right:1px solid rgba(255,255,255,.06)}
.cce-wk-dh{flex:1;text-align:center;padding:10px 4px;border-right:1px solid rgba(255,255,255,.04);display:flex;flex-direction:column;align-items:center;gap:4px}
.cce-wk-dh:last-child{border-right:none}.cce-wk-dh.today{background:rgba(99,102,241,.04)}
.cce-wk-dn{font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px}
.cce-wk-dd{font-size:17px;font-weight:800;color:#94a3b8;width:34px;height:34px;display:flex;align-items:center;justify-content:center;border-radius:9px}
.today-n{background:linear-gradient(135deg,#6366f1,#4f46e5)!important;color:#fff!important;box-shadow:0 2px 10px rgba(99,102,241,.3)}
.cce-wk-body{display:flex;position:relative;overflow-y:auto;max-height:72vh}
.cce-wk-times{width:52px;flex-shrink:0;border-right:1px solid rgba(255,255,255,.06)}
.cce-wt{height:64px;padding:0 8px;font-size:10px;font-weight:600;color:#475569;font-family:'SF Mono',monospace;display:flex;align-items:flex-start;justify-content:flex-end;transform:translateY(-6px)}
.cce-wk-grid{flex:1;display:flex;position:relative}
.cce-wk-line{position:absolute;left:0;right:0;height:1px;background:rgba(255,255,255,.04);pointer-events:none}
.cce-wk-col{flex:1;position:relative;border-right:1px solid rgba(255,255,255,.04)}
.cce-wk-col:last-child{border-right:none}.cce-wk-col.today{background:rgba(99,102,241,.02)}
.cce-now{position:absolute;left:0;right:0;height:2px;background:#ef4444;z-index:10;pointer-events:none}
.cce-now-dot{position:absolute;left:-4px;top:-4px;width:10px;height:10px;border-radius:50%;background:#ef4444;box-shadow:0 0 8px rgba(239,68,68,.5)}
.cce-we{position:absolute;border-radius:7px;padding:4px 6px;cursor:pointer;overflow:hidden;z-index:1;transition:all .15s;border:1px solid transparent}
.cce-we:hover{z-index:5;transform:scale(1.02);box-shadow:0 4px 14px rgba(0,0,0,.3);border-color:rgba(255,255,255,.12)}
.cce-we.conflict{border-color:rgba(239,68,68,.4)!important}
.cce-we-time{font-size:10px;font-weight:700;color:rgba(255,255,255,.85);font-family:'SF Mono',monospace;margin-bottom:2px}
.cce-we-name{font-size:11px;font-weight:700;color:#fff;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cce-we-room{font-size:10px;color:rgba(255,255,255,.65);margin-top:2px}
.cce-we-prof{font-size:9px;color:rgba(255,255,255,.45);font-style:italic}
.cce-month{border:1px solid rgba(255,255,255,.06);border-radius:16px;overflow:hidden;background:rgba(255,255,255,.012)}
.cce-month-lbl{text-align:center;font-size:16px;font-weight:800;color:#f1f5f9;padding:14px 0 6px;letter-spacing:-.3px}
.cce-month-head{display:grid;grid-template-columns:repeat(7,1fr);border-bottom:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.025)}
.cce-month-head div{text-align:center;padding:8px 0;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px}
.cce-month-grid{display:grid;grid-template-columns:repeat(7,1fr)}
.cce-mc{min-height:72px;border-right:1px solid rgba(255,255,255,.04);border-bottom:1px solid rgba(255,255,255,.04);padding:6px;display:flex;flex-direction:column;gap:3px;transition:all .18s;position:relative}
.cce-mc:nth-child(7n){border-right:none}.cce-mc.empty{background:rgba(0,0,0,.08);cursor:default}
.cce-mc.has-evs{cursor:pointer}.cce-mc.has-evs:hover{background:rgba(99,102,241,.06)}
.cce-mc.today{background:rgba(99,102,241,.05)}.cce-mc.sel{background:rgba(99,102,241,.1)!important;box-shadow:inset 0 0 0 2px rgba(99,102,241,.35)}
.cce-mc.conflict{box-shadow:inset 0 -2px 0 0 rgba(239,68,68,.5)}
.cce-mc-n{font-size:13px;font-weight:700;color:#94a3b8;width:26px;height:26px;display:flex;align-items:center;justify-content:center;border-radius:7px}
.tnow{background:linear-gradient(135deg,#6366f1,#4f46e5)!important;color:#fff!important;box-shadow:0 2px 8px rgba(99,102,241,.3)}
.cce-mc-dots{display:flex;gap:3px;flex-wrap:wrap}.cce-mc-dot{width:7px;height:7px;border-radius:50%}
.cce-mc-cnt{font-size:9px;font-weight:600;color:#64748b;margin-top:auto}
.cce-month-detail{padding:0;overflow:hidden;transition:all .3s ease}
.cce-month-detail:not(:empty){padding:14px;border-top:1px solid rgba(99,102,241,.15);background:rgba(99,102,241,.02)}
.cce-md-head{display:flex;align-items:center;gap:10px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,.06)}
.cce-md-day{font-size:14px;font-weight:700;color:#f1f5f9}.cce-md-date{font-size:11px;color:#64748b;margin-left:auto}
#cce-modal{border:none;background:transparent;padding:0;max-width:500px;width:90vw}
#cce-modal::backdrop{background:rgba(0,0,0,.65);backdrop-filter:blur(5px)}
.cce-m{background:linear-gradient(140deg,#0d1424,#1a2035);border:1px solid rgba(99,102,241,.2);border-radius:18px;padding:22px;position:relative;box-shadow:0 30px 70px rgba(0,0,0,.6);color:#e2e8f0}
.cce-m-x{position:absolute;top:14px;right:14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#94a3b8;width:30px;height:30px;border-radius:8px;font-size:13px;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center}
.cce-m-x:hover{background:rgba(239,68,68,.2);color:#f87171;border-color:rgba(239,68,68,.3)}
.cce-m-hero{display:flex;align-items:center;gap:14px;margin-bottom:14px;padding:14px;background:rgba(255,255,255,.025);border-radius:12px}
.cce-m-room{font-size:13px;font-weight:800;color:#a5b4fc;min-width:80px}.cce-m-room.dist{color:#38bdf8}
.cce-m-name{font-size:16px;font-weight:700;color:#f1f5f9;margin-bottom:3px}.cce-m-prof{font-size:12px;color:#94a3b8;font-style:italic}
.cce-m-badges{display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap}
.cce-m-badge{font-size:10px;font-weight:700;padding:4px 10px;border-radius:6px;letter-spacing:.5px;text-transform:uppercase}
.cce-m-badge.type-th{background:rgba(59,130,246,.15);color:#60a5fa;border:1px solid rgba(59,130,246,.25)}
.cce-m-badge.type-lab{background:rgba(249,115,22,.15);color:#fb923c;border:1px solid rgba(249,115,22,.25)}
.cce-m-badge.type-auto{background:rgba(34,197,94,.15);color:#4ade80;border:1px solid rgba(34,197,94,.25)}
.cce-m-badge.type-other{background:rgba(139,92,246,.15);color:#a78bfa;border:1px solid rgba(139,92,246,.25)}
.cce-m-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px}
.cce-m-cell{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:3px}
.cce-m-cell.wide{grid-column:1/-1}
.cce-m-lbl{font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#64748b}
.cce-m-val{font-size:13px;font-weight:500;color:#e2e8f0}
.cce-m-action{display:block;width:100%;padding:12px;text-align:center;font-size:13px;font-weight:600;color:#fff!important;background:linear-gradient(135deg,#6366f1,#4f46e5);border-radius:10px;cursor:pointer;text-decoration:none!important;box-shadow:0 2px 10px rgba(99,102,241,.2);transition:all .2s}
.cce-m-action:hover{box-shadow:0 6px 22px rgba(99,102,241,.45);transform:translateY(-1px)}
.cce-m-nolink{text-align:center;font-size:11px;color:#334155;font-style:italic;padding:8px}
  `;
  document.head.appendChild(s);
}
