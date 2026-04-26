/* ============================================================
   aimmap.js — Aim spot marking system
   Per archer, per target type, per distance.
   Fixed: animal names with spaces in onclick, blank page crash,
   robust image loading with fallback chain.
   ============================================================ */
 
const AimMap = (() => {
 
  let _currentTarget = 'bullseye';
  let _currentDist   = 10;
 
  /* ---- Target definitions — keys are safe IDs (no spaces) ---- */
  const TARGETS = {
    bullseye: {
      label: 'Paper Target',
      distances: [10, 15],
      cx: 0.50, cy: 0.50,
      srcs: []
    },
    duiker: {
      label: 'Duiker', animal: 'Duiker',
      distances: [10,11,12,13,14,15],
      cx: 0.53, cy: 0.53,
      srcs: ['assets/targets/duiker.jpg', 'AGA_2D_with_Fita_Rings_2025_duiker.jpg']
    },
    warthog: {
      label: 'Warthog', animal: 'Warthog',
      distances: [10,11,12,13,14,15],
      cx: 0.46, cy: 0.50,
      srcs: ['assets/targets/warthog.jpg', 'AGA_2D_with_Fita_Rings_2025_Warthog.jpg']
    },
    bushpig: {
      label: 'Bush Pig', animal: 'Bush Pig',
      distances: [10,11,12,13,14,15],
      cx: 0.55, cy: 0.55,
      srcs: ['assets/targets/bushpig.jpg', 'AGA_2D_with_Fita_Rings_2025_bushpig.jpg']
    },
    baboon: {
      label: 'Baboon', animal: 'Baboon',
      distances: [10,11,12,13,14,15],
      cx: 0.46, cy: 0.46,
      srcs: ['assets/targets/baboon.jpg', 'AGA_2D_with_Fita_Rings_2025_Baboon.jpg']
    },
    porcupine: {
      label: 'Porcupine', animal: 'Porcupine',
      distances: [10,11,12,13,14,15],
      cx: 0.55, cy: 0.52,
      srcs: ['assets/targets/porcupine.jpg', 'AGA_2D_with_Fita_Rings_2025_porcupine.jpg']
    },
    hyena: {
      label: 'Hyena', animal: 'Hyena',
      distances: [10,11,12,13,14,15],
      cx: 0.50, cy: 0.52,
      srcs: ['assets/targets/hyena.jpg', 'AGA_2D_with_Fita_Rings_2025_Hyena.jpg']
    }
  };
 
  const TARGET_KEYS = Object.keys(TARGETS);
 
  function spotKey() { return _currentTarget + ':' + _currentDist + 'm'; }
  function imgKey(id){ return 'arch:img:' + id; }
 
  /* ======================================================
     MAIN RENDER — wrapped in try/catch so errors show inline
     ====================================================== */
  function render() {
    const wrap = document.getElementById('aimmap-wrap');
    if (!wrap) return;
    try {
      const info  = TARGETS[_currentTarget] || TARGETS.bullseye;
      const spot  = Storage.getAimSpot(spotKey());
      const dists = info.distances || [10, 15];
 
      let html = '';
      html += renderTargetTabs();
      html += renderDistanceTabs(dists);
      html += renderTipBox(spot, info);
      html += '<div class="aim-map-wrap" id="aim-map-image-wrap" style="cursor:crosshair;">';
      html +=   renderTargetImage(info, spot);
      html += '</div>';
      if (spot) html += renderSpotActions(spot);
      html += '<div class="section-title">All saved aim spots</div>';
      html += '<div class="card">' + renderAllSpots() + '</div>';
      wrap.innerHTML = html;
      setTimeout(attachClickHandler, 60);
    } catch(err) {
      console.error('AimMap render error:', err);
      wrap.innerHTML = '<div class="tip-box" style="border-left-color:var(--clay);background:#fff0f0;">' +
        '<strong>Aim Map error:</strong> ' + err.message + '</div>';
    }
  }
 
  function renderTargetTabs() {
    let html = '<div class="section-title" style="margin-top:0;">Target</div>';
    html += '<div class="tab-bar" style="flex-wrap:wrap;height:auto;padding:4px;gap:4px;margin-bottom:8px;">';
    TARGET_KEYS.forEach(function(k) {
      const active = _currentTarget === k ? 'active' : '';
      html += '<button class="tab-btn ' + active + '" style="min-width:76px;flex:none;" ' +
              'onclick="AimMap.setTarget(\'' + k + '\')">' + TARGETS[k].label + '</button>';
    });
    html += '</div>';
    return html;
  }
 
  function renderDistanceTabs(dists) {
    let html = '<div class="section-title">Distance</div>';
    html += '<div class="tab-bar" style="margin-bottom:12px;">';
    dists.forEach(function(d) {
      const active = _currentDist === d ? 'active' : '';
      html += '<button class="tab-btn ' + active + '" onclick="AimMap.setDist(' + d + ')">' + d + 'm</button>';
    });
    html += '</div>';
    return html;
  }
 
  function renderTipBox(spot, info) {
    return '<div class="tip-box">Tap the target image to mark your aiming spot for <strong>' +
      info.label + '</strong> at <strong>' + _currentDist + 'm</strong>. ' +
      (spot ? '&#x2705; Spot saved.' : 'No spot set yet.') + '</div>';
  }
 
  function renderSpotActions(spot) {
    return '<div style="display:flex;gap:8px;margin-top:12px;margin-bottom:4px;">' +
      '<button class="btn btn-outline btn-sm" onclick="AimMap.clearSpot()">Clear spot</button>' +
      '<span style="font-size:13px;color:var(--ink-soft);display:flex;align-items:center;">' +
        'Spot at ' + Math.round(spot.x*100) + '%, ' + Math.round(spot.y*100) + '%' +
      '</span></div>';
  }
 
  /* ======================================================
     TARGET IMAGE RENDERING
     ====================================================== */
  function renderTargetImage(info, spot) {
    if (_currentTarget === 'bullseye') return renderBullseyeSVG(spot);
    return renderAnimalImage(info, spot);
  }
 
  function renderBullseyeSVG(spot) {
    const rings = [
      {r:48,fill:'#EEEEEE'},{r:43,fill:'#DDDDDD'},
      {r:38,fill:'#1a1a1a'},{r:33,fill:'#2a2a2a'},
      {r:28,fill:'#1144BB'},{r:23,fill:'#2255CC'},
      {r:18,fill:'#CC2200'},{r:13,fill:'#DD3311'},
      {r:8, fill:'#FFD700'},{r:4, fill:'#FFE033'}
    ];
    let svg = '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block;">';
    svg += '<rect width="100" height="100" fill="#f0ece4"/>';
    rings.forEach(function(r){ svg += '<circle cx="50" cy="50" r="' + r.r + '" fill="' + r.fill + '"/>'; });
    svg += '<line x1="50" y1="0" x2="50" y2="100" stroke="rgba(0,0,0,0.12)" stroke-width="0.4"/>';
    svg += '<line x1="0" y1="50" x2="100" y2="50" stroke="rgba(0,0,0,0.12)" stroke-width="0.4"/>';
    svg += '</svg>';
    const dot = spot
      ? '<div class="aim-dot" style="left:' + (spot.x*100) + '%;top:' + (spot.y*100) + '%;position:absolute;"></div>'
      : '';
    return '<div style="position:relative;">' + svg + dot + '</div>';
  }
 
  function renderAnimalImage(info, spot) {
    const cx = info.cx || 0.5;
    const cy = info.cy || 0.5;
    const uploadedSrc = Storage.get(imgKey(_currentTarget), null);
    const srcs = info.srcs || [];
 
    const dot = spot
      ? '<div class="aim-dot" style="left:' + (spot.x*100) + '%;top:' + (spot.y*100) + '%;position:absolute;"></div>'
      : '<div style="position:absolute;left:' + (cx*100) + '%;top:' + (cy*100) + '%;' +
          'transform:translate(-50%,-50%);width:18px;height:18px;border-radius:50%;' +
          'border:2px dashed rgba(255,255,255,0.85);pointer-events:none;' +
          'box-shadow:0 0 0 1px rgba(0,0,0,0.35);" title="Scoring centre"></div>';
 
    // Encode src list safely for data attribute
    const srcsAttr = srcs.map(function(s){ return encodeURIComponent(s); }).join('|');
 
    const imgSrc = uploadedSrc || (srcs.length ? srcs[0] : '');
 
    let html = '<div style="position:relative;background:var(--sage-pale);border-radius:var(--radius-md);min-height:120px;">';
    if (imgSrc) {
      html += '<img id="aim-animal-img" src="' + imgSrc + '" alt="' + info.label + '" ' +
              'data-srcs="' + srcsAttr + '" data-srcidx="0" ' +
              'style="width:100%;display:block;border-radius:var(--radius-md);" ' +
              'onerror="AimMap.tryNextSrc(this)">';
    }
    html += '<div id="aim-no-img" style="display:' + (imgSrc ? 'none' : 'flex') + ';' +
              'flex-direction:column;align-items:center;padding:32px 16px;color:var(--ink-muted);text-align:center;">' +
              '<div style="font-size:36px;margin-bottom:8px;">&#x1F98C;</div>' +
              '<div style="font-size:13px;line-height:1.6;">' +
                'Image not found for <strong>' + info.label + '</strong>.<br>' +
                'Upload one below, or place the JPG in<br>' +
                '<code style="font-size:11px;background:var(--sage-pale);padding:2px 5px;border-radius:3px;">assets/targets/' + _currentTarget + '.jpg</code>' +
              '</div></div>';
    html += dot;
    html += '</div>';
    html += '<div class="card card-sage" style="margin-top:10px;">' +
              '<div class="form-label" style="margin-bottom:6px;">Upload image for ' + info.label + '</div>' +
              '<input type="file" accept="image/*" ' +
                'onchange="AimMap.uploadImage(this,\'' + _currentTarget + '\')" ' +
                'style="font-size:13px;width:100%;">' +
            '</div>';
    return html;
  }
 
  /* ---- Try next image src in fallback list ---- */
  function tryNextSrc(img) {
    try {
      const srcs    = (img.dataset.srcs || '').split('|').filter(Boolean).map(decodeURIComponent);
      const nextIdx = parseInt(img.dataset.srcidx || '0') + 1;
      if (nextIdx < srcs.length) {
        img.dataset.srcidx = nextIdx;
        img.src = srcs[nextIdx];
      } else {
        img.style.display = 'none';
        const el = document.getElementById('aim-no-img');
        if (el) el.style.display = 'flex';
      }
    } catch(e) { img.style.display = 'none'; }
  }
 
  /* ---- All spots summary ---- */
  function renderAllSpots() {
    const spots = Storage.getAimSpots();
    const keys  = Object.keys(spots).filter(function(k){ return spots[k] && spots[k].x != null; });
    if (!keys.length) return '<div class="empty" style="padding:16px;">No spots saved yet.</div>';
    return keys.map(function(k) {
      const s      = spots[k];
      const parts  = k.split(':');
      const tid    = parts[0];
      const dist   = parts[1] || '';
      const label  = (TARGETS[tid] ? TARGETS[tid].label : tid) + ' \xB7 ' + dist;
      return '<div class="corr-row">' +
        '<div class="corr-label">' + label + '</div>' +
        '<div style="font-size:12px;color:var(--ink-muted);">' +
          Math.round(s.x*100) + '%, ' + Math.round(s.y*100) + '%' +
        '</div>' +
        '<button class="btn btn-xs btn-danger" onclick="AimMap.clearKey(\'' + k + '\')">&#x2715;</button>' +
      '</div>';
    }).join('');
  }
 
  /* ======================================================
     CLICK HANDLER
     ====================================================== */
  function attachClickHandler() {
    const mapWrap = document.getElementById('aim-map-image-wrap');
    if (!mapWrap) return;
    mapWrap.removeEventListener('click', handleMapClick);
    mapWrap.addEventListener('click', handleMapClick);
  }
 
  function handleMapClick(e) {
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.tagName === 'LABEL') return;
    const wrap = document.getElementById('aim-map-image-wrap');
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top)  / rect.height));
    Storage.setAimSpot(spotKey(), { x: parseFloat(x.toFixed(4)), y: parseFloat(y.toFixed(4)) });
    App.toast('Aim spot saved for ' + (TARGETS[_currentTarget] ? TARGETS[_currentTarget].label : _currentTarget) + ' at ' + _currentDist + 'm');
    render();
  }
 
  /* ======================================================
     PUBLIC API
     ====================================================== */
  function setTarget(targetId) {
    if (!TARGETS[targetId]) { console.warn('Unknown target:', targetId); return; }
    _currentTarget = targetId;
    _currentDist   = TARGETS[targetId].distances[0];
    render();
  }
 
  function setDist(dist) { _currentDist = dist; render(); }
 
  function clearSpot() {
    Storage.setAimSpot(spotKey(), null);
    App.toast('Spot cleared');
    render();
  }
 
  function clearKey(key) { Storage.setAimSpot(key, null); render(); }
 
  function uploadImage(input, targetId) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
      Storage.set(imgKey(targetId), ev.target.result);
      App.toast('Image saved for ' + (TARGETS[targetId] ? TARGETS[targetId].label : targetId));
      render();
    };
    reader.readAsDataURL(file);
  }
 
  return { render, setTarget, setDist, clearSpot, clearKey, uploadImage, tryNextSrc };
 
})();
 
