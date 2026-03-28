# Project Brief: Lern-Studio Curator for Google Docs
**Target Environment:** Google Apps Script (GAS) via TypeScript/Clasp
**Architecture:** Modular "Clean Code" (Service/Workflow/Model separation)

## 🎨 UI & User Experience Overview
The Lern-Studio Curator is a tabbed sidebar designed for seamless content creation and synchronization.

### 1. The Card Tab (Creation & Review)
* **Marker Management:** A dynamic form to set **Card Types** (Single, Multi, Synonym, etc.) and toggle **Pedagogical Flags** (e.g., "Don't quiz backwards").
* **Live Preview:** A real-time "Surgical" view of the current card. It displays the inherited context (Uphill) and the card's content (Downhill) exactly as it will appear in the app.
* **Precision Navigation:** A footer toolbar allowing users to cycle through cards in the document (`<` and `>`) or refresh the current selection (`↻`), complete with a "Card X of Y" counter for document-wide orientation.

### 2. The Transfer Tab (Connectivity & Sync)
* **State-Aware Pairing:** A dedicated onboarding flow using a **6-Digit Pairing Code** and **Target Lesson ID** to establish a secure handshake with the Supabase backend.
* **Session Management:** Once paired, the UI reflects the active connection (e.g., "Medicine > Pharmacology > Basics"), replacing the pairing form with a high-visibility **"Transfer Cards"** action button.
* **Card Transfer**   
    * Iterates through the entire document body to identify all valid Lern-Studio links. 
    * Harvests content for every identified card and transmits a structured JSON payload to the LMS API.
    * **Safety-First Sync:** Integrated "Dry-Run" reporting that alerts users to inserts, updates, and field-level changes before committing data to the live database.

### 2. The Info  Tab 
* basic infos how to use the sidebar


## Details

## 3. Data Encoding & Metadata (The "Brain")
Metadata is persisted directly within the Google Doc via **URL Query Parameters**. This allows the document to remain the "Source of Truth" without an external database.

**URL Pattern:** `https://www.lern-studio.de?id=[UID]&cardtype=[TYPE]&flags=[FLAGS]`

| Parameter | Description | Example Value |
| :--- | :--- | :--- |
| `id` | Unique timestamp-based identifier. | `1774402008697` |
| `cardtype` | Defines extraction logic for the LMS. | `MULTI_CARD`, `GAP`, `SYNONYM`, `SINGLE` |
| `flags` | User modifiers for the quiz engine. | `NO_BW` (No backwards), `NO_TYPING` |


### Card Management (Card Tab)
* **Card code / link  Detection:** The system detects existing cards from 
    * **Cursor Position (Look-Back):** Scans up to 20 characters behind the cursor to detect manually typed markers (e.g., `||>>>`) or links
    * **Text Selection:** same if text is selected

* **Upsert card links** 
    * The system detects existing card codes or links  
    * Card codes are converted into card links
    * meta data flags is added 
    * Special cases: **Gap Cards** require selected text in the middle of a paragraph to be inserted. 

* **Automatic Preview:** Upon detecting an existing link, the sidebar parses the URL and automatically updates the **Preview Pane:** that renders a real-time preview of the Question, Parent Context (Breadcrumbs), and extracted Answers/Synonyms.


## Architecture

### 3. Workflow Orchestration
We have established a "Workflow" layer to separate high-level business logic from low-level Google API calls:
* `pairing.ts`: Handles the handshake and stores `SESSION_TOKENS` in `PropertiesService`.
* `transfer.ts`: Orchestrates the full-document sync, including dry-run analysis and integrity checks.
* `preview.ts`: Manages the surgical card preview and navigation state.
* `upsert.ts` (Planned): Will handle the "Add / Update Card Marker" logic.

### 4. Developer Experience (DX)
* **TypeScript Migration:** Full conversion to `.ts` for type safety.
* **Folder Structure:** Optimized for "Clean Code" principles:
    * `/models`: Data shapes and Regex rules.
    * `/harvester`: Low-level data gathering tools.
    * `/workflows`: High-level business logic (Orchestrators).
    * `/system`: GAS entry points and utilities.

## 📍 Current Status / ToDos

### Done
* TypeScript migration complete — all files in `src/` compile cleanly
* Build pipeline: `src/` → flatten → `tmp/` → `tsc` → `build/` → `clasp push --force`
* Folder structure reconciled (`/services/MarkerDetection.ts` shared by both delivery lines)
* Card preview (`getSurgicalPreview`) wired up with `debugLog` instrumentation
* `buildRawCard` correctly splits `textBeforeLink / linkText / textAfterLink` per card type
* `getRowDisplayText` strips marker symbols from parent context (GAP-aware)

### Pending
* **Pairing workflow** — wire `exchangeCodeForToken` in `pairing.ts` to the Transfer tab UI; sample implementation is in `.ai/sample-implementation-pairing.gs`
* **Transport layer** — implement `transportToLernStudio` in `transfer.ts` (RawCard → ApiCard mapping + dry-run reporting)
* **Transfer tab UI** — connect `handleConnect()`, `runTransfer()`, `disconnect()` in `Sidebar.js.html`
* **Tests** — migrate unit tests from `src-legacy/` to Vitest; integration tests via GAS testing framework

---
