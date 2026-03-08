# Admin UI – Learning App

## Layout

- **Global Sidebar**: Content / Media / Users  
- **Content Browser**: collapsible tree → select Lesson  
- **Lesson Workspace**:
  - Header: breadcrumb (Program / Course / Lesson), editable title, optional switch lesson dropdown
  - Split view:
    - Left: Card List (sortable, drag-and-drop, batch operations)
    - Right: Card Detail Editor

---

## Card Navigation

- Previous / Next buttons follow current sort/filter state  
- Keyboard support: ArrowLeft / ArrowRight  
- Card list drives selection; no database ID order  

---

## Card Editor Sections

- **Basic Info**: question, card type, tipp  
- **Answers**: dynamic depending on type  
- **Card Modes**: multiselect UI from `card_modes` table  

---

## Media Gallery

- Top menu entry “Media”  
- Supports upload/delete/rename/search  
- Operates on file bucket + `media` table for metadata  

---
