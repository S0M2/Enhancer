// ═══════════════════════════════════════════════════════
//  ENHANCER — popup.js v3.3
// ═══════════════════════════════════════════════════════

// ── Constants ────────────────────────────────────────────

const CSS_PRESETS = {
  moodle: {
    hideHeader: `/* Cacher le header Moodle */\n#page-header, .page-header-headings { display: none !important; }`,
    bigCards: `/* Cards de cours plus grandes */\n.course-card { min-height: 220px !important; }\n.course-card .coursename { font-size: 15px !important; font-weight: 800 !important; }`,
    noBanner: `/* Cacher les bannières de cours */\n.course-card .card-img-top { display: none !important; }\n.course-card { padding-top: 0 !important; }`,
    wideCards: `/* Cartes larges (pleine largeur) */\n.card-carousel { flex-wrap: wrap !important; }\n.card-carousel .course-card { flex: 1 1 calc(50% - 8px) !important; min-width: 200px !important; }`,
    clearAll: '',
  },
  portal: {
    hideTopBar: `/* Cacher la topbar */\n.navbar.fixed-top { display: none !important; }\nbody { padding-top: 0 !important; }`,
    wideLayout: `/* Layout large */\n.container, .container-fluid { max-width: 100% !important; padding: 0 24px !important; }`,
    clearAll: '',
  },
};

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const DEFAULT_COLOR = '#6366f1';

// ── State ─────────────────────────────────────────────────

let courseSettings = {};
let knownCourses = [];
let moodleSettings = {};
let portalSettings = {};
let customCSS = { moodle: '', portal: '' };
let enabled = true;
let autoSaveTimer = null;

// ── Bootstrap ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  loadData();
  bindTabs();
  bindCssTabs();
  bindMoodleToggles();
  bindPortalControls();
  bindPresets();
  bindBulkActions();
  bindSearch();
  bindSave();
  bindMasterToggle();
});

// ── Data loading ──────────────────────────────────────────

function loadData() {
  const keys = ['courseSettings', 'knownCourses', 'moodleSettings', 'portalSettings', 'customCSS', 'extensionEnabled'];
  chrome.storage.local.get(keys, (res) => {
    try {
      if (chrome.runtime.lastError) {
        console.error('Storage read error:', chrome.runtime.lastError);
        return;
      }

      courseSettings = (res.courseSettings && typeof res.courseSettings === 'object') ? res.courseSettings : {};
      knownCourses = Array.isArray(res.knownCourses) ? res.knownCourses : [];
      customCSS = (res.customCSS && typeof res.customCSS === 'object') ? res.customCSS : { moodle: '', portal: '' };
      enabled = res.extensionEnabled !== false;

    const m = res.moodleSettings || {};
    moodleSettings = {
      // Appearance
      dark: m.darkEnabled ?? m.dark ?? true,
      accentColor: m.accentColor || DEFAULT_COLOR,
      compactCards: m.compactCards ?? false,
      hideBanners: m.hideBanners ?? false,
      noAnimations: m.noAnimations ?? false,
      // Visible blocks
      timeline: m.showTimeline ?? m.timeline ?? true,
      calendar: m.showCalendar ?? m.calendar ?? true,
      recent: m.showRecent ?? m.recent ?? true,
      showNextTimeline: m.showNextTimeline ?? true,
      // Hide elements
      hideNavbar: m.hideNavbar ?? false,
      hideSidebar: m.hideSidebar ?? false,
      hidePageHeader: m.hidePageHeader ?? false,
      hideNotifs: m.hideNotifs ?? false,
      hideEditMode: m.hideEditMode ?? false,
      hideFooter: m.hideFooter ?? false,
      // Course card display
      showCourseCategory: m.showCourseCategory !== false,
      showFavourite: m.showFavourite !== false,
      showPagination: m.showPagination !== false,
    };

    const p = res.portalSettings || {};
    portalSettings = {
      theme: p.theme || 'default',
      accentColor: p.accentColor || DEFAULT_COLOR,
      hideNavbar: p.hideNavbar ?? false,
      hideFooter: p.hideFooter ?? false,
      hideSidebar: p.hideSidebar ?? false,
      showBkmPedagogic: p.showBkmPedagogic ?? true,
      showBkmInfos: p.showBkmInfos ?? true,
      showBkmTools: p.showBkmTools ?? true,
      showBkmDepartment: p.showBkmDepartment ?? true,
      showBkmCloud: p.showBkmCloud ?? true,
      showBkmPersonal: p.showBkmPersonal ?? true,
    };

    syncUI();
    syncCoursesFromTab();
    renderAgendaTab();
    renderColorTab();
    } catch (err) {
      console.error('Error loading data:', err);
    }
  });
}

function syncUI() {
  setVal('masterToggle', enabled);

  // Moodle
  setVal('darkMode', moodleSettings.dark);
  setVal('accentColor', moodleSettings.accentColor);
  setVal('compactCards', moodleSettings.compactCards);
  setVal('hideBanners', moodleSettings.hideBanners);
  setVal('noAnimations', moodleSettings.noAnimations);
  setVal('showTimeline', moodleSettings.timeline);
  setVal('showCalendar', moodleSettings.calendar);
  setVal('showRecent', moodleSettings.recent);
  setVal('showNextTimeline', moodleSettings.showNextTimeline);
  setVal('hideNavbarM', moodleSettings.hideNavbar);
  setVal('hideSidebar', moodleSettings.hideSidebar);
  setVal('hidePageHeader', moodleSettings.hidePageHeader);
  setVal('hideNotifs', moodleSettings.hideNotifs);
  setVal('hideEditMode', moodleSettings.hideEditMode);
  setVal('hideFooterM', moodleSettings.hideFooter);
  setVal('showCourseCategory', moodleSettings.showCourseCategory);
  setVal('showFavourite', moodleSettings.showFavourite);
  setVal('showPagination', moodleSettings.showPagination);

  // CSS editors
  setVal('cssMoodle', customCSS.moodle);
  setVal('cssPortal', customCSS.portal);

  // Portal
  setVal('portalAccent', portalSettings.accentColor);
  setVal('portalHideNavbar', portalSettings.hideNavbar);
  setVal('portalHideFooter', portalSettings.hideFooter);
  setVal('portalHideSidebar', portalSettings.hideSidebar);
  setVal('showBkmPedagogic', portalSettings.showBkmPedagogic);
  setVal('showBkmInfos', portalSettings.showBkmInfos);
  setVal('showBkmTools', portalSettings.showBkmTools);
  setVal('showBkmDepartment', portalSettings.showBkmDepartment);
  setVal('showBkmCloud', portalSettings.showBkmCloud);
  setVal('showBkmPersonal', portalSettings.showBkmPersonal);
  setActiveThemeBtn(portalSettings.theme);
}

function setVal(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  if (el.type === 'checkbox') el.checked = !!value;
  else el.value = value ?? '';
}

function syncCoursesFromTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]?.id) return;
    chrome.tabs.sendMessage(tabs[0].id, { action: 'get_courses' }, (res) => {
      if (chrome.runtime.lastError || !res?.courses) return;
      const added = res.courses.filter(c => !knownCourses.includes(c));
      if (!added.length) return;
      knownCourses = [...new Set([...knownCourses, ...added])].sort();
      chrome.storage.local.set({ knownCourses });
      renderAgendaTab();
      renderColorTab();
    });
  });
}

// ── Agenda tab ────────────────────────────────────────────

function renderAgendaTab(filter = '') {
  const list = document.getElementById('agendaList');
  list.innerHTML = '';

  chrome.storage.local.get(['agendaEvents'], ({ agendaEvents = [] }) => {
    const today = todayStr();
    const now = Date.now();

    const future = agendaEvents
      .filter(ev => ev.date >= today)
      .map(ev => ({
        ...ev,
        startMs: toMs(ev.date, ev.sh, ev.sm),
        endMs: toMs(ev.date, ev.eh, ev.em),
      }))
      .sort((a, b) => a.startMs - b.startMs);

    if (!filter) renderPotentials(list, future, now);

    if (!future.length) {
      renderSimpleList(list, filter);
      return;
    }

    const filtered = future.filter(ev =>
      !filter || ev.courseName.toLowerCase().includes(filter)
    );

    if (!filtered.length) {
      list.appendChild(emptyMsg(filter ? `Aucun cours pour "${filter}"` : 'Navigue sur ton agenda pour charger les cours'));
      return;
    }

    const groups = groupByDate(filtered);
    Object.keys(groups).sort().slice(0, 7).forEach(date => {
      const dayEvents = groups[date];
      list.appendChild(makeDayLabel(date, today, dayEvents.length));
      dayEvents.forEach(ev => list.appendChild(makeAgendaRow(ev)));
    });
  });
}

function renderPotentials(list, future, now) {
  const current = future.find(ev => ev.startMs <= now && ev.endMs > now);
  const upcoming = future.filter(ev => ev.startMs > now);
  const nextMs = upcoming[0]?.startMs;
  const nextGroup = nextMs ? upcoming.filter(ev => ev.startMs === nextMs) : [];
  const items = [...(current ? [current] : []), ...nextGroup];
  if (!items.length) return;

  const section = el('div', 'potential-section');
  section.appendChild(el('div', 'potential-lbl', 'COURS POTENTIELS'));
  section.appendChild(el('div', 'potential-hint', 'Cours Moodle à ouvrir maintenant'));
  items.forEach(ev => section.appendChild(makePotentialCard(ev, ev === current)));
  list.appendChild(section);
}

function makePotentialCard(ev, isCurrent) {
  const s = courseSettings[ev.courseName] || {};
  const color = s.color || DEFAULT_COLOR;
  const card = el('div', `potential-card${isCurrent ? ' is-current' : ''}`);
  card.style.borderLeftColor = color;

  const top = el('div', 'pot-top');
  const status = el('span', 'pot-status');
  if (isCurrent) {
    status.append(el('span', 'pot-dot'), ' EN COURS');
  } else {
    status.textContent = '⏭ SUIVANT';
  }
  const time = el('span', 'pot-time', `${fmt(ev.sh, ev.sm)} → ${fmt(ev.eh, ev.em)}`);
  top.append(status, time);

  const name = el('div', 'pot-name', ev.courseName);
  const meta = el('div', 'pot-meta', `📍 ${ev.parsed?.room || '—'}${ev.parsed?.prof ? ' · 👤 ' + ev.parsed.prof : ''}`);
  card.append(top, name, meta);

  if (s.link) {
    const a = el('a', 'pot-btn', '🔗 Ouvrir le cours Moodle');
    a.href = s.link; a.target = '_blank'; a.rel = 'noopener noreferrer';
    card.appendChild(a);
  } else {
    card.appendChild(el('div', 'pot-no-link', "Aucun lien — ajoutez-le dans l'onglet Couleurs"));
  }
  return card;
}

function makeAgendaRow(ev) {
  const s = courseSettings[ev.courseName] || {};
  const col = s.color || DEFAULT_COLOR;
  const row = el('div', 'course-row');
  row.style.setProperty('--course-color', col);

  const time = el('span', 'course-time', `${fmt(ev.sh, ev.sm)}–${fmt(ev.eh, ev.em)}`);
  const swatch = el('div', 'color-swatch');
  swatch.style.background = col;
  const name = el('span', 'course-name', ev.courseName);
  name.title = ev.courseName;

  row.append(time, swatch, name);
  if (ev.parsed?.room) {
    const room = ev.parsed.room.split(',')[0].trim();
    if (room) row.appendChild(el('span', 'course-tag', room));
  }
  return row;
}

function renderSimpleList(list, filter = '') {
  const courses = knownCourses.filter(c => !filter || c.toLowerCase().includes(filter));
  if (!courses.length) {
    list.appendChild(emptyMsg(filter ? `Aucun cours pour "${filter}"` : 'Navigue sur ton agenda pour charger les cours'));
    return;
  }
  courses.forEach(name => {
    const col = courseSettings[name]?.color || DEFAULT_COLOR;
    const row = el('div', 'course-row');
    row.style.setProperty('--course-color', col);
    const swatch = el('div', 'color-swatch');
    swatch.style.background = col;
    const nameSpan = el('span', 'course-name', name);
    nameSpan.title = name;
    row.append(swatch, nameSpan);
    list.appendChild(row);
  });
}

// ── Color tab ─────────────────────────────────────────────

function renderColorTab(filter = '') {
  const list = document.getElementById('colorList');
  list.innerHTML = '';

  const courses = knownCourses.filter(c => !filter || c.toLowerCase().includes(filter));
  if (!courses.length) {
    list.appendChild(emptyMsg(filter ? `Aucun cours pour "${filter}"` : 'Aucun cours — navigue sur le Portail'));
    return;
  }

  courses.forEach(name => {
    const s = courseSettings[name] || {};
    const col = s.color || DEFAULT_COLOR;
    const vis = s.visible !== false;
    const link = s.link || '';
    const bacMatch = name.match(/\[?BAC\s*([1-3])\]?/i);
    const bac = bacMatch ? bacMatch[1] : null;

    const row = el('div', 'color-row');
    row.style.setProperty('--course-color', col);
    const main = el('div', 'color-row-main');

    const visCb = el('input', 'vis-check');
    visCb.type = 'checkbox'; visCb.checked = vis;

    const swatch = el('div', 'color-swatch');
    swatch.style.background = col;

    const hexInp = el('input', 'hex-input');
    hexInp.type = 'text'; hexInp.value = col;
    hexInp.placeholder = '#6366f1'; hexInp.maxLength = 7; hexInp.spellcheck = false;

    const nameSpan = el('span', 'course-name', name);
    nameSpan.title = name;

    main.append(visCb, swatch, hexInp, nameSpan);
    if (bac) main.appendChild(el('span', 'course-tag', `BAC ${bac}`));

    const linkRow = el('div', 'link-row');
    const linkInp = el('input', 'link-input');
    linkInp.type = 'text'; linkInp.placeholder = 'URL du cours Moodle…';
    linkInp.value = link; linkInp.autocomplete = 'off'; linkInp.spellcheck = false;
    linkRow.append(el('span', 'link-icon', '🔗'), linkInp);

    row.append(main, linkRow);

    hexInp.addEventListener('input', () => {
      let v = hexInp.value.trim();
      if (!v.startsWith('#')) v = '#' + v;
      hexInp.value = v;
      if (HEX_RE.test(v)) {
        swatch.style.background = v;
        row.style.setProperty('--course-color', v);
        hexInp.classList.remove('invalid');
        ensureSetting(name).color = v;
      } else {
        hexInp.classList.add('invalid');
      }
    });
    hexInp.addEventListener('blur', () => {
      if (hexInp.classList.contains('invalid')) {
        const saved = courseSettings[name]?.color || DEFAULT_COLOR;
        hexInp.value = saved;
        swatch.style.background = saved;
        row.style.setProperty('--course-color', saved);
        hexInp.classList.remove('invalid');
      }
    });
    visCb.addEventListener('change', () => { ensureSetting(name).visible = visCb.checked; });
    linkInp.addEventListener('input', () => { ensureSetting(name).link = linkInp.value.trim(); });

    list.appendChild(row);
  });
}

// ── Tab navigation ────────────────────────────────────────

function bindTabs() {
  const tabs = [...document.querySelectorAll('.tab')];
  const panels = [...document.querySelectorAll('.panel')];
  const scrollTopBtn = document.getElementById('scrollTopBtn');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      panels.forEach(p => {
        p.classList.remove('active', 'fade-in');
      });

      const activePanel = document.getElementById(`tab-${target}`);
      activePanel.classList.add('active');

      // Force reflow for animation
      setTimeout(() => {
        activePanel.classList.add('fade-in');
      }, 10);

      // Reset scroll when switching tabs
      window.scrollTo({ top: 0 });
      if (scrollTopBtn) scrollTopBtn.classList.remove('visible');
    });
  });

  // Initial fade-in for the active panel
  const activePanel = document.querySelector('.panel.active');
  if (activePanel) {
    setTimeout(() => activePanel.classList.add('fade-in'), 10);
  }

  // Scroll to top logic
  if (scrollTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 200) {
        scrollTopBtn.classList.add('visible');
      } else {
        scrollTopBtn.classList.remove('visible');
      }
    });

    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

function bindCssTabs() {
  const tabs = [...document.querySelectorAll('.css-tab')];
  const wraps = [...document.querySelectorAll('.css-wrap')];
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      wraps.forEach(w => w.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.target).classList.add('active');
    });
  });
}

// ── Moodle settings ───────────────────────────────────────

function bindMoodleToggles() {
  const toggleMap = {
    // Appearance
    darkMode: 'dark',
    compactCards: 'compactCards',
    hideBanners: 'hideBanners',
    noAnimations: 'noAnimations',
    // Visible blocks
    showTimeline: 'timeline',
    showCalendar: 'calendar',
    showRecent: 'recent',
    showNextTimeline: 'showNextTimeline',
    // Hide elements
    hideNavbarM: 'hideNavbar',
    hideSidebar: 'hideSidebar',
    hidePageHeader: 'hidePageHeader',
    hideNotifs: 'hideNotifs',
    hideEditMode: 'hideEditMode',
    hideFooterM: 'hideFooter',
    // Course card display
    showCourseCategory: 'showCourseCategory',
    showFavourite: 'showFavourite',
    showPagination: 'showPagination',
  };
  Object.entries(toggleMap).forEach(([id, key]) => {
    document.getElementById(id)?.addEventListener('change', e => {
      moodleSettings[key] = e.target.checked;
      scheduleAutoSave();
    });
  });
  document.getElementById('accentColor')?.addEventListener('input', e => {
    moodleSettings.accentColor = e.target.value;
    scheduleAutoSave();
  });
}

// ── Portal settings ───────────────────────────────────────

function bindPortalControls() {
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      portalSettings.theme = btn.dataset.theme;
      setActiveThemeBtn(btn.dataset.theme);
      scheduleAutoSave();
    });
  });
  document.getElementById('portalAccent')?.addEventListener('input', e => {
    portalSettings.accentColor = e.target.value;
    scheduleAutoSave();
  });
  const hideMap = {
    portalHideNavbar: 'hideNavbar',
    portalHideFooter: 'hideFooter',
    portalHideSidebar: 'hideSidebar',
    showBkmPedagogic: 'showBkmPedagogic',
    showBkmInfos: 'showBkmInfos',
    showBkmTools: 'showBkmTools',
    showBkmDepartment: 'showBkmDepartment',
    showBkmCloud: 'showBkmCloud',
    showBkmPersonal: 'showBkmPersonal',
  };
  Object.entries(hideMap).forEach(([id, key]) => {
    document.getElementById(id)?.addEventListener('change', e => {
      portalSettings[key] = e.target.checked;
      scheduleAutoSave();
    });
  });
}

function setActiveThemeBtn(theme) {
  document.querySelectorAll('.theme-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.theme === theme);
  });
}

// ── CSS presets ───────────────────────────────────────────

function bindPresets() {
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const { cssTarget, preset } = btn.dataset;
      const css = CSS_PRESETS[cssTarget]?.[preset];
      if (css === undefined) return;
      const id = cssTarget === 'moodle' ? 'cssMoodle' : 'cssPortal';
      const ta = document.getElementById(id);
      if (!ta) return;
      ta.value = preset === 'clearAll' ? '' : (ta.value ? ta.value + '\n\n' : '') + css;
      ta.focus();
      ta.selectionStart = ta.selectionEnd = ta.value.length;
    });
  });
}

// ── Bulk actions ──────────────────────────────────────────

function bindBulkActions() {
  const getFilter = () => document.getElementById('colorSearch')?.value?.toLowerCase() || '';
  document.getElementById('selectAll')?.addEventListener('click', () => {
    knownCourses.forEach(n => { ensureSetting(n).visible = true; });
    renderColorTab(getFilter());
  });
  document.getElementById('deselectAll')?.addEventListener('click', () => {
    knownCourses.forEach(n => { ensureSetting(n).visible = false; });
    renderColorTab(getFilter());
  });
  document.querySelectorAll('.btn-bac').forEach(btn => {
    btn.addEventListener('click', () => {
      const bac = btn.dataset.bac;
      const matches = knownCourses.filter(c => {
        const m = c.match(/\[?BAC\s*([1-3])\]?/i);
        return m && m[1] === bac;
      });
      if (!matches.length) return;
      const allVisible = matches.every(c => courseSettings[c]?.visible !== false);
      matches.forEach(c => { ensureSetting(c).visible = !allVisible; });
      btn.classList.toggle('active', !allVisible);
      renderColorTab(getFilter());
    });
  });
}

// ── Search ────────────────────────────────────────────────

function bindSearch() {
  document.getElementById('agendaSearch')?.addEventListener('input', e => {
    renderAgendaTab(e.target.value.toLowerCase().trim());
  });
  document.getElementById('colorSearch')?.addEventListener('input', e => {
    renderColorTab(e.target.value.toLowerCase().trim());
  });
}

// ── Master toggle ─────────────────────────────────────────

function bindMasterToggle() {
  document.getElementById('masterToggle')?.addEventListener('change', e => {
    enabled = e.target.checked;
    chrome.storage.local.set({ extensionEnabled: enabled });
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0]?.id) chrome.tabs.sendMessage(tabs[0].id, { action: 'set_enabled', enabled });
    });
    scheduleAutoSave();
  });
}

// ── Save ──────────────────────────────────────────────────

function bindSave() {
  document.getElementById('saveBtn')?.addEventListener('click', save);
}

function save() {
  customCSS.moodle = document.getElementById('cssMoodle')?.value || '';
  customCSS.portal = document.getElementById('cssPortal')?.value || '';

  document.querySelectorAll('#colorList .color-row').forEach(row => {
    const name = row.querySelector('.course-name')?.title;
    if (!name) return;
    const hexInp = row.querySelector('.hex-input');
    const visCb = row.querySelector('.vis-check');
    const linkInp = row.querySelector('.link-input');
    const s = ensureSetting(name);
    const v = hexInp?.value?.trim();
    if (v && HEX_RE.test(v)) s.color = v;
    if (visCb) s.visible = visCb.checked;
    if (linkInp) s.link = linkInp.value.trim();
  });

  // Build moodleSettings with legacy compat keys
  const ms = {
    ...moodleSettings,
    darkEnabled: moodleSettings.dark,
    showTimeline: moodleSettings.timeline,
    showCalendar: moodleSettings.calendar,
    showRecent: moodleSettings.recent,
  };

  const payload = {
    courseSettings,
    moodleSettings: ms,
    portalSettings,
    customCSS,
    extensionEnabled: enabled,
  };

  chrome.storage.local.set(payload, () => {
    if (chrome.runtime.lastError) {
      console.error('Storage error:', chrome.runtime.lastError);
      showSaveError('Erreur de sauvegarde');
      return;
    }
    
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'apply_settings',
          settings: courseSettings,
          moodleSettings: ms,
          portalSettings,
          customCSS,
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.warn('Tab message error:', chrome.runtime.lastError);
          }
        });
      }
    });
    showSaveConfirm();
  });
}

function showSaveConfirm() {
  const status = document.getElementById('statusMsg');
  if (status) {
    status.textContent = '✓ Sauvegardé !';
    status.classList.add('show');
    setTimeout(() => { status.classList.remove('show'); status.textContent = ''; }, 2500);
  }
  const btn = document.getElementById('saveBtn');
  const label = document.getElementById('saveBtnLabel');
  if (!btn || !label) return;
  label.textContent = '✓ Appliqué !';
  btn.classList.add('saved');
  setTimeout(() => {
    label.textContent = 'Sauvegarder & Appliquer';
    btn.classList.remove('saved');
  }, 2000);
}

function showSaveError(msg) {
  const status = document.getElementById('statusMsg');
  if (status) {
    status.textContent = '✗ ' + msg;
    status.classList.add('error', 'show');
    setTimeout(() => { status.classList.remove('error', 'show'); status.textContent = ''; }, 4000);
  }
}

function scheduleAutoSave() {
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    save();
  }, 2000);
}

// ── Helpers ───────────────────────────────────────────────

function ensureSetting(name) {
  if (!courseSettings[name]) courseSettings[name] = {};
  return courseSettings[name];
}

function el(tag, className = '', text = '') {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text) e.textContent = text;
  return e;
}

function emptyMsg(text) { return el('div', 'empty-msg', text); }
function fmt(h, m) { return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; }
function toMs(date, h, m) { return +new Date(`${date}T${fmt(h, m)}:00`); }
function todayStr() { return new Date().toLocaleDateString('en-CA'); }
function groupByDate(events) {
  return events.reduce((acc, ev) => {
    (acc[ev.date] = acc[ev.date] || []).push(ev);
    return acc;
  }, {});
}
function makeDayLabel(date, today, count) {
  const isToday = date === today;
  const text = isToday
    ? "Aujourd'hui"
    : capitalize(new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }));
  const div = el('div', 'day-label', text);
  if (count > 1) div.appendChild(el('span', 'day-count', `${count} cours`));
  return div;
}
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
