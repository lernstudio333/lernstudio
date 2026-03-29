
#  Google Docs "Lern-Studio" Harvester 
We are building a "Content Harvester" for a Google Docs Sidebar. The goal is to extract structured Flashcard data (Question, Answers, and Context) based on the specific `cardType` encoded in a link's URL. 

The Harvester uses a **Hierarchical Extraction Model** based on the document's indentation levels and relative positions.


## Hybrid Harvester

The harvester has two separate applications
1) get the card content for the card at the current cursor position / selection
   (this works together with navigating to the previous/next card and therefore a hybrid harvester strategy was implemented, see below)
2) get all cards from current doc to transfer them to the Lern-Studio API




### 🛠️ The Hybrid Harvester Architecture

| Feature                  | Job 1: Sidebar Preview (Single)                                     | Job 2: Transfer (Batch)                                              |
| :----------------------- | :------------------------------------------------------------------ | :------------------------------------------------------------------- |
| **Trigger**              | Cursor movement or "Add/Update" button click.                       | "Transfer Cards" button click in the Transfer tab.                   |
|                          |                                                                     |                                                                      |
| **Entry Point (DocApp)** | **Physical:** Uses `getCursor()` to find the specific paragraph     | **Sequential:** Iterates through the document body to identify all   |
|                          | element in the active document.                                     | paragraphs containing markers.                                       |
|                          |                                                                     |                                                                      |
| **Dta Engine (REST API)**| **Hybrid Lookup:** Maps the physical paragraph to the JSON Map      | **Bulk Map:** Uses a single REST API call to fetch the entire        |
|                          | fetched via `Docs.Documents.get` for instant context climbing.      | document structure once, processing all cards from the JSON map.     |
|                          |                                                                     |                                                                      |
| **Scope**                | **Local:** Focuses on the single paragraph index and its            | **Global:** Processes the entire JSON map, converting every          |
|                          | immediate "Uphill/Downhill" neighbors in the JSON map.              | identified marker into a structured card.                            |
|                          |                                                                     |                                                                      |
| **Common Logic (Reader)**| **Identical:** Uses the `MarkerDetection` service and               | **Identical:** Calls the exact same `buildRawCard` function          |
|                          | `buildRawCard` logic to turn JSON nodes into Card objects.          | for every index identified during the global scan.                   |
|                          |                                                                     |                                                                      |
| **Performance Edge**     | **Instant:** No more recursive `.getParent()` calls; context is     | **Scalable:** Reduces execution time by ~90% compared to standard    |
|                          | retrieved by simply looking at previous indices in the JSON array.  | Apps Script by avoiding repeated UI-thread lookups.                  |
|                          |                                                                     |                                                                      |
| **Output**               | Returns a single `rawCard` object to update the Sidebar UI.         | Returns an **Array** of `rawCard` objects to be sent to the API.     |
| :----------------------- | :------------------------------------------------------------------ | :------------------------------------------------------------------- |


## Indentation Levels (`StructuredParagraph.level`)

The `level` field is derived from the Google Docs REST API (`paragraph.bullet.nestingLevel`):

| Document element        | `level` value |
| :---------------------- | :-----------: |
| Normal paragraph        | `-1`          |
| Bullet point, 1st level | `0`           |
| Bullet point, 2nd level | `1`           |
| Bullet point, nth level | `n - 1`       |

A normal paragraph (`level -1`) can have bullet children at `level 0` — `startLevel + 1` still correctly resolves to `0`.

---

## Card Extraction Logic

1.  **The Question:**
    * **Markers:** Text on the same line to the left of the link/marker.
    * **Gaps:** The surrounding paragraph text with the linked word replaced by `[...]`.
2.  **The Parent Context (Breadcrumbs):**
    * Climbs "up" the document, collecting text from all paragraphs with strictly decreasing indentation levels (e.g., `Medicine > Pharmacology > Basics`).
3.  **The Answers:**
    * **Logic:** Scans subsequent paragraphs and collects those that are **exactly one indentation level deeper** than the marker's paragraph.
    * **Termination:** The scan stops immediately if it encounters a paragraph with an indentation level **equal to or lower** than the marker's paragraph.
    * **Filtering:** Paragraphs nested two or more levels deeper are ignored (as they likely belong to nested child markers).



The Harvester must follow these strict extraction rules for each card type:


### 1. MULTI_CARD (The Indentation Logic)
**Trigger:** A link containing `cardtype=MULTI_CARD` (marker like `||>>>`) found at the end of a paragraph.

* **Extraction Rule:** Collect subsequent paragraphs that are exactly **one indentation level deeper** than the marker's paragraph.
* **Termination:** Stop scanning as soon as a paragraph is encountered with an indentation level **equal to or lower** than the marker's paragraph.
* **Hierarchical Filtering:** Ignore paragraphs that are two or more levels deeper (as those belong to nested child markers).

**Example Input:**
* Medicines 
    * pain killers >>> [LINK: MULTI_CARD]
       * paracetamol
            * application |>>> [LINK: MULTI_CARD]
                 * mild fever
                 * mild to moderate pain
       * aspirin

**Resulting Extractions:**
1.  **Card "pain killers":** Question: `pain killers`; Answers: `['paracetamol', 'aspirin']`.
2.  **Card "application":** Question: `application`; Answers: `['mild fever', 'mild to moderate pain']`.

---

### 2. GAP (The Cloze Deletion Logic)
**Trigger:** A link containing `cardtype=GAP` wrapping a specific string of text within a paragraph.

* **Question Source:** The entire surrounding paragraph, but with the linked text replaced by a placeholder (e.g., `[...]`).
* **Answer Source:** The exact text string contained inside the link.

**Example Input:**
`Lorem ipsum [dolor](www.link.com?cardtype=GAP) sit amet.`

**Resulting Extraction:**
* **Question:** `Lorem ipsum [...] sit amet.`
* **Answer:** `dolor`

---

### 3. SINGLE_CARD (The Linear Logic)
**Trigger:** A link containing `cardtype=SINGLE_CARD` (marker like `>>`).

* **Question Source:** All text on the same line to the **left** of the marker.
* **Answer Source:** All text on the same line to the **right** of the marker.

---

### 4. IMAGES (The Visual Logic)
**Trigger:** A link containing `cardtype=IMAGES` (marker like `>I>`).

* **Extraction Rule:** Exactly like the **MULTI_CARD**, but the content collected consists of image file names/references.
* **Source Format:** A bulleted list of image names (one level deeper) OR a comma-separated list of image names on the same line.
* **Resulting Extraction:** `displayAnswers` should be an array of image identifiers/filenames.

---

### 5. SYNONYM (The Terminology Logic)
**Trigger:** A link containing `cardtype=SYNONYM` (marker like `>S>`).

* **Extraction Rule:** Structurally identical to the **MULTI_CARD** (Indentation Logic).
* **Question Source:** The word or term on the same line as the marker.
* **Answer Source:** A list of subsequent paragraphs exactly one indentation level deeper, each representing a valid synonym.
* **Note:** While the extraction is the same as MULTI_CARD, the LMS treats these as interchangeable "correct" answers during quizzing.

---

### Technical Implementation Goal:
Update the `handleInsertMarkerOrchestrator` to include a `displayData` object in the `cardMetadata` response:
1.  **`displayQuestion`**: String (The formatted question/prompt).
2.  **`displayAnswers`**: Array of Strings (The list of answers, synonyms, image names, or the gap key).
3.  **`contextPath`**: String (The breadcrumb path of parent headings/bullets, e.g., `Medicines > pain killers`).


## 🏗️ Technical Achievements

### 1. The "Hybrid" Harvester
We implemented a high-performance harvesting strategy to overcome Google Apps Script's execution limits:
* **Navigation (DocumentApp):** Uses the standard library to physically locate paragraphs and move the user's cursor.
* **Extraction (REST API):** Uses the Google Docs REST API (`Docs.Documents.get`) to fetch the entire document structure as a JSON map. This allows for near-instant "Uphill/Downhill" context climbing that is 10x faster than standard GAS methods.

### 2. Data Modeling & Extraction
* **RawCard Model:** The Harvester returns a standardized object used by both the Preview UI and the Transfer API. 

```javascript
const rawCard = {
  question: string,               // Text on the marker line
  paragraphTextBeforeLink: string, // Context for Gap cards
  paragraphTextAfterLink: string,  // Context for Gap cards
  parents: string[],              // Array of parent strings (for breadcrumbs)
  directChildren: string[]        // Array of bullet points (answers/synonyms)
};
```

* **Surgical Extraction:** Built logic to extract a single card based on the user's current cursor position or selection by mapping the physical paragraph to the REST API JSON index.