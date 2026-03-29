// Stub GAS globals that pure functions call at runtime.
// These are no-ops in tests — we verify outputs, not logs.
(globalThis as any).debugLog = () => {};
