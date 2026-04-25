/* ============================================================
   storage.js — Complete data layer
   All data namespaced per user account + per archer profile.
   Firebase sync layered on top of localStorage baseline.
   ============================================================ */

const Storage = (() => {

  /* ---- LocalStorage helpers ---- */
  function get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch(e) { return fallback; }
  }
  function set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch(e) { console.warn('Storage full?', e); return false; }
  }
  function del(key) {
    try { localStorage.removeItem(key); } catch(e) {}
  }

  /* ---- Account / Auth ---- */
  function getAccountId() { return get('arch:accountId', null); }
  function setAccountId(id) { set('arch:accountId', id); }

  /* ---- Profiles (up to 5) ---- */
  const DEFAULT_PROFILES = [{ id: 'p1', name: 'Archer 1', category: 'jnr', color: '#1E3A1E' }];
  function getProfiles()          { return get('arch:profiles', DEFAULT_PROFILES); }
  function setProfiles(arr)       { set('arch:profiles', arr); }
  function getActiveProfileId()   { return get('arch:activeProfile', 'p1'); }
  function setActiveProfileId(id) { set('arch:activeProfile', id); }
  function getActiveProfile() {
    const profiles = getProfiles();
    return profiles.find(p => p.id === getActiveProfileId()) || profiles[0];
  }
  function addProfile(name, category) {
    const profiles = getProfiles();
    if (profiles.length >= 5) return false;
    const id = 'p' + Date.now();
    profiles.push({ id, name, category: category || 'jnr', color: '#1E3A1E' });
    setProfiles(profiles);
    return id;
  }
  function removeProfile(id) {
    const profiles = getProfiles().filter(p => p.id !== id);
    if (!profiles.length) return false;
    setProfiles(profiles);
    if (getActiveProfileId() === id) setActiveProfileId(profiles[0].id);
    del('arch:' + id + ':sessions');
    del('arch:' + id + ':steps');
    del('arch:' + id + ':aimspots');
    return true;
  }

  /* ---- Namespaced key helper ---- */
  function pk(suffix) { return 'arch:' + getActiveProfileId() + ':' + suffix; }

  /* ================================================================
     SESSIONS
     Each session object shape:
     {
       id, date, timestamp,
       type: 'practice' | 'competition',
       roundType: 'bullseye' | 'animal2d' | 'animal3d',
       category: 'aag'|'snr'|'jnr'|'cubs'|'beginners',  // competitions
       mood: 1-5,
       physicalReadiness: 1-5,
       focusSteps: [bool x11],
       tags: [],
       notes: '',
       // Bullseye:
       flights: [{ distance:10|15, practice:bool, arrows:[0-10 x5], total }],
       // Animal:
       animalLanes: [{ distance, animal, score:0|7|8|9|10 }],
       total, maxTotal
     }
     ================================================================ */

  function getSessions()      { return get(pk('sessions'), []); }
  function setSessions(arr)   { set(pk('sessions'), arr); }

  function addSession(session) {
    const sessions = getSessions();
    const s = { ...session, id: Date.now(), timestamp: Date.now(),
      date: new Date().toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) };
    sessions.push(s);
    setSessions(sessions);
    return s.id;
  }

  function updateSession(id, patch) {
    const sessions = getSessions();
    const idx = sessions.findIndex(s => s.id === id);
    if (idx === -1) return false;
    sessions[idx] = { ...sessions[idx], ...patch };
    setSessions(sessions);
    return true;
  }

  function deleteSession(id) {
    setSessions(getSessions().filter(s => s.id !== id));
  }

  function getSessionsByType(type) {
    return getSessions().filter(s => s.type === type);
  }

  /* ---- Stats helpers ---- */
  function getStats() {
    const sessions = getSessions();
    if (!sessions.length) return { count:0, avgScore:0, bestScore:0, practiceCount:0, compCount:0 };
    const scored = sessions.filter(s => s.total > 0);
    const scores = scored.map(s => s.total);
    return {
      count:         sessions.length,
      practiceCount: sessions.filter(s => s.type === 'practice').length,
      compCount:     sessions.filter(s => s.type === 'competition').length,
      avgScore:      scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : 0,
      bestScore:     scores.length ? Math.max(...scores) : 0,
      recentSessions: [...sessions].reverse().slice(0,5)
    };
  }

  /* ---- Bullseye-specific stats ---- */
  function getBullseyeStats() {
    const sessions = getSessions().filter(s => s.roundType === 'bullseye');
    const stats = { '10m': { totals:[], avg:0 }, '15m': { totals:[], avg:0 } };
    sessions.forEach(s => {
      (s.flights||[]).filter(f=>!f.practice).forEach(f => {
        const key = f.distance + 'm';
        if (stats[key]) stats[key].totals.push(f.total);
      });
    });
    ['10m','15m'].forEach(k => {
      const t = stats[k].totals;
      stats[k].avg = t.length ? Math.round(t.reduce((a,b)=>a+b,0)/t.length) : 0;
      stats[k].best = t.length ? Math.max(...t) : 0;
    });
    return stats;
  }

  /* ---- Mood / readiness correlation ---- */
  function getMoodCorrelation() {
    const sessions = getSessions().filter(s => s.mood && s.total);
    const byMood = {};
    sessions.forEach(s => {
      if (!byMood[s.mood]) byMood[s.mood] = [];
      byMood[s.mood].push(s.total);
    });
    return Object.entries(byMood).map(([mood, scores]) => ({
      mood: parseInt(mood),
      avg: Math.round(scores.reduce((a,b)=>a+b,0)/scores.length),
      count: scores.length
    })).sort((a,b) => a.mood - b.mood);
  }

  function getTagStats() {
    const sessions = getSessions().filter(s => s.tags && s.tags.length && s.total);
    const byTag = {};
    sessions.forEach(s => {
      s.tags.forEach(tag => {
        if (!byTag[tag]) byTag[tag] = [];
        byTag[tag].push(s.total);
      });
    });
    return Object.entries(byTag).map(([tag, scores]) => ({
      tag,
      avg: Math.round(scores.reduce((a,b)=>a+b,0)/scores.length),
      count: scores.length
    })).sort((a,b) => b.avg - a.avg);
  }

  /* ---- NASP Steps ---- */
  function getSteps()      { return get(pk('steps'), new Array(11).fill(false)); }
  function setSteps(arr)   { set(pk('steps'), arr); }

  /* ---- Aim spots ---- */
  // Key: profileId:aimspots → { 'bullseye:10m': {x,y}, 'animal:duiker:10m': {x,y}, ... }
  function getAimSpots()         { return get(pk('aimspots'), {}); }
  function setAimSpot(key, spot) {
    const spots = getAimSpots();
    spots[key] = spot;
    set(pk('aimspots'), spots);
  }
  function getAimSpot(key) { return getAimSpots()[key] || null; }

  return {
    get, set, del,
    getAccountId, setAccountId,
    getProfiles, setProfiles,
    getActiveProfileId, setActiveProfileId, getActiveProfile,
    addProfile, removeProfile,
    getSessions, setSessions, addSession, updateSession, deleteSession,
    getSessionsByType, getStats, getBullseyeStats,
    getMoodCorrelation, getTagStats,
    getSteps, setSteps,
    getAimSpots, setAimSpot, getAimSpot
  };
})();
