/src
├── /models
│   ├── Types.ts          # Interfaces (RawCard, NormalizedRow, CardMeta, …)
│   └── cardTypes.ts      # CONFIG, CARDTYPES registry, validator functions
│
│   CARDTYPES shape:
│     marker                  — the visual symbol inserted into the doc (e.g. ">>>")
│     legacyCode              — short code sent to the API (e.g. "MC")
│     requiresSelection       — boolean, documents the intent (mirrors validateInsert)
│     selectionMode           — 'wrap' | 'replace'; drives insertion branch in executors.ts
│     lineBreakAfterCardRequired — boolean; drives post-insertion newline
│     validateRange(sel)      — called before Strategy 2 only; raw GAS selection checks (partial, single-para, text type)
│     validateInsert(ctx)     — called before Strategy 2 only, after validateRange; logical context checks
│     validateConvert(ctx)    — called before Strategy 1 (typed marker → link); returns error string or null
│
│   Validators in this file:
│     validateGapSelection(sel) — GAP validateRange: checks partial, single-para, text-type on raw GAS selection
│     validateNoSelection(ctx)  — non-GAP validateInsert: rejects selection to avoid silently replacing text
│
├── /services
│   └── MarkerDetection.ts  # detectMarkerPattern + parseCardUrl (shared by harvester & cardMngr)
│
├── /harvester            # The "Worker Bees" (low-level data)
│   ├── api.ts            # Docs REST API — gatherDocumentMap → NormalizedRow[]
│   ├── extraction.ts     # buildRawCard, findParentContext, findDirectChildren, getRowDisplayText
│   ├── navigation.ts     # Cursor helpers — findCardUrlInParagraph, getParaFromElement
│   └── full-doc-harvester.ts  # Batch harvest: all cards in document
│
├── /workflows            # The "Orchestrators" (high-level logic)
│   ├── upsert.ts         # Insert / update marker links
│   │     Dispatch pattern:
│   │       Strategy 1 (typed marker): config.validateConvert?.(ctx) → executeConversion()
│   │       Strategy 2 (fresh insert): config.validateInsert?.(ctx)  → executeInsertion()
│   ├── preview.ts        # getSurgicalPreview — single-card preview for sidebar
│   ├── pairing.ts        # Pairing-code exchange, session token storage
│   └── transfer.ts       # Full-document sync to Lern-Studio API
│
├── /cardMngr
│   ├── inspector.ts      # Cursor/selection analysis → getDocumentContext()
│   │     Returns context object: { focus, isSelection, element, text, markerIndex, endOffset, existingLink }
│   ├── executors.ts      # All GAS document mutations
│   │     executeConversion()         — styles a typed marker as a link
│   │     executeInsertion()          — fresh insert or selection wrap; branches on config.selectionMode
│   │     buildMarkerUrl()            — builds the card URL with flags
│   │     handlePostInsertionFormatting() — adds trailing space/newline after conversion
│   │     needsSpaceBefore/After/NewlineAfter() — spacing helpers
│   └── detector.ts       # (empty — see MarkerDetection.ts and executors.ts)
│
├── /UI
│   ├── Sidebar.html      # Shell template (tabs, Bootstrap, include() calls)
│   ├── Sidebar.css.html  # Scoped sidebar styles
│   ├── Sidebar.js.html   # Front-end JS (google.script.run calls, UI state)
│   ├── tab-card.html     # Card tab fragment
│   ├── tab-transfer.html # Transfer tab fragment
│   └── tab-info.html     # Info tab fragment
│
└── /system
    ├── main.ts           # onOpen(), showSidebar()
    ├── util.ts           # DEBUG flag, debugLog(), logError(), include()
    └── checkGoogleDocAPI.js  # Dev helper — verifies Docs API access
