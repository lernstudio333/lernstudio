// the sheet "Dashboard" contains a dropdown with all the course IDs (named reange "selDocId").
// When a course ID is selected and the button [Import] is clicked, lickedImport() is executed.
function clickedImport(){
  const selDocId = SpreadsheetApp.getActiveSpreadsheet().getRangeByName("selDocId").getValue()
  console.log(selDocId);

  const docInfos = new LsDocs()

  const selDocs = docInfos.dataDct.filter(d => d.shortDocId == selDocId)

  console.log(selDocs.length) 

  if (selDocs.length > 1) {
    SpreadsheetApp.getUi().alert("FEHLER: " + selDocId + " existiert mehrfach! Abbruch!")
    return;
  } else if (selDocs.length < 1) {
    SpreadsheetApp.getUi().alert("FEHLER: " + selDocId + " existiert nicht! Abbruch!")
    return;
  }
  console.log(selDocs[0])
  importCardsFromDoc(selDocs[0])

}