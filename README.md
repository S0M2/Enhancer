<div align="center">

# 🎓 Enhancer — Portail & Moodle HENALLUX

**L'extension Chrome qui transforme ton expérience sur le Portail et Moodle HENALLUX**

![Version](https://img.shields.io/badge/version-3.4.0-6366f1?style=for-the-badge&labelColor=0d1117)
![Manifest](https://img.shields.io/badge/Manifest-V3-22c55e?style=for-the-badge&labelColor=0d1117)
![Chrome](https://img.shields.io/badge/Chrome-Compatible-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white&labelColor=0d1117)

---

*Agenda remanié, thème dark premium, couleurs personnalisées, CSS custom & plus.*

</div>

---

## ✨ Fonctionnalités

### 📅 Agenda amélioré
- **Vue liste, semaine & mois** — Remplace le calendrier FullCalendar par défaut avec une interface moderne et lisible
- **Bannière « En cours / Suivant »** — Affiche en temps réel le cours actuel et le prochain
- **Détection des conflits** — Surligne les chevauchements d'horaires
- **Liens Moodle intégrés** — Ouvre directement le cours Moodle depuis l'agenda
- **Synchronisation automatique** — Les données sont partagées entre le Portail et Moodle

### 🌙 Mode sombre premium
- **Moodle** — Thème dark complet avec backdrop-filter, glassmorphism et animations subtiles
- **Portail** — Choix entre thème par défaut, clair ☀️ ou sombre 🌙
- **Couleur d'accentuation** — Personnalise la teinte principale (boutons, liens, surbrillances)

### 🎨 Couleurs par cours
- **Couleur personnalisée** par cours — Visible dans l'agenda et sur les cartes Moodle
- **Visibilité** — Masque les cours que tu ne veux pas voir dans l'agenda
- **Lien Moodle** — Associe un lien par cours pour un accès rapide
- **Filtres BAC 1/2/3** — Sélection rapide par année

### 🧩 Timeline « Prochain cours »
- Affichée sur le **dashboard Moodle** — Montre le cours en cours (avec barre de progression), le prochain et les 5 suivants
- **Badge « PROCHAIN »** sur les cartes de cours Moodle correspondantes

### ✏️ CSS custom
- **Éditeur intégré** avec presets (cacher le header, cards XL, layout large…)
- **Séparé Moodle / Portail** — Chaque site a son propre éditeur
- Injecté en temps réel à chaque sauvegarde

### 🔧 Masquer des éléments
- Navbar, footer, sidebar, notifications, drawer  
- Séparé entre Moodle et Portail

---

## � Changelog v3.4.0

### 🐛 Corrections de bugs
- **Critique**: Fixe les paramètres du Portail qui n'étaient pas complètement initialisés
- **Gestion d'erreur**: Ajoute la validation des données du stockage et les vérifications d'erreur
- **Validation**: Améliore la robustesse avec try-catch et vérification des types de données

### ✨ Nouvelles fonctionnalités
- **Auto-save**: Les paramètres se sauvegardent automatiquement 2 secondes après modification
- **Feedback utilisateur**: Affichage des messages d'erreur avec codes visuels
- **Bookmark toggles**: Ajout des contrôles pour afficher/masquer les catégories de liens du Portail

### 🎨 Améliorations UI/UX
- Transitions plus fluides (cubic-bezier easing)
- Meilleure lisibilité (line-height et letter-spacing)
- Effets 3D sur les onglets (transform Y)
- Amélioration générale du polish et de la réactivité

---

## �🚀 Installation

### Depuis les fichiers sources (développement)

1. **Clone** ou télécharge le projet :
   ```bash
   git clone https://github.com/ton-username/PortalRefound-Chromium.git
   ```

2. Ouvre **Chrome** et va dans `chrome://extensions/`

3. Active le **Mode développeur** (toggle en haut à droite)

4. Clique **Charger l'extension non empaquetée**

5. Sélectionne le dossier `PortalRefound-Chromium/`

6. L'extension apparaît dans la barre d'outils — clique sur l'icône pour ouvrir le popup

### Packager pour distribution

```bash
./package.sh
```
Crée `PortalRefound.zip` prêt à être uploadé sur le Chrome Web Store.

---

## 🏗️ Architecture

```
PortalRefound-Chromium/
├── manifest.json        # Configuration Manifest V3
├── content.js           # Script principal injecté sur Portail & Moodle
├── popup.html           # Interface du popup
├── popup.js             # Logique du popup (tabs, settings, save)
├── styles.css           # Styles du popup
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── package.sh           # Script de packaging
└── README.md
```

### Flux de données

```
┌──────────────┐     chrome.storage      ┌──────────────┐
│   popup.js   │ ◄──────────────────────► │  content.js  │
│  (settings)  │     chrome.runtime      │  (injection)  │
└──────────────┘      .sendMessage        └──────────────┘
                                                │
                                    ┌───────────┴───────────┐
                                    ▼                       ▼
                             portail.henallux.be     moodle.henallux.be
                             (agenda, thème)         (dark mode, timeline)
```

- **`popup.js`** : Interface utilisateur. Lit/écrit les settings dans `chrome.storage.local`, envoie un message `apply_settings` au content script actif.
- **`content.js`** : Injecté sur les deux sites. Détecte le contexte (`isMoodle`, `isPortal`, `isAgenda`, `isHome`), applique les thèmes, lit les événements FullCalendar, et construit l'agenda personnalisé.
- **`chrome.storage.local`** : Source de vérité pour les réglages (`courseSettings`, `moodleSettings`, `portalSettings`, `customCSS`, `agendaEvents`).

---

## ⚙️ Permissions

| Permission | Usage |
|------------|-------|
| `storage` | Sauvegarder les réglages et les événements de l'agenda |
| `activeTab` | Communiquer avec l'onglet actif depuis le popup |
| `scripting` | Injecter le content script |
| `host_permissions` | Accès à `portail.henallux.be` et `moodle.henallux.be` uniquement |

> **Aucune donnée n'est envoyée à l'extérieur.** Tout reste en local dans le navigateur.

---

## 🛠️ Stack technique

- **Manifest V3** — Standard moderne des extensions Chrome
- **Vanilla JS** — Zéro dépendance, zéro framework
- **Chrome Storage API** — Persistance locale des données
- **CSS injection** — Thèmes appliqués via `<style>` injectés dynamiquement
- **MutationObserver** (Moodle) + **setInterval** (Agenda) — Réactivité contrôlée sans surcharge CPU

---

## 📝 Changelog

### v3.2 (Mars 2026)
- 🐛 **Fix performances critiques** — Résolution des boucles infinies MutationObserver qui causaient 100% CPU
- 🐛 **Fix scroll agenda** — Remplacement des observers continus par un interval de 10 min
- 🐛 **Fix reset .fc** — Le calendrier original se restaure correctement quand l'extension est désactivée
- 🧹 Suppression du code mort (`compactHeader`, `persistTimer`, `hideNavbar` Moodle)
- 🌐 Le thème Portail s'applique maintenant sur **toutes** les pages du portail (pas seulement home/agenda)
- 🔄 Versions synchronisées entre tous les fichiers

### v3.1
- ✨ Thèmes Portail (défaut, clair, sombre) avec couleur d'accent personnalisable
- ✨ Vue semaine et mois dans l'agenda
- ✨ Détection des conflits horaires
- ✨ Éditeur CSS custom avec presets

---

## 📄 Licence

Ce projet est distribué à des fins éducatives pour les étudiants HENALLUX.

---

<div align="center">
  <sub>Fait avec 💜 pour la communauté HENALLUX</sub>
</div>
