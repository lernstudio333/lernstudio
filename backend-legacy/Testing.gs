// ================================================================================================
// TESTING FRAMEWORK
// ================================================================================================

/**
 * Tracks the currently running test group/function.
 * 
 * @namespace TESTING_CONTEXT
 * @property {string} group - The name of the current test group.
 * @property {Function} setGroup - Sets the current test group.
 */
const TESTING_CONTEXT = {
  group: '',
  
  /**
   * Sets the current test group name and logs it.
   * 
   * @param {string} name - The name of the test group.
   */
  setGroup: function(name) {
    this.group = name;
    Logger.log('▶️ Running Test Group: ' + name);
  }
};

// ================================================================================================

/**
 * Tracks pass/fail statistics for the tests.
 * 
 * @namespace TESTING_STATS
 * @property {number} passed - Number of tests that passed.
 * @property {number} failed - Number of tests that failed.
 * @property {Function} reset - Resets the pass/fail counters.
 * @property {Function} logSummary - Logs a summary of the test results.
 */
const TESTING_STATS = {
  passed: 0,
  failed: 0,

  /**
   * Resets the pass/fail counters to zero.
   */
  reset: function() {
    this.passed = 0;
    this.failed = 0;
  },

  /**
   * Logs the summary of the test results.
   * 
   * @example
   * // Logs: TEST SUMMARY: ✅ 5 passed / ❌ 2 failed
   */
  logSummary: function() {
    Logger.log('===============================');
    Logger.log(`TEST SUMMARY: ✅ ${this.passed} passed / ❌ ${this.failed} failed`);
    Logger.log('===============================');
  }
};

// ================================================================================================

/**
 * Runs a test function and sets the test group context.
 * 
 * This function ensures that each test function has its group name set before execution.
 * It also logs the start of the test group.
 * 
 * @param {Function} fn - The test function to run.
 * 
 * @example
 * RUN_TEST(testMyFunction);
 */
function RUN_TEST(fn) {
  TESTING_CONTEXT.setGroup(fn.name); // Set the group context based on the function name
  fn();  // Run the test function
}

// ================================================================================================

/**
 * Asserts that `result` equals `expected`. Supports primitives, objects, arrays, and Sets.
 * Logs detailed output on failure or if debug is true.
 *
 * @param {*} result - Actual result.
 * @param {*} expected - Expected result.
 * @param {string} msg - Test description.
 * @param {boolean} [showIfOk=true] - Whether to log passing tests.
 * @param {boolean} [debug=false] - Whether to log detailed output.
 */
function TESTING_EQUALS(result, expected, msg, showIfOk = true, debug = false) {
  function isPrimitive(val) {
    return val !== Object(val);
  }

  function setsAreEqual(a, b) {
    if (!(a instanceof Set) || !(b instanceof Set)) return false;
    if (a.size !== b.size) return false;
    const arrA = Array.from(a).sort();
    const arrB = Array.from(b).sort();
    return JSON.stringify(arrA) === JSON.stringify(arrB);
  }

  let pass;

  if (result instanceof Set && expected instanceof Set) {
    pass = setsAreEqual(result, expected);
  } else if (isPrimitive(result)) {
    pass = result === expected;
  } else {
    pass = JSON.stringify(result) === JSON.stringify(expected);
  }

  if (pass) {
    if (showIfOk) Logger.log('✅ ' + msg);
    if (debug) {
      Logger.log('     result:   ' + JSON.stringify(result));
      Logger.log('     expected: ' + JSON.stringify(expected));
    }
    TESTING_STATS.passed++;
  } else {
    Logger.log('❌ ' + msg);
    Logger.log('     result:   ' + JSON.stringify(result));
    Logger.log('     expected: ' + JSON.stringify(expected));
    TESTING_STATS.failed++;
  }
}


// ================================================================================================

/**
 * Asserts that an expression is true. Logs failure or always logs if debug is true.
 * @param {boolean} expression - The condition to test.
 * @param {string} msg - Test description.
 * @param {boolean} [showIfOk=true] - Whether to log passing tests.
 * @param {boolean} [debug=false] - Whether to log detailed output.
 */
function TESTING_TRUE(expression, msg, showIfOk = true, debug = false) {
  if (expression) {
    if (showIfOk) Logger.log('✅ ' + msg);
    if (debug) Logger.log('     expression was truthy');
    TESTING_STATS.passed++;
  } else {
    Logger.log('❌ ' + msg);
    Logger.log('     expression was falsy');
    TESTING_STATS.failed++;
  }
}


// ================================================================================================

/**
 * Expects an exception to be thrown when the provided function is executed.
 * 
 * If an exception is thrown, it logs the success message and increments the `passed` count.
 * If no exception is thrown, it logs an error message and increments the `failed` count.
 * 
 * @param {Function} fn - The function expected to throw an exception.
 * @param {string} msg - A description or message to log along with the result.
 * 
 * @example
 * TESTING_RAISE_EXCEPTION(() => { throw new Error('Test error') }, 'Expecting an error to be thrown');
 */
function TESTING_RAISE_EXCEPTION(fn, msg) {
  try {
    fn();  // Try running the function
    Logger.log(`❌ ${TESTING_CONTEXT.group}: ${msg} -- ERROR: exception expected but not thrown`);
    TESTING_STATS.failed++;
  } catch (e) {
    Logger.log(`✅ ${TESTING_CONTEXT.group}: ${msg} -- OK: caught ${e.name}: ${e.message}`);
    TESTING_STATS.passed++;
  }
}
