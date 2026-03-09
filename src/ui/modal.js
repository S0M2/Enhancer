/**
 * UI Service - Modal
 * Event details modal dialog
 */

import { setH } from '../utils/dom.js';
import { parseTitle, isDistanceCourse } from '../services/parser.js';
import * as storage from '../services/storage.js';

/**
 * Get type badge information
 * @param {string} type - Type (th, lab, auto, other)
 * @returns {Object}
 */
function getTypeBadge(type) {
  const badges = {
    'th': { text: '📖 Théorie', class: 'type-th' },
    'lab': { text: '🔬 Labo', class: 'type-lab' },
    'auto': { text: '📝 Autonomie', class: 'type-auto' },
    'other': { text: '📌 Cours', class: 'type-other' }
  };
  return badges[type] || badges['other'];
}

/**
 * Get accent color for course type
 * @param {string} type
 * @returns {string}
 */
function getTypeColor(type) {
  const colors = {
    'th': '#6366f1',
    'lab': '#f97316',
    'auto': '#22c55e',
    'other': '#6366f1'
  };
  return colors[type] || '#6366f1';
}

/**
 * Open event detail modal
 * @param {Element} cardEl - Event card element
 */
export async function openModal(cardEl) {
  const original = cardEl.dataset.original;
  const dl = cardEl.dataset.dateLabel;
  const parsed = parseTitle(original);

  if (!parsed) return;

  const name = parsed.name;
  const courseSetting = await storage.getCourseSetting(name);
  const link = courseSetting?.link || null;
  const isDist = isDistanceCourse(original);
  const color = courseSetting?.color || '#6366f1';
  const badge = getTypeBadge(parsed.type);

  let modal = document.getElementById('cce-modal');
  if (!modal) {
    modal = document.createElement('dialog');
    modal.id = 'cce-modal';
    document.body.appendChild(modal);
    modal.addEventListener('click', e => {
      if (e.target === modal) modal.close();
    });
  }

  const timeEl = cardEl.querySelector('.cce-time, .cce-we-time');
  const time = timeEl?.innerText?.replace('⚠ ', '') || '';

  const modalContent = `
    <div class="cce-m">
      <button class="cce-m-x" id="cce-m-close">✕</button>
      <div class="cce-m-hero" style="border-left:4px solid ${color}">
        <div class="cce-m-room${isDist ? ' dist' : ''}">${isDist ? '🌐 À distance' : (parsed.room || '—')}</div>
        <div>
          <div class="cce-m-name">${parsed.name}</div>
          ${parsed.prof ? `<div class="cce-m-prof">👤 ${parsed.prof}</div>` : ''}
        </div>
      </div>
      <div class="cce-m-badges">
        <span class="cce-m-badge ${badge.class}">${badge.text}</span>
      </div>
      <div class="cce-m-grid">
        <div class="cce-m-cell"><span class="cce-m-lbl">📅 Date</span><span class="cce-m-val">${dl}</span></div>
        <div class="cce-m-cell"><span class="cce-m-lbl">🕐 Horaire</span><span class="cce-m-val">${time}</span></div>
        <div class="cce-m-cell wide"><span class="cce-m-lbl">🏫 Salle</span><span class="cce-m-val">${parsed.room || '—'}</span></div>
      </div>
      ${link ? `<a href="${link}" target="_blank" class="cce-m-action">🔗 Ouvrir le cours</a>` : `<div class="cce-m-nolink">Aucun lien — ajoutez-le dans l'extension</div>`}
    </div>
  `;

  setH(modal, modalContent);
  modal.querySelector('#cce-m-close').onclick = () => modal.close();
  modal.showModal();
}

/**
 * Get modal styles
 * @returns {string}
 */
export function getModalStyles() {
  return `
/* ═══ EVENT MODAL ═══ */
#cce-modal { 
  border: none; 
  background: transparent; 
  padding: 0; 
  max-width: 520px; 
  width: 90vw;
}

#cce-modal::backdrop { 
  background: rgba(0, 0, 0, 0.75); 
  backdrop-filter: blur(8px); 
  -webkit-backdrop-filter: blur(8px);
}

.cce-m { 
  background: linear-gradient(135deg, #0c1323, #1a1f3a); 
  border: 1px solid rgba(99, 102, 241, 0.25); 
  border-radius: 20px; 
  padding: 28px; 
  position: relative; 
  box-shadow: 0 20px 70px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.05); 
  color: #e2e8f0; 
  animation: modalSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modalSlideIn {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.cce-m-x { 
  position: absolute; 
  top: 16px; 
  right: 16px; 
  background: rgba(255, 255, 255, 0.08); 
  border: 1px solid rgba(255, 255, 255, 0.12); 
  color: #94a3b8; 
  width: 36px; 
  height: 36px; 
  border-radius: 10px; 
  font-size: 16px; 
  font-weight: 600; 
  cursor: pointer; 
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
  display: flex; 
  align-items: center; 
  justify-content: center;
}

.cce-m-x:hover { 
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(239, 68, 68, 0.15)); 
  color: #fca5a5; 
  border-color: rgba(239, 68, 68, 0.4); 
  transform: scale(1.1) rotate(90deg);
}

.cce-m-hero { 
  display: flex; 
  align-items: center; 
  gap: 16px; 
  margin-bottom: 18px; 
  padding: 16px; 
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(99, 102, 241, 0.04)); 
  border-radius: 14px; 
  border: 1px solid rgba(99, 102, 241, 0.15);
}

.cce-m-room { 
  font-size: 13px; 
  font-weight: 800; 
  color: #a78bfa; 
  min-width: 90px; 
  text-transform: uppercase; 
  letter-spacing: 0.5px;
}

.cce-m-room.dist { 
  color: #38bdf8; 
  background: rgba(56, 189, 248, 0.1); 
  padding: 4px 8px; 
  border-radius: 6px;
}

.cce-m-name { 
  font-size: 17px; 
  font-weight: 800; 
  color: #f1f5f9; 
  margin-bottom: 4px; 
  letter-spacing: -0.3px;
}

.cce-m-prof { 
  font-size: 13px; 
  color: #a5b4fc; 
  font-style: normal; 
  font-weight: 600;
}

.cce-m-badges { 
  display: flex; 
  gap: 8px; 
  margin-bottom: 18px; 
  flex-wrap: wrap;
}

.cce-m-badge { 
  font-size: 11px; 
  font-weight: 800; 
  padding: 6px 12px; 
  border-radius: 8px; 
  letter-spacing: 0.6px; 
  text-transform: uppercase; 
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); 
  transition: all 0.2s;
}

.cce-m-badge.type-th { 
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.08)); 
  color: #93c5fd; 
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.cce-m-badge.type-lab { 
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(249, 115, 22, 0.08)); 
  color: #fdba74; 
  border: 1px solid rgba(249, 115, 22, 0.3);
}

.cce-m-badge.type-auto { 
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.08)); 
  color: #86efac; 
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.cce-m-badge.type-other { 
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.08)); 
  color: #d8b4fe; 
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.cce-m-grid { 
  display: grid; 
  grid-template-columns: 1fr 1fr; 
  gap: 10px; 
  margin-bottom: 18px;
}

.cce-m-cell { 
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.01)); 
  border: 1px solid rgba(99, 102, 241, 0.1); 
  border-radius: 12px; 
  padding: 12px; 
  display: flex; 
  flex-direction: column; 
  gap: 4px; 
  transition: all 0.2s;
}

.cce-m-cell:hover { 
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(99, 102, 241, 0.03)); 
  border-color: rgba(99, 102, 241, 0.2);
}

.cce-m-cell.wide { 
  grid-column: 1 / -1;
}

.cce-m-lbl { 
  font-size: 10px; 
  font-weight: 700; 
  text-transform: uppercase; 
  letter-spacing: 1.2px; 
  color: #818cf8;
}

.cce-m-val { 
  font-size: 14px; 
  font-weight: 600; 
  color: #e0e7ff;
}

.cce-m-action { 
  display: block; 
  width: 100%; 
  padding: 14px; 
  text-align: center; 
  font-size: 14px; 
  font-weight: 700; 
  color: #fff!important; 
  background: linear-gradient(135deg, #818cf8, #6366f1); 
  border-radius: 12px; 
  cursor: pointer; 
  text-decoration: none!important; 
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3); 
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); 
  text-transform: uppercase; 
  letter-spacing: 0.5px; 
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.cce-m-action:hover { 
  box-shadow: 0 10px 32px rgba(99, 102, 241, 0.5); 
  transform: translateY(-3px) scale(1.02); 
  background: linear-gradient(135deg, #a78bfa, #818cf8);
}

.cce-m-action:active { 
  transform: translateY(-1px) scale(0.98);
}

.cce-m-nolink { 
  text-align: center; 
  font-size: 12px; 
  color: #64748b; 
  font-style: italic; 
  padding: 10px; 
  background: rgba(0, 0, 0, 0.1); 
  border-radius: 8px; 
  border: 1px solid rgba(255, 255, 255, 0.04);
}

/* Modal responsive */
@media (max-width: 480px) {
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
`;
}
