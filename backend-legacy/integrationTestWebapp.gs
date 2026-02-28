// ================================================================================================
// INTEGRATION TESTS: webapp.gs  (require active spreadsheet + valid tokens)
// When run manually from the GAS editor, raw responses are printed (TESTING_CONTEXT.verbose).
// When run via runTests() in Tests.gs, only pass/fail is logged.
// ================================================================================================

const TEST_TOKEN_VOLKER = 'adfjkl6h3489pdfghsrrlzh58eotzhwels8ps5o';
const TEST_TOKEN_MARIA  = '7t4dskfgh9etsdfghwe9t5eshgset59sgihs949';
const TEST_CARD_SELECTOR = 'HPP-F60';

function makeRequest_(jsonData) {
  const s = JSON.stringify(jsonData);
  return { postData: { getDataAsString: () => s } };
}

// ------------------------------------------------------------------------------------------------

function test_doPost_invalidToken() {
  const result = doPost(makeRequest_({ dataType: 'docs', token: 'invalid_token_xxx' }));
  if (TESTING_CONTEXT.verbose) Logger.log(result.getContent());
  TESTING_TRUE(result !== null && result !== undefined, 'invalid token: response should not be null');
}

// ------------------------------------------------------------------------------------------------

function test_doPost_userdata() {
  const result = doPost(makeRequest_({ dataType: 'user', token: TEST_TOKEN_VOLKER }));
  if (TESTING_CONTEXT.verbose) Logger.log(result.getContent());
  const content = JSON.parse(result.getContent());
  TESTING_EQUALS(content.name, 'Volker',  'user name should be Volker');
  TESTING_TRUE('email' in content,        'user should have email field');
  TESTING_TRUE('id'    in content,        'user should have id field');
}

// ------------------------------------------------------------------------------------------------

function test_doPost_docs() {
  const result = doPost(makeRequest_({ dataType: 'docs', token: TEST_TOKEN_VOLKER }));
  if (TESTING_CONTEXT.verbose) Logger.log(result.getContent());
  const content = JSON.parse(result.getContent());
  TESTING_TRUE(Array.isArray(content),           'docs should be an array');
  TESTING_TRUE(content.length > 0,               'docs array should not be empty');
  TESTING_TRUE('shortDocId' in content[0],       'each doc should have shortDocId');
  TESTING_TRUE('book'       in content[0],       'each doc should have book');
  TESTING_TRUE('docTitle'   in content[0],       'each doc should have docTitle');
}

// ------------------------------------------------------------------------------------------------

function test_doPost_nextCards_learnNew() {
  const result = doPost(makeRequest_({
    dataType: 'nextCards', token: TEST_TOKEN_VOLKER,
    cardSelector: TEST_CARD_SELECTOR, method: 'learnNew'
  }));
  if (TESTING_CONTEXT.verbose) Logger.log(result.getContent());
  const content = JSON.parse(result.getContent());
  TESTING_TRUE('questions' in content,           'learnNew: response should have questions');
  TESTING_TRUE('answers'   in content,           'learnNew: response should have answers');
  TESTING_TRUE(Array.isArray(content.questions), 'learnNew: questions should be an array');
  TESTING_TRUE(Array.isArray(content.answers),   'learnNew: answers should be an array');
}

function test_doPost_nextCards_repeat() {
  const result = doPost(makeRequest_({
    dataType: 'nextCards', token: TEST_TOKEN_VOLKER,
    cardSelector: TEST_CARD_SELECTOR, method: 'repeat'
  }));
  if (TESTING_CONTEXT.verbose) Logger.log(result.getContent());
  const content = JSON.parse(result.getContent());
  TESTING_TRUE('questions' in content,           'repeat: response should have questions');
  TESTING_TRUE('answers'   in content,           'repeat: response should have answers');
}

function test_doPost_nextCards_list() {
  const result = doPost(makeRequest_({
    dataType: 'nextCards', token: TEST_TOKEN_VOLKER,
    cardSelector: TEST_CARD_SELECTOR, method: 'list', favouritesOnly: 'false'
  }));
  if (TESTING_CONTEXT.verbose) Logger.log(result.getContent());
  const content = JSON.parse(result.getContent());
  TESTING_TRUE('questions' in content,           'list: response should have questions');
  TESTING_TRUE('answers'   in content,           'list: response should have answers');
}

// ------------------------------------------------------------------------------------------------

function test_doPost_learnings() {
  const result = doPost(makeRequest_({
    dataType: 'learnings',
    token: TEST_TOKEN_MARIA,
    learnings: [
      { cardId: 'HPP-F60-1694287373659', learning: { score: 5, lastEdited: new Date().toString() } }
    ]
  }));
  if (TESTING_CONTEXT.verbose) Logger.log(result.getContent());
  TESTING_TRUE(result !== null && result !== undefined, 'learnings write should not crash');
}
