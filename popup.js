// ═══════════════════════════════════════════════
//  ENHANCER — popup.js v3.2
// ═══════════════════════════════════════════════

// ── Constants ──────────────────────────────────

const CSS_PRESETS = {
  moodle: {
    hideHeader: `/* Cacher le header */\n#page-header, .page-header-headings { display: none !important; }`,
    bigCards: `/* Cards de cours plus grandes */\n.course-card { min-height: 200px !important; }\n.course-card .coursename { font-size: 16px !important; font-weight: 800 !important; }`,
    noBanner: `/* Cacher les bannières */\n.course-card .card-img { display: none !important; }\n.course-card { padding-top: 12px !important; }`,
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

// ── State ───────────────────────────────────────

let courseSettings = {};
let knownCourses = [];
let moodleSettings = {};
let portalSettings = {};
let customCSS = { moodle: '', portal: '' };
let enabled = true;

// ── Bootstrap ───────────────────────────────────

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

// ── Data loading ────────────────────────────────

function loadData() {
  const keys = ['courseSettings', 'knownCourses', 'moodleSettings', 'portalSettings', 'customCSS', 'extensionEnabled'];
  chrome.storage.local.get(keys, (res) => {
    if (chrome.runtime.lastError) return;

    courseSettings = res.courseSettings || {};
    knownCourses = res.knownCourses || [];
    customCSS = res.customCSS || { moodle: '', portal: '' };
    enabled = res.extensionEnabled !== false;

    const m = res.moodleSettings || {};
    moodleSettings = {
      dark: m.darkEnabled ?? m.dark ?? true,
      timeline: m.showTimeline ?? m.timeline ?? true,
      calendar: m.showCalendar ?? m.calendar ?? true,
      recent: m.showRecent ?? m.recent ?? true,
      hideNotifs: m.hideNotifs ?? false,
      hideFooter: m.hideFooter ?? false,
      hideSidebar: m.hideSidebar ?? false,
      accentColor: m.accentColor || DEFAULT_COLOR,
    };

    const p = res.portalSettings || {};
    portalSettings = {
      theme: p.theme || 'default',
      accentColor: p.accentColor || DEFAULT_COLOR,
      hideNavbar: p.hideNavbar ?? false,
      hideFooter: p.hideFooter ?? false,
      hideSidebar: p.hideSidebar ?? false,
    };

    syncUI();
    syncCoursesFromTab();
    renderAgendaTab();
    renderColorTab();
  });
}

function syncUI() {
  setVal('masterToggle', enabled);
  setVal('darkMode', moodleSettings.dark);
  setVal('accentColor', moodleSettings.accentColor);
  setVal('showTimeline', moodleSettings.timeline);
  setVal('showCalendar', moodleSettings.calendar);
  setVal('showRecent', moodleSettings.recent);
  setVal('hideNotifs', moodleSettings.hideNotifs);
  setVal('hideFooterM', moodleSettings.hideFooter);
  setVal('hideSidebar', moodleSettings.hideSidebar);
  setVal('cssMoodle', customCSS.moodle);
  setVal('cssPortal', customCSS.portal);
  setVal('portalAccent', portalSettings.accentColor);
  setVal('portalHideNavbar', portalSettings.hideNavbar);
  setVal('portalHideFooter', portalSettings.hideFooter);
  setVal('portalHideSidebar', portalSettings.hideSidebar);
  setActiveThemeBtn(portalSettings.theme);
}

function setVal(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  if (el.type === 'checkbox') el.checked = value;
  else el.value = value;
}

function syncCoursesFromTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]?.id) return;
    chrome.tabs.sendMessage(tabs[0].id, { action: 'get_courses' }, (res) => {
      if (chrome.runtime.lastError || !res?.courses) return;
      const added = res.courses.filter(c => !knownCourses.includes(c));
      if (!added.length) return;
      knownCourses = [...new Set([...knownCourses, ...added])].sort();
      renderAgendaTab();
      renderColorTab();
    });
  });
}

// ── Agenda tab ──────────────────────────────────

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

    renderPotentials(list, future, now);

    if (!future.length) {
      renderSimpleList(list, filter);
      return;
    }

    const groups = groupByDate(future);
    Object.keys(groups).sort().slice(0, 6).forEach(date => {
      list.appendChild(makeDayLabel(date, today));
      groups[date]
        .filter(ev => !filter || ev.courseName.toLowerCase().includes(filter))
        .forEach(ev => list.appendChild(makeAgendaRow(ev)));
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
  section.appendChild(el('div', 'potential-lbl', '⚡ COURS POTENTIELS'));
  section.appendChild(el('div', 'potential-hint', 'Cours Moodle à ouvrir maintenant'));
  items.forEach(ev => section.appendChild(makePotentialCard(ev, ev === current)));
  list.appendChild(section);
}

function makePotentialCard(ev, isCurrent) {
  const s = courseSettings[ev.courseName] || {};
  const color = s.color || DEFAULT_COLOR;
  const card = el('div', `potential-card${isCurrent ? ' is-current' : ''}`);
  card.style.borderLeftColor = color;

  const statusDot = isCurrent ? '<span class="pot-dot"></span>' : '';
  const statusTxt = isCurrent ? 'EN COURS' : '⏭ SUIVANT';

  const top = el('div', 'pot-top');
  const status = el('span', 'pot-status');
  if (isCurrent) {
    const dot = el('span', 'pot-dot');
    status.append(dot, 'EN COURS');
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
    a.href = s.link;
    a.target = '_blank';
    card.appendChild(a);
  } else {
    card.appendChild(el('div', 'pot-no-link', 'Aucun lien — ajoutez-le dans Couleurs'));
  }

  return card;
}

function makeAgendaRow(ev) {
  const s = courseSettings[ev.courseName] || {};
  const col = s.color || DEFAULT_COLOR;
  const row = el('div', 'course-row');
  const time = el('span', 'course-time', `${fmt(ev.sh, ev.sm)}–${fmt(ev.eh, ev.em)}`);
  const swatch = el('div', 'color-swatch');
  swatch.style.background = col;
  const name = el('span', 'course-name', ev.courseName);
  name.title = ev.courseName;

  row.append(time, swatch, name);
  if (ev.parsed?.room) row.appendChild(el('span', 'course-tag', ev.parsed.room.split(',')[0]));
  return row;
}

function renderSimpleList(list, filter = '') {
  const courses = knownCourses.filter(c => !filter || c.toLowerCase().includes(filter));
  if (!courses.length) {
    list.appendChild(el('div', 'empty-msg', 'Navigue sur ton agenda pour charger les cours'));
    return;
  }
  courses.forEach(name => {
    const col = courseSettings[name]?.color || DEFAULT_COLOR;
    const row = el('div', 'course-row');
    const swatch = el('div', 'color-swatch');
    swatch.style.background = col;
    const nameSpan = el('span', 'course-name', name);
    nameSpan.title = name;
    row.append(swatch, nameSpan);
    list.appendChild(row);
  });
}

// ── Color tab ───────────────────────────────────

function renderColorTab(filter = '') {
  const list = document.getElementById('colorList');
  list.innerHTML = '';

  const courses = knownCourses.filter(c => !filter || c.toLowerCase().includes(filter));
  if (!courses.length) {
    list.appendChild(el('div', 'empty-msg', 'Aucun cours — navigue sur le Portail'));
    return;
  }

  courses.forEach(name => {
    const s = courseSettings[name] || {};
    const col = s.color || DEFAULT_COLOR;
    const vis = s.visible !== false;
    const link = s.link || '';
    const bac = (name.match(/\[BAC\s*([1-3])\]/i) || [])[1];

    const row = el('div', 'color-row');
    const main = el('div', 'color-row-main');

    const visCb = el('input', 'vis-check');
    visCb.type = 'checkbox';
    visCb.checked = vis;

    const swatch = el('div', 'color-swatch');
    swatch.style.background = col;

    const hexInp = el('input', 'hex-input');
    hexInp.type = 'text';
    hexInp.value = col;
    hexInp.placeholder = '#6366f1';
    hexInp.maxLength = 7;
    hexInp.spellcheck = false;

    const nameSpan = el('span', 'course-name', name);
    nameSpan.title = name;

    main.append(visCb, swatch, hexInp, nameSpan);
    if (bac) main.appendChild(el('span', 'course-tag', `BAC ${bac}`));

    const linkRow = el('div', 'link-row');
    const linkIcon = el('span', 'link-icon', '🔗');
    const linkInp = el('input', 'link-input');
    linkInp.type = 'text';
    linkInp.placeholder = 'URL Moodle du cours…';
    linkInp.value = link;
    linkRow.append(linkIcon, linkInp);

    row.append(main, linkRow);


    hexInp.addEventListener('input', () => {
      let v = hexInp.value.trim();
      if (!v.startsWith('#')) v = '#' + v;
      hexInp.value = v;
      if (HEX_RE.test(v)) {
        swatch.style.background = v;
        hexInp.dataset.valid = 'true';
        hexInp.style.color = '';
        ensureSetting(name).color = v;
      } else {
        hexInp.dataset.valid = 'false';
        hexInp.style.color = '#ef4444';
      }
    });

    hexInp.addEventListener('blur', () => {
      if (hexInp.dataset.valid === 'false') {
        hexInp.value = courseSettings[name]?.color || DEFAULT_COLOR;
        hexInp.style.color = '';
        swatch.style.background = hexInp.value;
      }
    });

    visCb.addEventListener('change', () => { ensureSetting(name).visible = visCb.checked; });
    linkInp.addEventListener('input', () => { ensureSetting(name).link = linkInp.value.trim(); });

    list.appendChild(row);
  });
}

// ── Tab navigation ──────────────────────────────

function bindTabs() {
  const tabs = [...document.querySelectorAll('.tab')];
  const panels = [...document.querySelectorAll('.panel')];
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
  });
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

// ── Moodle settings ─────────────────────────────

function bindMoodleToggles() {
  const toggleMap = {
    darkMode: 'dark',
    showTimeline: 'timeline',
    showCalendar: 'calendar',
    showRecent: 'recent',
    hideNotifs: 'hideNotifs',
    hideFooterM: 'hideFooter',
    hideSidebar: 'hideSidebar',
  };
  Object.entries(toggleMap).forEach(([id, key]) => {
    document.getElementById(id)?.addEventListener('change', e => {
      moodleSettings[key] = e.target.checked;
    });
  });
  document.getElementById('accentColor')?.addEventListener('input', e => {
    moodleSettings.accentColor = e.target.value;
  });
}

// ── Portal settings ─────────────────────────────

function bindPortalControls() {
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      portalSettings.theme = btn.dataset.theme;
      setActiveThemeBtn(btn.dataset.theme);
    });
  });

  document.getElementById('portalAccent')?.addEventListener('input', e => {
    portalSettings.accentColor = e.target.value;
  });

  const hideMap = {
    portalHideNavbar: 'hideNavbar',
    portalHideFooter: 'hideFooter',
    portalHideSidebar: 'hideSidebar',
  };
  Object.entries(hideMap).forEach(([id, key]) => {
    document.getElementById(id)?.addEventListener('change', e => {
      portalSettings[key] = e.target.checked;
    });
  });
}

function setActiveThemeBtn(theme) {
  document.querySelectorAll('.theme-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.theme === theme);
  });
}

// ── CSS presets ──────────────────────────────────

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
    });
  });
}

// ── Bulk actions ─────────────────────────────────

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
      const matches = knownCourses.filter(c => c.includes(`BAC ${bac}`) || c.includes(`[BAC${bac}]`));
      if (!matches.length) return;
      const allVisible = matches.every(c => courseSettings[c]?.visible !== false);
      matches.forEach(c => { ensureSetting(c).visible = !allVisible; });
      renderColorTab(getFilter());
    });
  });
}

// ── Search ───────────────────────────────────────

function bindSearch() {
  document.getElementById('agendaSearch')?.addEventListener('input', e => renderAgendaTab(e.target.value.toLowerCase()));
  document.getElementById('colorSearch')?.addEventListener('input', e => renderColorTab(e.target.value.toLowerCase()));
}

// ── Master toggle ────────────────────────────────

function bindMasterToggle() {
  document.getElementById('masterToggle')?.addEventListener('change', e => {
    enabled = e.target.checked;
    chrome.storage.local.set({ extensionEnabled: enabled });
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0]?.id) chrome.tabs.sendMessage(tabs[0].id, { action: 'set_enabled', enabled });
    });
  });
}

// ── Save ─────────────────────────────────────────

function bindSave() {
  document.getElementById('saveBtn')?.addEventListener('click', save);
}

function save() {
  // Collect CSS
  customCSS.moodle = document.getElementById('cssMoodle')?.value || '';
  customCSS.portal = document.getElementById('cssPortal')?.value || '';

  // Collect color/link/visibility from colorList
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

  const ms = {
    ...moodleSettings,
    // Legacy keys for backward compat
    darkEnabled: moodleSettings.dark,
    showTimeline: moodleSettings.timeline,
    showCalendar: moodleSettings.calendar,
    showRecent: moodleSettings.recent,
  };

  chrome.storage.local.set({ courseSettings, moodleSettings: ms, portalSettings, customCSS, extensionEnabled: enabled }, () => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'apply_settings',
          settings: courseSettings,
          moodleSettings: ms,
          portalSettings,
          customCSS,
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
    setTimeout(() => status.classList.remove('show'), 2500);
  }
  const btn = document.getElementById('saveBtn');
  if (!btn) return;
  btn.textContent = '✓ Appliqué !';
  btn.style.background = 'linear-gradient(135deg,#22c55e,#16a34a)';
  setTimeout(() => {
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Sauvegarder & Appliquer`;
    btn.style.background = '';
  }, 2000);
}

// ── Helpers ──────────────────────────────────────

function ensureSetting(name) {
  if (!courseSettings[name]) courseSettings[name] = {};
  return courseSettings[name];
}

/** Create element with optional class and text */
function el(tag, className = '', text = '') {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text) e.textContent = text;
  return e;
}

function fmt(h, m) {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function toMs(date, h, m) {
  return +new Date(`${date}T${fmt(h, m)}:00`);
}

function todayStr() {
  return new Date().toLocaleDateString('en-CA');
}

function groupByDate(events) {
  return events.reduce((acc, ev) => {
    (acc[ev.date] = acc[ev.date] || []).push(ev);
    return acc;
  }, {});
}

function makeDayLabel(date, today) {
  const isToday = date === today;
  const label = isToday
    ? "Aujourd'hui"
    : capitalize(new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }));
  return el('div', 'day-label', label);
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
