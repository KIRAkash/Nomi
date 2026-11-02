// Seed data for the staff screens until their API routes land. Every number is something Nomi could see, count or hear:
// plate scores from PASS captures, faces and answers from guests, whole-item counts from shelf photos. No money, weights or forecasts.
export const GOLDEN_PHOTO = require('../../assets/images/demo/chicken-biryani/golden-1.jpg');
export const MASK_PHOTO = require('../../assets/images/demo/biryani-masks.jpg');

export type Shift = 'Lunch' | 'Dinner';
export type Model = 'Muse Wonder' | 'Muse Spark' | 'Muse Image' | 'Voice Transcribe' | 'SAM 3.1' | 'Glimmer (on site)';

export type DishStat = {
  id: string;
  name: string;
  category: string;
  golden: 'published' | 'draft' | 'none';
  goldenVersion?: number;
  scoreToday: number | null;          // mean PASS score today, 0–100
  trend: number[];                    // last 7 days, oldest first
  byShift?: { Lunch: number; Dinner: number };
  plates: number;                     // plates scored today
  flagged: number;                    // plates below the nudge line today
  guestAvg: number | null;            // mean face, 1–5, this week
  guestCount: number;
  topTheme?: { label: string; n: number; tone: 'tomato' | 'mint' };
  attention?: string;                 // why this card is at the top, in facts
};

export const DISH_STATS: DishStat[] = [
  {
    id: '00000000-0000-0000-0000-0000000d0001', name: 'Chicken Biryani', category: 'Mains', golden: 'published', goldenVersion: 2,
    scoreToday: 71, trend: [88, 90, 86, 87, 84, 74, 71], byShift: { Lunch: 86, Dinner: 64 }, plates: 38, flagged: 9,
    guestAvg: 3.4, guestCount: 41, topTheme: { label: 'Portion', n: 6, tone: 'tomato' },
    attention: 'Dinner plates 22 points under lunch · 6 guests said portion',
  },
  {
    id: '00000000-0000-0000-0000-0000000d0002', name: 'Paneer Tikka', category: 'Starters', golden: 'published', goldenVersion: 1,
    scoreToday: 79, trend: [82, 85, 81, 80, 83, 78, 79], byShift: { Lunch: 81, Dinner: 77 }, plates: 24, flagged: 3,
    guestAvg: 4.1, guestCount: 22, topTheme: { label: 'Burnt edges', n: 2, tone: 'tomato' },
    attention: 'Garnish missing on 3 of 24 plates',
  },
  {
    id: '00000000-0000-0000-0000-0000000d0004', name: 'Butter Chicken', category: 'Mains', golden: 'published', goldenVersion: 1,
    scoreToday: 92, trend: [89, 90, 91, 93, 92, 91, 92], byShift: { Lunch: 93, Dinner: 91 }, plates: 31, flagged: 0,
    guestAvg: 4.6, guestCount: 35, topTheme: { label: 'Loved the gravy', n: 9, tone: 'mint' },
  },
  {
    id: '00000000-0000-0000-0000-0000000d0003', name: 'Dal Makhani', category: 'Mains', golden: 'published', goldenVersion: 1,
    scoreToday: 94, trend: [93, 92, 95, 94, 93, 95, 94], byShift: { Lunch: 95, Dinner: 93 }, plates: 27, flagged: 0,
    guestAvg: 4.5, guestCount: 19,
  },
  {
    id: '00000000-0000-0000-0000-0000000d0005', name: 'Garlic Naan', category: 'Breads', golden: 'draft',
    scoreToday: null, trend: [], plates: 0, flagged: 0, guestAvg: 3.9, guestCount: 30, topTheme: { label: 'Cold', n: 3, tone: 'tomato' },
    attention: 'Golden Plate is a draft: masks need one fix',
  },
  {
    id: '00000000-0000-0000-0000-0000000d0007', name: 'Mutton Biryani', category: 'Mains', golden: 'none',
    scoreToday: null, trend: [], plates: 0, flagged: 0, guestAvg: 4.0, guestCount: 14,
  },
  {
    id: '00000000-0000-0000-0000-0000000d0006', name: 'Gulab Jamun', category: 'Desserts', golden: 'none',
    scoreToday: null, trend: [], plates: 0, flagged: 0, guestAvg: 4.7, guestCount: 16,
  },
];

export const COVERAGE = { protected: 4, total: 32 };

/** `shot` is the demo photo of this plate (docs/demo-images.md); when it exists, its SAM run replaces the score and reasons. */
export type Capture = { id: string; dishId: string; shift: Shift; time: string; score: number; reasons: string[]; day: string; shot?: string };
export const CAPTURES: Capture[] = [
  { id: 'cap-9', shot: 'chicken-biryani/pass-onions-missing', dishId: DISH_STATS[0].id, shift: 'Dinner', time: '21:42', day: 'Fri', score: 58, reasons: ['Rice share 21% under reference', 'Fried onions missing'] },
  { id: 'cap-8', shot: 'chicken-biryani/pass-rice-short', dishId: DISH_STATS[0].id, shift: 'Dinner', time: '21:18', day: 'Fri', score: 63, reasons: ['Rice share 18% under reference'] },
  { id: 'cap-7', shot: 'chicken-biryani/pass-three-pieces', dishId: DISH_STATS[0].id, shift: 'Dinner', time: '20:51', day: 'Fri', score: 66, reasons: ['3 chicken pieces, reference is 4'] },
  { id: 'cap-6', shot: 'chicken-biryani/pass-lemon-off', dishId: DISH_STATS[0].id, shift: 'Dinner', time: '20:05', day: 'Fri', score: 81, reasons: ['Lemon off the rim'] },
  { id: 'cap-5', shot: 'chicken-biryani/pass-good', dishId: DISH_STATS[0].id, shift: 'Lunch', time: '13:22', day: 'Fri', score: 91, reasons: [] },
  { id: 'cap-4', shot: 'paneer-tikka/pass-chutney-missing', dishId: DISH_STATS[1].id, shift: 'Dinner', time: '21:05', day: 'Fri', score: 69, reasons: ['Mint chutney missing'] },
];

export type Lang = 'Hinglish' | 'Hindi' | 'Kannada' | 'English' | 'Tamil';
export type Note = {
  id: string;
  table: string;
  shift: Shift;
  ago: string;
  day: string;
  language: Lang;
  kind: 'voice' | 'text' | 'taps';
  original?: string;
  translation?: string;
  durationS?: number;
  faces: { dish: string; value: 1 | 2 | 3 | 4 | 5 }[];
  answers: { q: string; a: string; good: boolean }[];
  tags: { label: string; category: string; sentiment: 'positive' | 'negative' | 'neutral' }[];
  photo?: { dishId: string; score: number; reasons: string[]; shot?: string };
  severity: 'low' | 'medium' | 'high';
  status: 'new' | 'replied' | 'resolved';
  issueId?: string;
  reply?: { text: string; en: string; offer: string | null };
  phone: boolean;
};

export const NOTES: Note[] = [
  {
    id: 'fb-101', table: 'Table 7', shift: 'Dinner', ago: '4 min ago', day: 'Fri', language: 'Hinglish', kind: 'voice', durationS: 9,
    original: 'Biryani ka taste toh mast tha, but portion bahut kam tha yaar. Chicken bhi sirf teen piece.',
    translation: 'The biryani tasted great, but the portion was really small. Only three chicken pieces too.',
    faces: [{ dish: 'Chicken Biryani', value: 2 }],
    answers: [{ q: 'Was the portion enough?', a: 'Too little', good: false }, { q: 'Enough chicken pieces?', a: 'Fewer', good: false }],
    tags: [{ label: 'Biryani · portion', category: 'portion', sentiment: 'negative' }, { label: 'Biryani · taste', category: 'taste', sentiment: 'positive' }],
    photo: { dishId: DISH_STATS[0].id, score: 62, reasons: ['Rice share 19% under reference', '3 chicken pieces, reference is 4'], shot: 'chicken-biryani/guest-table-7' },
    severity: 'medium', status: 'new', issueId: 'iss-1', phone: true,
    reply: {
      text: 'Thank you for telling us! Aapne sahi kaha, aaj raat biryani ka portion standard se kam tha. Next visit pe ek biryani humari taraf se.',
      en: 'Thank you for telling us! You were right, tonight the biryani portion was below our standard. Your next biryani is on us.',
      offer: 'Biryani on next visit',
    },
  },
  {
    id: 'fb-102', table: 'Table 3', shift: 'Dinner', ago: '11 min ago', day: 'Fri', language: 'English', kind: 'text',
    original: 'My son has a nut allergy and the gravy seemed to have cashew in it. Nobody asked us about allergies.',
    translation: undefined,
    faces: [{ dish: 'Butter Chicken', value: 1 }],
    answers: [],
    tags: [{ label: 'Allergy · cashew', category: 'service', sentiment: 'negative' }],
    severity: 'high', status: 'new', phone: true,
    reply: { text: 'We are so sorry. Our manager Arjun will call you tonight to understand what happened.', en: 'We are so sorry. Our manager Arjun will call you tonight to understand what happened.', offer: null },
  },
  {
    id: 'fb-103', table: 'Table 12', shift: 'Dinner', ago: '26 min ago', day: 'Fri', language: 'Kannada', kind: 'voice', durationS: 7,
    original: 'ಬಿರಿಯಾನಿ ತುಂಬಾ ಕಡಿಮೆ ಇತ್ತು, ಆದರೆ ಸರ್ವೀಸ್ ಚೆನ್ನಾಗಿತ್ತು.',
    translation: 'The biryani was very little, but the service was good.',
    faces: [{ dish: 'Chicken Biryani', value: 3 }],
    answers: [{ q: 'Was the portion enough?', a: 'Too little', good: false }],
    tags: [{ label: 'Biryani · portion', category: 'portion', sentiment: 'negative' }, { label: 'Service', category: 'service', sentiment: 'positive' }],
    severity: 'low', status: 'new', issueId: 'iss-1', phone: false,
    reply: { text: 'ನಿಮ್ಮ ಮಾತಿಗೆ ಧನ್ಯವಾದಗಳು! ಬಿರಿಯಾನಿ ಪ್ರಮಾಣವನ್ನು ನಾವು ಸರಿಪಡಿಸುತ್ತಿದ್ದೇವೆ.', en: 'Thank you for your words! We are fixing the biryani portion.', offer: null },
  },
  {
    id: 'fb-104', table: 'Table 5', shift: 'Dinner', ago: '48 min ago', day: 'Fri', language: 'Hindi', kind: 'voice', durationS: 6,
    original: 'नान ठंडे आए थे, बाकी सब बढ़िया।',
    translation: 'The naans came cold, everything else was great.',
    faces: [{ dish: 'Garlic Naan', value: 2 }, { dish: 'Dal Makhani', value: 5 }],
    answers: [],
    tags: [{ label: 'Naan · cold', category: 'temperature', sentiment: 'negative' }, { label: 'Dal · loved', category: 'taste', sentiment: 'positive' }],
    severity: 'low', status: 'replied', issueId: 'iss-2', phone: false,
    reply: { text: 'शुक्रिया! नान अब सीधे तंदूर से आपकी टेबल तक आएँगे।', en: 'Thank you! Naans will now come straight from the tandoor to your table.', offer: null },
  },
  {
    id: 'fb-105', table: 'Table 2', shift: 'Lunch', ago: '6 h ago', day: 'Fri', language: 'English', kind: 'taps',
    faces: [{ dish: 'Butter Chicken', value: 5 }, { dish: 'Garlic Naan', value: 4 }],
    answers: [],
    tags: [{ label: 'Butter chicken · loved', category: 'taste', sentiment: 'positive' }],
    severity: 'low', status: 'resolved', phone: false,
  },
  {
    id: 'fb-106', table: 'Table 9', shift: 'Lunch', ago: '7 h ago', day: 'Fri', language: 'Tamil', kind: 'voice', durationS: 5,
    original: 'பனீர் கொஞ்சம் கருகி இருந்தது.',
    translation: 'The paneer was a little burnt.',
    faces: [{ dish: 'Paneer Tikka', value: 3 }],
    answers: [{ q: 'Nicely charred?', a: 'Burnt', good: false }],
    tags: [{ label: 'Paneer · burnt', category: 'presentation', sentiment: 'negative' }],
    severity: 'low', status: 'new', phone: false,
    reply: { text: 'உங்கள் கருத்துக்கு நன்றி! அடுத்த முறை சரியாக இருக்கும்.', en: 'Thank you for your feedback! It will be right next time.', offer: null },
  },
];

export type Issue = { id: string; title: string; category: string; dish?: string; count: number; perDay: number[]; status: 'open' | 'resolved'; since: string };
export const ISSUES: Issue[] = [
  { id: 'iss-1', title: 'Biryani portion too small', category: 'portion', dish: 'Chicken Biryani', count: 6, perDay: [0, 0, 1, 0, 1, 1, 3], status: 'open', since: 'Tue' },
  { id: 'iss-2', title: 'Naan arriving cold', category: 'temperature', dish: 'Garlic Naan', count: 3, perDay: [1, 0, 0, 1, 0, 0, 1], status: 'open', since: 'Sat' },
  { id: 'iss-3', title: 'Paneer edges burnt', category: 'presentation', dish: 'Paneer Tikka', count: 2, perDay: [0, 0, 0, 0, 1, 0, 1], status: 'open', since: 'Thu' },
  { id: 'iss-4', title: 'Wait for bill', category: 'wait_time', count: 4, perDay: [1, 1, 0, 1, 1, 0, 0], status: 'resolved', since: 'Mon' },
];

export type EvidenceItem = { kind: 'quote' | 'plate' | 'count' | 'photo'; title: string; detail: string; tone?: 'tomato' | 'saffron' | 'mint' | 'sky' };
export type Action = { id: string; type: 'update_sop' | 'adjust_order' | 'reply_guest'; title: string; detail: string; status: 'proposed' | 'approved' | 'rejected' };
export type BriefIssue = {
  id: string;
  title: string;
  chain: { analyst: 'Feedback' | 'Plate' | 'Stock' | 'Closing'; fact: string; evidence: EvidenceItem[] }[];
  likelyCause: string;
  actions: Action[];
};

export const BRIEFING = {
  date: 'Friday, 31 Oct',
  ranAt: '00:42',
  durationS: 38,
  stats: { notes: 47, plates: 212, photos: 18, closingSpots: 6 },
  issues: [
    {
      id: 'b1',
      title: 'Biryani portions shrank at Friday dinner',
      chain: [
        { analyst: 'Feedback', fact: '6 guests said the biryani portion was small, 5 of them at dinner', evidence: [
          { kind: 'quote', title: 'Table 7 · Hinglish', detail: '"portion bahut kam tha yaar"', tone: 'tomato' },
          { kind: 'quote', title: 'Table 12 · Kannada', detail: '"The biryani was very little"', tone: 'tomato' },
          { kind: 'count', title: 'Guest answers', detail: '"Was the portion enough?" Too little: 5 of 9 dinner answers', tone: 'tomato' },
        ] },
        { analyst: 'Plate', fact: 'Dinner biryani plates averaged 64 against Golden Plate v2; lunch averaged 86', evidence: [
          { kind: 'plate', title: '21:42 capture · score 58', detail: 'Rice share 21% under reference', tone: 'tomato' },
          { kind: 'plate', title: '21:18 capture · score 63', detail: 'Rice share 18% under reference', tone: 'tomato' },
          { kind: 'count', title: 'Chicken pieces', detail: '3 pieces on 7 of 22 dinner plates (reference 4)', tone: 'saffron' },
        ] },
        { analyst: 'Stock', fact: 'Basmati rice sacks at close: 1 on Friday, 4 on Thursday', evidence: [
          { kind: 'count', title: 'Dry store photo, 23:40', detail: '1 rice sack counted (minimum 4)', tone: 'saffron' },
        ] },
      ],
      likelyCause: 'Rice ran short during Friday dinner and plates were portioned down to stretch it.',
      actions: [
        { id: 'a1', type: 'adjust_order', title: 'Order 3 more sacks of basmati for Friday', detail: 'Brings Friday close to the 4-sack minimum. Sent to the supplier only after you approve.', status: 'proposed' },
        { id: 'a2', type: 'update_sop', title: 'Add "use the marked rice scoop" to the biryani SOP card', detail: 'Chef Imran approves the card before staff see it.', status: 'proposed' },
        { id: 'a3', type: 'reply_guest', title: 'Reply to the 6 guests in their language', detail: '4 left a phone number, 2 will see it on their table page.', status: 'proposed' },
      ],
    },
    {
      id: 'b2',
      title: 'Naan reaching tables cold',
      chain: [
        { analyst: 'Feedback', fact: '3 guests said naan was cold this week, all at tables 5, 11 and 14 by the window', evidence: [
          { kind: 'quote', title: 'Table 5 · Hindi', detail: '"नान ठंडे आए थे"', tone: 'tomato' },
        ] },
        { analyst: 'Closing', fact: 'The bread warmer was photographed switched off at close on 2 nights', evidence: [
          { kind: 'photo', title: 'Stove and tandoor, Thu', detail: 'Warmer door open, display dark', tone: 'saffron' },
        ] },
      ],
      likelyCause: 'Naan waits on the pass without the warmer for window tables.',
      actions: [
        { id: 'a4', type: 'update_sop', title: 'Add "naan goes in the warmer if not picked up in 1 min" to the bread card', detail: 'Chef approves the card.', status: 'proposed' },
      ],
    },
  ] as BriefIssue[],
  wins: [
    { title: 'Butter Chicken held 91+ on every shift this week', detail: '9 guests mentioned the gravy by name' },
    { title: 'Closing round done 7 nights in a row', detail: 'Every flag fixed with an after photo' },
  ],
};

export type StockItem = { id: string; name: string; unit: string; min: number; counts: number[]; lastScan: string };
export const STOCK: StockItem[] = [
  { id: 's1', name: 'Basmati rice', unit: 'sack', min: 4, counts: [5, 5, 4, 4, 3, 4, 1], lastScan: 'Fri 23:40' },
  { id: 's2', name: 'Cooking oil', unit: 'tin', min: 3, counts: [6, 6, 5, 5, 4, 4, 4], lastScan: 'Fri 23:40' },
  { id: 's3', name: 'Milk', unit: 'packet', min: 10, counts: [18, 14, 16, 12, 11, 9, 8], lastScan: 'Fri 23:40' },
  { id: 's4', name: 'Paneer', unit: 'block', min: 6, counts: [9, 8, 9, 7, 8, 7, 7], lastScan: 'Fri 23:40' },
  { id: 's5', name: 'Atta', unit: 'bag', min: 2, counts: [3, 3, 3, 3, 3, 2, 2], lastScan: 'Fri 23:40' },
];

export type Spot = { id: string; name: string; flags: { flag: string; where: string; fixed: boolean }[]; counts: { item: string; n: number }[]; done: boolean };
export const CLOSING_SPOTS: Spot[] = [
  { id: 'walkin', name: 'Walk-in fridge', done: true, counts: [{ item: 'Covered containers', n: 14 }, { item: 'Milk packets', n: 8 }], flags: [{ flag: 'Container without a lid', where: 'Top shelf, left', fixed: true }] },
  { id: 'dry', name: 'Dry store', done: true, counts: [{ item: 'Rice sacks', n: 1 }, { item: 'Oil tins', n: 4 }], flags: [] },
  { id: 'prep', name: 'Prep counter', done: false, counts: [], flags: [] },
  { id: 'stove', name: 'Stove and tandoor', done: false, counts: [], flags: [] },
  { id: 'floor', name: 'Floor and drain', done: false, counts: [], flags: [] },
  { id: 'bins', name: 'Bins', done: false, counts: [], flags: [] },
];

export const HANDOVERS = [
  {
    id: 'h1', shift: 'Lunch → Dinner', when: 'Fri 15:40', durationS: 52,
    turns: [
      { speaker: 'Ravi', text: 'Biryani handi number two is done, number three on dum since three o clock.' },
      { speaker: 'Meena', text: 'Paneer marinade for dinner is ready, two trays. Mint chutney finished, need to grind fresh.' },
      { speaker: 'Ravi', text: 'Tandoor gas was low pressure for some time, told Arjun sir.' },
    ],
    summary: {
      done: ['Biryani handi 2 cooked', 'Paneer marinade: 2 trays ready'],
      pending: ['Biryani handi 3 on dum since 15:00', 'Grind fresh mint chutney'],
      problems: ['Tandoor gas pressure low for a while (Arjun told)'],
    },
  },
];

export const SOP_CARDS = [
  {
    dishId: DISH_STATS[0].id, dish: 'Chicken Biryani', version: 2, approvedBy: 'Chef Imran', approvedAt: 'Wed',
    rules: [
      { en: 'Rice fills the centre, about 4 parts of 10 of the plate', hi: 'चावल बीच में, प्लेट का लगभग 10 में से 4 हिस्सा' },
      { en: '4 chicken pieces, spread evenly on the rice', hi: '4 चिकन पीस, चावल पर बराबर फैलाकर' },
      { en: 'Fried onions at 2 o\'clock, never covering the chicken', hi: 'तली प्याज़ 2 बजे की तरफ, चिकन को ढके बिना' },
      { en: 'Lemon wedge on the rim at 5 o\'clock', hi: 'नींबू का टुकड़ा किनारे पर 5 बजे की तरफ' },
      { en: 'Raita bowl outside the plate, on the left', hi: 'रायते की कटोरी प्लेट के बाहर, बाईं ओर' },
    ],
  },
  {
    dishId: DISH_STATS[1].id, dish: 'Paneer Tikka', version: 1, approvedBy: 'Chef Imran', approvedAt: 'Mon',
    rules: [
      { en: '6 paneer cubes on the skewer', hi: 'सीख पर 6 पनीर के टुकड़े' },
      { en: 'Mint chutney in the small bowl at 10 o\'clock', hi: 'पुदीने की चटनी छोटी कटोरी में 10 बजे की तरफ' },
      { en: 'Onion rings fanned on the right', hi: 'प्याज़ के छल्ले दाईं ओर फैलाकर' },
    ],
  },
];

/** Tonight's reminders, each built from yesterday's PASS facts. */
export const WATCH_LIST = [
  { dish: 'Chicken Biryani', fact: 'Rice share under reference on 9 of 22 dinner plates', fix: 'Use the marked rice scoop' },
  { dish: 'Paneer Tikka', fact: 'Mint chutney missing on 3 of 24 plates', fix: 'Chutney bowl goes on before the skewer' },
  { dish: 'Garlic Naan', fact: '3 guests said cold this week', fix: 'Warmer on, door closed' },
];

export const TEAM = [
  { name: 'Priya Sharma', roles: ['Owner'], phone: '+91 98•••• 4410', language: 'English', active: true },
  { name: 'Imran Khan', roles: ['Head Chef'], phone: '+91 99•••• 1023', language: 'Hindi', active: true },
  { name: 'Arjun Rao', roles: ['Manager'], phone: '+91 97•••• 7781', language: 'Kannada', active: true },
  { name: 'Ravi Kumar', roles: ['Staff'], phone: '+91 90•••• 3392', language: 'Hindi', active: true },
  { name: 'Meena Das', roles: ['Staff'], phone: '+91 91•••• 5530', language: 'Bengali', active: false },
];

export const TABLES = Array.from({ length: 14 }, (_, i) => ({ label: `Table ${i + 1}`, token: i === 6 ? 'demo-table-7' : `t${(i * 7919 + 13).toString(36)}x${i}`, notes: [3, 1, 4, 0, 6, 2, 9, 1, 5, 2, 3, 2, 4, 1][i] }));

export type ModelCall = { model: Model; purpose: string; when: string; ms: number; ok: boolean };
export const AI_LOG: ModelCall[] = [
  { model: 'Muse Wonder', purpose: 'NIGHTSHIFT plan and correlate', when: '00:42', ms: 9120, ok: true },
  { model: 'Muse Spark', purpose: 'Feedback analyst (47 notes)', when: '00:42', ms: 4210, ok: true },
  { model: 'Muse Spark', purpose: 'Plate analyst (212 captures)', when: '00:42', ms: 3880, ok: true },
  { model: 'Muse Spark', purpose: 'Stock analyst (7 shelf scans)', when: '00:42', ms: 2140, ok: true },
  { model: 'Muse Spark', purpose: 'Closing analyst (6 spots)', when: '00:42', ms: 1990, ok: true },
  { model: 'Voice Transcribe', purpose: 'Guest voice note, Table 7', when: '22:04', ms: 1310, ok: true },
  { model: 'Muse Spark', purpose: 'Tag and translate, Table 7', when: '22:04', ms: 980, ok: true },
  { model: 'SAM 3.1', purpose: 'Guest photo vs Golden Plate', when: '22:04', ms: 2620, ok: true },
  { model: 'Muse Spark', purpose: 'Reply draft in Hinglish', when: '22:04', ms: 870, ok: true },
  { model: 'Glimmer (on site)', purpose: 'Pass frame filter: 41 dropped, 6 kept', when: '21:42', ms: 140, ok: true },
  { model: 'Glimmer (on site)', purpose: 'Redact phone number in guest text', when: '21:31', ms: 90, ok: true },
  { model: 'SAM 3.1', purpose: 'Pass capture score, biryani', when: '21:42', ms: 2310, ok: true },
  { model: 'Muse Spark', purpose: 'Dish recognition, guest photo', when: '21:12', ms: 1150, ok: false },
];

/** What Menu Snap returned for the demo menu photo; amber fields were flagged unclear by Muse Wonder. */
export const MENU_SNAP = [
  { name: 'Chicken Biryani', category: 'Mains', price: 349, veg: false, spice: 2, unclear: [] as string[] },
  { name: 'Mutton Biryani', category: 'Mains', price: 449, veg: false, spice: 2, unclear: [] },
  { name: 'Paneer Tikka', category: 'Starters', price: 289, veg: true, spice: 1, unclear: [] },
  { name: 'Dal Makhani', category: 'Mains', price: 259, veg: true, spice: 0, unclear: [] },
  { name: 'Butter Chicken', category: 'Mains', price: 379, veg: false, spice: 1, unclear: [] },
  { name: 'Garlic Naan', category: 'Breads', price: 69, veg: true, spice: 0, unclear: [] },
  { name: 'Hara Bhara Kebab', category: 'Starters', price: null, veg: true, spice: 1, unclear: ['price'] },
  { name: 'Gulab Jamun', category: 'Desserts', price: 129, veg: true, spice: 0, unclear: [] },
  { name: 'Rasmalai (2 pc)', category: 'Desserts', price: 149, veg: true, spice: 0, unclear: ['name'] },
];

export const COMPONENTS = [
  { name: 'Rice', prompt: 'rice', role: 'main', colour: '#4D9DE0', confidence: 0.96, share: 0.42, clock: 'centre', count: null as number | null },
  { name: 'Chicken pieces', prompt: 'chicken pieces', role: 'count', colour: '#D93A2E', confidence: 0.93, share: 0.17, clock: 'spread', count: 4 },
  { name: 'Fried onions', prompt: 'fried onions', role: 'placement', colour: '#FFB627', confidence: 0.88, share: 0.06, clock: '2 o\'clock', count: null },
  { name: 'Lemon wedge', prompt: 'lemon wedge', role: 'placement', colour: '#FF7AB6', confidence: 0.91, share: 0.02, clock: '5 o\'clock, rim', count: 1 },
  { name: 'Raita bowl', prompt: 'bowl', role: 'side', colour: '#3BB273', confidence: 0.64, share: 0, clock: 'outside, 9 o\'clock', count: 1 },
];

export const ASK_SUGGESTIONS = [
  'Why did biryani scores drop on Friday?',
  'Which dish do guests love most this week?',
  'How much biryani will we sell tomorrow?',
  'Which tables complained about naan?',
];

export const ASK_ANSWERS: Record<string, { text: string; evidence: string[]; declined?: boolean }> = {
  'Why did biryani scores drop on Friday?': {
    text: 'Friday dinner biryani plates averaged 64 against Golden Plate v2, while lunch averaged 86. The most common reason on those plates was rice share under reference (9 of 22). The dry store photo at close showed 1 rice sack against a minimum of 4. Likely cause: rice ran short and plates were portioned down.',
    evidence: ['22 dinner captures', '6 guest notes', 'Dry store photo 23:40'],
  },
  'Which dish do guests love most this week?': {
    text: 'Gulab Jamun has the highest average face this week, 4.7 from 16 guests. Butter Chicken is next at 4.6 from 35 guests, and 9 of them mentioned the gravy by name.',
    evidence: ['16 ratings', '35 ratings', '9 quotes'],
  },
  'How much biryani will we sell tomorrow?': {
    declined: true,
    text: 'I can\'t predict sales. Here is what I can count: guests picked Chicken Biryani on 41 feedback visits this week, 26 of them at dinner, and PASS scored 38 biryani plates today.',
    evidence: ['41 guest picks', '38 captures today'],
  },
  'Which tables complained about naan?': {
    text: 'Tables 5, 11 and 14 said the naan was cold this week. All three sit by the window, the furthest from the pass.',
    evidence: ['3 guest notes', 'Floor plan'],
  },
};

/** This week's answers to each dish's chef questions. */
export const ANSWER_STATS: Record<string, { q: string; yes: number; no: number; noLabel: string }[]> = {
  [DISH_STATS[0].id]: [
    { q: 'Was the portion enough?', yes: 13, no: 6, noLabel: 'Too little' },
    { q: 'Enough chicken pieces?', yes: 15, no: 4, noLabel: 'Fewer' },
    { q: 'Was it hot?', yes: 18, no: 1, noLabel: 'Lukewarm' },
  ],
  [DISH_STATS[1].id]: [
    { q: 'Enough paneer pieces?', yes: 11, no: 1, noLabel: 'Fewer' },
    { q: 'Nicely charred?', yes: 9, no: 2, noLabel: 'Burnt' },
    { q: 'Was it hot?', yes: 12, no: 0, noLabel: 'Lukewarm' },
  ],
};

/** Guest picks per day for the last 7 days, per dish. */
export const PICKS: Record<string, number[]> = {
  [DISH_STATS[0].id]: [5, 6, 4, 6, 5, 6, 9],
  [DISH_STATS[1].id]: [3, 2, 4, 3, 3, 3, 4],
  [DISH_STATS[2].id]: [5, 6, 4, 5, 5, 4, 6],
  [DISH_STATS[3].id]: [2, 3, 3, 2, 3, 3, 3],
  [DISH_STATS[4].id]: [4, 5, 4, 4, 4, 4, 5],
  [DISH_STATS[5].id]: [2, 2, 1, 2, 2, 3, 2],
  [DISH_STATS[6].id]: [2, 3, 2, 2, 2, 2, 3],
};
