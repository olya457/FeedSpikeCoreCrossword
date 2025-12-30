export type CrosswordWord = {
  clue: string;
  answer: string;
};

export type CrosswordLevel = {
  id: number;
  title: string;
  words: CrosswordWord[];
};

export const CROSSWORDS: CrosswordLevel[] = [
  {
    id: 1,
    title: 'Fruits',
    words: [
      { clue: 'Small green or purple fruits growing in a bunch', answer: 'GRAPE' },
      { clue: 'A yellow sour fruit', answer: 'LEMON' },
      { clue: 'A green part of a plant', answer: 'LEAF' },
      { clue: 'A purple fruit with a stone inside', answer: 'PLUM' },
    ],
  },
  {
    id: 2,
    title: 'Energy & Light',
    words: [
      { clue: 'A small flash of energy', answer: 'SPARK' },
      { clue: 'A moving line of energy or motion', answer: 'WAPER' },
      { clue: 'The center or heart of something', answer: 'CORE' },
    ],
  },
  {
    id: 3,
    title: 'Calm & Feelings',
    words: [
      { clue: 'A state of being relaxed and calm', answer: 'PEACE' },
      { clue: 'To stop and relax', answer: 'REST' },
      { clue: 'Gentle to touch or feel', answer: 'SOFT' },
      { clue: 'The absence of noise', answer: 'QUIET' },
    ],
  },
  {
    id: 4,
    title: 'Growth & Care',
    words: [
      { clue: 'A flower opening or growing', answer: 'BLOOM' },
      { clue: 'The part of a plant under the ground', answer: 'ROOT' },
      { clue: 'To become bigger over time', answer: 'GROW' },
    ],
  },
  {
    id: 5,
    title: 'Spike World',
    words: [
      { clue: 'The name of your energy friend', answer: 'SPIKE' },
      { clue: 'Something that makes darkness brighter', answer: 'LIGHT' },
      { clue: 'Power that makes things move or shine', answer: 'ENERGY' },
    ],
  },
  {
    id: 6,
    title: 'Daily Calm',
    words: [
      { clue: 'To slowly take air in and out', answer: 'BREATHE' },
      { clue: 'The start of the day', answer: 'MORNING' },
      { clue: 'A state of harmony and stability', answer: 'BALANCE' },
      { clue: 'Not moving, calm', answer: 'STILL' },
    ],
  },

  { id: 7, title: 'Nature Touch', words: [
    { clue: 'A small flowing stream', answer: 'RIVER' },
    { clue: 'Soft light from the sky', answer: 'GLOW' },
    { clue: 'Moving air', answer: 'WIND' },
  ]},
  { id: 8, title: 'Inner State', words: [
    { clue: 'Being aware of the present', answer: 'FOCUS' },
    { clue: 'To let go of stress', answer: 'RELAX' },
    { clue: 'A feeling of safety', answer: 'SAFE' },
  ]},
  { id: 9, title: 'Plant Life', words: [
    { clue: 'A tall plant with a hard trunk', answer: 'TREE' },
    { clue: 'A thin green part of a plant', answer: 'STEM' },
    { clue: 'A seed growing into a plant', answer: 'SPROUT' },
  ]},
  { id: 10, title: 'Light Shapes', words: [
    { clue: 'A round shape', answer: 'CIRCLE' },
    { clue: 'A straight line', answer: 'LINE' },
    { clue: 'A soft edge', answer: 'CURVE' },
  ]},
  { id: 11, title: 'Soft Actions', words: [
    { clue: 'To move slowly', answer: 'DRIFT' },
    { clue: 'To touch lightly', answer: 'BRUSH' },
    { clue: 'To hold gently', answer: 'CRADLE' },
  ]},
  { id: 12, title: 'Quiet Moments', words: [
    { clue: 'The time before sleep', answer: 'NIGHT' },
    { clue: 'The moment after rest', answer: 'WAKE' },
    { clue: 'A short stop', answer: 'PAUSE' },
  ]},
  { id: 13, title: 'Warm Feelings', words: [
    { clue: 'A kind emotion', answer: 'CARE' },
    { clue: 'A gentle smile', answer: 'SMILE' },
    { clue: 'Feeling close to someone', answer: 'BOND' },
  ]},
  { id: 14, title: 'Day Light', words: [
    { clue: 'Light in the early day', answer: 'DAWN' },
    { clue: 'Soft light at sunset', answer: 'DUSK' },
    { clue: 'Heat from the sun', answer: 'WARMTH' },
  ]},
  { id: 15, title: 'Simple Joy', words: [
    { clue: 'A pleasant feeling', answer: 'JOY' },
    { clue: 'Something fun to do', answer: 'PLAY' },
    { clue: 'A happy surprise', answer: 'DELIGHT' },
  ]},
  { id: 16, title: 'Flow', words: [
    { clue: 'To move smoothly', answer: 'FLOW' },
    { clue: 'A steady rhythm', answer: 'PACE' },
    { clue: 'Even and stable', answer: 'STEADY' },
  ]},
  { id: 17, title: 'Earth', words: [
    { clue: 'Dry soil', answer: 'SAND' },
    { clue: 'Small stones', answer: 'PEBBLE' },
    { clue: 'Solid ground', answer: 'EARTH' },
  ]},
  { id: 18, title: 'Support', words: [
    { clue: 'To help gently', answer: 'AID' },
    { clue: 'To protect', answer: 'GUARD' },
    { clue: 'To support growth', answer: 'NURTURE' },
  ]},
  { id: 19, title: 'Calm Space', words: [
    { clue: 'A safe place', answer: 'SHELTER' },
    { clue: 'A quiet area', answer: 'ZONE' },
    { clue: 'A small room', answer: 'ROOM' },
  ]},
  { id: 20, title: 'Motion', words: [
    { clue: 'Soft movement', answer: 'SWAY' },
    { clue: 'Slow rotation', answer: 'TURN' },
    { clue: 'Gentle rise', answer: 'LIFT' },
  ]},
  { id: 21, title: 'Inner Strength', words: [
    { clue: 'Calm power', answer: 'STRENGTH' },
    { clue: 'Steady confidence', answer: 'FAITH' },
    { clue: 'Inner light', answer: 'SPIRIT' },
  ]},
  { id: 22, title: 'Nature Sounds', words: [
    { clue: 'Water falling', answer: 'DROP' },
    { clue: 'Leaves moving softly', answer: 'RUSTLE' },
    { clue: 'A soft constant sound', answer: 'HUM' },
  ]},
  { id: 23, title: 'Daily Care', words: [
    { clue: 'Food for growth', answer: 'NOURISH' },
    { clue: 'Time to rest', answer: 'SLEEP' },
    { clue: 'Care for yourself', answer: 'SELF' },
  ]},
  { id: 24, title: 'Sky & Air', words: [
    { clue: 'Moving air', answer: 'BREEZE' },
    { clue: 'Soft cloud close to ground', answer: 'MIST' },
    { clue: 'Open sky color', answer: 'BLUE' },
  ]},
  { id: 25, title: 'Small Things', words: [
    { clue: 'Tiny light point', answer: 'DOT' },
    { clue: 'Small amount', answer: 'BIT' },
    { clue: 'Light contact', answer: 'TOUCH' },
  ]},
  { id: 26, title: 'Stability', words: [
    { clue: 'Strong base', answer: 'BASE' },
    { clue: 'Even state', answer: 'LEVEL' },
    { clue: 'Balanced form', answer: 'ALIGN' },
  ]},
  { id: 27, title: 'Ease', words: [
    { clue: 'To reduce tension', answer: 'EASE' },
    { clue: 'Quiet mind', answer: 'CALM' },
    { clue: 'Soft thought', answer: 'IDEA' },
  ]},
  { id: 28, title: 'New Start', words: [
    { clue: 'Early stage of a plant', answer: 'SEED' },
    { clue: 'Fresh start', answer: 'BEGIN' },
    { clue: 'To slowly develop', answer: 'EVOLVE' },
  ]},
  { id: 29, title: 'Gentle Power', words: [
    { clue: 'Soft strength and elegance', answer: 'GRACE' },
    { clue: 'Light energy around', answer: 'AURA' },
    { clue: 'Inner warmth', answer: 'HEAT' },
  ]},
  { id: 30, title: 'Connection', words: [
    { clue: 'To link things', answer: 'CONNECT' },
    { clue: 'Shared moment', answer: 'TOGETHER' },
    { clue: 'Single unity', answer: 'ONE' },
  ]},
  { id: 31, title: 'Recovery', words: [
    { clue: 'To get better again', answer: 'HEAL' },
    { clue: 'Quiet pause', answer: 'BREAK' },
    { clue: 'Slow breath in', answer: 'INHALE' },
  ]},
  { id: 32, title: 'Bright', words: [
    { clue: 'Light reflection', answer: 'SHINE' },
    { clue: 'Soft brightness', answer: 'GLOW' },
    { clue: 'A clear ray of light', answer: 'BEAM' },
  ]},
  { id: 33, title: 'Steps', words: [
    { clue: 'To go forward', answer: 'MOVE' },
    { clue: 'One walking motion', answer: 'STEP' },
    { clue: 'A gentle path', answer: 'WAY' },
  ]},
  { id: 34, title: 'Feelings', words: [
    { clue: 'Deep calm', answer: 'SERENE' },
    { clue: 'Safe warm feeling', answer: 'COMFORT' },
    { clue: 'Quiet happiness', answer: 'CONTENT' },
  ]},
  { id: 35, title: 'Care Actions', words: [
    { clue: 'To look after plants', answer: 'TEND' },
    { clue: 'To support', answer: 'HOLD' },
    { clue: 'To keep safe', answer: 'PROTECT' },
  ]},
  { id: 36, title: 'Life Flow', words: [
    { clue: 'A repeating order', answer: 'CYCLE' },
    { clue: 'Smooth change', answer: 'SHIFT' },
    { clue: 'Time passing', answer: 'TIME' },
  ]},
  { id: 37, title: 'Places', words: [
    { clue: 'Open area', answer: 'FIELD' },
    { clue: 'Personal zone', answer: 'SPACE' },
    { clue: 'Quiet corner', answer: 'NOOK' },
  ]},
  { id: 38, title: 'Harmony', words: [
    { clue: 'Even energy', answer: 'HARMONY' },
    { clue: 'Stable center', answer: 'CENTER' },
    { clue: 'Smooth motion', answer: 'FLOW' },
  ]},
  { id: 39, title: 'Mindful', words: [
    { clue: 'Present moment', answer: 'NOW' },
    { clue: 'Clear awareness', answer: 'AWARE' },
    { clue: 'Gentle focus', answer: 'ATTEND' },
  ]},
  { id: 40, title: 'Light Care', words: [
    { clue: 'To brighten', answer: 'ILLUME' },
    { clue: 'Warm light source', answer: 'LAMP' },
    { clue: 'Soft shine', answer: 'GLOW' },
  ]},
  { id: 41, title: 'Inner World', words: [
    { clue: 'Inside of you', answer: 'INNER' },
    { clue: 'Quiet thought', answer: 'THINK' },
    { clue: 'Deep feeling', answer: 'SENSE' },
  ]},
  { id: 42, title: 'Nature Calm', words: [
    { clue: 'Still water', answer: 'LAKE' },
    { clue: 'Quiet forest area', answer: 'WOODS' },
    { clue: 'Soft green ground', answer: 'MOSS' },
  ]},
  { id: 43, title: 'Support', words: [
    { clue: 'Strong help', answer: 'BACKING' },
    { clue: 'Steady hold', answer: 'ANCHOR' },
    { clue: 'To hold up', answer: 'LIFT' },
  ]},
  { id: 44, title: 'Balance', words: [
    { clue: 'Even sides', answer: 'EQUAL' },
    { clue: 'Smooth state', answer: 'STABLE' },
    { clue: 'To keep steady', answer: 'BALANCE' },
  ]},
  { id: 45, title: 'Gentle Days', words: [
    { clue: 'Early morning light', answer: 'DAWN' },
    { clue: 'Midday time', answer: 'NOON' },
    { clue: 'Late quiet time', answer: 'NIGHT' },
  ]},
  { id: 46, title: 'Will', words: [
    { clue: 'Power to act', answer: 'WILL' },
    { clue: 'A reason to do something', answer: 'MOTIVE' },
    { clue: 'Quiet strength', answer: 'GRIT' },
  ]},
  { id: 47, title: 'Stages', words: [
    { clue: 'Next stage', answer: 'PHASE' },
    { clue: 'Final form', answer: 'FORM' },
    { clue: 'Small progress', answer: 'STEP' },
  ]},
  { id: 48, title: 'Peaceful World', words: [
    { clue: 'No conflict', answer: 'PEACE' },
    { clue: 'Soft life', answer: 'EASE' },
    { clue: 'Stable arrangement', answer: 'ORDER' },
  ]},
  { id: 49, title: 'Spike Care', words: [
    { clue: 'Food for Spike', answer: 'FRUIT' },
    { clue: 'Growth moment', answer: 'FEED' },
    { clue: 'Energy gain', answer: 'POWER' },
  ]},
  { id: 50, title: 'Complete Journey', words: [
    { clue: 'Finished stage', answer: 'COMPLETE' },
    { clue: 'Growth achieved', answer: 'RISE' },
    { clue: 'Balanced ending', answer: 'HARMONY' },
  ]},
];
