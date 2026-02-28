// ================================================================================================
// UNIT TEST RUNNER
// Run this function from the GAS editor to execute all unit tests.
// ================================================================================================

function runUnitTests() {
  TESTING_STATS.reset();

  // pure unit tests
  RUN_TEST(test_robustJsonParse);

  // webapp integration tests (require active spreadsheet + valid tokens)
  RUN_TEST(test_doPost_invalidToken);
  RUN_TEST(test_doPost_userdata);
  RUN_TEST(test_doPost_docs);
  RUN_TEST(test_doPost_nextCards_learnNew);
  RUN_TEST(test_doPost_nextCards_repeat);
  RUN_TEST(test_doPost_nextCards_list);
  RUN_TEST(test_doPost_learnings);

  TESTING_STATS.logSummary();
}
