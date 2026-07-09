// ============================================================
//  NOVUS HOMME — Admin Core
//  Shared state, storage helpers, and UI utilities
// ============================================================

// ---- Format helpers ----
function fmt(n) { return new Intl.NumberFormat('uz-UZ').format(n) + ' UZS'; }
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('uz-UZ', { day:'2-digit', month:'2-digit', year:'numeric' });
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

// ---- Status config ----
const ORDER_STATUSES = {
  pending:    { label: 'Kutilmoqda',   color: 'bg-yellow-100 text-yellow-800' },
  processing: { label: 'Jarayonda',    color: 'bg-blue-100 text-blue-800'   },
  shipped:    { label: 'Yuborildi',    color: 'bg-purple-100 text-purple-800'},
  delivered:  { label: 'Yetkazildi',  color: 'bg-green-100 text-green-800'  },
  cancelled:  { label: 'Bekor qilindi', color: 'bg-red-100 text-red-800'   },
};

const COLOR_NAMES = {
  '#FFFFFF':'Oq','#1A1A1A':'Qora','#1B2D4F':"To'q ko'k",
  '#8B8B8B':'Kulrang','#C9A96E':'Tuya rangi','#6B7B8D':"Po'lat ko'k",
  '#6B5A4E':'Jigarrang','#8B7355':'Xaki','#8B5A2B':'Ochiq jigarrang',
};

function statusBadge(s) {
  const st = ORDER_STATUSES[s] || { label: s, color: 'bg-gray-100 text-gray-700' };
  return `<span class="px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide ${st.color}">${st.label}</span>`;
}

function stockBadge(n) {
  if (n === 0)  return `<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700">Tugadi</span>`;
  if (n <= 10)  return `<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-100 text-orange-700">Kam: ${n}</span>`;
  return `<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-green-100 text-green-700">${n} ta</span>`;
}

// ---- Auth ----
function isLoggedIn() { return apiIsLoggedIn(); }
function requireAuth() {
  if (!isLoggedIn()) { window.location.href = 'login.html'; }
}
function logout() { apiLogout(); window.location.href = 'login.html'; }

// ---- Toast ----
function toast(msg, type='success') {
  const existing = document.getElementById('nh-toast');
  if (existing) existing.remove();
  const colors = { success:'bg-green-600', error:'bg-red-600', info:'bg-[#1A1A1A]' };
  const el = document.createElement('div');
  el.id = 'nh-toast';
  el.className = `fixed bottom-6 right-6 z-[9999] ${colors[type]||colors.info} text-white px-5 py-3 rounded shadow-lg text-sm font-medium flex items-center gap-3 transition-all`;
  el.innerHTML = `<span>${msg}</span>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ---- Confirm modal ----
function confirmModal(msg, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 z-[9998] bg-black/40 flex items-center justify-center p-4';
  overlay.innerHTML = `
    <div class="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
      <p class="text-[#1A1A1A] text-sm font-medium mb-6">${msg}</p>
      <div class="flex gap-3 justify-end">
        <button id="cm-cancel" class="px-5 py-2 border border-gray-200 text-[#6B6B6B] rounded text-xs font-semibold hover:bg-gray-50">Bekor</button>
        <button id="cm-ok" class="px-5 py-2 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700">O'chirish</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById('cm-cancel').onclick = () => overlay.remove();
  document.getElementById('cm-ok').onclick = () => { overlay.remove(); onConfirm(); };
}

// ---- Sidebar active link ----
document.addEventListener('DOMContentLoaded', () => {
  const links = document.querySelectorAll('[data-nav]');
  const page = location.pathname.split('/').pop();
  links.forEach(l => {
    if (l.getAttribute('href') === page || (page === '' && l.getAttribute('href') === 'index.html')) {
      l.classList.add('bg-[#C9A96E]/10','text-[#C9A96E]','border-r-2','border-[#C9A96E]');
      l.classList.remove('text-[#6B6B6B]','hover:bg-gray-50','hover:text-[#1A1A1A]');
    }
  });
  // update order count badge
  const badge = document.getElementById('order-badge');
  if (badge && isLoggedIn()) {
    apiOrders.getAll('pending').then(orders => {
      if (orders.length > 0) { badge.textContent = orders.length; badge.classList.remove('hidden'); }
    }).catch(() => {});
  }
});
