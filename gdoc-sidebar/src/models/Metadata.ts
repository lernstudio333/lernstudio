// src/models/Metadata.ts
const CONFIG = {
  BASE_URL: "https://www.lern-studio.de",
  REGEX: /\/c\/(\d+)\?t=([^&]+)/,
  DEFAULT_LEVEL: -1
};

const CARDTYPES = {
  "SINGLE_CARD": { 
    marker: ">>", 
    legacyCode: "SC",
    requiresSelection: false,
    lineBreakAfterCardRequired: false, // Question and Answer stay on the same line ↔️
    validate: nothingSelected,
    action: insertCardDefault
  },
  "MULTI_CARD": { 
    marker: ">>>", 
    legacyCode: "MC",
    requiresSelection: false,
    lineBreakAfterCardRequired: true, // Starts a new line for list items ⬇️
    validate: nothingSelected,
    action: insertCardDefault
  },
  "SYNONYM": { 
    marker: ">S>", 
    legacyCode: "SYN",
    requiresSelection: false,
    lineBreakAfterCardRequired: true, // Starts a new line for synonyms ⬇️
    validate: nothingSelected,
    action: insertCardDefault
  },
  "GAP": { 
    marker: "[...]", // Or null if you prefer no text marker for gaps
    legacyCode: "GAP",
    requiresSelection: true,
    lineBreakAfterCardRequired: false, // Inline within a sentence ➡️
    validate: validateGapSelection,
    action: insertCardGAP
  },
  "IMAGES": { 
    marker: ">I>", 
    legacyCode: "IMG",
    requiresSelection: false,
    lineBreakAfterCardRequired: true ,
    validate: nothingSelected,
    action: insertCardDefault
  }
};

/**
 * The main entry point for inserting cards.
 */
function insertText(cardTypeName, noBackward, noTyping, includeAbove) {
  // 1. Setup & Config ⚙️
  const config = CARDTYPES[cardTypeName];
  if (!config) throw "Unknown card type: " + cardTypeName;

  // 2. Collect Flags 🚩
  // We push the string value only if the checkbox was true
  const flags: string[] = [];
  if (noBackward) flags.push("NO_BACKWARD");
  if (noTyping) flags.push("NO_TYPING");

  // 3. URL Generation 🔗
  const timestamp = new Date().getTime();
  
  // We can join the array into a comma-separated string for the URL
  const flagString = flags.length > 0 ? `&flags=${flags.join(',')}` : '';
  const url = `${CONFIG.BASE_URL}?id=${timestamp}&cardtype=${cardTypeName}&includeAbove=${includeAbove}${flagString}`;

  // 4. Validation & Execution 🚀
  const sel = DocumentApp.getActiveDocument().getSelection();
  if (config.validate) {
    const errorMsg = config.validate(sel);
    if (errorMsg) return { success: false, error: errorMsg };
  }

  config.action(url, config, sel, includeAbove);

  return { success: true };
}

/**
 * Legacy-based validator for Gap cards.
 * Returns null if valid, or a string error message if invalid.
 */
function validateGapSelection(sel) {
  if (!sel) return "Gap cards require text selection. 🖱️";

  const rangeElements = sel.getRangeElements();
  if (rangeElements.length > 1) {
    return "Gap cards only allow selection within one paragraph. 📏";
  }

  const rangeEl = rangeElements[0];
  const el = rangeEl.getElement();

  // Check for partial selection (not the whole paragraph)
  if (!rangeEl.isPartial()) {
    return "Gap cards require only part of the paragraph to be selected. ✂️";
  }

  // Ensure it's text
  if (el.getType() !== DocumentApp.ElementType.TEXT) {
    return "Gap cards require a text selection.";
  }

  return null; // All clear! ✅
}


/**
 * Validator to ensure no text is selected.
 * Used for markers that should only be placed at a cursor.
 */
function nothingSelected(sel) {
  // In Google Docs, if a selection exists and isn't empty, 
  // getRangeElements() will have length > 0
  if (sel && sel.getRangeElements().length > 0) {
    return "This card type cannot be used with a selection. Please place your cursor instead. 📍";
  }
  return null; // All clear! ✅
}

function insertCardDefault(url, config, sel, includeAbove) {
  const cursor = DocumentApp.getActiveDocument().getCursor();
  if (!cursor) throw "Please click where you want to insert the card. 📍";

  const surroundingText = cursor.getSurroundingText().getText();
  const offset = cursor.getSurroundingTextOffset();

  // 1. Prepare the visual strings 🎨
  const includeIcon = includeAbove > 0 ? '|'.repeat(includeAbove) : '';
  const markerText = includeIcon + config.marker;

  // 2. Determine formatting using our helpers 📏
  const spaceBefore = needsSpaceBefore(surroundingText, offset) ? ' ' : '';
  const spaceAfter = needsSpaceAfter(surroundingText, offset) ? ' ' : '';
  const newlineAfter = needsNewlineAfter(surroundingText, offset, config.lineBreakAfterCardRequired) ? '\n' : '';

  const textToInsert = spaceBefore + markerText + spaceAfter + newlineAfter;

  // 3. The Legacy Insertion & Linking Logic 🪄
  const textElement = cursor.insertText(textToInsert);
  
  // linkStart matches your legacy 'offsetLink' (1 if space, 0 if not)
  const linkStart = spaceBefore.length; 
  const linkEnd = linkStart + markerText.length - 1;

  // Apply link and bolding only to the marker (including pipes)
  textElement.setLinkUrl(linkStart, linkEnd, url);
  textElement.setBold(linkStart, linkEnd, true);
}

/**
 * Action: Wraps the existing text selection in a link.
 * Uses: url and sel. Ignores config and includeAbove.
 */
function insertCardGAP(url, config, sel, includeAbove) {
  const rangeEl = sel.getRangeElements()[0];
  const el = rangeEl.getElement(); // This is the Text element
  const start = rangeEl.getStartOffset();
  const end = rangeEl.getEndOffsetInclusive();
  
  // Grab the text exactly as you did in the legacy code
  const elText = el.getText().substring(start, end + 1);
  
  // The "Reset" sequence 🔄
  el.deleteText(start, end);
  el.insertText(start, elText).setLinkUrl(start, start + elText.length - 1, url);
}

/**
 * Checks if a space is needed before the insertion.
 */
function needsSpaceBefore(text, offset) {
  // If we're at the very start of a paragraph, no space needed
  if (offset === 0) return false;
  // Check if the character before the cursor is NOT a whitespace
  return !/\s/.test(text.charAt(offset - 1));
}

/**
 * Checks if a space is needed after the insertion.
 */
function needsSpaceAfter(text, offset) {
  // If we're at the very end of a paragraph, no space needed
  if (offset >= text.length) return false;
  // Check if the character after the cursor is NOT a whitespace
  return !/\s/.test(text.charAt(offset));
}

/**
 * Checks if a newline is needed after a multi-card.
 */
function needsNewlineAfter(text, offset, isRequired) {
  if (!isRequired) return false;
  // If there is still text remaining in the paragraph after the cursor,
  // we need a newline to push that text down.
  return offset < text.length;
}
