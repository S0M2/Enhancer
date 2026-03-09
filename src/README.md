# Modules Source - Clean Code Architecture

## 📋 Fichiers Modulaires

### `main.js` - Orchestration Principale
Point d'entrée de l'extension. Initialise les services et configure les écouteurs.

**Responsabilités:**
- Détection du contexte (Portal/Moodle)
- Initialisation des services
- Setup des message listeners
- Chargement des thèmes

### `utils/dom.js` - Utilitaires DOM
Fonctions réutilisables pour manipuler le DOM.

**Exports:**
- `setH(el, html)` - Remplacer le contenu HTML (safe)
- `addH(el, html)` - Ajouter du HTML
- `q(selector)` - QuerySelector shorthand
- `qa(selector)` - QuerySelectorAll shorthand
- `createElement(tag, attrs, content)` - Créer un élément
- `injectStyle(id, css)` - Injecter une feuille de styles
- `remove(selector)` - Supprimer un élément
- `toggleClass(el, className, force)` - Toggle classe CSS
- `waitFor(selector, timeout)` - Attendre qu'un élément apparaisse

### `utils/helpers.js` - Fonctions Utilitaires
Helpers génériques pour formatage, conversion, manipulation de données.

**Exports:**
- `debounce(fn, ms)` - Debounce une fonction
- `throttle(fn, ms)` - Throttle une fonction
- `pad2(n)` - Padding zéro (12 → "12")
- `cap(s)` - Capitaliser
- `hash(str)` - Hash simple
- `rgba(r, g, b, a)` - Créer chaîne RGBA
- `hexToRgb(hex)` / `rgbToHex(r, g, b)` - Conversion couleurs
- `isValid(str)` - Validation basique
- `formatDate(date)` / `formatTime(date)` - Format date/heure
- `getDayName(day)` / `getMonthName(month)` - Noms jours/mois (FR)
- `deepMerge(target, source)` - Fusion profonde objets
- `clamp(value, min, max)` - Limiter valeur
- `sleep(ms)` - Delay execution

### `services/storage.js` - Stockage Chrome
Wrapper autour Chrome Storage API avec meilleure interface.

**Exports:**
- `get(key, defaultValue)` - Async get
- `set(key, value)` - Async set
- `remove(key)` - Async remove
- `clear()` - Clear all
- `getSettings()` - Get toutes les settings
- `getSetting(key, defaultValue)` - Get une setting
- `setSetting(key, value)` - Set une setting
- `updateSettings(updates)` - Bulk update
- `getCourseSettings()` / `getCourseSetting(name)` - Course settings
- `setCourseSetting(name, setting)` - Set course setting
- `onStorageChange(key, callback)` - Listen changes
- `onAnyChange(callback)` - Listen any changes

### `services/parser.js` - Parsing Texte
Parsing de titres de cours et extraction d'informations.

**Exports:**
- `parseTitle(text)` - Parse titre complet → {name, type, room, prof, year}
- `extractName(text)` - Extraire juste le nom
- `extractType(text)` - Extraire type (th/lab/auto)
- `extractRoom(text)` - Extraire salle
- `extractProf(text)` - Extraire professeur
- `isDistanceCourse(text)` - Est-ce à distance?
- `extractBACLevel(text)` - Extraire [BAC n]
- `normalizeCourseName(name)` - Normaliser pour comparaison
- `parseEventElement(el)` - Parser un élément DOM
- `parseDate(dateStr)` - Parser date (YYYY-MM-DD)
- `formatDateFR(date)` - Formater date (FR)

### `services/theme.js` - Génération Thèmes
Build dynamique du CSS de thème et CSS responsif.

**Exports:**
- `buildPortalThemeCSS(theme, accent)` - Générer CSS thème Portal
- `getResponsiveCSS()` - Générer CSS responsif complet
- `getDashboardCSS()` - Générer CSS dashboard

### `ui/agenda.js` - Rendu Agenda
Fonctions pour construire les différentes vues agenda.

**Exports:**
- `buildListView(events)` - Vue liste événements
- `buildWeekView(events)` - Vue semaine
- `buildMonthView(events)` - Vue mois
- `createEventCard(event)` - Créer carte événement

### `ui/modal.js` - Modal Événement
Dialog modal pour détails événement.

**Exports:**
- `openModal(cardEl)` - Ouvrir modal détails
- `getModalStyles()` - CSS du modal (responsive)

### `ui/responsive.js` - Design Responsive
Tous les breakpoints CSS responsif.

**Exports:**
- `getResponsiveCSS()` - CSS responsive complet (2500+ lignes)

## 🔄 Flux de Données

```plaintext
Chrome Extension Loads
        ↓
main.js Initialize
        ↓
┌───────┴───────┐
│               │
Portal      Moodle
│               │
├→ applyPortalTheme()    ├→ injectMoodleStyles()
│  (use theme CSS)       └→ initNextCourse()
├→ injectDashboardCSS()
│  (use agenda CSS)
├→ applyPortalHides()
│  (use storage)
└→ initAgenda()
   ├→ waitFor calendar
   ├→ collectCourses()
   ├→ buildListView/Week/Month()
   └→ listen clicks → openModal()
```

## 💾 Dépendances Entre Modules

```plaintext
main.js
  ├── imports: storage, theme, parser, dom, agendaUI, modalUI
  └── dépend de: tout

ui/modal.js
  ├── imports: dom, parser, storage
  └── dépend de: services/storage, services/parser

ui/agenda.js
  ├── imports: dom, helpers, parser
  └── dépend de: services/parser

services/theme.js
  ├── imports: rien
  └── dépend de: (indépendant)

services/parser.js
  ├── imports: rien
  └── dépend de: (indépendant)

services/storage.js
  ├── imports: rien
  └── dépend de: Chrome Storage API

utils/dom.js
  ├── imports: rien
  └── dépend de: DOM API standard

utils/helpers.js
  ├── imports: rien
  └── dépend de: (indépendant)
```

## 🎯 Principes de Design

### Separation of Concerns
Chaque module a une seule responsabilité clairement définie.

### DRY (Don't Repeat Yourself)
Fonctions réutilisables au lieu de code dupliqué.

### Single Responsibility Principle
- utils: formatage/manipulation
- services: logique métier
- ui: présentation/rendu

### Open/Closed Principle
Ouvert à l'extension, fermé à la modification.

### JSDoc Documentation
Toutes les functions publiques documentées.

### Error Handling
try/catch et gestion d'erreurs systématique.

### Async/Await
Pas de callbacks, code lisible.

## 🚀 Tests Unitaires (À Implémenter)

```javascript
import { pad2, cap, debounce } from './utils/helpers.js';

describe('helpers', () => {
  it('pad2(5) === "05"', () => {
    assert.equal(pad2(5), '05');
  });

  it('cap("hello") === "Hello"', () => {
    assert.equal(cap('hello'), 'Hello');
  });

  it('debounce delays execution', (done) => {
    let count = 0;
    const fn = debounce(() => count++, 10);
    fn();
    fn();
    fn();
    setTimeout(() => {
      assert.equal(count, 1);
      done();
    }, 20);
  });
});
```

## 📚 Migration vers Bundler

Pour intégrer ces modules en production:

### Webpack

```bash
npm install --save-dev webpack webpack-cli
```

```javascript
// webpack.config.js
module.exports = {
  entry: './src/main.js',
  output: {
    filename: 'content.js',
    path: __dirname
  },
  mode: 'production'
};
```

```bash
npx webpack build
```

### Rollup

```bash
npm install --save-dev rollup @rollup/plugin-node-resolve
```

```bash
rollup src/main.js -o content.js -f iife
```

## 🎓 Learning Resources

- **Clean Code**: Robert C. Martin
- **Refactoring**: Martin Fowler
- **JavaScript Design Patterns**: Addy Osmani
- **ES6 Modules**: MDN Web Docs
- **Chrome Extension API**: developer.chrome.com

## 📊 Statistiques

- **Fichiers modulaires**: 9
- **Lignes de code modulaires**: 2700+
- **Lignes content.js**: 1774
- **Couverture fonctionnelle**: 90%+
- **Breakpoints responsif**: 7 (phones, tablets, desktop, landscape, print, etc)
- **Accessibility features**: 5+ (reduced-motion, high-contrast, touch, etc)

## ✅ Checklist Migration

- [ ] Installer Webpack/Rollup
- [ ] Configurer bundler
- [ ] Tester build production
- [ ] Ajouter tests unitaires
- [ ] Optimiser tree-shaking
- [ ] Minifier CSS/JS
- [ ] Générer source maps
- [ ] Publier nouvelle version

## 🔗 Liens Utiles

- [ARCHITECTURE.md](../ARCHITECTURE.md) - Vue d'ensemble projet
- [content.js](../content.js) - Version monolithique (prod)
- [manifest.json](../manifest.json) - Config extension
- [GitHub Repo](https://github.com/S0M2/Enhancer) - Code source
