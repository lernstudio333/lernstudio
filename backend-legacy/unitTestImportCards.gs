// ================================================================================================
// UNIT TESTS: importCards.gs  (pure functions — no spreadsheet required)
// ================================================================================================

function test_textFromElements() {
  const elmts = [
    { textRun: {} },
    { textRun: { content: 'Somnolenz ' } },
    { textRun: { textStyle: { link: { url: 'http://www.lern-studio.de?cardtype=mc&id=123&querymode=type' } }, content: '>>>' } },
    { textRun: { content: '\n' } }
  ];
  TESTING_EQUALS(textFromElements(elmts),  'Somnolenz >>>\n',  'concatenates all textRun content values');
  TESTING_EQUALS(textFromElements([]),      '',                 'empty array returns empty string');
  TESTING_EQUALS(textFromElements([{ textRun: {} }]), '',       'element without content returns empty string');
}

// ------------------------------------------------------------------------------------------------

function test_getUrlAndQueryParams() {
  // basic params + key lowercasing
  const r1 = getUrlAndQueryParams('https://lernstudio.de?ID=2&first=1&second=b');
  TESTING_EQUALS(r1.url,           'lernstudio.de',  'extracts base URL');
  TESTING_EQUALS(r1.params.id,     '2',              'lowercases key ID → id');
  TESTING_EQUALS(r1.params.first,  '1',              'parses first param');
  TESTING_EQUALS(r1.params.second, 'b',              'parses second param');

  // duplicate keys: last value wins
  const r2 = getUrlAndQueryParams('https://lernstudio.de?this=1&this=2&this=3');
  TESTING_EQUALS(r2.params.this, '3', 'duplicate key: last value wins');

  // decoding: + as space, %20 as space, key without value
  const r3 = getUrlAndQueryParams('https://lernstudio.de?enc=+Hello%20&empty');
  TESTING_EQUALS(r3.params.enc,   ' Hello ', 'decodes + and %20 as spaces');
  TESTING_EQUALS(r3.params.empty, '',         'key without value parses as empty string');
}

// ------------------------------------------------------------------------------------------------

function test_findLsLink() {
  const elmts = [
    { textRun: {} },
    { textRun: { content: 'Somnolenz ' } },
    { textRun: { textStyle: { link: { url: 'http://www.lern-studio.de?cardtype=mc&id=523489573894573&querymode=type&includeabove=2' } }, content: '>>>' } },
    { textRun: { content: '\n' } }
  ];
  const result = findLsLink(elmts);
  TESTING_EQUALS(result.idx,          2,                  'finds link at correct index');
  TESTING_EQUALS(result.id,           '523489573894573',  'extracts card id');
  TESTING_EQUALS(result.type,         'mc',               'extracts card type');
  TESTING_EQUALS(result.mode,         'type',             'extracts query mode');
  TESTING_EQUALS(result.includeAbove, '2',                'extracts includeAbove');

  // no LS link present
  TESTING_EQUALS(findLsLink([{ textRun: { content: 'plain text' } }]), null, 'returns null when no LS link found');
  TESTING_EQUALS(findLsLink([]), null, 'returns null for empty array');
}
