/* ============================================================
   coach.js — AI-powered coach via Claude API
   Falls back to rule-based tips when offline.
   ============================================================ */

const Coach = (() => {

  let _thinking = false;

  /* ---- Build a rich context payload for the AI ---- */
  function buildContext() {
    const profile  = Storage.getActiveProfile();
    const stats    = Storage.getStats();
    const bStats   = Storage.getBullseyeStats();
    const sessions = Storage.getSessions().slice(-10);
    const steps    = Storage.getSteps();
    const mood     = Storage.getMoodCorrelation();
    const tags     = Storage.getTagStats();

    return {
      archerName:        profile.name,
      category:          profile.category,
      totalSessions:     stats.count,
      avgScore:          stats.avgScore,
      bestScore:         stats.bestScore,
      bullseye10mAvg:    bStats['10m'].avg,
      bullseye15mAvg:    bStats['15m'].avg,
      bullseye10mBest:   bStats['10m'].best,
      bullseye15mBest:   bStats['15m'].best,
      recentScores:      sessions.map(s => ({ type: s.roundType, total: s.total, date: s.date })),
      stepsCompleted:    steps.filter(Boolean).length,
      moodCorrelation:   mood,
      topTags:           tags.slice(0,5),
      lastMood:          sessions.length ? sessions[sessions.length-1].mood : null,
      lastPhysical:      sessions.length ? sessions[sessions.length-1].physicalReadiness : null
    };
  }

  /* ---- System prompt ---- */
  const SYSTEM = `You are an expert NASP® archery coach embedded in an archery tracking app.
Your role is to analyse an archer's performance data and give them specific, encouraging, 
actionable coaching advice. 

Rules:
- Be warm, encouraging, and specific — reference their actual numbers
- Keep responses to 3–5 sentences maximum
- Always end with one concrete action they can take in their next session
- For young archers (cubs/jnr), use simpler language and more encouragement
- Reference the NASP 11 Steps when relevant
- If scores are improving, celebrate that; if declining, diagnose gently
- Never be harsh or discouraging`;

  /* ---- Ask the AI coach ---- */
  async function ask(userQuestion) {
    if (_thinking) return;
    _thinking = true;
    showThinking(true);

    const ctx = buildContext();

    const prompt = `Here is my archery performance data:
${JSON.stringify(ctx, null, 2)}

My question: ${userQuestion || 'Give me personalised coaching advice based on my recent performance.'}`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: SYSTEM,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!res.ok) throw new Error('API error: ' + res.status);
      const data = await res.json();
      const text = data.content?.[0]?.text || offlineTip();
      showResponse(text);
    } catch(e) {
      console.warn('Coach API failed, using offline tip:', e);
      showResponse(offlineTip());
    } finally {
      _thinking = false;
      showThinking(false);
    }
  }

  /* ---- Offline fallback ---- */
  function offlineTip() {
    const tips = C.COACH_TIPS;
    return tips[Math.floor(Math.random() * tips.length)];
  }

  /* ---- UI helpers ---- */
  function showThinking(on) {
    const el = document.getElementById('coach-thinking');
    const te = document.getElementById('coach-text');
    if (el) el.style.display = on ? 'flex' : 'none';
    if (te && on) te.style.opacity = '0.4';
  }

  function showResponse(text) {
    const te = document.getElementById('coach-text');
    const el = document.getElementById('coach-thinking');
    if (te) { te.textContent = text; te.style.opacity = '1'; }
    if (el) el.style.display = 'none';
  }

  /* ---- Auto-coaching after a session is saved ---- */
  async function autoCoach(session) {
    const profile = Storage.getActiveProfile();
    const ctx     = buildContext();
    const prompt  = `I just completed a ${session.type} session.
Round: ${session.roundType}. Total: ${session.total}/${session.maxTotal}.
My mood was ${session.mood}/5, physical readiness ${session.physicalReadiness}/5.
${session.notes ? 'Notes: ' + session.notes : ''}
My performance data: ${JSON.stringify({ avgScore: ctx.avgScore, bestScore: ctx.bestScore, totalSessions: ctx.totalSessions }, null, 2)}
Give me immediate post-session feedback.`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: SYSTEM,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      return data.content?.[0]?.text || offlineTip();
    } catch(e) {
      return offlineTip();
    }
  }

  return { ask, autoCoach, offlineTip };
})();
