# Architecture Modulaire de l'Extension

## Structure du Projet

```
PortalRefound-Chromium/
├── content.js                 # Entry point (production, monolithique)
├── popup.html/js             # Settings UI
├── themes.js                 # Theme system
├── manifest.json             # Extension configuration
│
└── src/                       # Modules (future refactoring)
    ├── main.js              # Entry point orchestration
    ├── utils/
    │   ├── dom.js           # DOM manipulation utilities
    │   └── helpers.js       # Generic helper functions
    ├── services/
    │   ├── storage.js       # Chrome Storage API wrapper
    │   ├── parser.js        # Course text parsing
    │   └── theme.js         # Theme CSS generation
    └── ui/
        ├── agenda.js        # Agenda view rendering
        ├── modal.js         # Event modal dialog
        └── responsive.js    # Responsive design CSS
```

## Principes de Clean Code Appliqués

### 1. **Séparation des Responsabilités**
- **utils/**: Fonctions réutilisables (DOM, helpers, formatage)
- **services/**: Métier de l'application (storage, parsing, thématisation)
- **ui/**: Présentation et rendu visuel

### 2. **Export/Import Modulaire**
Chaque module exporte ses foncs publiques:
```javascript
// DOM utilities
export function setH(el, h) { ... }
export function q(selector) { ... }

// Usage
import { setH, q } from './utils/dom.js';
```

### 3. **Fonctions Pures**
- Pas d'effets de bord globaux
- Arguments explicites
- Résultats prévisibles

### 4. **Documentation JSDoc**
```javascript
/**
 * Description claire
 * @param {type} name - description
 * @returns {type}
 */
export function myFunction(param) { ... }
```

### 5. **Gestion d'Erreurs**
```javascript
export async function get(key, defaultValue = null) {
  try {
    return await chrome.storage.local.get(key);
  } catch (error) {
    console.error('Storage error:', error);
    return defaultValue;
  }
}
```

## Responsive Design

### Breakpoints Mobile-First
- **< 480px**: Phones (vertical)
- **480px - 767px**: Tablets  
- **768px - 1024px**: Medium screens
- **1024px+**: Desktop
- **< 600px height**: Landscape phones

### Optimisations Mobile
✅ Padding/margin réduits  
✅ Font-sizes adaptées  
✅ Grilles single-column  
✅ Touch targets 44x44px  
✅ Modals full-width  
✅ Menu burgers  
✅ Reduced motion support  

### Utilities CSS
```css
/* Flex responsive */
.flex-mobile-col { flex-direction: column; }
@media (min-width: 768px) { 
  .flex-mobile-col { flex-direction: row; } 
}

/* Spacing utilities */
.p-mobile { padding: 12px; }
@media (min-width: 768px) { 
  .p-mobile { padding: 16px; } 
}
```

## Migration Vers Modules ES6

Pour basculer vers la structure modulaire (nécessite unbundler):

### Option 1: Webpack
```bash
npm install --save-dev webpack webpack-cli
npx webpack --mode production
```

### Option 2: Rollup
```bash
npm install --save-dev rollup
npx rollup src/main.js -o dist/content.js
```

### Option 3: Vite
```bash
npm install --save-dev vite
vite build
```

## Functions "Modulaires" Disponibles

### DOM Utils
```javascript
import { setH, addH, q, qa, createElement, injectStyle, waitFor } from './utils/dom.js';
```

### Helpers
```javascript
import { debounce, throttle, pad2, cap, hash, hexToRgb, formatDate } from './utils/helpers.js';
```

### Storage
```javascript
import * as storage from './services/storage.js';
// async: get, set, remove, getSettings, setSetting, getCourseSetting
```

### Parser
```javascript
import { parseTitle, extractName, isDistanceCourse, parseDate } from './services/parser.js';
```

### Theme
```javascript
import { buildPortalThemeCSS, getResponsiveCSS, getDashboardCSS } from './services/theme.js';
```

### Agenda UI
```javascript
import { buildListView, buildWeekView, buildMonthView } from './ui/agenda.js';
```

### Modal UI
```javascript
import { openModal, getModalStyles } from './ui/modal.js';
```

### Responsive
```javascript
import { getResponsiveCSS } from './ui/responsive.js';
```

## Intégration Progressive

**Phase 1 (Actuelle)**: Content.js monolithique + src/ comme référence  
**Phase 2**: Utiliser les modules dans popup.js  
**Phase 3**: Bundler content.js avec les modules  
**Phase 4**: Refactor complet

## Bénéfices

✅ Code plus testable  
✅ Réutilisabilité accrue  
✅ Maintenance simplifiée  
✅ Onboarding développeurs  
✅ Scalabilité future  
✅ Responsivité mobile complète  
✅ Accessibilité améliorée  

## Notes

- content.js reste monolithique pour la prod (pas de bundler requis)
- src/ est une feuille de route pour future refactorisation
- Tous les CSS responsive sont intégrés dans injectDashboardCSS()
- Mobile-first approach: styles basiques pour mobile, enhancements pour desktop
