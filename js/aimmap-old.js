/* ============================================================
   aimmap.js — Aim spot marking system
   Per archer, per target type, per distance
   ============================================================ */

const AimMap = (() => {

  let _currentTarget = 'bullseye';
  let _currentDist   = 10;
  let _currentAnimal = 'Duiker';
  let _placing       = false;

  /* ---- Target image sources ---- */
  // bullseye cx/cy: approximate centre of the 10-ring as fraction of image dimensions
  const TARGETS = {
    bullseye:  { src: null,                             label: 'Paper Target', distances: [10, 15],      cx: 0.50, cy: 0.50 },
    Duiker:    { src: 'assets/targets/duiker.jpg',     label: 'Duiker',       distances: C.DISTANCES,   cx: 0.53, cy: 0.53 },
    Warthog:   { src: 'assets/targets/warthog.jpg',    label: 'Warthog',      distances: C.DISTANCES,   cx: 0.46, cy: 0.50 },
    'Bush Pig':{ src: 'assets/targets/bushpig.jpg',    label: 'Bush Pig',     distances: C.DISTANCES,   cx: 0.55, cy: 0.55 },
    Baboon:    { src: 'assets/targets/baboon.jpg',     label: 'Baboon',       distances: C.DISTANCES,   cx: 0.46, cy: 0.46 },
    Porcupine: { src: 'assets/targets/porcupine.jpg',  label: 'Porcupine',    distances: C.DISTANCES,   cx: 0.55, cy: 0.52 },
    Hyena:     { src: 'assets/targets/hyena.jpg',      label: 'Hyena',        distances: C.DISTANCES,   cx: 0.50, cy: 0.52 }
  };

  /* ---- Storage key ---- */
  function spotKey() {
    if (_currentTarget === 'bullseye') return `bullseye:${_currentDist}m`;
    return `animal:${_currentTarget}:${_currentDist}m`;
  }

  /* ---- Main render ---- */
  function render() {
    const wrap = document.getElementById('aimmap-wrap');
    if (!wrap) return;

    const targetInfo = TARGETS[_currentTarget];
    const spot       = Storage.getAimSpot(spotKey());
    const dists      = targetInfo?.distances || [10, 15];

    wrap.innerHTML = `
      <div class="section-title" style="margin-top:0;">Target</div>
      <div class="tab-bar" style="flex-wrap:wrap;gap:4px;height:auto;padding:4px;">
        <button class="tab-btn ${_currentTarget==='bullseye'?'active':''}"
          onclick="AimMap.setTarget('bullseye')" style="min-width:80px;">🎯 Paper</button>
        ${C.ANIMALS.map(a=>`
          <button class="tab-btn ${_currentTarget===a?'active':''}"
            onclick="AimMap.setTarget('${a}')" style="min-width:80px;">${a}</button>`).join('')}
      </div>

      <div class="section-title">Distance</div>
      <div class="tab-bar">
        ${dists.map(d=>`
          <button class="tab-btn ${_currentDist===d?'active':''}"
            onclick="AimMap.setDist(${d})">${d}m</button>`).join('')}
      </div>

      <div class="tip-box">
        Tap the target image to mark your aiming spot for ${_currentTarget==='bullseye'?'the paper target':_currentTarget} at ${_currentDist}m.
        ${spot ? '✅ Spot saved.' : 'No spot set yet.'}
      </div>

      <div class="aim-map-wrap" id="aim-map-image-wrap">
        ${renderTargetImage(targetInfo, spot)}
      </div>

      ${spot ? `
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button class="btn btn-outline btn-sm" onclick="AimMap.clearSpot()">Clear spot</button>
          <div style="font-size:13px;color:var(--ink-soft);display:flex;align-items:center;">
            Spot at ${Math.round(spot.x*100)}%, ${Math.round(spot.y*100)}%
          </div>
        </div>` : ''}

      <div class="section-title">All saved spots</div>
      <div class="card">${renderAllSpots()}</div>`;

    // Attach click listener
    setTimeout(() => {
      const mapWrap = document.getElementById('aim-map-image-wrap');
      if (mapWrap) mapWrap.addEventListener('click', handleMapClick);
    }, 50);
  }

  function renderTargetImage(info, spot) {
    if (_currentTarget === 'bullseye') {
      return `
        <div style="position:relative;cursor:crosshair;">
          ${bullseyeSVG()}
          ${spot ? `<div class="aim-dot" style="left:${spot.x*100}%;top:${spot.y*100}%;"></div>` : ''}
        </div>`;
    }
    // Real animal photo
    const savedSrc = Storage.get('arch:img:' + _currentTarget, null);
    const imgSrc   = savedSrc || (info && info.src ? info.src : '');
    const cx = info && info.cx ? info.cx : 0.5;
    const cy = info && info.cy ? info.cy : 0.5;
    return `
      <div style="position:relative;cursor:crosshair;border-radius:var(--radius-md);overflow:hidden;background:var(--sage-pale);">
        ${imgSrc
          ? `<img src="${imgSrc}" alt="${_currentTarget}" style="width:100%;display:block;">`
          : `<div style="padding:40px;text-align:center;color:var(--ink-muted);"><div style="font-size:40px;">🦌</div><div style="margin-top:8px;font-size:13px;">No image</div></div>`
        }
        ${spot ? `<div class="aim-dot" style="left:${spot.x*100}%;top:${spot.y*100}%;position:absolute;"></div>` : `<div style="position:absolute;left:${cx*100}%;top:${cy*100}%;transform:translate(-50%,-50%);width:14px;height:14px;border-radius:50%;border:2px dashed rgba(255,255,255,0.7);pointer-events:none;" title="Suggested centre"></div>`}
      </div>
      <div style="margin-top:10px;">
        <label class="form-label">Replace image for ${_currentTarget}</label>
        <input type="file" accept="image/*" onchange="AimMap.uploadImage(this,'${_currentTarget}')" style="font-size:13px;width:100%;">
      </div>`;
  }

  /* ---- Inline bullseye SVG ---- */
  function bullseyeSVG() {
    const rings = [
      { r:48, fill:'#EEEEEE' }, { r:43, fill:'#DDDDDD' },
      { r:38, fill:'#111111' }, { r:33, fill:'#222222' },
      { r:28, fill:'#1144AA' }, { r:23, fill:'#2255BB' },
      { r:18, fill:'#CC2200' }, { r:13, fill:'#DD3311' },
      { r: 8, fill:'#FFD700' }, { r: 4, fill:'#FFE033' }
    ];
    return `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"
        style="width:100%;border-radius:var(--radius-md);">
        <rect width="100" height="100" fill="#f5f5f0"/>
        ${rings.map(r=>`<circle cx="50" cy="50" r="${r.r}" fill="${r.fill}"/>`).join('')}
        <line x1="50" y1="2" x2="50" y2="8" stroke="#999" stroke-width="0.5"/>
        <line x1="50" y1="92" x2="50" y2="98" stroke="#999" stroke-width="0.5"/>
        <line x1="2" y1="50" x2="8" y2="50" stroke="#999" stroke-width="0.5"/>
        <line x1="92" y1="50" x2="98" y2="50" stroke="#999" stroke-width="0.5"/>
      </svg>`;
  }

  /* ---- Handle tap on map ---- */
  function handleMapClick(e) {
    const wrap = document.getElementById('aim-map-image-wrap');
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const x    = (e.clientX - rect.left) / rect.width;
    const y    = (e.clientY - rect.top)  / rect.height;
    const spot = { x: parseFloat(x.toFixed(4)), y: parseFloat(y.toFixed(4)) };
    Storage.setAimSpot(spotKey(), spot);
    App.toast(`Aim spot saved for ${_currentTarget} at ${_currentDist}m`);
    render();
  }

  /* ---- All spots summary ---- */
  function renderAllSpots() {
    const spots = Storage.getAimSpots();
    const keys  = Object.keys(spots);
    if (!keys.length) return `<div class="empty" style="padding:16px;">No spots saved yet.</div>`;
    return keys.map(k => {
      const s = spots[k];
      const [type, ...rest] = k.split(':');
      const label = type === 'bullseye' ? `Paper target ${rest[0]}` : `${rest[0]} ${rest[1]}`;
      return `
        <div class="corr-row">
          <div class="corr-label">${label}</div>
          <div style="font-size:12px;color:var(--ink-muted);">${Math.round(s.x*100)}%, ${Math.round(s.y*100)}%</div>
          <button class="btn btn-xs btn-danger" onclick="AimMap.clearKey('${k}')">✕</button>
        </div>`;
    }).join('');
  }

  /* ---- Upload animal image ---- */
  function uploadImage(input, animal) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      Storage.set('arch:img:' + animal, e.target.result);
      render();
    };
    reader.readAsDataURL(file);
  }

  /* ---- Controls ---- */
  function setTarget(target) { _currentTarget = target; _currentDist = TARGETS[target]?.distances[0] || 10; render(); }
  function setDist(dist)     { _currentDist   = dist;   render(); }
  function clearSpot()       { Storage.setAimSpot(spotKey(), null); render(); App.toast('Spot cleared'); }
  function clearKey(key)     { Storage.setAimSpot(key, null); render(); }

  return { render, setTarget, setDist, clearSpot, clearKey, uploadImage };
})();
