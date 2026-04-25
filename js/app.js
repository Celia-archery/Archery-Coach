/* ============================================================
   app.js — Main controller: navigation, dashboard, init
   ============================================================ */

const App = (() => {

  const PAGES = ['dashboard','log','history','aimmap','community','profiles'];

  /* ---- Navigation ---- */
  function navigate(pageId) {
    if (!PAGES.includes(pageId)) return;
    PAGES.forEach(p => {
      const el = document.getElementById('page-' + p);
      if (el) el.classList.remove('active');
    });
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const target = document.getElementById('page-' + pageId);
    if (target) { target.classList.add('active'); target.scrollTop = 0; }
    const navEl = document.getElementById('nav-' + pageId);
    if (navEl) navEl.classList.add('active');

    switch (pageId) {
      case 'dashboard':  renderDashboard();   break;
      case 'log':        Sessions.render();   break;
      case 'history':    History.render();    break;
      case 'aimmap':     AimMap.render();     break;
      case 'community':  Community.render();  break;
      case 'profiles':   Profiles.render();   break;
    }
  }

  /* ---- Dashboard ---- */
  let _trendChart = null;

  function renderDashboard() {
    const profile  = Storage.getActiveProfile();
    const stats    = Storage.getStats();
    const sessions = Storage.getSessions();

    // Greeting
    const hour = new Date().getHours();
    const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    setText('dash-greeting', greet + ', ' + profile.name + '!');
    setText('dash-category', C.CATEGORIES[profile.category]?.label || '');

    // Stats
    setText('dash-sessions', stats.count);
    setText('dash-avg',      stats.avgScore  || '—');
    setText('dash-best',     stats.bestScore || '—');

    // Bullseye distance averages
    const bs = Storage.getBullseyeStats();
    const bsWrap = document.getElementById('dash-bs-stats');
    if (bsWrap) {
      bsWrap.innerHTML = (bs['10m'].avg || bs['15m'].avg) ? `
        <div class="card card-sage">
          <div class="card-title" style="margin-bottom:8px;">Bullseye averages</div>
          <div style="display:flex;gap:24px;">
            ${bs['10m'].avg ? `<div><div style="font-size:20px;font-weight:800;color:var(--forest);">${bs['10m'].avg}</div><div class="stat-lbl">10m avg / 50</div></div>` : ''}
            ${bs['15m'].avg ? `<div><div style="font-size:20px;font-weight:800;color:var(--forest);">${bs['15m'].avg}</div><div class="stat-lbl">15m avg / 50</div></div>` : ''}
          </div>
        </div>` : '';
    }

    // Recent sessions
    const recentWrap = document.getElementById('dash-recent');
    if (recentWrap) {
      const recent = [...sessions].reverse().slice(0, 4);
      recentWrap.innerHTML = recent.length
        ? `<div class="card">` + recent.map(s => `
            <div class="session-row">
              <div>
                <div style="font-size:17px;font-weight:800;color:var(--forest);">${s.total} <span style="font-size:13px;font-weight:400;color:var(--ink-muted);">/ ${s.maxTotal}</span></div>
                <div class="session-meta">${s.date} · ${s.roundType==='bullseye'?'🎯':s.roundType==='animal2d'?'🦌':'🐗'} ${s.roundType}</div>
              </div>
              <div style="display:flex;align-items:center;gap:6px;">
                ${s.mood ? `<span style="font-size:18px;">${C.MOOD_EMOJIS[s.mood-1]?.emoji||''}</span>` : ''}
                <span class="badge badge-${s.type}">${s.type}</span>
              </div>
            </div>`).join('') + `</div>`
        : `<div class="empty"><span class="empty-icon">🏹</span>No sessions yet.<br>Log your first session!</div>`;
    }

    // Coach tip
    renderDashCoach(sessions);

    // Trend chart
    renderTrendChart(sessions.slice(-12).filter(s=>s.total).map(s=>({ label: s.date, val: s.total })));
  }

  async function renderDashCoach(sessions) {
    const coachWrap = document.getElementById('dash-coach');
    if (!coachWrap) return;
    const tip = Coach.offlineTip();
    coachWrap.innerHTML = `
      <div class="coach-bubble">
        <div class="coach-text" id="dash-coach-text">${tip}</div>
        <button class="btn btn-sm" style="margin-top:10px;background:var(--forest-light);color:var(--white);border-color:var(--forest-light);"
          onclick="App.askCoach()">Ask your coach ↗</button>
      </div>`;
  }

  function renderTrendChart(data) {
    const canvas = document.getElementById('dash-trend-canvas');
    if (!canvas) return;
    if (_trendChart) { _trendChart.destroy(); _trendChart = null; }
    if (data.length < 2) { canvas.style.display = 'none'; return; }
    canvas.style.display = 'block';
    _trendChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: data.map(d => d.label.split(' ').slice(0,2).join(' ')),
        datasets: [{
          data: data.map(d => d.val),
          borderColor: '#3D7A3D', backgroundColor: 'rgba(61,122,61,0.08)',
          borderWidth: 2.5, pointRadius: 4, pointBackgroundColor: '#3D7A3D',
          tension: 0.35, fill: true
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#9B9B90', maxRotation: 30 } },
          y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 11 }, color: '#9B9B90' } }
        }
      }
    });
  }

  /* ---- Coach modal ---- */
  function askCoach() {
    const modal = document.getElementById('coach-modal');
    if (modal) {
      modal.classList.add('open');
      Coach.ask(null);
    }
  }

  function showCoachModal(text) {
    const modal = document.getElementById('coach-modal');
    const el    = document.getElementById('coach-text');
    if (el) el.textContent = text;
    if (modal) modal.classList.add('open');
  }

  function closeCoachModal() {
    const modal = document.getElementById('coach-modal');
    if (modal) modal.classList.remove('open');
  }

  /* ---- Auth state change ---- */
  function onAuthChange(user) {
    Profiles.renderBadge();
    // Refresh community tab if open
    const commPage = document.getElementById('page-community');
    if (commPage?.classList.contains('active')) Community.render();
  }

  /* ---- Toast ---- */
  function toast(msg, duration = 2500) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), duration);
  }

  /* ---- Helpers ---- */
  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  /* ---- Service Worker ---- */
  function registerSW() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./service-worker.js')
        .then(() => console.log('SW registered'))
        .catch(e => console.warn('SW failed:', e));
    }
  }

  /* ---- Init ---- */
  function init() {
    registerSW();

    // Load Firebase config if available
    if (typeof FIREBASE_CONFIG !== 'undefined') {
      FB.init(FIREBASE_CONFIG);
    }

    Profiles.renderBadge();
    navigate('dashboard');
  }

  return { navigate, renderDashboard, onAuthChange, askCoach, showCoachModal, closeCoachModal, toast, init };
})();

document.addEventListener('DOMContentLoaded', App.init);
