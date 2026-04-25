/* ============================================================
   history.js — Session history, stats, charts, trends
   ============================================================ */

const History = (() => {

  let _chartInstances = {};
  let _filter = 'all';
  let _roundFilter = 'all';

  /* ======================================================
     MAIN RENDER
     ====================================================== */
  function render() {
    renderFilters();
    renderStats();
    renderList();
    renderCharts();
    renderTrends();
  }

  /* ---- Filters ---- */
  function renderFilters() {
    const wrap = document.getElementById('history-filters');
    if (!wrap) return;
    wrap.innerHTML = `
      <div class="tab-bar" style="margin-bottom:8px;">
        ${['all','practice','competition'].map(f=>`
          <button class="tab-btn ${_filter===f?'active':''}"
            onclick="History.setFilter('${f}')">${f.charAt(0).toUpperCase()+f.slice(1)}</button>`).join('')}
      </div>
      <div class="tab-bar">
        ${['all','bullseye','animal2d','animal3d'].map(f=>`
          <button class="tab-btn ${_roundFilter===f?'active':''}"
            onclick="History.setRoundFilter('${f}')">${f==='all'?'All rounds':f==='bullseye'?'🎯 Bullseye':f==='animal2d'?'🦌 2D Animal':'🐗 3D Animal'}</button>`).join('')}
      </div>`;
  }

  function setFilter(f)      { _filter = f;      render(); }
  function setRoundFilter(f) { _roundFilter = f;  render(); }

  function getFiltered() {
    return Storage.getSessions().filter(s =>
      (_filter === 'all'     || s.type === _filter) &&
      (_roundFilter === 'all' || s.roundType === _roundFilter)
    );
  }

  /* ---- Stats summary ---- */
  function renderStats() {
    const sessions = getFiltered();
    const scores   = sessions.filter(s=>s.total).map(s=>s.total);
    const avg      = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : 0;
    const best     = scores.length ? Math.max(...scores) : 0;

    const wrap = document.getElementById('history-stats');
    if (!wrap) return;
    wrap.innerHTML = `
      <div class="stat-row">
        <div class="stat-box">
          <div class="stat-val">${sessions.length}</div>
          <div class="stat-lbl">Sessions</div>
        </div>
        <div class="stat-box">
          <div class="stat-val">${avg||'—'}</div>
          <div class="stat-lbl">Avg score</div>
        </div>
        <div class="stat-box">
          <div class="stat-val">${best||'—'}</div>
          <div class="stat-lbl">Best score</div>
        </div>
      </div>
      ${renderBullseyeDistanceStats(sessions)}`;
  }

  function renderBullseyeDistanceStats(sessions) {
    const bs = sessions.filter(s=>s.roundType==='bullseye' && s.flights);
    if (!bs.length) return '';
    const by = { 10:[], 15:[] };
    bs.forEach(s => s.flights.filter(f=>!f.practice).forEach(f => {
      if (by[f.distance]) by[f.distance].push(f.total);
    }));
    const avg10 = by[10].length ? Math.round(by[10].reduce((a,b)=>a+b,0)/by[10].length) : null;
    const avg15 = by[15].length ? Math.round(by[15].reduce((a,b)=>a+b,0)/by[15].length) : null;
    if (!avg10 && !avg15) return '';
    return `
      <div class="card card-sage" style="padding:12px 14px;">
        <div class="card-title" style="margin-bottom:8px;">Bullseye distance averages</div>
        <div style="display:flex;gap:20px;">
          ${avg10 !== null ? `<div><div style="font-size:18px;font-weight:800;color:var(--forest);">${avg10}</div><div style="font-size:11px;color:var(--ink-soft);">10m avg / 50</div></div>` : ''}
          ${avg15 !== null ? `<div><div style="font-size:18px;font-weight:800;color:var(--forest);">${avg15}</div><div style="font-size:11px;color:var(--ink-soft);">15m avg / 50</div></div>` : ''}
        </div>
      </div>`;
  }

  /* ---- Session list ---- */
  function renderList() {
    const sessions = [...getFiltered()].reverse();
    const wrap = document.getElementById('history-list');
    if (!wrap) return;
    if (!sessions.length) {
      wrap.innerHTML = `<div class="empty"><span class="empty-icon">🎯</span>No sessions yet.<br>Log your first session!</div>`;
      return;
    }
    wrap.innerHTML = `<div class="card">` + sessions.map(s => `
      <div class="session-row">
        <div style="flex:1;">
          <div style="display:flex;align-items:baseline;gap:6px;">
            <span class="session-score">${s.total}</span>
            <span style="font-size:13px;color:var(--ink-muted);">/ ${s.maxTotal}</span>
            ${s.mood ? `<span style="font-size:16px;margin-left:4px;">${C.MOOD_EMOJIS[s.mood-1]?.emoji||''}</span>` : ''}
          </div>
          <div class="session-meta">
            ${s.date} · ${roundLabel(s.roundType)}
            ${s.category ? ' · ' + C.CATEGORIES[s.category]?.label : ''}
          </div>
          ${s.notes ? `<div class="session-meta" style="font-style:italic;">"${s.notes}"</div>` : ''}
          ${s.tags?.length ? `<div style="margin-top:4px;">${s.tags.map(t=>`<span class="badge badge-practice" style="font-size:10px;margin-right:3px;">${t}</span>`).join('')}</div>` : ''}
        </div>
        <div class="session-actions">
          <span class="badge badge-${s.type}">${s.type}</span>
          ${FB.isSignedIn() ? `<button class="btn btn-xs btn-outline" onclick="History.share(${s.id})" title="Share">↗</button>` : ''}
          <button class="btn btn-xs btn-danger" onclick="History.remove(${s.id})">✕</button>
        </div>
      </div>`).join('') + `</div>`;
  }

  function roundLabel(rt) {
    return rt === 'bullseye' ? '🎯 Bullseye' : rt === 'animal2d' ? '🦌 2D Animal' : '🐗 3D Animal';
  }

  /* ---- Charts ---- */
  function renderCharts() {
    const sessions = getFiltered().filter(s=>s.total);
    const wrap = document.getElementById('history-charts');
    if (!wrap) return;
    if (sessions.length < 2) { wrap.innerHTML = ''; return; }

    wrap.innerHTML = `
      <div class="section-title">Score trend</div>
      <div class="card">
        <div class="chart-wrap"><canvas id="trend-chart"></canvas></div>
      </div>`;

    setTimeout(() => {
      destroyChart('trend');
      const ctx = document.getElementById('trend-chart');
      if (!ctx) return;
      const labels = sessions.map(s => s.date.split(' ').slice(0,2).join(' '));
      const data   = sessions.map(s => s.total);
      _chartInstances['trend'] = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            data, label: 'Score',
            borderColor: '#3D7A3D', backgroundColor: 'rgba(61,122,61,0.08)',
            borderWidth: 2.5, pointRadius: 5, pointBackgroundColor: '#3D7A3D',
            tension: 0.35, fill: true
          }]
        },
        options: chartOptions('Score per session')
      });
    }, 50);
  }

  /* ---- Trends & correlations ---- */
  function renderTrends() {
    const wrap = document.getElementById('history-trends');
    if (!wrap) return;

    const mood    = Storage.getMoodCorrelation();
    const tagStats= Storage.getTagStats();

    if (!mood.length && !tagStats.length) { wrap.innerHTML = ''; return; }

    const maxAvg = Math.max(...mood.map(m=>m.avg), ...tagStats.map(t=>t.avg), 1);

    wrap.innerHTML = `
      ${mood.length ? `
        <div class="section-title">Mood vs score</div>
        <div class="card">
          ${mood.map(m=>`
            <div class="corr-row">
              <div class="corr-label">${C.MOOD_EMOJIS[m.mood-1]?.emoji} ${C.MOOD_EMOJIS[m.mood-1]?.label}</div>
              <div class="corr-bar-wrap"><div class="corr-bar" style="width:${Math.round(m.avg/maxAvg*100)}%"></div></div>
              <div class="corr-val">${m.avg}</div>
            </div>`).join('')}
        </div>` : ''}

      ${tagStats.length ? `
        <div class="section-title">Average score by tag</div>
        <div class="card">
          ${tagStats.map(t=>`
            <div class="corr-row">
              <div class="corr-label">${t.tag} <span style="font-size:10px;color:var(--ink-muted);">(${t.count})</span></div>
              <div class="corr-bar-wrap"><div class="corr-bar" style="width:${Math.round(t.avg/maxAvg*100)}%"></div></div>
              <div class="corr-val">${t.avg}</div>
            </div>`).join('')}
        </div>` : ''}`;
  }

  /* ---- Actions ---- */
  function remove(id) {
    Storage.deleteSession(id);
    render();
    App.toast('Session deleted');
  }

  async function share(id) {
    const session = Storage.getSessions().find(s=>s.id===id);
    if (!session) return;
    try {
      await FB.shareSession(session, Storage.getActiveProfile().name);
      App.toast('Score shared with community!');
    } catch(e) {
      App.toast('Sign in to share scores');
    }
  }

  /* ---- Chart helpers ---- */
  function destroyChart(key) {
    if (_chartInstances[key]) { _chartInstances[key].destroy(); delete _chartInstances[key]; }
  }

  function chartOptions(title) {
    return {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ' '+c.parsed.y+' pts' } } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#9B9B90', maxRotation: 45 } },
        y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 11 }, color: '#9B9B90' } }
      }
    };
  }

  return { render, setFilter, setRoundFilter, remove, share };
})();
