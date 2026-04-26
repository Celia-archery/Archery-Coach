/* ============================================================
   sessions.js — Session entry for all round types
   Bullseye (practice + competition) | Animal 2D | Animal 3D
   ============================================================ */
 
const Sessions = (() => {
 
  /* ======================================================
     STATE
     ====================================================== */
  let state = {
    sessionType:  'practice',
    roundType:    'bullseye',
    category:     'jnr',
    mood:         0,
    physical:     0,
    focusSteps:   new Array(11).fill(false),
    tags:         [],
    notes:        '',
    flights:      [],      // [{ distance, practice, arrows:[0-10 x5], total }]
    animalLanes:  []       // [{ distance, animal, score }]
  };
 
  /* ======================================================
     RENDER — Session type / round selector
     ====================================================== */
  function renderTypeSelector() {
    const wrap = document.getElementById('session-type-wrap');
    if (!wrap) return;
    wrap.innerHTML = `
      <div class="tab-bar">
        <button class="tab-btn ${state.sessionType==='practice'?'active':''}"
          onclick="Sessions.setType('practice')">Practice</button>
        <button class="tab-btn ${state.sessionType==='competition'?'active':''}"
          onclick="Sessions.setType('competition')">Competition</button>
      </div>
      <div class="tab-bar" style="margin-top:-8px;">
        <button class="tab-btn ${state.roundType==='bullseye'?'active':''}"
          onclick="Sessions.setRound('bullseye')">🎯 Bullseye</button>
        <button class="tab-btn ${state.roundType==='animal2d'?'active':''}"
          onclick="Sessions.setRound('animal2d')">🦌 2D Animal</button>
        <button class="tab-btn ${state.roundType==='animal3d'?'active':''}"
          onclick="Sessions.setRound('animal3d')">🐗 3D Animal</button>
      </div>
      ${state.sessionType==='competition' ? renderCategorySelector() : ''}`;
  }
 
  function renderCategorySelector() {
    return `
      <div class="form-group">
        <label class="form-label">Competition category</label>
        <select onchange="Sessions.setCategory(this.value)">
          ${Object.entries(C.CATEGORIES).map(([k,v]) =>
            `<option value="${k}" ${state.category===k?'selected':''}>${v.label}</option>`
          ).join('')}
        </select>
      </div>`;
  }
 
  /* ======================================================
     RENDER — Wellbeing (mood, physical, steps, tags, notes)
     ====================================================== */
  function renderWellbeing() {
    const wrap = document.getElementById('wellbeing-wrap');
    if (!wrap) return;
    wrap.innerHTML = `
      <div class="card">
        <div class="section-title" style="margin-top:0;">Mood</div>
        <div class="emoji-rating">
          ${C.MOOD_EMOJIS.map(m=>`
            <button class="emoji-btn ${state.mood===m.val?'selected':''}"
              onclick="Sessions.setMood(${m.val})">
              ${m.emoji}<span>${m.label}</span>
            </button>`).join('')}
        </div>
 
        <div class="section-title">Physical Readiness</div>
        <div class="emoji-rating">
          ${C.PHYSICAL_EMOJIS.map(m=>`
            <button class="emoji-btn ${state.physical===m.val?'selected':''}"
              onclick="Sessions.setPhysical(${m.val})">
              ${m.emoji}<span>${m.label}</span>
            </button>`).join('')}
        </div>
 
        <div class="section-title">Focus Steps (NASP 11)</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;">
          ${C.STEPS.map((s,i)=>`
            <button class="tag ${state.focusSteps[i]?'selected':''}"
              onclick="Sessions.toggleStep(${i})">${i+1}. ${s.name}</button>`
          ).join('')}
        </div>
 
        <div class="section-title">Tags</div>
        <div class="tags-wrap">
          ${C.TAGS.map(t=>`
            <span class="tag ${state.tags.includes(t)?'selected':''}"
              onclick="Sessions.toggleTag('${t}')">${t}</span>`
          ).join('')}
        </div>
 
        <div class="section-title">Notes</div>
        <textarea placeholder="Any notes about this session…"
          oninput="Sessions.setNotes(this.value)">${state.notes}</textarea>
      </div>`;
  }
 
  /* ======================================================
     RENDER — Bullseye score entry
     ====================================================== */
  function renderBullseye() {
    const wrap = document.getElementById('score-entry-wrap');
    if (!wrap) return;
 
    const scored = state.flights.filter(f => !f.practice);
    const total  = scored.reduce((a,f) => a + f.total, 0);
    const max    = scored.length * 50;
 
    // Per-distance running averages
    const by = { 10:[], 15:[] };
    scored.forEach(f => { if (by[f.distance]) by[f.distance].push(f.total); });
    const avg10 = avg(by[10]);
    const avg15 = avg(by[15]);
 
    wrap.innerHTML = `
      <div class="running-bar">
        <div>
          <div class="running-label">Session total</div>
          <div class="running-score" id="running-score-val">${total}
            <span style="font-size:16px;opacity:.6"> / ${max||'—'}</span>
          </div>
        </div>
        <div style="text-align:right;">
          ${avg10 ? `<div style="font-size:12px;color:var(--sage-light);">10m avg: ${avg10}/50</div>` : ''}
          ${avg15 ? `<div style="font-size:12px;color:var(--sage-light);">15m avg: ${avg15}/50</div>` : ''}
        </div>
      </div>
 
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <div class="card-title" style="margin:0;">Flights</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;">
            <button class="btn btn-sm btn-outline" onclick="Sessions.addFlight(10,true)">+ Practice 10m</button>
            <button class="btn btn-sm btn-outline" onclick="Sessions.addFlight(15,true)">+ Practice 15m</button>
          </div>
        </div>
        <div style="display:flex;gap:6px;margin-bottom:14px;">
          <button class="btn btn-primary btn-sm" onclick="Sessions.addFlight(10,false)">+ Score 10m</button>
          <button class="btn btn-primary btn-sm" onclick="Sessions.addFlight(15,false)">+ Score 15m</button>
        </div>
 
        <div id="flights-list">
          ${state.flights.length
            ? state.flights.map((f,i) => renderFlight(f, i)).join('')
            : `<div class="empty" style="padding:16px;">
                 <span class="empty-icon">🏹</span>Add a flight above to start scoring.
               </div>`}
        </div>
      </div>`;
  }
 
  /* ---- Single flight block ---- */
  function renderFlight(f, idx) {
    return `
      <div class="flight-block" id="flight-${idx}">
        <div class="flight-header">
          <div class="flight-label">${f.practice ? '⚪ Practice' : '🟢 Scoring'} · ${f.distance}m</div>
          <div style="display:flex;gap:6px;align-items:center;">
            ${!f.practice ? `<span class="flight-total" id="flight-total-${idx}">${f.total} pts</span>` : ''}
            <button class="btn btn-xs btn-danger" onclick="Sessions.removeFlight(${idx})">✕</button>
          </div>
        </div>
 
        <!-- Quick-fill ring buttons (one score per arrow, user clicks each arrow separately) -->
        <div style="font-size:11px;color:var(--ink-muted);margin-bottom:6px;">
          Tap a ring score to set it for the <strong>selected arrow</strong>, or type directly:
        </div>
        <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;" id="ring-btns-${idx}">
          <span style="font-size:11px;color:var(--ink-muted);align-self:center;">Selected arrow:</span>
          <select id="arrow-select-${idx}" style="padding:4px 8px;font-size:13px;width:auto;">
            <option value="0">Arrow 1</option>
            <option value="1">Arrow 2</option>
            <option value="2">Arrow 3</option>
            <option value="3">Arrow 4</option>
            <option value="4">Arrow 5</option>
          </select>
        </div>
        <div style="display:flex;gap:5px;margin-bottom:12px;flex-wrap:wrap;">
          ${C.BULLSEYE_RINGS.map(r =>
            `<button class="btn btn-xs"
              style="font-size:12px;font-weight:700;min-width:32px;
                background:${r.hex};
                color:${r.score <= 4 ? '#fff' : '#111'};
                border-color:${r.hex};"
              onclick="Sessions.quickFill(${idx}, ${r.score})">${r.score}</button>`
          ).join('')}
        </div>
 
        <!-- Five arrow inputs — no labels beneath -->
        <div class="arrow-row">
          ${f.arrows.map((val, ai) => `
            <div class="arrow-input-wrap">
              <input type="number"
                class="arrow-input${val !== null && val >= 0 ? ' score-' + val : ''}"
                id="f${idx}a${ai}"
                value="${val !== null ? val : ''}"
                min="0" max="10"
                placeholder="${ai + 1}"
                inputmode="numeric"
                onblur="Sessions.commitArrow(${idx}, ${ai}, this)">
            </div>`).join('')}
        </div>
 
        <!-- Confirm button to lock in manually typed scores -->
        <button class="btn btn-outline btn-sm btn-block" style="margin-top:10px;"
          onclick="Sessions.confirmFlight(${idx})">✓ Confirm arrows</button>
 
      </div>
      <div style="height:1px;background:var(--border);margin:10px 0;"></div>`;
  }
 
  /* ======================================================
     RENDER — Animal score entry (2D and 3D)
     ====================================================== */
  function renderAnimal() {
    const wrap = document.getElementById('score-entry-wrap');
    if (!wrap) return;
 
    while (state.animalLanes.length < 6) {
      const i = state.animalLanes.length;
      state.animalLanes.push({ distance: C.DISTANCES[i], animal: '', score: null });
    }
 
    const total   = state.animalLanes.reduce((a,l) => a + (l.score || 0), 0);
    const maxPoss = 6 * 10;
 
    wrap.innerHTML = `
      <div class="running-bar">
        <div class="running-label">Session total</div>
        <div class="running-score">${total}
          <span style="font-size:16px;opacity:.6"> / ${maxPoss}</span>
        </div>
      </div>
      <div class="card">
        <div class="card-title" style="margin-bottom:14px;">Distances & animals</div>
        ${state.animalLanes.map((lane, i) => renderAnimalLane(lane, i)).join('')}
      </div>`;
  }
 
  function renderAnimalLane(lane, idx) {
    return `
      <div class="flight-block">
        <div class="flight-header">
          <div class="flight-label">${lane.distance}m — ${lane.animal || 'No animal set'}</div>
          ${lane.score !== null
            ? `<span class="flight-total">${lane.score} pts</span>`
            : ''}
        </div>
        <div style="margin-bottom:8px;">
          <select onchange="Sessions.setAnimal(${idx}, this.value)"
            style="width:100%;padding:10px;font-size:15px;">
            <option value="">Select animal…</option>
            ${C.ANIMALS.map(a =>
              `<option value="${a}" ${lane.animal === a ? 'selected' : ''}>${a}</option>`
            ).join('')}
          </select>
        </div>
        <div class="animal-score-btns">
          ${C.ANIMAL_SCORES.map(s => `
            <button class="animal-score-btn ${lane.score === s ? 'sel' : ''}" data-val="${s}"
              onclick="Sessions.setAnimalScore(${idx}, ${s})">
              ${s}<br>
              <span style="font-size:9px;font-weight:400;">${C.ANIMAL_SCORE_LABELS[s]}</span>
            </button>`).join('')}
        </div>
      </div>
      <div style="height:1px;background:var(--border);margin:10px 0;"></div>`;
  }
 
  /* ======================================================
     RENDER — Competition
     ====================================================== */
  function renderCompetition() {
    const cat  = C.CATEGORIES[state.category];
    const wrap = document.getElementById('score-entry-wrap');
    if (!wrap) return;
 
    const allScored = state.flights.filter(f => !f.practice);
    const total     = allScored.reduce((a,f) => a + f.total, 0);
 
    wrap.innerHTML = `
      <div class="running-bar">
        <div class="running-label">Competition total</div>
        <div class="running-score" id="running-score-val">${total}
          <span style="font-size:16px;opacity:.6"> / ${cat.maxTotal}</span>
        </div>
      </div>
      <div class="card card-ochre" style="margin-bottom:12px;">
        <div style="font-size:12px;font-weight:700;color:var(--ochre);margin-bottom:4px;">${cat.label}</div>
        <div style="font-size:13px;color:var(--ink-soft);">
          ${cat.rounds} round${cat.rounds > 1 ? 's' : ''} ·
          ${cat.distances.join('m & ')}m · Max ${cat.maxTotal} pts
        </div>
      </div>
      ${Array.from({ length: cat.rounds }, (_, r) => `
        <div class="section-title">Round ${r + 1}</div>
        ${cat.distances.map((dist, di) => `
          <div class="card">
            <div class="card-title">${dist}m — ${cat.practice[di]} practice + ${cat.scoring[di]} scoring flights</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
              <button class="btn btn-sm btn-outline"
                onclick="Sessions.addCompFlight(${r},${dist},true)">+ Practice ${dist}m</button>
              <button class="btn btn-primary btn-sm"
                onclick="Sessions.addCompFlight(${r},${dist},false)">+ Score ${dist}m</button>
            </div>
            <div>
              ${state.flights
                .filter(f => f.round === r && f.distance === dist)
                .map(f => renderFlight(f, state.flights.indexOf(f)))
                .join('')}
            </div>
          </div>`).join('')}`).join('')}`;
  }
 
  /* ======================================================
     STATE MUTATIONS
     ====================================================== */
  function setType(t)    { state.sessionType = t; render(); }
  function setRound(r)   { state.roundType   = r; render(); }
  function setCategory(c){ state.category    = c; render(); }
  function setMood(v)    { state.mood        = v; renderWellbeing(); }
  function setPhysical(v){ state.physical    = v; renderWellbeing(); }
  function setNotes(v)   { state.notes       = v; }
  function toggleStep(i) { state.focusSteps[i] = !state.focusSteps[i]; renderWellbeing(); }
  function toggleTag(t)  {
    const idx = state.tags.indexOf(t);
    if (idx >= 0) state.tags.splice(idx, 1); else state.tags.push(t);
    renderWellbeing();
  }
 
  /* ---- Flights ---- */
  function addFlight(distance, practice) {
    state.flights.push({ distance, practice, arrows: [null,null,null,null,null], total: 0, round: 0 });
    renderBullseye();
  }
  function addCompFlight(round, distance, practice) {
    state.flights.push({ distance, practice, arrows: [null,null,null,null,null], total: 0, round });
    renderCompetition();
  }
  function removeFlight(idx) {
    state.flights.splice(idx, 1);
    render();
  }
 
  /* ---- Arrow scoring: quick-fill ONE arrow via dropdown + ring button ---- */
  function quickFill(flightIdx, score) {
    const sel = document.getElementById('arrow-select-' + flightIdx);
    const ai  = sel ? parseInt(sel.value) : 0;
    const f   = state.flights[flightIdx];
    if (!f) return;
 
    f.arrows[ai] = score;
    f.total = f.arrows.reduce((a, b) => a + (b || 0), 0);
 
    // Update just that input's value + colour
    const input = document.getElementById('f' + flightIdx + 'a' + ai);
    if (input) { input.value = score; colourInput(input); }
 
    // Advance selector to next arrow
    if (sel && ai < 4) sel.value = ai + 1;
 
    // Update the flight total badge
    const badge = document.getElementById('flight-total-' + flightIdx);
    if (badge) badge.textContent = f.total + ' pts';
 
    updateRunningTotal();
  }
 
  /* ---- Arrow scoring: user typed directly into input, confirmed on blur ---- */
  function commitArrow(flightIdx, arrowIdx, input) {
    const v = parseInt(input.value, 10);
    const f = state.flights[flightIdx];
    if (!f) return;
    if (!isNaN(v)) {
      const clamped = Math.min(10, Math.max(0, v));
      input.value   = clamped;
      f.arrows[arrowIdx] = clamped;
      colourInput(input);
    } else {
      f.arrows[arrowIdx] = null;
    }
    f.total = f.arrows.reduce((a, b) => a + (b || 0), 0);
    const badge = document.getElementById('flight-total-' + flightIdx);
    if (badge) badge.textContent = f.total + ' pts';
    updateRunningTotal();
  }
 
  /* ---- Confirm button: reads all 5 inputs for a flight ---- */
  function confirmFlight(flightIdx) {
    const f = state.flights[flightIdx];
    if (!f) return;
    for (let ai = 0; ai < 5; ai++) {
      const input = document.getElementById('f' + flightIdx + 'a' + ai);
      if (input) commitArrow(flightIdx, ai, input);
    }
    App.toast('Flight confirmed — ' + f.total + ' pts');
  }
 
  /* ---- Animal ---- */
  function setAnimal(idx, animal) { state.animalLanes[idx].animal = animal; }
  function setAnimalScore(idx, score) {
    state.animalLanes[idx].score = score;
    renderAnimal();
  }
 
  /* ======================================================
     HELPERS
     ====================================================== */
  function colourInput(input) {
    const v = parseInt(input.value, 10);
    input.className = 'arrow-input' + ((!isNaN(v) && v >= 0 && v <= 10) ? ' score-' + v : '');
  }
 
  function updateRunningTotal() {
    const el = document.getElementById('running-score-val');
    if (!el) return;
    const scored = state.flights.filter(f => !f.practice);
    const total  = scored.reduce((a, f) => a + f.total, 0);
    const max    = state.sessionType === 'competition'
      ? C.CATEGORIES[state.category].maxTotal
      : scored.length * 50;
    el.innerHTML = `${total} <span style="font-size:16px;opacity:.6"> / ${max || '—'}</span>`;
  }
 
  function avg(arr) {
    if (!arr.length) return 0;
    return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  }
 
  function calcTotal() {
    if (state.roundType === 'bullseye') {
      return state.flights.filter(f => !f.practice).reduce((a, f) => a + f.total, 0);
    }
    return state.animalLanes.reduce((a, l) => a + (l.score || 0), 0);
  }
 
  function calcMax() {
    if (state.sessionType === 'competition') return C.CATEGORIES[state.category].maxTotal;
    if (state.roundType === 'bullseye') {
      return state.flights.filter(f => !f.practice).length * 50;
    }
    return 60;
  }
 
  /* ======================================================
     SAVE
     ====================================================== */
  async function save() {
    // Confirm any unconfirmed inputs first
    state.flights.forEach((f, idx) => confirmFlight(idx));
 
    const total    = calcTotal();
    const maxTotal = calcMax();
 
    if (total === 0) { App.toast('Enter at least one score before saving'); return; }
 
    const session = {
      type:              state.sessionType,
      roundType:         state.roundType,
      category:          state.sessionType === 'competition' ? state.category : null,
      mood:              state.mood,
      physicalReadiness: state.physical,
      focusSteps:        [...state.focusSteps],
      tags:              [...state.tags],
      notes:             state.notes,
      flights:           state.roundType === 'bullseye' ? state.flights.map(f => ({ ...f })) : null,
      animalLanes:       state.roundType !== 'bullseye' ? state.animalLanes.map(l => ({ ...l })) : null,
      total,
      maxTotal
    };
 
    Storage.addSession(session);
    App.toast('Session saved! Getting coach feedback…');
    const feedback = await Coach.autoCoach({ ...session });
 
    resetState();
    render();
    App.showCoachModal(feedback);
  }
 
  function resetState() {
    state = {
      sessionType: 'practice', roundType: 'bullseye', category: 'jnr',
      mood: 0, physical: 0, focusSteps: new Array(11).fill(false),
      tags: [], notes: '', flights: [], animalLanes: []
    };
  }
 
  /* ======================================================
     MAIN RENDER
     ====================================================== */
  function render() {
    renderTypeSelector();
    renderWellbeing();
    if (state.sessionType === 'competition') {
      renderCompetition();
    } else if (state.roundType === 'bullseye') {
      renderBullseye();
    } else {
      renderAnimal();
    }
  }
 
  return {
    render,
    setType, setRound, setCategory,
    setMood, setPhysical, setNotes,
    toggleStep, toggleTag,
    addFlight, addCompFlight, removeFlight,
    quickFill, commitArrow, confirmFlight,
    setAnimal, setAnimalScore,
    save
  };
})();
 
