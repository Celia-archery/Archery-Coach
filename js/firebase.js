/* ============================================================
   firebase.js — Firebase Auth + Firestore social sharing
   Uses Firebase v9 compat SDK (loaded via CDN in index.html)
   ============================================================ */

const FB = (() => {

  let _db   = null;
  let _auth = null;
  let _user = null;

  /* ---- Init (called after Firebase SDK loads) ---- */
  function init(firebaseConfig) {
    try {
      if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
      _db   = firebase.firestore();
      _auth = firebase.auth();

      _auth.onAuthStateChanged(user => {
        _user = user;
        if (user) {
          Storage.setAccountId(user.uid);
          App.onAuthChange(user);
        } else {
          App.onAuthChange(null);
        }
      });
      return true;
    } catch(e) {
      console.warn('Firebase init failed — offline mode:', e);
      return false;
    }
  }

  function isReady()    { return !!_db && !!_auth; }
  function getUser()    { return _user; }
  function isSignedIn() { return !!_user; }

  /* ---- Auth ---- */
  async function signUpEmail(email, password, displayName) {
    const cred = await _auth.createUserWithEmailAndPassword(email, password);
    await cred.user.updateProfile({ displayName });
    await _db.collection('users').doc(cred.user.uid).set({
      displayName, email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return cred.user;
  }

  async function signInEmail(email, password) {
    return _auth.signInWithEmailAndPassword(email, password);
  }

  async function signOut() {
    return _auth.signOut();
  }

  async function resetPassword(email) {
    return _auth.sendPasswordResetEmail(email);
  }

  /* ---- Share a session to Firestore ---- */
  async function shareSession(session, profileName) {
    if (!isSignedIn()) throw new Error('Not signed in');
    const payload = {
      uid:         _user.uid,
      displayName: _user.displayName || 'Archer',
      profileName,
      sharedAt:    firebase.firestore.FieldValue.serverTimestamp(),
      type:        session.type,
      roundType:   session.roundType,
      total:       session.total,
      maxTotal:    session.maxTotal,
      date:        session.date,
      category:    session.category || null,
      flights:     session.flights    || null,
      animalLanes: session.animalLanes || null
    };
    return _db.collection('sharedScores').add(payload);
  }

  /* ---- Fetch community scores ---- */
  async function getCommunityScores(roundType = null, limitN = 50) {
    if (!isReady()) return [];
    try {
      let q = _db.collection('sharedScores').orderBy('sharedAt', 'desc').limit(limitN);
      if (roundType) q = q.where('roundType', '==', roundType);
      const snap = await q.get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch(e) {
      console.warn('getCommunityScores failed:', e);
      return [];
    }
  }

  /* ---- Leaderboard (top scores by round type) ---- */
  async function getLeaderboard(roundType) {
    if (!isReady()) return [];
    try {
      const snap = await _db.collection('sharedScores')
        .where('roundType', '==', roundType)
        .orderBy('total', 'desc')
        .limit(20)
        .get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch(e) {
      console.warn('getLeaderboard failed:', e);
      return [];
    }
  }

  return { init, isReady, getUser, isSignedIn,
           signUpEmail, signInEmail, signOut, resetPassword,
           shareSession, getCommunityScores, getLeaderboard };
})();
