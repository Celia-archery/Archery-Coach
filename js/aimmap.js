/* ============================================================
   aimmap.js — Aim spot marking system v3
   Per archer, per target type, per distance.
   ============================================================ */
 
const AimMap = (() => {
 
  let _currentTarget = 'bullseye';
  let _currentDist   = 10;
 
  /* ---- Target definitions — keys are safe IDs (no spaces) ---- */
  const TARGETS = {
    bullseye:  { label:'Paper Target', distances:[10,15],             cx:0.50, cy:0.50, srcs:[] },
    duiker:    { label:'Duiker',       distances:[10,11,12,13,14,15], cx:0.53, cy:0.53, srcs:['assets/targets/duiker.jpg',    'AGA_2D_with_Fita_Rings_2025_duiker.jpg']    },
    warthog:   { label:'Warthog',      distances:[10,11,12,13,14,15], cx:0.46, cy:0.50, srcs:['assets/targets/warthog.jpg',   'AGA_2D_with_Fita_Rings_2025_Warthog.jpg']   },
    bushpig:   { label:'Bush Pig',     distances:[10,11,12,13,14,15], cx:0.55, cy:0.55, srcs:['assets/targets/bushpig.jpg',   'AGA_2D_with_Fita_Rings_2025_bushpig.jpg']   },
    baboon:    { label:'Baboon',       distances:[10,11,12,13,14,15], cx:0.46, cy:0.46, srcs:['assets/targets/baboon.jpg',    'AGA_2D_with_Fita_Rings_2025_Baboon.jpg']    },
    porcupine: { label:'Porcupine',    distances:[10,11,12,13,14,15], cx:0.55, cy:0.52, srcs:['assets/targets/porcupine.jpg', 'AGA_2D_with_Fita_Rings_2025_porcupine.jpg'] },
    hyena:     { label:'Hyena',        distances:[10,11,12,13,14,15], cx:0.50, cy:0.52, srcs:['assets/targets/hyena.jpg',     'AGA_2D_with_Fita_Rings_2025_Hyena.jpg']     }
  };
 
  const TARGET_KEYS = Object.keys(TARGETS);
 
  /* ---- Keys ---- */
  function spotKey()    { return 'spot:' + _currentTarget + ':' + _currentDist; }
  function imgKey(id)   { return 'arch:img:' + id; }
 
  /* ---- Get/set aim spots (separate from image storage) ---- */
  function getSpot(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch(e) { return null; }
  }
  function setSpot(key, val) {
    try {
      if (val === null) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(val));
    } catch(e) {}
  }
  function getAllSpotKeys() {
    var keys = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf('spot:') === 0) keys.push(k);
    }
    return keys;
  }
 
  /* ======================================================
     MAIN RENDER
     ====================================================== */
  function render() {
    var wrap = document.getElementById('aimmap-wrap');
    if (!wrap) return;
    try {
      var info  = TARGETS[_currentTarget] || TARGETS.bullseye;
      var spot  = getSpot(spotKey());
      var dists = info.distances || [10, 15];
 
      var html = '';
      html += renderTargetTabs();
      html += renderDistanceTabs(dists);
      html += renderTipBox(spot, info);
 
      // Image area — self-contained div
      html += '<div id="aim-map-image-wrap" style="cursor:crosshair;margin-bottom:12px;">';
      html +=   renderTargetImage(info, spot);
      html += '</div>';
 
      // Upload section — outside image wrap
      if (_currentTarget !== 'bullseye') {
        html += renderUploadSection(info.label);
      }
 
      // Spot actions
      if (spot) html += renderSpotActions(spot);
 
      // Saved spots list
      html += '<div class="section-title">All saved aim spots</div>';
      html += '<div class="card">' + renderAllSpots() + '</div>';
 
      wrap.innerHTML = html;
      setTimeout(attachClickHandler, 80);
 
    } catch(err) {
      console.error('AimMap render error:', err);
      wrap.innerHTML = '<div class="tip-box" style="border-left-color:#8B4513;background:#fff0e8;">' +
        '<strong>Aim Map error:</strong> ' + err.message + '</div>';
    }
  }
 
  /* ---- Tabs ---- */
  function renderTargetTabs() {
    var html = '<div class="section-title" style="margin-top:0;">Target</div>';
    html += '<div class="tab-bar" style="flex-wrap:wrap;height:auto;padding:4px;gap:4px;margin-bottom:8px;">';
    TARGET_KEYS.forEach(function(k) {
      var active = (_currentTarget === k) ? 'active' : '';
      html += '<button class="tab-btn ' + active + '" style="min-width:76px;flex:none;" ' +
              'onclick="AimMap.setTarget(\'' + k + '\')">' + TARGETS[k].label + '</button>';
    });
    html += '</div>';
    return html;
  }
 
  function renderDistanceTabs(dists) {
    var html = '<div class="section-title">Distance</div>';
    html += '<div class="tab-bar" style="margin-bottom:12px;">';
    dists.forEach(function(d) {
      var active = (_currentDist === d) ? 'active' : '';
      html += '<button class="tab-btn ' + active + '" onclick="AimMap.setDist(' + d + ')">' + d + 'm</button>';
    });
    html += '</div>';
    return html;
  }
 
  function renderTipBox(spot, info) {
    return '<div class="tip-box">Tap the target image to set your aiming spot for <strong>' +
      info.label + '</strong> at <strong>' + _currentDist + 'm</strong>. ' +
      (spot ? '&#x2705; Spot saved.' : 'Tap to set a spot.') + '</div>';
  }
 
  function renderSpotActions(spot) {
    return '<div style="display:flex;gap:8px;margin:8px 0;">' +
      '<button class="btn btn-outline btn-sm" onclick="AimMap.clearSpot()">Clear this spot</button>' +
      '<span style="font-size:13px;color:var(--ink-soft);display:flex;align-items:center;">' +
        Math.round(spot.x*100) + '%, ' + Math.round(spot.y*100) + '%' +
      '</span></div>';
  }
 
  function renderUploadSection(label) {
    return '<div class="card card-sage" style="margin-bottom:12px;">' +
      '<div class="form-label" style="margin-bottom:6px;">Upload your own image for ' + label + '</div>' +
      '<input type="file" accept="image/*" ' +
        'onchange="AimMap.uploadImage(this,\'' + _currentTarget + '\')" ' +
        'style="font-size:13px;width:100%;">' +
    '</div>';
  }
 
  /* ======================================================
     IMAGE RENDERING — only one image shown at a time
     ====================================================== */
  function renderTargetImage(info, spot) {
    if (_currentTarget === 'bullseye') return renderBullseyeSVG(spot);
    return renderAnimalImage(info, spot);
  }
 
  function renderBullseyeSVG(spot) {
    var rings = [
      {r:48,fill:'#EEEEEE'},{r:43,fill:'#DDDDDD'},
      {r:38,fill:'#1a1a1a'},{r:33,fill:'#2a2a2a'},
      {r:28,fill:'#1144BB'},{r:23,fill:'#2255CC'},
      {r:18,fill:'#CC2200'},{r:13,fill:'#DD3311'},
      {r:8, fill:'#FFD700'},{r:4, fill:'#FFE033'}
    ];
    var svg = '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" ' +
              'style="width:100%;display:block;border-radius:var(--radius-md);">';
    svg += '<rect width="100" height="100" fill="#f0ece4"/>';
    rings.forEach(function(r) {
      svg += '<circle cx="50" cy="50" r="' + r.r + '" fill="' + r.fill + '"/>';
    });
    svg += '<line x1="50" y1="0" x2="50" y2="100" stroke="rgba(0,0,0,0.12)" stroke-width="0.4"/>';
    svg += '<line x1="0" y1="50" x2="100" y2="50" stroke="rgba(0,0,0,0.12)" stroke-width="0.4"/>';
    svg += '</svg>';
 
    var dot = spot
      ? '<div class="aim-dot" style="left:' + (spot.x*100) + '%;top:' + (spot.y*100) + '%;position:absolute;"></div>'
      : '';
 
    return '<div style="position:relative;border-radius:var(--radius-md);overflow:hidden;">' + svg + dot + '</div>';
  }
 
  function renderAnimalImage(info, spot) {
    var cx = info.cx || 0.5;
    var cy = info.cy || 0.5;
    var uploadedSrc = null;
    try { uploadedSrc = localStorage.getItem(imgKey(_currentTarget)); } catch(e) {}
 
    var srcs = info.srcs || [];
    var imgSrc = uploadedSrc || (srcs.length ? srcs[0] : '');
 
    // Centre guide dot (shown when no spot saved yet)
    var centreDot = '<div style="position:absolute;left:' + (cx*100) + '%;top:' + (cy*100) + '%;' +
      'transform:translate(-50%,-50%);width:18px;height:18px;border-radius:50%;' +
      'border:2px dashed rgba(255,255,255,0.85);pointer-events:none;' +
      'box-shadow:0 0 0 1px rgba(0,0,0,0.35);" title="Scoring centre"></div>';
 
    var aimDot = spot
      ? '<div class="aim-dot" style="left:' + (spot.x*100) + '%;top:' + (spot.y*100) + '%;position:absolute;"></div>'
      : centreDot;
 
    // Encode fallback srcs for onerror chain
    var srcsEncoded = srcs.map(encodeURIComponent).join('|');
 
    var html = '<div style="position:relative;background:var(--sage-pale);border-radius:var(--radius-md);overflow:hidden;min-height:100px;">';
 
    if (imgSrc) {
      html += '<img id="aim-animal-img" ' +
              'src="' + imgSrc + '" ' +
              'alt="' + info.label + '" ' +
              'data-srcs="' + srcsEncoded + '" ' +
              'data-srcidx="0" ' +
              'style="width:100%;display:block;" ' +
              'onerror="AimMap.tryNextSrc(this)">';
    }
 
    // "Not found" message — hidden if image loads, shown if all srcs fail
    html += '<div id="aim-no-img" style="display:' + (imgSrc ? 'none' : 'flex') + ';' +
            'flex-direction:column;align-items:center;padding:28px 16px;text-align:center;color:var(--ink-muted);">' +
            '<div style="font-size:36px;margin-bottom:8px;">&#x1F98C;</div>' +
            '<div style="font-size:13px;line-height:1.6;">' +
              '<strong>' + info.label + '</strong> image not found.<br>' +
              'Expected at: <code style="font-size:11px;">assets/targets/' + _currentTarget + '.jpg</code><br>' +
              'Or upload one using the button below.' +
            '</div></div>';
 
    html += aimDot;
    html += '</div>'; // end position:relative wrapper
    return html;
  }
 
  /* ---- Try next src in fallback chain ---- */
  function tryNextSrc(img) {
    try {
      var srcs    = (img.dataset.srcs || '').split('|').filter(Boolean).map(decodeURIComponent);
      var nextIdx = parseInt(img.dataset.srcidx || '0') + 1;
      if (nextIdx < srcs.length) {
        img.dataset.srcidx = String(nextIdx);
        img.src = srcs[nextIdx];
      } else {
        img.style.display = 'none';
        var noImg = document.getElementById('aim-no-img');
        if (noImg) noImg.style.display = 'flex';
      }
    } catch(e) {
      img.style.display = 'none';
    }
  }
 
  /* ---- Saved spots list — text only, NO images ---- */
  function renderAllSpots() {
    var keys = getAllSpotKeys();
    if (!keys.length) {
      return '<div class="empty" style="padding:16px;">No spots saved yet. Tap a target image above to set one.</div>';
    }
    return keys.map(function(k) {
      var s      = getSpot(k);
      if (!s || s.x == null) return '';
      // key format: spot:targetId:distance
      var parts  = k.split(':');
      var tid    = parts[1] || '';
      var dist   = parts[2] || '';
      var label  = (TARGETS[tid] ? TARGETS[tid].label : tid) + ' \xB7 ' + dist;
      return '<div class="corr-row">' +
        '<div class="corr-label">' + label + '</div>' +
        '<div style="font-size:12px;color:var(--ink-muted);">' +
          Math.round(s.x*100) + '%, ' + Math.round(s.y*100) + '%' +
        '</div>' +
        '<button class="btn btn-xs btn-danger" onclick="AimMap.clearKey(\'' + k + '\')">&#x2715;</button>' +
      '</div>';
    }).filter(Boolean).join('');
  }
 
  /* ======================================================
     CLICK HANDLER
     ====================================================== */
  function attachClickHandler() {
    var mapWrap = document.getElementById('aim-map-image-wrap');
    if (!mapWrap) return;
    mapWrap.removeEventListener('click', handleMapClick);
    mapWrap.addEventListener('click', handleMapClick);
  }
 
  function handleMapClick(e) {
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' ||
        e.target.tagName === 'LABEL'  || e.target.tagName === 'A') return;
    var wrap = document.getElementById('aim-map-image-wrap');
    if (!wrap) return;
    var rect = wrap.getBoundingClientRect();
    var x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    var y = Math.min(1, Math.max(0, (e.clientY - rect.top)  / rect.height));
    setSpot(spotKey(), { x: parseFloat(x.toFixed(4)), y: parseFloat(y.toFixed(4)) });
    App.toast('Aim spot saved \u2014 ' + (TARGETS[_currentTarget] ? TARGETS[_currentTarget].label : _currentTarget) + ' ' + _currentDist + 'm');
    render();
  }
 
  /* ======================================================
     PUBLIC API
     ====================================================== */
  function setTarget(targetId) {
    if (!TARGETS[targetId]) return;
    _currentTarget = targetId;
    _currentDist   = TARGETS[targetId].distances[0];
    render();
  }
 
  function setDist(dist) { _currentDist = dist; render(); }
 
  function clearSpot() {
    setSpot(spotKey(), null);
    App.toast('Spot cleared');
    render();
  }
 
  function clearKey(key) {
    try { localStorage.removeItem(key); } catch(e) {}
    render();
  }
 
  function uploadImage(input, targetId) {
    var file = input.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      try { localStorage.setItem(imgKey(targetId), ev.target.result); } catch(e) {
        App.toast('Image too large to store — try a smaller file');
        return;
      }
      App.toast('Image saved for ' + (TARGETS[targetId] ? TARGETS[targetId].label : targetId));
      render();
    };
    reader.readAsDataURL(file);
  }
 
  return { render, setTarget, setDist, clearSpot, clearKey, uploadImage, tryNextSrc };
 
})();
 
