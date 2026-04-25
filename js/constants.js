/* ============================================================
   constants.js — All scoring rules, animals, steps, tags
   ============================================================ */

const C = {

  /* ---- NASP 11 Steps ---- */
  STEPS: [
    { name: 'Stance',       desc: 'Stand perpendicular to the target. Feet shoulder-width apart, weight balanced.' },
    { name: 'Nock',         desc: 'Place arrow on the rest, clip nock to string at the nocking point.' },
    { name: 'Set',          desc: 'Grip the bow lightly. Hook fingers on string — one above, two below the nock.' },
    { name: 'Pre-draw',     desc: 'Raise bow arm toward target at shoulder height. Rotate elbow slightly outward.' },
    { name: 'Draw',         desc: 'Pull string back using back muscles. Keep drawing elbow high and moving back.' },
    { name: 'Anchor',       desc: 'Bring drawing hand firmly to the same anchor point every shot.' },
    { name: 'Aim',          desc: 'Focus on target and align sight pin with the centre. Keep both eyes open.' },
    { name: 'Shot Setup',   desc: 'Maintain back tension. Check alignment — bow arm steady, elbow pointing back.' },
    { name: 'Aim Again',    desc: 'Re-confirm sight picture. Make final micro-adjustments and commit.' },
    { name: 'Release',      desc: 'Relax fingers completely. Let the string slide off — do not throw the shot.' },
    { name: 'Follow Through', desc: 'Hold position until arrow hits. Bow arm stays up, drawing hand moves back naturally.' }
  ],

  /* ---- Bullseye rings ---- */
  BULLSEYE_RINGS: [
    { score: 10, colour: 'Gold',  hex: '#FFD700' },
    { score:  9, colour: 'Gold',  hex: '#FFD700' },
    { score:  8, colour: 'Red',   hex: '#CC2200' },
    { score:  7, colour: 'Red',   hex: '#CC2200' },
    { score:  6, colour: 'Blue',  hex: '#1144AA' },
    { score:  5, colour: 'Blue',  hex: '#1144AA' },
    { score:  4, colour: 'Black', hex: '#111111' },
    { score:  3, colour: 'Black', hex: '#111111' },
    { score:  2, colour: 'White', hex: '#DDDDDD' },
    { score:  1, colour: 'White', hex: '#DDDDDD' },
    { score:  0, colour: 'Miss',  hex: '#FFFFFF'  }
  ],

  /* ---- Animal scoring ---- */
  ANIMAL_SCORES: [10, 9, 8, 7, 0],
  ANIMAL_SCORE_LABELS: {
    10: 'Inner bull',
    9:  'Bull',
    8:  'Outer bull',
    7:  'On animal',
    0:  'Miss'
  },

  /* ---- Animals (6) ---- */
  ANIMALS: ['Duiker', 'Warthog', 'Bush Pig', 'Baboon', 'Porcupine', 'Hyena'],

  /* ---- Distances ---- */
  DISTANCES: [10, 11, 12, 13, 14, 15],
  BULLSEYE_DISTANCES: [10, 15],

  /* ---- Competition categories ---- */
  CATEGORIES: {
    aag:       { label: 'AAG (Adult)',          rounds: 2, distances: [10,15], scoring: [3,3], practice: [1,1], maxPerRound: 300, maxTotal: 600 },
    snr:       { label: 'Senior (High School)', rounds: 2, distances: [10,15], scoring: [3,3], practice: [1,1], maxPerRound: 300, maxTotal: 600 },
    jnr:       { label: 'Junior (Std 4–7)',     rounds: 2, distances: [10,15], scoring: [3,3], practice: [1,1], maxPerRound: 300, maxTotal: 600 },
    cubs:      { label: 'Cubs (Below Std 4)',   rounds: 1, distances: [10],    scoring: [4],   practice: [1],   maxPerRound: 200, maxTotal: 200 },
    beginners: { label: 'Beginners',            rounds: 1, distances: [10],    scoring: [4],   practice: [1],   maxPerRound: 200, maxTotal: 200 }
  },

  /* ---- Preset tags ---- */
  TAGS: ['Wind', 'Indoor', 'Outdoor', 'Morning', 'Afternoon', 'New arrows', 'Equipment issue',
         'Felt strong', 'Tired', 'Focused', 'Distracted', 'Rain', 'Hot', 'Cold', 'Competition nerves'],

  /* ---- Emoji mood scale ---- */
  MOOD_EMOJIS: [
    { val: 1, emoji: '😞', label: 'Poor' },
    { val: 2, emoji: '😕', label: 'Low' },
    { val: 3, emoji: '😐', label: 'OK' },
    { val: 4, emoji: '🙂', label: 'Good' },
    { val: 5, emoji: '😄', label: 'Great' }
  ],

  PHYSICAL_EMOJIS: [
    { val: 1, emoji: '🤕', label: 'Poor' },
    { val: 2, emoji: '😓', label: 'Low' },
    { val: 3, emoji: '😐', label: 'OK' },
    { val: 4, emoji: '💪', label: 'Good' },
    { val: 5, emoji: '🔥', label: 'Peak' }
  ],

  /* ---- Coach tips (offline fallback) ---- */
  COACH_TIPS: [
    "Focus on your anchor point — consistency there means consistency everywhere.",
    "Back tension, not arm pull, is the secret to a clean release.",
    "A relaxed bow grip eliminates torque. Think 'hold a bird, not a hammer'.",
    "Follow through holds your form accountable. Never peek early.",
    "Breathe in, exhale halfway, then release for maximum stability.",
    "Repetition builds muscle memory. Quality practice beats quantity every time.",
    "If a shot feels wrong at anchor, let it down. Never force a bad shot.",
    "Keep your bow arm up until the arrow hits. Your form isn't finished until it lands.",
    "The 11 Steps aren't just rules — they're a pre-shot routine. Make them automatic.",
    "Between ends, shake tension from your hands and refocus your breathing."
  ]
};
