// ─── Condition definitions ────────────────────────────────────
// built: true = game is fully implemented
// built: false = placeholder shown, game being built next

export const CONDITIONS = [
  {
    id: 'anxiety',
    label: "My mind won't stop",
    clinical: 'Anxiety',
    game: 'Fog Lantern',
    color: '#4A9EDE',
    icon: '🌫️',
    built: false,
    desc: 'You carry a warm lantern through a dark misty world. Moving slowly reveals breathtaking hidden scenes. Move too fast and the lantern flickers out — hold still to relight it.',
  },
  {
    id: 'depression',
    label: 'I feel empty or low',
    clinical: 'Depression',
    game: 'Deep Sea Glow',
    color: '#20A882',
    icon: '🌊',
    built: false,
    desc: 'Complete darkness. Any touch creates bioluminescent ripples. Glowing sea creatures swim toward your light. The more you interact, the more alive the world becomes.',
  },
  {
    id: 'stress',
    label: 'Everything feels too much',
    clinical: 'Stress',
    game: 'Glass Storm',
    color: '#E06B3A',
    icon: '💥',
    built: true,
    desc: 'Swipe hard through the cracked glass panes suspended in space. Each shattering releases a satisfying crack and dissolves into soft drifting particles. Calm waits beneath.',
  },
  {
    id: 'fear',
    label: 'Something has me scared',
    clinical: 'Fear',
    game: 'The Lighthouse',
    color: '#9B8FE8',
    icon: '🔦',
    built: false,
    desc: 'A violent storm. Ships are lost at sea. You are the lighthouse keeper — tap rhythmically to keep the beam spinning. As you maintain the rhythm, the storm slowly clears.',
  },
  {
    id: 'tension',
    label: 'My body feels tight',
    clinical: 'Tension',
    game: 'The Coil',
    color: '#44C4A1',
    icon: '🌀',
    built: false,
    desc: 'Press and hold a glowing coil to wind it tighter — colour shifts, tension builds. Then release for an explosion of light and particles. Three coils per session.',
  },
  {
    id: 'unknown',
    label: 'I just feel... off',
    clinical: 'Discovery',
    game: 'The Signal',
    color: '#A89E8A',
    icon: '🔍',
    built: true,
    dashed: true,
    desc: 'Three sensory scenes appear. Pick the one that feels most like right now. One follow-up question narrows it down and routes you to the right game.',
  },
]

// ─── India-specific crisis helplines ─────────────────────────
export const CRISIS = [
  { name: 'iCall',                 number: '9152987821' },
  { name: 'Vandrevala Foundation', number: '1860-2662-345' },
  { name: 'AASRA',                 number: '9820466627' },
  { name: 'Snehi',                 number: '044-24640050' },
]

// ─── Session-close affirmations per condition ─────────────────
export const AFFIRMATIONS = {
  anxiety:    "You slowed down when your mind wanted to race. That's real courage.",
  depression: 'You showed up. Even the smallest light you created today counts.',
  stress:     "You let it out. Now there's room to breathe again.",
  fear:       'You kept the light going when the storm was loudest. That matters.',
  tension:    'You felt the tension and then you let it go. Your body remembers.',
  unknown:    "You reached in when you didn't know what you needed. That takes bravery.",
}

// ─── The Signal sensory scenes ────────────────────────────────
export const SIGNAL_SCENES = [
  {
    label: 'Churning waves',
    sub: 'Restless, crashing, chaotic energy',
    emoji: '🌊',
    color: '#E06B3A',
    followup: [
      { answer: 'Panic / mind racing, can\'t breathe', conditionId: 'anxiety' },
      { answer: 'Frustrated and completely overwhelmed', conditionId: 'stress' },
    ],
  },
  {
    label: 'Still grey fog',
    sub: 'Heavy, slow, quiet and numb',
    emoji: '🌫️',
    color: '#6B8CAE',
    followup: [
      { answer: 'Empty, disconnected, feel nothing', conditionId: 'depression' },
      { answer: 'Stuck, tight, body won\'t move', conditionId: 'tension' },
    ],
  },
  {
    label: 'Crackling sparks',
    sub: 'Sharp, edgy, electric and on-edge',
    emoji: '⚡',
    color: '#9B8FE8',
    followup: [
      { answer: 'Scared thoughts, something feels threatening', conditionId: 'fear' },
      { answer: 'Physical tension, body is coiled tight', conditionId: 'tension' },
    ],
  },
]
