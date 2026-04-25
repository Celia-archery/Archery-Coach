/* ============================================================
   community.js — Social feed, leaderboard, shared scores
   ============================================================ */

const Community = (() => {

  let _tab = 'feed';
  let _roundFilter = 'bullseye';

  async function render() {
    const wrap = document.getElementById('community-wrap');
    if (!wrap) return;

    if (!FB.isReady() || !FB.isSignedIn()) {
      wrap.innerHTML = `
        <div class="auth-wrap">
          <div class="auth-logo">🏹</div>
          <div class="auth-title">Join the community</div>
          <div class="auth-sub">Sign in to share scores and see how other archers are performing.</div>
          <button class="btn btn-primary" onclick="App.navigate('profiles')">Sign in / Sign up ↗</button>
        </div>`;
      return;
    }

    wrap.innerHTML = `
      <div class="tab-bar">
        <button class="tab-btn ${_tab==='feed'?'active':''}" onclick="Community.setTab('feed')">Recent scores</button>
        <button class="tab-btn ${_tab==='leaderboard'?'active':''}" onclick="Community.setTab('leaderboard')">Leaderboard</button>
      </div>
      <div class="tab-bar" style="margin-top:-8px;">
        ${['bullseye','animal2d','animal3d'].map(r=>`
          <button class="tab-btn ${_roundFilter===r?'active':''}"
            onclick="Community.setRound('${r}')">
            ${r==='bullseye'?'🎯 Bullseye':r==='animal2d'?'🦌 2D Animal':'🐗 3D Animal'}
          </button>`).join('')}
      </div>
      <div id="community-content"><div class="empty"><span class="empty-icon">⏳</span>Loading…</div></div>`;

    await loadContent();
  }

  async function loadContent() {
    const wrap = document.getElementById('community-content');
    if (!wrap) return;

    try {
      if (_tab === 'feed') {
        const scores = await FB.getCommunityScores(_roundFilter, 30);
        if (!scores.length) {
          wrap.innerHTML = `<div class="empty"><span class="empty-icon">🎯</span>No shared scores yet.<br>Be the first!</div>`;
          return;
        }
        wrap.innerHTML = `<div class="card">` + scores.map(s => `
          <div class="session-row">
            <div style="flex:1;">
              <div style="display:flex;align-items:baseline;gap:6px;">
                <span class="session-score">${s.total}</span>
                <span style="font-size:13px;color:var(--ink-muted);">/ ${s.maxTotal}</span>
              </div>
              <div class="session-meta">
                <strong>${s.displayName}</strong>${s.profileName&&s.profileName!==s.displayName?' · '+s.profileName:''} · ${s.date}
              </div>
            </div>
            <span class="badge badge-${s.type}">${s.type}</span>
          </div>`).join('') + `</div>`;

      } else {
        const board = await FB.getLeaderboard(_roundFilter);
        if (!board.length) {
          wrap.innerHTML = `<div class="empty"><span class="empty-icon">🏆</span>No scores yet for this round type.</div>`;
          return;
        }
        wrap.innerHTML = `<div class="card">` + board.map((s,i) => `
          <div class="leaderboard-row">
            <div class="lb-rank">${i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)}</div>
            <div class="avatar" style="width:32px;height:32px;font-size:11px;">${(s.displayName||'?').slice(0,2).toUpperCase()}</div>
            <div class="lb-name">${s.displayName||'Archer'}${s.profileName&&s.profileName!==s.displayName?'<br><span style="font-size:11px;color:var(--ink-muted);">'+s.profileName+'</span>':''}</div>
            <div class="lb-score">${s.total}</div>
          </div>`).join('') + `</div>`;
      }
    } catch(e) {
      wrap.innerHTML = `<div class="empty"><span class="empty-icon">📡</span>Could not load scores.<br>Check your connection.</div>`;
    }
  }

  function setTab(tab)    { _tab = tab;         render(); }
  function setRound(round){ _roundFilter = round; render(); }

  return { render, setTab, setRound };
})();
