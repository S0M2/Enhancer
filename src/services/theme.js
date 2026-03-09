/**
 * Theme Service
 * Manages theme CSS generation and application
 */

/**
 * Build Portal theme CSS dynamically
 * @param {Object} theme - Theme object with colors
 * @param {string} accent - Accent color
 * @returns {string}
 */
export function buildPortalThemeCSS(theme, accent) {
  const colors = theme.colors;
  const isLight = colors.bg === '#f8f9ff' || colors.text.startsWith('#1');
  const textRGB = isLight ? '0,0,0' : '255,255,255';

  return `
/* ═══ PORTAL THEME: ${theme.name} ═══ */
:root {
  --portal-bg: ${colors.bg};
  --portal-bg1: ${colors.bg1};
  --portal-bg2: ${colors.bg2};
  --portal-bg3: ${colors.bg3};
  --portal-text: ${colors.text};
  --portal-muted: ${colors.muted};
  --portal-accent: ${accent};
}

/* Base */
html, body { 
  background: var(--portal-bg) !important;
  color: var(--portal-text) !important;
}

/* Main containers */
main, #main, [role="main"], .container, .container-fluid {
  background: var(--portal-bg) !important;
  color: var(--portal-text) !important;
}

/* Cards & sections */
.card, .well, .panel, .box, .section {
  background: linear-gradient(135deg, var(--portal-bg2), var(--portal-bg3)) !important;
  border: 1px solid rgba(${textRGB}, 0.12) !important;
  border-radius: 14px !important;
  color: var(--portal-text) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
}

.card:hover, .well:hover, .panel:hover, .box:hover, .section:hover {
  transform: translateY(-4px) !important;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.25) !important;
  border-color: var(--portal-accent) !important;
}

.card-body, .well-body, .panel-body {
  background: transparent !important;
  color: var(--portal-text) !important;
}

/* Text elements */
h1, h2, h3, h4, h5, h6 {
  color: var(--portal-text) !important;
}

p, span, div, label {
  color: var(--portal-text) !important;
}

a {
  color: var(--portal-accent) !important;
  transition: all 0.2s ease !important;
}

a:hover {
  opacity: 0.8;
}

/* Bookmarks */
.bookmark {
  background: linear-gradient(135deg, var(--portal-bg2), var(--portal-bg3)) !important;
  border: 1px solid rgba(${textRGB}, 0.12) !important;
  border-radius: 12px !important;
  color: var(--portal-text) !important;
  padding: 16px !important;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
}

.bookmark-title {
  color: var(--portal-text) !important;
  font-weight: 700 !important;
}

.bookmark:hover {
  background: linear-gradient(135deg, var(--portal-accent), var(--portal-bg2)) !important;
  border-color: var(--portal-accent) !important;
  transform: translateY(-3px) scale(1.02) !important;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2) !important;
}

/* Announcements */
.announcement {
  background: var(--portal-bg2) !important;
  border-color: rgba(${textRGB}, 0.1) !important;
  color: var(--portal-text) !important;
}

.announcement--high {
  border-left-color: #ef4444 !important;
  background: rgba(239, 68, 68, 0.1) !important;
}

/* Navbar */
.navbar, nav, header, .fixed-top {
  background: linear-gradient(135deg, var(--portal-bg2), var(--portal-bg1)) !important;
  opacity: 0.99;
  backdrop-filter: blur(16px) !important;
  -webkit-backdrop-filter: blur(16px) !important;
  border-bottom: 1px solid rgba(${textRGB}, 0.12) !important;
  color: var(--portal-text) !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2) !important;
  transition: all 0.3s ease !important;
}

.navbar-brand, .site-name {
  color: var(--portal-text) !important;
  font-weight: 800 !important;
  letter-spacing: -0.5px !important;
  transition: all 0.2s ease !important;
}

.navbar-brand:hover, .site-name:hover {
  transform: scale(1.02) !important;
}

.nav-link {
  color: var(--portal-muted) !important;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
  font-weight: 600 !important;
  padding: 8px 16px !important;
  border-radius: 8px !important;
}

.nav-link:hover, .nav-link.active {
  color: var(--portal-accent) !important;
  background: rgba(var(--portal-accent-rgb, 99, 102, 241), 0.1) !important;
  transform: translateY(-2px) !important;
}

/* Inputs & forms */
input, textarea, select {
  background: var(--portal-bg2) !important;
  color: var(--portal-text) !important;
  border-color: rgba(${textRGB}, 0.15) !important;
}

input:focus, textarea:focus, select:focus {
  border-color: var(--portal-accent) !important;
}

/* Buttons */
button, .btn {
  background: var(--portal-accent) !important;
  color: white !important;
  border-color: var(--portal-accent) !important;
}

button:hover, .btn:hover {
  opacity: 0.9 !important;
}

/* Tables */
table, th, td {
  border-color: rgba(${textRGB}, 0.1) !important;
  color: var(--portal-text) !important;
}

th {
  background: var(--portal-bg3) !important;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: var(--portal-bg1);
}

::-webkit-scrollbar-thumb {
  background: var(--portal-accent);
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  opacity: 0.8;
}
`;
}

/**
 * Get responsive CSS breakpoints
 * @returns {string}
 */
export function getResponsiveCSS() {
  return `
/* ═══ RESPONSIVE DESIGN ═══ */

/* Mobile First - Base mobile styles */
* {
  box-sizing: border-box;
}

/* Tablets (768px and up) */
@media (min-width: 768px) {
  .cce-bar {
    gap: 20px;
  }
  
  #cce-banner {
    grid-template-columns: 1fr 1fr;
  }
}

/* Small screens (480px and down) */
@media (max-width: 480px) {
  #cce-agenda {
    padding: 16px 12px;
  }
  
  .cce-bar {
    flex-direction: column;
    gap: 12px;
  }
  
  .cce-bar-title {
    font-size: 18px;
  }
  
  .cce-bar-nav {
    width: 100%;
    justify-content: center;
  }
  
  #cce-banner {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .cce-bc {
    padding: 12px 16px;
  }
  
  .cce-day {
    margin-bottom: 20px;
  }
  
  .cce-card {
    padding: 10px 14px;
    margin-bottom: 4px;
  }
  
  .cce-time {
    min-width: 85px;
    font-size: 12px;
  }
  
  .cce-name {
    font-size: 13px;
  }
  
  /* Month view mobile */
  .cce-month-grid {
    grid-template-columns: repeat(7, 1fr);
  }
  
  .cce-mc {
    min-height: 60px;
    padding: 4px;
    font-size: 11px;
  }
  
  .cce-mc-n {
    width: 22px;
    height: 22px;
    font-size: 12px;
  }
  
  /* Week view mobile */
  .cce-we-time {
    font-size: 10px;
  }
  
  .cce-we-name {
    font-size: 11px;
  }
  
  /* Modal mobile */
  #cce-modal {
    max-width: 95vw;
  }
  
  .cce-m {
    padding: 16px;
  }
  
  .cce-m-x {
    width: 30px;
    height: 30px;
    font-size: 14px;
  }
  
  .cce-m-grid {
    grid-template-columns: 1fr;
  }
  
  .cce-m-hero {
    gap: 10px;
    padding: 10px;
  }
}

/* Large screens (1200px and up) */
@media (min-width: 1200px) {
  #cce-agenda {
    max-width: 1400px;
  }
  
  .cce-bar {
    gap: 24px;
  }
  
  #cce-banner {
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
}

/* Very small screens (landscape on phones) */
@media (max-height: 600px) {
  .cce-bar {
    padding: 12px 16px;
  }
  
  .cce-day-head {
    padding: 8px 12px;
  }
  
  .cce-card {
    margin-bottom: 2px;
  }
}
`;
}

/**
 * Get dashboard premium CSS
 * @returns {string}
 */
export function getDashboardCSS() {
  return `
/* ═══ SPA DASHBOARD PREMIUM STYLES ═══ */
#cce-agenda, #cce-agenda * { 
  box-sizing: border-box;
}

#cce-agenda { 
  color: #e2e8f0; 
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
  max-width: 1200px; 
  margin: 0 auto; 
  padding: 40px 24px; 
  animation: fadeIn 0.5s ease-out; 
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.02), rgba(139, 92, 246, 0.01)); 
  border-radius: 24px;
}

@keyframes fadeIn { 
  from { opacity: 0; transform: translateY(15px); } 
  to { opacity: 1; transform: translateY(0); } 
}

.cce-bar { 
  display: flex; 
  align-items: center; 
  justify-content: space-between; 
  margin-bottom: 32px; 
  gap: 16px; 
  flex-wrap: wrap; 
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(139, 92, 246, 0.02)); 
  padding: 18px 24px; 
  border-radius: 16px; 
  border: 1px solid rgba(99, 102, 241, 0.15); 
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); 
}

.cce-btn { 
  background: rgba(255, 255, 255, .06); 
  border: 1px solid rgba(99, 102, 241, .12); 
  color: #cbd5e1; 
  border-radius: 11px; 
  padding: 10px 18px; 
  font-size: 13px; 
  font-weight: 700; 
  cursor: pointer; 
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
  font-family: inherit; 
  text-transform: uppercase; 
  letter-spacing: 0.5px; 
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); 
}

.cce-btn:hover { 
  background: linear-gradient(135deg, rgba(99, 102, 241, .2), rgba(99, 102, 241, .12)); 
  color: #e0e7ff; 
  border-color: rgba(99, 102, 241, .5); 
  transform: translateY(-2px); 
  box-shadow: 0 6px 12px rgba(99, 102, 241, 0.2); 
}

.cce-today-btn { 
  background: linear-gradient(135deg, #6366f1, #4f46e5); 
  border-color: transparent; 
  color: #fff; 
  box-shadow: 0 4px 15px rgba(99, 102, 241, .3); 
}

.cce-bar-title { 
  font-size: 24px; 
  font-weight: 900; 
  letter-spacing: -1px; 
  color: #f1f5f9; 
  margin: 0; 
  background: linear-gradient(135deg, #e0e7ff, #d8b4fe); 
  -webkit-background-clip: text; 
  -webkit-text-fill-color: transparent; 
  background-clip: text; 
}

.cce-card { 
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01)); 
  border: 1px solid rgba(99, 102, 241, 0.1); 
  border-radius: 12px; 
  margin-bottom: 8px; 
  padding: 14px 18px; 
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); 
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05); 
  position: relative; 
  overflow: hidden; 
}

.cce-card::before { 
  content: ''; 
  position: absolute; 
  top: 0; 
  left: -100%; 
  width: 100%; 
  height: 100%; 
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent); 
  transition: left 0.5s; 
}

.cce-card:hover::before { 
  left: 100%; 
}

.cce-card:hover { 
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(99, 102, 241, 0.06)); 
  border-color: rgba(99, 102, 241, 0.3); 
  transform: translateX(8px) translateY(-2px); 
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08); 
}

.cce-day { 
  margin-bottom: 36px; 
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.01), transparent); 
  border-radius: 16px; 
  overflow: hidden; 
  border: 1px solid rgba(99, 102, 241, 0.05); 
  transition: all 0.3s ease; 
}

.cce-day-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(99, 102, 241, 0.03));
  border-bottom: 2px solid rgba(99, 102, 241, 0.2);
  margin-bottom: 18px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
  transition: all 0.3s ease;
}

.cce-day-head:hover { 
  border-bottom-color: rgba(99, 102, 241, 0.3); 
  box-shadow: 0 8px 16px rgba(99, 102, 241, 0.15); 
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(99, 102, 241, 0.05)); 
}

.cce-day-name { 
  font-size: 17px; 
  font-weight: 800; 
  color: #e0e7ff; 
  letter-spacing: -0.2px; 
  text-transform: capitalize; 
}

/* Custom Scrollbar */
::-webkit-scrollbar { 
  width: 8px; 
  height: 8px; 
}

::-webkit-scrollbar-track { 
  background: transparent; 
}

::-webkit-scrollbar-thumb { 
  background: rgba(255, 255, 255, 0.1); 
  border-radius: 10px; 
}

::-webkit-scrollbar-thumb:hover { 
  background: rgba(99, 102, 241, 0.5); 
}
`;
}
