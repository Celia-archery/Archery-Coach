/* ============================================================
   profiles.js — Profile management + Firebase Auth UI
   ============================================================ */

const Profiles = (() => {

  function initials(name) {
    return name.trim().split(/\s+/).map(w=>w[0]).join('').toUpperCase().slice(0,2);
  }

  /* ======================================================
     PROFILE MANAGEMENT
     ====================================================== */
  function render() {
    renderProfileList();
    renderAuthSection();
    renderAddForm();
  }

  function renderProfileList() {
    const wrap    = document.getElementById('profiles-list');
    const profiles= Storage.getProfiles();
    const activeId= Storage.getActiveProfileId();
    if (!wrap) return;

    wrap.innerHTML = profiles.map(p => {
      const stats = getProfileStats(p.id);
      return `
        <div class="profile-row">
          <div class="profile-info">
            <div class="avatar">${initials(p.name)}</div>
            <div>
              <div class="profile-name">${p.name}
                ${p.id === activeId ? '<span class="badge badge-practice" style="margin-left:6px;font-size:10px;">Active</span>' : ''}
              </div>
              <div class="profile-meta">${C.CATEGORIES[p.category]?.label || 'Archer'} · ${stats.count} sessions · Best: ${stats.best||'—'}</div>
            </div>
          </div>
          <div style="display:flex;gap:6px;">
            ${p.id !== activeId
              ? `<button class="btn btn-sm btn-primary" onclick="Profiles.switchTo('${p.id}')">Switch</button>`
              : ''}
            ${profiles.length > 1
              ? `<button class="btn btn-sm btn-danger" onclick="Profiles.remove('${p.id}')">Remove</button>`
              : ''}
          </div>
        </div>`;
    }).join('');

    renderBadge();
  }

  function getProfileStats(profileId) {
    const saved = Storage.getActiveProfileId();
    Storage.setActiveProfileId(profileId);
    const sessions = Storage.getSessions();
    const scores   = sessions.map(s=>s.total).filter(Boolean);
    Storage.setActiveProfileId(saved);
    return {
      count: sessions.length,
      best:  scores.length ? Math.max(...scores) : 0,
      avg:   scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : 0
    };
  }

  function renderAddForm() {
    const wrap = document.getElementById('profile-add-wrap');
    if (!wrap) return;
    const profiles = Storage.getProfiles();
    if (profiles.length >= 5) {
      wrap.innerHTML = `<div class="tip-box">Maximum 5 profiles reached. Remove one to add another.</div>`;
      return;
    }
    wrap.innerHTML = `
      <div class="card">
        <div class="section-title" style="margin-top:0;">Add archer</div>
        <div class="form-group">
          <label class="form-label">Name</label>
          <input type="text" id="new-profile-name" placeholder="Archer name…">
        </div>
        <div class="form-group">
          <label class="form-label">Category</label>
          <select id="new-profile-cat">
            ${Object.entries(C.CATEGORIES).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('')}
          </select>
        </div>
        <button class="btn btn-primary btn-block" onclick="Profiles.add()">Add archer</button>
      </div>`;
  }

  /* ======================================================
     AUTH SECTION
     ====================================================== */
  function renderAuthSection() {
    const wrap = document.getElementById('auth-section');
    if (!wrap) return;

    if (!FB.isReady()) {
      wrap.innerHTML = `
        <div class="card card-ochre">
          <div class="section-title" style="margin-top:0;">🔥 Firebase not configured</div>
          <div style="font-size:13px;color:var(--ink-soft);margin-bottom:12px;">
            To enable social sharing and cloud backup, set up Firebase and update
            the config in <code>js/firebase-config.js</code>.
          </div>
          <a href="https://console.firebase.google.com" target="_blank" class="btn btn-ochre btn-sm">Open Firebase Console ↗</a>
        </div>`;
      return;
    }

    if (FB.isSignedIn()) {
      const user = FB.getUser();
      wrap.innerHTML = `
        <div class="card">
          <div class="section-title" style="margin-top:0;">Account</div>
          <div class="profile-info" style="margin-bottom:14px;">
            <div class="avatar">${initials(user.displayName||'U')}</div>
            <div>
              <div class="profile-name">${user.displayName||'Archer'}</div>
              <div class="profile-meta">${user.email}</div>
            </div>
          </div>
          <button class="btn btn-outline btn-sm" onclick="Profiles.signOut()">Sign out</button>
        </div>`;
    } else {
      wrap.innerHTML = `
        <div class="card">
          <div class="section-title" style="margin-top:0;">Sign in for cloud sync & sharing</div>
          <div class="form-group">
            <label class="form-label">Name</label>
            <input type="text" id="auth-name" placeholder="Your name">
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" id="auth-email" placeholder="you@email.com">
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" id="auth-pass" placeholder="Password (6+ chars)">
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-primary" style="flex:1;" onclick="Profiles.signUp()">Sign up</button>
            <button class="btn btn-outline" style="flex:1;" onclick="Profiles.signIn()">Sign in</button>
          </div>
          <div class="divider">or</div>
          <button class="btn btn-outline btn-sm btn-block" onclick="Profiles.resetPassword()">Forgot password?</button>
        </div>`;
    }
  }

  /* ======================================================
     PROFILE ACTIONS
     ====================================================== */
  function add() {
    const name = document.getElementById('new-profile-name')?.value.trim();
    const cat  = document.getElementById('new-profile-cat')?.value || 'jnr';
    if (!name) return App.toast('Please enter a name');
    const id = Storage.addProfile(name, cat);
    if (!id) return App.toast('Maximum 5 profiles reached');
    Storage.setActiveProfileId(id);
    App.toast(name + ' added!');
    render();
  }

  function switchTo(id) {
    Storage.setActiveProfileId(id);
    render();
    App.toast('Switched to ' + Storage.getActiveProfile().name);
  }

  function remove(id) {
    const profiles = Storage.getProfiles();
    if (profiles.length <= 1) return App.toast('Cannot remove the only profile');
    const name = profiles.find(p=>p.id===id)?.name || 'Profile';
    if (!confirm(`Remove ${name} and all their data?`)) return;
    Storage.removeProfile(id);
    render();
    App.toast(name + ' removed');
  }

  function renderBadge() {
    const profile = Storage.getActiveProfile();
    const badge   = document.getElementById('header-avatar');
    if (badge) badge.textContent = initials(profile.name);
  }

  /* ======================================================
     AUTH ACTIONS
     ====================================================== */
  async function signUp() {
    const name  = document.getElementById('auth-name')?.value.trim();
    const email = document.getElementById('auth-email')?.value.trim();
    const pass  = document.getElementById('auth-pass')?.value;
    if (!name || !email || !pass) return App.toast('Please fill all fields');
    try {
      await FB.signUpEmail(email, pass, name);
      App.toast('Account created! Welcome, ' + name);
    } catch(e) { App.toast(e.message || 'Sign up failed'); }
  }

  async function signIn() {
    const email = document.getElementById('auth-email')?.value.trim();
    const pass  = document.getElementById('auth-pass')?.value;
    if (!email || !pass) return App.toast('Enter email and password');
    try {
      await FB.signInEmail(email, pass);
      App.toast('Signed in!');
    } catch(e) { App.toast(e.message || 'Sign in failed'); }
  }

  async function signOut() {
    await FB.signOut();
    App.toast('Signed out');
    renderAuthSection();
  }

  async function resetPassword() {
    const email = document.getElementById('auth-email')?.value.trim();
    if (!email) return App.toast('Enter your email first');
    try {
      await FB.resetPassword(email);
      App.toast('Reset email sent!');
    } catch(e) { App.toast(e.message || 'Failed'); }
  }

  return { render, renderBadge, add, switchTo, remove, signUp, signIn, signOut, resetPassword, initials };
})();
