// ================================================================================================
// UNIT TESTS: utils.gs
// ================================================================================================

function test_robustJsonParse() {
  TESTING_EQUALS(robustJsonParse('{"a":1}'),    {a: 1},       'valid object parses correctly');
  TESTING_EQUALS(robustJsonParse('["x","y"]'),  ["x", "y"],   'valid array parses correctly');
  TESTING_EQUALS(robustJsonParse('42'),          42,           'number string parses correctly');
  TESTING_EQUALS(robustJsonParse('true'),        true,         'boolean string parses correctly');
  TESTING_EQUALS(robustJsonParse(''),            '',           'empty string returns ""');
  TESTING_EQUALS(robustJsonParse('not json'),    '',           'invalid JSON returns ""');
  TESTING_EQUALS(robustJsonParse('{bad}'),       '',           'malformed object returns ""');
}
