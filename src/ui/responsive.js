/**
 * Responsive CSS Module
 * Complete responsive design system
 */

export function getResponsiveCSS() {
  return `
/* ═══ RESPONSIVE MOBILE-FIRST DESIGN ═══ */

/* Base Mobile Styles (< 480px) */
* {
  box-sizing: border-box;
}

body {
  font-size: 16px;
}

/* Small Phones (< 480px) */
@media (max-width: 479px) {
  /* Dashboard */
  #cce-agenda {
    padding: 16px 12px !important;
    max-width: 100% !important;
    margin: 0 !important;
    border-radius: 0 !important;
  }

  /* Control bar collapse */
  .cce-bar {
    flex-direction: column !important;
    gap: 12px !important;
    padding: 12px 16px !important;
    align-items: stretch !important;
  }

  .cce-bar-nav {
    width: 100% !important;
    justify-content: center !important;
  }

  .cce-bar-title {
    font-size: 16px !important;
    text-align: center !important;
  }

  .cce-views {
    justify-self: center !important;
  }

  /* Banner stacking */
  #cce-banner {
    grid-template-columns: 1fr !important;
    gap: 12px !important;
    margin-bottom: 20px !important;
  }

  .cce-bc {
    padding: 12px 16px !important;
  }

  /* Day sections */
  .cce-day {
    margin-bottom: 16px !important;
  }

  .cce-day-head {
    padding: 10px 14px !important;
    gap: 8px !important;
  }

  .cce-day-name {
    font-size: 14px !important;
  }

  /* Cards compact */
  .cce-card {
    padding: 10px 12px !important;
    margin-bottom: 4px !important;
    flex-direction: column !important;
    gap: 2px !important;
  }

  .cce-time {
    font-size: 11px !important;
    min-width: auto !important;
  }

  .cce-name {
    font-size: 12px !important;
  }

  .cce-room {
    font-size: 11px !important;
  }

  /* Month view mobile */
  .cce-month-lbl {
    font-size: 14px !important;
    padding: 10px 0 6px !important;
  }

  .cce-month-head {
    padding: 0 !important;
  }

  .cce-month-head div {
    padding: 6px 0 !important;
    font-size: 9px !important;
  }

  .cce-mc {
    min-height: 60px !important;
    padding: 4px !important;
  }

  .cce-mc-n {
    width: 20px !important;
    height: 20px !important;
    font-size: 12px !important;
  }

  .cce-mc-dots {
    gap: 2px !important;
  }

  .cce-mc-dot {
    width: 5px !important;
    height: 5px !important;
  }

  /* Week view mobile */
  .cce-we-time {
    font-size: 9px !important;
  }

  .cce-we-name {
    font-size: 10px !important;
  }

  .cce-we-room {
    font-size: 9px !important;
  }

  /* Modal mobile */
  #cce-modal {
    max-width: 95vw !important;
  }

  .cce-m {
    padding: 14px !important;
  }

  .cce-m-x {
    width: 28px !important;
    height: 28px !important;
    font-size: 12px !important;
    top: 10px !important;
    right: 10px !important;
  }

  .cce-m-hero {
    gap: 8px !important;
    padding: 8px !important;
  }

  .cce-m-name {
    font-size: 14px !important;
  }

  .cce-m-grid {
    grid-template-columns: 1fr !important;
    gap: 8px !important;
  }

  .cce-m-cell {
    padding: 8px !important;
  }

  .cce-m-action {
    padding: 10px !important;
    font-size: 12px !important;
  }

  /* Portal narrow (phones) */
  .card, .well, .panel {
    margin-bottom: 12px !important;
  }

  .navbar {
    padding: 8px 12px !important;
  }

  .navbar-brand {
    font-size: 14px !important;
  }

  .nav-link {
    padding: 6px 10px !important;
    font-size: 13px !important;
  }

  .bookmark {
    padding: 10px !important;
    margin-bottom: 8px !important;
  }

  table {
    font-size: 12px !important;
  }

  th, td {
    padding: 6px 4px !important;
  }
}

/* Tablets (480px - 768px) */
@media (min-width: 480px) and (max-width: 767px) {
  #cce-agenda {
    padding: 24px 16px !important;
  }

  .cce-bar {
    flex-wrap: wrap !important;
    gap: 14px !important;
  }

  .cce-bar-title {
    font-size: 18px !important;
  }

  #cce-banner {
    grid-template-columns: 1fr !important;
  }

  .cce-card {
    padding: 11px 15px !important;
  }

  .cce-time {
    font-size: 12px !important;
  }

  /* Modal tablet */
  #cce-modal {
    max-width: 90vw !important;
  }

  .cce-m {
    padding: 20px !important;
  }

  .cce-m-grid {
    grid-template-columns: 1fr 1fr !important;
  }
}

/* Medium Screens (768px - 1024px) */
@media (min-width: 768px) {
  .cce-bar {
    gap: 16px !important;
    padding: 16px 20px !important;
  }

  .cce-bar-nav {
    gap: 8px !important;
  }

  #cce-banner {
    grid-template-columns: 1fr 1fr !important;
    gap: 16px !important;
  }

  .cce-card {
    display: flex !important;
    align-items: center !important;
    gap: 12px !important;
  }

  .cce-time {
    min-width: 100px !important;
  }
}

/* Large Screens (1024px - 1200px) */
@media (min-width: 1024px) {
  #cce-agenda {
    max-width: 1200px !important;
    padding: 32px 28px !important;
  }

  .cce-bar {
    gap: 18px !important;
    padding: 18px 24px !important;
  }

  #cce-banner {
    grid-template-columns: 1fr 1fr !important;
    gap: 18px !important;
  }

  .cce-bc {
    padding: 20px 24px !important;
  }
}

/* Very Large Screens (> 1200px) */
@media (min-width: 1200px) {
  #cce-agenda {
    max-width: 1400px !important;
  }

  .cce-bar {
    gap: 24px !important;
  }

  #cce-banner {
    gap: 20px !important;
  }
}

/* Landscape orientation (phones) */
@media (max-height: 600px) {
  .cce-bar {
    padding: 10px 14px !important;
  }

  .cce-day {
    margin-bottom: 12px !important;
  }

  .cce-day-head {
    padding: 8px 12px !important;
  }

  .cce-card {
    padding: 8px 12px !important;
    margin-bottom: 2px !important;
  }

  #cce-banner {
    gap: 10px !important;
    margin-bottom: 14px !important;
  }
}

/* Touch devices optimization */
@media (hover: none) and (pointer: coarse) {
  .cce-btn,
  .cce-card,
  .cce-bc,
  .bookmark,
  button,
  a {
    min-height: 44px !important;
    min-width: 44px !important;
  }

  .cce-btn {
    padding: 12px 16px !important;
  }

  .cce-card {
    padding: 12px 14px !important;
    margin-bottom: 6px !important;
  }
}

/* High DPI Displays */
@media (-webkit-min-device-pixel-ratio: 2) {
  body {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}

/* Print styles */
@media print {
  #cce-agenda,
  .cce-bar,
  .cce-btn,
  #cce-banner {
    display: block !important;
  }

  .cce-card {
    page-break-inside: avoid;
    box-shadow: none !important;
  }
}

/* Dark mode preference */
@media (prefers-color-scheme: dark) {
  /* Already dark by default */
}

/* Light mode preference fallback */
@media (prefers-color-scheme: light) {
  #cce-agenda {
    background: linear-gradient(135deg, rgba(248, 249, 255, 0.8), rgba(240, 249, 255, 0.5)) !important;
    color: #1e293b !important;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Forced colors (high contrast mode) */
@media (forced-colors: active) {
  .cce-card {
    border: 2px solid CanvasText !important;
  }

  .cce-btn {
    border: 2px solid CanvasText !important;
  }
}

/* Flex utilities for mobile */
.flex-mobile-col {
  display: flex;
  flex-direction: column;
}

@media (min-width: 768px) {
  .flex-mobile-col {
    flex-direction: row;
  }
}

/* Text utilities */
.text-truncate-mobile {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (min-width: 768px) {
  .text-truncate-mobile {
    white-space: normal;
  }
}

/* Spacing utilities mobile-first */
.p-mobile {
  padding: 12px;
}

@media (min-width: 768px) {
  .p-mobile {
    padding: 16px;
  }
}

.gap-mobile {
  gap: 8px;
}

@media (min-width: 768px) {
  .gap-mobile {
    gap: 12px;
  }
}
`;
}
