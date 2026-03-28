/src
├── /models
│   ├── Types.ts          # Interfaces (RawCard, NormalizedRow, CardMeta, …)
│   └── Metadata.ts       # CONFIG, CARDTYPES, regex, URL parsing helpers
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
│   ├── preview.ts        # getSurgicalPreview — single-card preview for sidebar
│   ├── pairing.ts        # Pairing-code exchange, session token storage
│   └── transfer.ts       # Full-document sync to Lern-Studio API
│
├── /cardMngr
│   ├── inspector.ts      # Cursor/selection analysis, card detection
│   └── detector.ts       # buildMarkerUrl, handlePostInsertionFormatting
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
