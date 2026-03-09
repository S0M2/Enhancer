// ═══════════════════════════════════════════════════════
//  ENHANCER — themes.js v3.4
//  Système de thèmes personnalisables
// ═══════════════════════════════════════════════════════

const THEMES = {
  // ── Thème Dark Premium (par défaut)
  darkPremium: {
    name: 'Dark Premium',
    icon: '🌙',
    colors: {
      bg: '#07090f',
      bg1: '#0d1017',
      bg2: '#131722',
      bg3: '#1a1f2e',
      text: '#e8eaf0',
      muted: '#8892b0',
      accent: '#6366f1',
      accentLight: '#818cf8',
      accentBright: '#a5b4fc',
    },
    apply: (accent) => `
      :root {
        --enhancer-bg: #07090f;
        --enhancer-bg1: #0d1017;
        --enhancer-bg2: #131722;
        --enhancer-bg3: #1a1f2e;
        --enhancer-text: #e8eaf0;
        --enhancer-muted: #8892b0;
        --enhancer-accent: ${accent};
      }
      
      body { background: var(--enhancer-bg) !important; color: var(--enhancer-text) !important; }
      
      .course-card, .card, .block, .content-container {
        background: var(--enhancer-bg2) !important;
        color: var(--enhancer-text) !important;
        border-color: rgba(255,255,255,0.1) !important;
      }
      
      .navbar, nav, header, #page-header {
        background: rgba(7,9,15,.95) !important;
        backdrop-filter: blur(16px) !important;
        border-bottom: 1px solid rgba(255,255,255,.07) !important;
      }
    `,
  },

  // ── Thème Clair Épuré
  lightClean: {
    name: 'Light Clean',
    icon: '☀️',
    colors: {
      bg: '#f8f9ff',
      bg1: '#ffffff',
      bg2: '#f1f3fb',
      bg3: '#e8eaf6',
      text: '#1a1d2e',
      muted: '#64748b',
      accent: '#6366f1',
      accentLight: '#818cf8',
      accentBright: '#a5b4fc',
    },
    apply: (accent) => `
      :root {
        --enhancer-bg: #f8f9ff;
        --enhancer-bg1: #ffffff;
        --enhancer-bg2: #f1f3fb;
        --enhancer-bg3: #e8eaf6;
        --enhancer-text: #1a1d2e;
        --enhancer-muted: #64748b;
        --enhancer-accent: ${accent};
      }
      
      body { background: var(--enhancer-bg) !important; color: var(--enhancer-text) !important; }
      
      .course-card, .card, .block, .content-container {
        background: var(--enhancer-bg1) !important;
        color: var(--enhancer-text) !important;
        border: 1px solid var(--enhancer-bg3) !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05) !important;
      }
      
      .navbar, nav, header, #page-header {
        background: linear-gradient(180deg, var(--enhancer-bg1), var(--enhancer-bg2)) !important;
        border-bottom: 1px solid rgba(0,0,0,0.08) !important;
        box-shadow: 0 1px 12px rgba(0,0,0,0.08) !important;
      }
    `,
  },

  // ── Thème Orange Chaud
  warmOrange: {
    name: 'Warm Orange',
    icon: '🔥',
    colors: {
      bg: '#1a1410',
      bg1: '#2d1f1a',
      bg2: '#3f2a22',
      bg3: '#4a3428',
      text: '#fefaf3',
      muted: '#c8a882',
      accent: '#ff9d3d',
      accentLight: '#ffb366',
      accentBright: '#ffc084',
    },
    apply: (accent) => `
      :root {
        --enhancer-bg: #1a1410;
        --enhancer-bg1: #2d1f1a;
        --enhancer-bg2: #3f2a22;
        --enhancer-bg3: #4a3428;
        --enhancer-text: #fefaf3;
        --enhancer-muted: #c8a882;
        --enhancer-accent: ${accent};
      }
      
      body { background: var(--enhancer-bg) !important; color: var(--enhancer-text) !important; }
      
      .course-card, .card, .block, .content-container {
        background: var(--enhancer-bg2) !important;
        color: var(--enhancer-text) !important;
        border-left: 4px solid var(--enhancer-accent) !important;
      }
    `,
  },

  // ── Thème Vert Technologie
  techGreen: {
    name: 'Tech Green',
    icon: '🟢',
    colors: {
      bg: '#0a1210',
      bg1: '#0f1a18',
      bg2: '#142420',
      bg3: '#1a3028',
      text: '#e0f7f4',
      muted: '#7db8ad',
      accent: '#10b981',
      accentLight: '#34d399',
      accentBright: '#6ee7b7',
    },
    apply: (accent) => `
      :root {
        --enhancer-bg: #0a1210;
        --enhancer-bg1: #0f1a18;
        --enhancer-bg2: #142420;
        --enhancer-bg3: #1a3028;
        --enhancer-text: #e0f7f4;
        --enhancer-muted: #7db8ad;
        --enhancer-accent: ${accent};
      }
      
      body { background: var(--enhancer-bg) !important; color: var(--enhancer-text) !important; }
      
      .course-card, .card, .block, .content-container {
        background: var(--enhancer-bg2) !important;
        color: var(--enhancer-text) !important;
        border: 1px solid rgba(16,185,129,0.2) !important;
      }
    `,
  },

  // ── Thème Violet Mystique
  mysticPurple: {
    name: 'Mystic Purple',
    icon: '💜',
    colors: {
      bg: '#15111f',
      bg1: '#1f1a2e',
      bg2: '#2a233d',
      bg3: '#3a2f4a',
      text: '#ede9f6',
      muted: '#a393b5',
      accent: '#a78bfa',
      accentLight: '#c4b5fd',
      accentBright: '#ddd6fe',
    },
    apply: (accent) => `
      :root {
        --enhancer-bg: #15111f;
        --enhancer-bg1: #1f1a2e;
        --enhancer-bg2: #2a233d;
        --enhancer-bg3: #3a2f4a;
        --enhancer-text: #ede9f6;
        --enhancer-muted: #a393b5;
        --enhancer-accent: ${accent};
      }
      
      body { background: var(--enhancer-bg) !important; color: var(--enhancer-text) !important; }
      
      .course-card, .card, .block, .content-container {
        background: linear-gradient(135deg, var(--enhancer-bg2), var(--enhancer-bg3)) !important;
        color: var(--enhancer-text) !important;
      }
    `,
  },
};

const PRESET_ACCENTS = {
  indigo: '#6366f1',
  purple: '#a78bfa',
  pink: '#ec4899',
  red: '#ef4444',
  orange: '#f97316',
  amber: '#f59e0b',
  yellow: '#eab308',
  lime: '#84cc16',
  green: '#22c55e',
  emerald: '#10b981',
  teal: '#14b8a6',
  cyan: '#06b6d4',
  sky: '#0ea5e9',
  blue: '#3b82f6',
  rose: '#f43f5e',
};

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { THEMES, PRESET_ACCENTS };
}
