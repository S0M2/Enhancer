/**
 * UI Service - Agenda Rendering
 * Functions for building agenda views (list, week, month)
 */

import { setH, addH, createElement } from '../utils/dom.js';
import { pad2, formatDate, formatTime } from '../utils/helpers.js';
import { formatDateFR } from '../services/parser.js';

/**
 * Build list view for agenda
 * @param {Array} events - Array of event objects
 * @returns {HTMLElement}
 */
export function buildListView(events) {
  const container = createElement('div', { id: 'cce-list-view' });
  
  if (!events || events.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:#64748b; padding:20px;">Aucun événement</p>';
    return container;
  }

  // Group events by date
  const grouped = {};
  events.forEach(e => {
    const date = e.dateLabel || formatDateFR(e.date);
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(e);
  });

  // Render each day group
  Object.entries(grouped).forEach(([dateLabel, dayEvents]) => {
    const dayEl = createElement('div', { class: 'cce-day' });
    
    // Day header
    const header = createElement('div', { class: 'cce-day-head' });
    header.innerHTML = `<span class="cce-day-name">${dateLabel}</span>`;
    dayEl.appendChild(header);

    // Event cards
    dayEvents.forEach(e => {
      const card = createElement('div', { class: 'cce-card' });
      card.dataset.original = e.original;
      card.dataset.dateLabel = dateLabel;
      
      const time = e.time?.replace('⚠ ', '') || '';
      const name = e.name || '';
      const room = e.room || '—';

      card.innerHTML = `
        <span class="cce-time">${time}</span>
        <span class="cce-name">${name}</span>
        <span class="cce-room">${room}</span>
      `;
      
      dayEl.appendChild(card);
    });

    container.appendChild(dayEl);
  });

  return container;
}

/**
 * Build week view for agenda
 * @param {Array} events - Array of event objects
 * @returns {HTMLElement}
 */
export function buildWeekView(events) {
  const container = createElement('div', { id: 'cce-week-view' });
  
  if (!events || events.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:#64748b; padding:20px;">Aucun événement cette semaine</p>';
    return container;
  }

  // Generate week data
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    weekDays.push(d);
  }

  // Create week header
  const weekHeader = createElement('div', { 
    style: 'display:grid; grid-template-columns:repeat(7,1fr); gap:2px; margin-bottom:16px;'
  });

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  weekDays.forEach((d, idx) => {
    const headerCell = createElement('div', {
      style: `text-align:center; padding:8px; font-weight:700; color:#818cf8; font-size:12px;`
    });
    const isToday = d.toDateString() === now.toDateString() ? ' ← Aujourd\'hui' : '';
    headerCell.textContent = `${dayNames[idx]} ${d.getDate()}${isToday}`;
    weekHeader.appendChild(headerCell);
  });

  container.appendChild(weekHeader);

  // Create week grid
  const weekGrid = createElement('div', {
    style: 'display:grid; grid-template-columns:repeat(7,1fr); gap:2px; min-height:200px;'
  });

  weekDays.forEach(d => {
    const dayCell = createElement('div', {
      class: 'cce-mc',
      style: `border:1px solid rgba(99,102,241,0.1); padding:4px; min-height:80px;`
    });

    // Find events for this day
    const dayEvents = events.filter(e => e.date && e.date.toDateString() === d.toDateString());
    
    if (dayEvents.length === 0) {
      dayCell.innerHTML = '<span style="font-size:11px; color:#64748b;">—</span>';
    } else {
      dayEvents.forEach(e => {
        const eventEl = createElement('div', {
          class: 'cce-we-time',
          style: 'font-size:10px; color:#a78bfa; margin-bottom:2px;'
        });
        eventEl.textContent = e.time?.replace('⚠ ', '') || '';
        dayCell.appendChild(eventEl);

        const nameEl = createElement('div', {
          class: 'cce-we-name',
          style: 'font-size:11px; color:#e0e7ff; line-height:1.2; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;'
        });
        nameEl.textContent = e.name || '';
        dayCell.appendChild(nameEl);
      });
    }

    weekGrid.appendChild(dayCell);
  });

  container.appendChild(weekGrid);
  return container;
}

/**
 * Build month view for agenda
 * @param {Array} events - Array of event objects
 * @returns {HTMLElement}
 */
export function buildMonthView(events) {
  const container = createElement('div', { id: 'cce-month-view' });
  
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // Month header
  const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  
  const header = createElement('div', {
    class: 'cce-month-lbl',
    style: 'text-align:center; font-size:18px; font-weight:800; color:#e0e7ff; padding:16px 0 8px;'
  });
  header.textContent = `${months[month]} ${year}`;
  container.appendChild(header);

  // Day names header
  const dayHeader = createElement('div', {
    style: 'display:grid; grid-template-columns:repeat(7,1fr); border-bottom:2px solid rgba(99,102,241,0.1); background:linear-gradient(135deg,rgba(99,102,241,0.08),rgba(99,102,241,0.03));'
  });

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  dayNames.forEach(name => {
    const cell = createElement('div', {
      style: 'text-align:center; padding:10px 0; font-size:11px; font-weight:800; color:#818cf8; text-transform:uppercase; letter-spacing:1.2px;'
    });
    cell.textContent = name;
    dayHeader.appendChild(cell);
  });
  container.appendChild(dayHeader);

  // Month grid
  const monthGrid = createElement('div', {
    style: 'display:grid; grid-template-columns:repeat(7,1fr);'
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    const emptyCell = createElement('div', {
      class: 'cce-mc empty',
      style: 'min-height:80px; background:rgba(0,0,0,0.1); cursor:default;'
    });
    monthGrid.appendChild(emptyCell);
  }

  // Days of month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const cell = createElement('div', {
      class: 'cce-mc',
      style: `min-height:80px; border-right:1px solid rgba(99,102,241,0.08); border-bottom:1px solid rgba(99,102,241,0.08); padding:8px; display:flex; flex-direction:column;`
    });

    if (date.toDateString() === now.toDateString()) {
      cell.classList.add('today');
      cell.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(99,102,241,0.03))';
    }

    // Day number
    const dayNum = createElement('div', {
      class: 'cce-mc-n',
      style: 'font-size:14px; font-weight:800; color:#cbd5e1; width:28px; height:28px; display:flex; align-items:center; justify-content:center; border-radius:8px; background:rgba(255,255,255,0.03); transition:all 0.2s;'
    });
    dayNum.textContent = day;
    cell.appendChild(dayNum);

    // Events this day
    const dayEvents = events.filter(e => e.date && e.date.getDate() === day);
    if (dayEvents.length > 0) {
      cell.classList.add('has-evs');
      const dots = createElement('div', { class: 'cce-mc-dots', style: 'display:flex; gap:3px; flex-wrap:wrap; margin-top:auto;' });
      dayEvents.slice(0, 3).forEach(() => {
        const dot = createElement('div', {
          class: 'cce-mc-dot',
          style: 'width:6px; height:6px; border-radius:50%; background:rgba(99,102,241,0.7); transition:all 0.2s;'
        });
        dots.appendChild(dot);
      });
      cell.appendChild(dots);

      if (dayEvents.length > 3) {
        const cnt = createElement('div', {
          class: 'cce-mc-cnt',
          style: 'font-size:10px; font-weight:700; color:#a78bfa; margin-top:auto;'
        });
        cnt.textContent = `+${dayEvents.length - 3}`;
        cell.appendChild(cnt);
      }
    }

    monthGrid.appendChild(cell);
  }

  container.appendChild(monthGrid);
  return container;
}

/**
 * Create event card for agenda
 * @param {Object} event - Event data
 * @returns {HTMLElement}
 */
export function createEventCard(event) {
  const card = createElement('div', { class: 'cce-card' });
  card.dataset.original = event.original;
  card.dataset.dateLabel = event.dateLabel;

  const html = `
    <span class="cce-time">${event.time || ''}</span>
    <span class="cce-name">${event.name || ''}</span>
    <span class="cce-room">${event.room || '—'}</span>
  `;

  card.innerHTML = html;
  return card;
}
