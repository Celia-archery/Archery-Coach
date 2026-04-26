/* ============================================================
   sessions.js — Session entry for all round types
   Bullseye (practice + competition) | Animal 2D | Animal 3D
   ============================================================ */

const Sessions = (() => {

  /* ======================================================
     STATE
     ====================================================== */
  let state = {
    sessionType:  'practice',   // 'practice' | 'competition'
    roundType:    'bullseye',   // 'bullseye' | 'animal2d' | 'animal3d'
    category:     'jnr',        // competition category
    mood:         0,
    physical:     0,
    focusSteps:   new Array(11).fill(false),
    tags:         [],
    notes:        '',
    // Bullseye
    flights:      [],           // [{ distance, practice, arrows:[...], total }]
    // Animal
    animalLanes:  []            // [{ distance, animal, score }]
  };

  /* ======================================================
     RENDER — Session type selector
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
      ${state.sessionType==='competition' ? renderCategorySelector() : ''}
    `;
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
     RENDER — Wellbeing section (mood, physical, steps, tags)
     ====================================================== */
  function renderWellbeing() {
    const wrap = document.getElementById('wellbeing-wrap');
    if (!wrap) return;
    wrap.innerHTML = `
      <div class="card">
        <div class="section-title" style="margin-top:0;">Mood</div>
        <div class="emoji-rating" id="mood-rating">
          ${C.MOOD_EMOJIS.map(m=>`
            <button class="emoji-btn ${state.mood===m.val?'selected':''}"
              onclick="Sessions.setMood(${m.val})">
              ${m.emoji}<span>${m.label}</span>
            </button>`).join('')}
        </div>

        <div class="section-title">Physical Readiness</div>
        <div class="emoji-rating" id="physical-rating">
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

    // Calculate totals
    const scored = state.flights.filter(f => !f.practice);
    const total  = scored.reduce((a,f) => a + f.total, 0);
    const max    = scored.length * 50;

    const byDist = {};
    scored.forEach(f => {
      if (!byDist[f.distance]) byDist[f.distance] = [];
      byDist[f.distance].push(f.total);
    });
    const avg10 = avg(byDist[10] || []);
    const avg15 = avg(byDist[15] || []);

    wrap.innerHTML = `
      <div class="running-bar">
        <div>
          <div class="running-label">Session total</div>
          <div class="running-score">${total} <span style="font-size:16px;opacity:.6">/ ${max||'—'}</span></div>
        </div>
        <div style="text-align:right;">
          ${avg10 ? `<div style="font-size:12px;color:var(--sage-light);">10m avg: ${avg10}</div>` : ''}
          ${avg15 ? `<div style="font-size:12px;color:var(--sage-light);">15m avg: ${avg15}</div>` : ''}
        </div>
      </div>

      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div class="card-title" style="margin:0;">Flights</div>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-sm btn-outline" onclick="Sessions.addFlight(10, true)">+ Practice 10m</button>
            <button class="btn btn-sm btn-outline" onclick="Sessions.addFlight(15, true)">+ Practice 15m</button>
          </div>
        </div>
        <div style="display:flex;gap:6px;margin-bottom:14px;">
          <button class="btn btn-primary btn-sm" onclick="Sessions.addFlight(10, false)">+ Score 10m</button>
          <button class="btn btn-primary btn-sm" onclick="Sessions.addFlight(15, false)">+ Score 15m</button>
        </div>

        <div id="flights-list">
          ${state.flights.length
            ? state.flights.map((f,i) => renderFlight(f,i)).join('')
            : `<div class="empty" style="padding:16px;"><span class="empty-icon">🏹</span>Add a flight above to start scoring.</div>`
          }
        </div>
      </div>`;
  }

  function renderFlight(f, idx) {
    const total = f.arrows.reduce((a,b)=>a+(b||0),0);
    return `
      <div class="flight-block" id="flight-${idx}">
        <div class="flight-header">
          <div class="flight-label">${f.practice?'⚪ Practice':'🟢 Scoring'} · ${f.distance}m</div>
          <div style="display:flex;gap:6px;align-items:center;">
            ${!f.practice ? `<span class="flight-total">${total} pts</span>` : ''}
            <button class="btn btn-xs btn-danger" onclick="Sessions.removeFlight(${idx})">✕</button>
          </div>
        </div>
        <div class="arrow-row">
          ${f.arrows.map((val,ai)=>`
            <div class="arrow-input-wrap">
              <div class="arrow-num">A${ai+1}</div>
              <input type="number" class="arrow-input score-colour"
                value="${val||''}" min="0" max="10" placeholder="—"
                inputmode="numeric"
                oninput="Sessions.setArrow(${idx},${ai},this)"
                onchange="Sessions.clampArrow(this,0,10)"
                id="f${idx}a${ai}">
            </div>`).join('')}
        </div>
        <div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap;">
          ${C.BULLSEYE_RINGS.map(r=>
            `<button class="btn btn-xs" style="font-size:11px;background:${r.hex};color:${r.score<=3?'#fff':'#111'};border-color:${r.hex};padding:4px 8px;"
              onclick="Sessions.fillRing(${idx},'${r.score}')">${r.score}</button>`
          ).join('')}
        </div>
      </div>
      <div style="height:1px;background:var(--border);margin:10px 0;"></div>`;
  }

  /* ======================================================
     RENDER — Animal score entry (2D and 3D share same UI)
     ====================================================== */
  function renderAnimal() {
    const wrap = document.getElementById('score-entry-wrap');
    if (!wrap) return;

    // Ensure 6 lanes exist
    while (state.animalLanes.length < 6) {
      const idx = state.animalLanes.length;
      state.animalLanes.push({ distance: C.DISTANCES[idx], animal: '', score: null });
    }

    const total  = state.animalLanes.reduce((a,l) => a + (l.score||0), 0);
    const maxPoss = 6 * 10;

    wrap.innerHTML = `
      <div class="running-bar">
        <div>
          <div class="running-label">Session total</div>
          <div class="running-score">${total} <span style="font-size:16px;opacity:.6">/ ${maxPoss}</span></div>
        </div>
      </div>

      <div class="card">
        <div class="card-title" style="margin-bottom:14px;">Assign animals to distances</div>
        ${state.animalLanes.map((lane, i) => renderAnimalLane(lane, i)).join('')}
      </div>`;
  }

  function renderAnimalLane(lane, idx) {
    return `
      <div class="flight-block">
        <div class="flight-header">
          <div class="flight-label">${lane.distance}m</div>
          ${lane.score !== null ? `<span class="flight-total">${lane.score} pts</span>` : ''}
        </div>
        <div class="form-row" style="margin-bottom:8px;">
          <div class="form-group" style="margin-bottom:0;">
            <select onchange="Sessions.setAnimal(${idx},this.value)">
              <option value="">Select animal…</option>
              ${C.ANIMALS.map(a=>`<option value="${a}" ${lane.animal===a?'selected':''}>${a}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="animal-score-btns">
          ${C.ANIMAL_SCORES.map(s=>`
            <button class="animal-score-btn ${lane.score===s?'sel':''}" data-val="${s}"
              onclick="Sessions.setAnimalScore(${idx},${s})">
              ${s}<br><span style="font-size:9px;font-weight:400;">${C.ANIMAL_SCORE_LABELS[s]}</span>
            </button>`).join('')}
        </div>
      </div>
      <div style="height:1px;background:var(--border);margin:10px 0;"></div>`;
  }

  /* ======================================================
     RENDER — Competition entry (wraps bullseye in rounds)
     ====================================================== */
  function renderCompetition() {
    const cat     = C.CATEGORIES[state.category];
    const wrap    = document.getElementById('score-entry-wrap');
    if (!wrap) return;

    const allScored = state.flights.filter(f => !f.practice);
    const total     = allScored.reduce((a,f) => a+f.total, 0);

    wrap.innerHTML = `
      <div class="running-bar">
        <div class="running-label">Competition total</div>
        <div class="running-score">${total} <span style="font-size:16px;opacity:.6">/ ${cat.maxTotal}</span></div>
      </div>
      <div class="card card-ochre" style="margin-bottom:12px;">
        <div style="font-size:12px;font-weight:700;color:var(--ochre);margin-bottom:4px;">${cat.label}</div>
        <div style="font-size:13px;color:var(--ink-soft);">
          ${cat.rounds} round${cat.rounds>1?'s':''} ·
          ${cat.distances.join('m & ')}m ·
          Max ${cat.maxTotal} pts
        </div>
      </div>

      ${Array.from({length:cat.rounds},(_,r)=>`
        <div class="section-title">Round ${r+1}</div>
        ${cat.distances.map((dist,di)=>`
          <div class="card">
            <div class="card-title">${dist}m — ${cat.practice[di]} practice + ${cat.scoring[di]} scoring flights</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
              <button class="btn btn-sm btn-outline"
                onclick="Sessions.addCompFlight(${r},${dist},true)">+ Practice ${dist}m</button>
              <button class="btn btn-primary btn-sm"
                onclick="Sessions.addCompFlight(${r},${dist},false)">+ Scoring ${dist}m</button>
            </div>
            <div id="comp-flights-r${r}d${dist}">
              ${renderCompFlights(r, dist)}
            </div>
          </div>`).join('')}`).join('')}`;
  }

  function renderCompFlights(round, distance) {
    const flights = state.flights.filter(f => f.round===round && f.distance===distance);
    if (!flights.length) return `<div style="font-size:13px;color:var(--ink-muted);padding:8px 0;">No flights added yet.</div>`;
    return flights.map((f, localIdx) => {
      const globalIdx = state.flights.indexOf(f);
      return renderFlight(f, globalIdx);
    }).join('');
  }

  /* ======================================================
     STATE MUTATIONS
     ====================================================== */
  function setType(type)     { state.sessionType = type; render(); }
  function setRound(round)   { state.roundType   = round; render(); }
  function setCategory(cat)  { state.category    = cat;  render(); }
  function setMood(val)      { state.mood        = val;  renderWellbeing(); }
  function setPhysical(val)  { state.physical    = val;  renderWellbeing(); }
  function setNotes(val)     { state.notes       = val; }
  function toggleStep(i) {
    state.focusSteps[i] = !state.focusSteps[i];
    renderWellbeing();
  }
  function toggleTag(tag) {
    const idx = state.tags.indexOf(tag);
    if (idx >= 0) state.tags.splice(idx,1); else state.tags.push(tag);
    renderWellbeing();
  }

  /* Bullseye flights */
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
  function setArrow(flightIdx, arrowIdx, input) {
    const v = parseInt(input.value, 10);
    if (!isNaN(v)) {
      state.flights[flightIdx].arrows[arrowIdx] = v;
      state.flights[flightIdx].total = state.flights[flightIdx].arrows.reduce((a,b)=>a+(b||0),0);
      colourInput(input);
    }
    updateRunningTotal();
  }
  function clampArrow(input, min, max) {
    const v = parseInt(input.value,10);
    if (!isNaN(v)) input.value = Math.min(max, Math.max(min, v));
    colourInput(input);
  }
  function fillRing(flightIdx, score) {
    const f = state.flights[flightIdx];
    if (!f) return;
    f.arrows = f.arrows.map(() => parseInt(score));
    f.total  = f.arrows.reduce((a,b)=>a+b,0);
    render();
  }

  /* Animal */
  function setAnimal(idx, animal) { state.animalLanes[idx].animal = animal; }
  function setAnimalScore(idx, score) {
    state.animalLanes[idx].score = score;
    renderAnimal();
  }

  /* ======================================================
     HELPERS
     ====================================================== */
  function colourInput(input) {
    const v = parseInt(input.value,10);
    input.className = 'arrow-input' + ((!isNaN(v) && v>=0 && v<=10) ? ' score-'+v : '');
  }

  function updateRunningTotal() {
    const el = document.querySelector('.running-score');
    if (!el) return;
    const scored = state.flights.filter(f=>!f.practice);
    const total  = scored.reduce((a,f)=>a+f.total,0);
    el.textContent = total + ' ';
  }

  function avg(arr) {
    if (!arr.length) return 0;
    return Math.round(arr.reduce((a,b)=>a+b,0)/arr.length);
  }

  function calcTotal() {
    if (state.roundType === 'bullseye') {
      const scored = state.flights.filter(f=>!f.practice);
      return scored.reduce((a,f)=>a+f.total,0);
    }
    return state.animalLanes.reduce((a,l)=>a+(l.score||0),0);
  }

  function calcMax() {
    if (state.sessionType === 'competition') {
      return C.CATEGORIES[state.category].maxTotal;
    }
    if (state.roundType === 'bullseye') {
      const scored = state.flights.filter(f=>!f.practice);
      return scored.length * 50;
    }
    return 60; // 6 animals × 10
  }

  /* ======================================================
     SAVE
     ====================================================== */
  async function save() {
    const total   = calcTotal();
    const maxTotal= calcMax();

    if (total === 0) { App.toast('Enter at least one score before saving'); return; }

    const session = {
      type:              state.sessionType,
      roundType:         state.roundType,
      category:          state.sessionType==='competition' ? state.category : null,
      mood:              state.mood,
      physicalReadiness: state.physical,
      focusSteps:        [...state.focusSteps],
      tags:              [...state.tags],
      notes:             state.notes,
      flights:           state.roundType==='bullseye' ? state.flights.map(f=>({...f})) : null,
      animalLanes:       state.roundType!=='bullseye' ? state.animalLanes.map(l=>({...l})) : null,
      total,
      maxTotal
    };

    Storage.addSession(session);

    // Get AI coach feedback
    App.toast('Session saved! Getting coach feedback…');
    const feedback = await Coach.autoCoach({ ...session });

    // Reset state
    resetState();
    render();

    // Show coach feedback then navigate to history
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
    setArrow, clampArrow, fillRing,
    setAnimal, setAnimalScore,
    save
  };
})();
