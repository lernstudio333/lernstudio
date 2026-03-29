import { describe, it, expect } from 'vitest';
import { buildRawCard } from './extraction';

// ---------------------------------------------------------------------------
// para() — builds a StructuredParagraph with sensible defaults.
// Spread real fixture data on top to override only what matters.
// ---------------------------------------------------------------------------
function para(overrides: Partial<StructuredParagraph>): StructuredParagraph {
  return {
    index: 0,
    level: -1,
    text: '',
    cardMetadata: null,
    textBeforeLink: '',
    linkText: '',
    textAfterLink: '',
    linkCharOffset: 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// expectRawCard — compares a subset of RawCard fields.
// rowIndex in expectedRaw must match the card's position in the allParas array.
// ---------------------------------------------------------------------------
const RAW_CARD_TEST_KEYS = [
  'cardId', 'type', 'question', 'answer', 'rowIndex', 'fullUrl'
] as const;

function expectRawCard(
  allParas: StructuredParagraph[],
  cardIndex: number,
  expectedRaw: Partial<RawCard>
) {
  const actual = buildRawCard(allParas, cardIndex);
  for (const key of RAW_CARD_TEST_KEYS) {
    expect(actual[key], key).toEqual(expectedRaw[key]);
  }
}

// ---------------------------------------------------------------------------
// Fixtures — real data captured from a live document
// ---------------------------------------------------------------------------

const SINGLE_CARD_1_strucPara = {
  index: 26,
  text: 'Craniosascral-Therapie ist eine >> Körpertherapie',
  level: -1,
  cardMetadata: {
    id: '1774722489170',
    typeKey: 'SINGLE_CARD',
    flags: [],
    includeAbove: 0,
    fullUrl: 'https://www.lern-studio.de?id=1774722489170&cardtype=SINGLE_CARD&depth=0'
  },
  textBeforeLink: 'Craniosascral-Therapie ist eine ',
  linkText: '>>',
  textAfterLink: ' Körpertherapie',
  linkCharOffset: 32
};

const SINGLE_CARD_1_rawAnsw = {
  cardId:  '1774722489170',
  type:    'SINGLE_CARD',
  question: 'Craniosascral-Therapie ist eine',  // trimmed
  answer:  'Körpertherapie',                     // trimmed
  rowIndex: 0,  // position in test array
  fullUrl: 'https://www.lern-studio.de?id=1774722489170&cardtype=SINGLE_CARD&depth=0'
};

// ---

const MULTI_CARD_1_strucPara = {
  index: 28,
  text: 'Biosphere >>>',
  level: -1,
  cardMetadata: {
    id: '1774565841853',
    typeKey: 'MULTI_CARD',
    flags: [],
    includeAbove: 0,
    fullUrl: 'https://www.lern-studio.de?id=1774565841853&cardtype=MULTI_CARD&depth=0'
  },
  textBeforeLink: 'Biosphere ',
  linkText: '>>>',
  textAfterLink: '',
  linkCharOffset: 10
};

const MULTI_CARD_1_rawAnsw = {
  cardId:   '1774565841853',
  type:     'MULTI_CARD',
  question: 'Biosphere',  // trimmed
  answer:   ['liquid body OR', 'living field (structure + fluid + potency)'],
  rowIndex: 0,  // position in test array
  fullUrl:  'https://www.lern-studio.de?id=1774565841853&cardtype=MULTI_CARD&depth=0'
};

// ---

const GAP_1_strucPara = {
  index: 5,
  text: 'The craniosacral system has its own rhythm',
  level: -1,
  cardMetadata: {
    id: '1774565841900',
    typeKey: 'GAP',
    flags: [],
    includeAbove: 0,
    fullUrl: 'https://www.lern-studio.de?id=1774565841900&cardtype=GAP&depth=0'
  },
  textBeforeLink: 'The ',
  linkText:       'craniosacral',
  textAfterLink:  ' system has its own rhythm',
  linkCharOffset: 4
};

const GAP_1_rawAnsw = {
  cardId:   '1774565841900',
  type:     'GAP',
  question: 'The ... system has its own rhythm',
  answer:   'craniosacral',
  rowIndex: 0,
  fullUrl:  'https://www.lern-studio.de?id=1774565841900&cardtype=GAP&depth=0'
};

// ---

const SYNONYM_1_strucPara = {
  index: 10,
  text: 'Craniosacral-Rhythmus |>S>',
  level: -1,
  cardMetadata: {
    id: '1774565841910',
    typeKey: 'SYNONYM',
    flags: [],
    includeAbove: 0,
    fullUrl: 'https://www.lern-studio.de?id=1774565841910&cardtype=SYNONYM&depth=0'
  },
  textBeforeLink: 'Craniosacral-Rhythmus ',
  linkText:       '|>S>',
  textAfterLink:  '',
  linkCharOffset: 22
};

const SYNONYM_1_rawAnsw = {
  cardId:   '1774565841910',
  type:     'SYNONYM',
  question: 'Craniosacral-Rhythmus',  // trimmed
  answer:   ['Primäre Respiration', 'CRI'],
  rowIndex: 0,
  fullUrl:  'https://www.lern-studio.de?id=1774565841910&cardtype=SYNONYM&depth=0'
};

// ---

const IMAGES_1_strucPara = {
  index: 15,
  text: 'Spine anatomy >I>',
  level: -1,
  cardMetadata: {
    id: '1774565841920',
    typeKey: 'IMAGES',
    flags: [],
    includeAbove: 0,
    fullUrl: 'https://www.lern-studio.de?id=1774565841920&cardtype=IMAGES&depth=0'
  },
  textBeforeLink: 'Spine anatomy ',
  linkText:       '>I>',
  textAfterLink:  '',
  linkCharOffset: 14
};

const IMAGES_1_rawAnsw = {
  cardId:   '1774565841920',
  type:     'IMAGES',
  question: 'Spine anatomy',  // trimmed
  answer:   ['spine_lateral.png', 'spine_anterior.png'],
  rowIndex: 0,
  fullUrl:  'https://www.lern-studio.de?id=1774565841920&cardtype=IMAGES&depth=0'
};

// ---------------------------------------------------------------------------
// SINGLE_CARD
// ---------------------------------------------------------------------------

describe('buildRawCard — SINGLE_CARD', () => {
  const DOC: StructuredParagraph[] = [
    para({ ...SINGLE_CARD_1_strucPara }),
  ];

  it('core fields', () => expectRawCard(DOC, 0, SINGLE_CARD_1_rawAnsw));
  it('answer is trimmed', () => expect(buildRawCard(DOC, 0).answer).toBe('Körpertherapie'));
  it('parents empty (depth=0)', () => expect(buildRawCard(DOC, 0).parents).toEqual([]));
});

describe('buildRawCard — SINGLE_CARD: answer is undefined when nothing follows the marker', () => {
  const DOC: StructuredParagraph[] = [
    para({ ...SINGLE_CARD_1_strucPara, textAfterLink: '' }),
  ];

  it('answer', () => expect(buildRawCard(DOC, 0).answer).toBeUndefined());
});

// ---------------------------------------------------------------------------
// MULTI_CARD
// ---------------------------------------------------------------------------

describe('buildRawCard — MULTI_CARD', () => {
  const DOC: StructuredParagraph[] = [
    para({ ...MULTI_CARD_1_strucPara }),
    para({ level: 0, textBeforeLink: 'liquid body OR' }),
    para({ level: 0, textBeforeLink: 'living field (structure + fluid + potency)' }),
  ];

  it('core fields', () => expectRawCard(DOC, 0, MULTI_CARD_1_rawAnsw));
  it('parents empty (depth=0)', () => expect(buildRawCard(DOC, 0).parents).toEqual([]));
});


describe('buildRawCard — MULTI_CARD: warning when unexpected text follows the marker', () => {
  const DOC: StructuredParagraph[] = [
    para({ ...MULTI_CARD_1_strucPara, textAfterLink: 'unexpected text' }),
  ];

  it('warning contains the offending text',
    () => expect(buildRawCard(DOC, 0).warning).toContain('unexpected text'));
});

// ---------------------------------------------------------------------------
// GAP
// ---------------------------------------------------------------------------

describe('buildRawCard — GAP', () => {
  const DOC: StructuredParagraph[] = [
    para({ ...GAP_1_strucPara }),
  ];

  it('core fields', () => expectRawCard(DOC, 0, GAP_1_rawAnsw));
  it('answer is the linked word', () => expect(buildRawCard(DOC, 0).answer).toBe('craniosacral'));
  it('parents empty (depth=0)', () => expect(buildRawCard(DOC, 0).parents).toEqual([]));
});

// ---------------------------------------------------------------------------
// SYNONYM
// ---------------------------------------------------------------------------

describe('buildRawCard — SYNONYM', () => {
  const DOC: StructuredParagraph[] = [
    para({ ...SYNONYM_1_strucPara }),
    para({ level: 0, textBeforeLink: 'Primäre Respiration' }),
    para({ level: 0, textBeforeLink: 'CRI' }),
  ];

  it('core fields', () => expectRawCard(DOC, 0, SYNONYM_1_rawAnsw));
  it('parents empty (depth=0)', () => expect(buildRawCard(DOC, 0).parents).toEqual([]));
});

// ---------------------------------------------------------------------------
// IMAGES
// ---------------------------------------------------------------------------

describe('buildRawCard — IMAGES', () => {
  const DOC: StructuredParagraph[] = [
    para({ ...IMAGES_1_strucPara }),
    para({ level: 0, textBeforeLink: 'spine_lateral.png' }),
    para({ level: 0, textBeforeLink: 'spine_anterior.png' }),
  ];

  it('core fields', () => expectRawCard(DOC, 0, IMAGES_1_rawAnsw));
  it('parents empty (depth=0)', () => expect(buildRawCard(DOC, 0).parents).toEqual([]));
});

// ---------------------------------------------------------------------------
// Parent climbing (includeAbove > 0)
//
// Principle: level is the only thing that determines parent/child relationships.
// Whether a paragraph is a plain heading, a bullet, or has a card marker is irrelevant.
//
// Example A — flat structure with two plain headings above bullet cards:
//
//  [0] "Foundations"      level=-1  plain paragraph
//  [1] "Biosphere"        level=-1  plain paragraph
//  [2] "Def |>>>"         level=0   MULTI_CARD, includeAbove=1  → parent: ['Biosphere']
//  [3]   "liquid body"    level=1   child of Def
//  [4]   "living field"   level=1   child of Def
//  [5] "Synonyme |>S>"    level=0   SYNONYM,    includeAbove=1  → parent: ['Biosphere']
//
// Example B — nested structure where card markers appear at intermediate levels:
//
//  [0] "medicinal flowers >>>"   level=-1  MULTI_CARD           → answer: ['Cammomile', 'Calendula']
//  [1]   "Cammomile"             level=0   plain bullet
//  [2]     "Applications |>>>"   level=1   MULTI_CARD, includeAbove=1  → parent: ['Cammomile']
//  [3]         "anxiety"         level=2   child of Applications
//  [4]         "digestion"       level=2   child of Applications
//  [5]   "Calendula"             level=0   plain bullet
//  [6]     "Applications |>>>"   level=1   MULTI_CARD, includeAbove=1  → parent: ['Calendula']
//  [7]         "skin irritations" level=2  child of Applications
//  [8]         "inflammation"    level=2   child of Applications
// ---------------------------------------------------------------------------

// Example A
const EXAMPLE_A_DOC: StructuredParagraph[] = [
  para({ textBeforeLink: 'Foundations' }),
  para({ textBeforeLink: 'Biosphere' }),
  para({ level: 0, textBeforeLink: 'Def ', linkText: '|>>>', cardMetadata: {
    id: '3001', typeKey: 'MULTI_CARD' as const, flags: [], includeAbove: 1
  }}),
  para({ level: 1, textBeforeLink: 'liquid body' }),
  para({ level: 1, textBeforeLink: 'living field' }),
  para({ level: 0, textBeforeLink: 'Synonyme ', linkText: '|>S>', cardMetadata: {
    id: '3002', typeKey: 'SYNONYM' as const, flags: [], includeAbove: 1
  }}),
];

describe('buildRawCard — includeAbove=1: bullet card finds nearest level=-1 heading (Def)', () => {
  it('parents', () => expect(buildRawCard(EXAMPLE_A_DOC, 2).parents).toEqual(['Biosphere']));
});

describe('buildRawCard — includeAbove=1: second bullet card finds same heading, skipping sibling card (Synonyme)', () => {
  it('parents', () => expect(buildRawCard(EXAMPLE_A_DOC, 5).parents).toEqual(['Biosphere']));
});

// Example B
const EXAMPLE_B_DOC: StructuredParagraph[] = [
  para({ textBeforeLink: 'medicinal flowers ', linkText: '>>>', cardMetadata: {
    id: '4001', typeKey: 'MULTI_CARD' as const, flags: [], includeAbove: 0
  }}),
  para({ level: 0, textBeforeLink: 'Cammomile' }),
  para({ level: 1, textBeforeLink: 'Applications ', linkText: '|>>>', cardMetadata: {
    id: '4002', typeKey: 'MULTI_CARD' as const, flags: [], includeAbove: 1
  }}),
  para({ level: 2, textBeforeLink: 'anxiety' }),
  para({ level: 2, textBeforeLink: 'digestion' }),
  para({ level: 0, textBeforeLink: 'Calendula' }),
  para({ level: 1, textBeforeLink: 'Applications ', linkText: '|>>>', cardMetadata: {
    id: '4003', typeKey: 'MULTI_CARD' as const, flags: [], includeAbove: 1
  }}),
  para({ level: 2, textBeforeLink: 'skin irritations' }),
  para({ level: 2, textBeforeLink: 'inflammation' }),
];

describe('buildRawCard — medicinal flowers: collects level=0 children across nested card boundaries', () => {
  it('answer', () => expect(buildRawCard(EXAMPLE_B_DOC, 0).answer).toEqual(['Cammomile', 'Calendula']));
});

describe('buildRawCard — Applications (Cammomile): includeAbove=1 finds nearest level=0 bullet above', () => {
  it('parents', () => expect(buildRawCard(EXAMPLE_B_DOC, 2).parents).toEqual(['Cammomile']));
  it('answer',  () => expect(buildRawCard(EXAMPLE_B_DOC, 2).answer).toEqual(['anxiety', 'digestion']));
});

describe('buildRawCard — Applications (Calendula): includeAbove=1 finds nearest level=0 bullet above', () => {
  it('parents', () => expect(buildRawCard(EXAMPLE_B_DOC, 6).parents).toEqual(['Calendula']));
  it('answer',  () => expect(buildRawCard(EXAMPLE_B_DOC, 6).answer).toEqual(['skin irritations', 'inflammation']));
});
