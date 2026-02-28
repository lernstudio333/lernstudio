
function importCardsFromDoc(doc){
  console.log(doc)
  const cards = readDoc(doc.googleDocId);
  console.log (cards);
  writeCardsOnSheetUpdate(doc.googleDocId, cards)
}

function importCardsFromDocManually(){
  const googleDocId = "1NkzzLusFJbB0uedwIiCtphqRUsWGuJUGpPug1FuaUBI"
  const cardsFromDoc = readDoc(googleDocId);
  console.log (cardsFromDoc);
  writeCardsOnSheetUpdate(googleDocId, cardsFromDoc)
}


function test_importSheet(){
  const docs = {
    "F42": {
      book: "HPP",
      title: "F42 Zwangsstörung",
      googleDocId: '1ZohDfaCrzvhZz086R3qR5pEfLzJE2eogX4x3-Bw2dUE'
    },
     "F60": {
      book: "HPP",
      title: "F60 Persönlichkeitsstörungen",
      googleDocId: '1nILZJEkIEPKlHUZ4rLD8TQyIEzYUB9saFd_T2WJdnbo'
    },
     "THE_G1": {
      book: "HPP",
      title: "Therapie-Verfahren",
      googleDocId: '1-xH_pIihiBYgvsfanbbEr2Q5a0BaxIJuILEpf0iDweM'
    }
  } 
  const doc = docs['THE_G1']
  importSheet(doc)
}

function writeCardsOnSheetAttach(docId, cards){
  if (cards.length > 0){
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName('cards');
    const colMax = sheet.getDataRange().getLastColumn()
    const header = sheet.getRange(1,1,1,colMax).getValues()[0];
    console.log(header)

    // idc is something like { sheetId: 0, cardId: 1, question: 2, answers: 3, options: 4, lastEdited: 5 }
    const idc = idcFromHeader(header)
    //console.log(idc)
    
    const lastRow = sheet.getLastRow();  
    //console.log("lastRow: " + lastRow)

    const values = cards.map(cd => {
      console.log(cd)
      let rw = Array(colMax);
      rw[idc.sheetId] =  docId;
      rw[idc.cardId] =  cd.cardId;
      rw[idc.question] =  cd.question.trim();
      rw[idc.answers] =  JSON.stringify( (cd.answer ? [cd.answer]:null) || cd.answers || []);
      rw[idc.options] =  JSON.stringify( {'type' : cd.cardType, 'mode': cd.mode});    
      rw[idc.lastEdited] =  new Date();  
      return rw;
    })
    sheet.getRange(lastRow + 1, 1, values.length, values[0].length ).setValues(values);
  } else {
    console.log("data does not contain any new data sets")
  }
}

function idcFromHeader(header){
  let idc = {};
  idc['sheetId'] = header.indexOf('sheet ID'); 
  idc['cardId'] = header.indexOf('card ID'); 
  idc['question'] = header.indexOf('question');
  idc['answers'] = header.indexOf('answers');
  idc['options'] = header.indexOf('options');
  idc['lastEdited'] = header.indexOf('last edited');

  return idc;
}

function writeCardsOnSheetUpdate(docId, updatedCards){
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName('cards');
  const datarange = sheet.getDataRange();
  let existingData = datarange.getValues();

  console.log(existingData)

  // idc is something like { sheetId: 0, cardId: 1, question: 2, answers: 3, options: 4, lastEdited: 5 }
  const idc = idcFromHeader(existingData[0])
  // console.log("IDC"); console.log(idc)

  var cardIds = existingData.map(rw => rw[idc.cardId])
  //console.log("CARDIDS"); console.log(cardIds)
  
    var newCards = []

  for (cd of updatedCards){
    const rwIdx = cardIds.indexOf(cd.cardId)
    if (rwIdx > 0 ){
      if(existingData[rwIdx][idc.sheetId] != docId){
        console.log ("ERROR: wrong doc ID at row " + rwIdx + " for card ID " + cd.cardId);
        console.log(existingData[rwIdx][idc.sheetId])
        console.log(docId)
        continue;
      }
      existingData[rwIdx][idc.question] =  cd.question.trim();
      existingData[rwIdx][idc.answers] =  JSON.stringify( (cd.answer ? [cd.answer]:null) || cd.answers || []);
      existingData[rwIdx][idc.options] =  JSON.stringify( {'type' : cd.cardType, 'mode': cd.mode});    
      existingData[rwIdx][idc.lastEdited] =  new Date();    
    } else {
      newCards.push(cd)
    }
  }
  datarange.setValues(existingData);
  writeCardsOnSheetAttach(docId, newCards)
}

function test_docReAD(){
  const document = Docs.Documents.create({'title': 'My New Document'});
}


function readDoc(id) {
  console.log(id)
  var doc = Docs.Documents.get(id);     //

  const content = doc.body.content;
  
  const paragraphs = content.filter(el => ("paragraph" in el)).map(el => extractParagraph(el.paragraph));
  
  // for mult-line cards add content of level below to cards as anwer
  const cards = paragraphs
    // for mult-line cards add content of level below to cards as anwer
    .map( (p,idx) => {
      if ('cardType' in p && (p.cardType == "MC" || p.cardType == "SYN" )){
        let answers = [];
        for (let i = idx+1; i < paragraphs.length; i++) { 
          if (paragraphs[i].paragraphLevel - 1 == p.paragraphLevel){   //direct child
            
            answers.push(paragraphs[i].question || paragraphs[i].text)
          }
          if (paragraphs[i].paragraphLevel <= p.paragraphLevel){  // same level or above
            break;                                                 // no direct childs after this element  
          }
        } 
        p['answers'] = answers;
      }
      return p;
    })
    // if includeAbove add lines above
    .map( (p,idx) => {
      if ('includeAbove' in p){
        const includeAboveInt = parseInt(p.includeAbove);
       
        if (!isNaN(includeAboveInt) &&  includeAboveInt > 0 &&  -1 <= p.paragraphLevel - includeAboveInt){
          let qu = p['question'];
          let searchForLevel = -1;
          for (let i = idx-1; i > 0; i--) { 
            if (paragraphs[i].paragraphLevel == p.paragraphLevel + searchForLevel){ // next level above
                console.warn("PLING"+ paragraphs[i].text)
                qu = paragraphs[i].text + " - " + qu;
                searchForLevel -= 1;
            }
            if (Math.abs(searchForLevel) > includeAboveInt){  // walked up the tree as far 
              break;                                            
            }
          } 
          return {...p, question: qu}
        }
      }
      return p;
    })
    .filter(p => ('cardType' in p));
 return cards
}


function checkParagraphForLSLink(p){
  
}

function validLsLink(p){
  
}


function paragraphLevel(p){
  if ('bullet' in p){
    if ('nestingLevel' in p.bullet){
      return p.bullet.nestingLevel;
    } else {
      return 0;
    }
  }
  return -1;
}

function paragraphElement(el){
  

}

function textFromElements(elmts){

  return elmts.reduce( (total, el) =>  
    total += (el.hasOwnProperty("textRun") && el.textRun.hasOwnProperty("content")) ? el.textRun.content : ""
    , "") || ""
}

function test_textFromElements(){
  const testElmts = [
      {
        "textRun": {}
      },
      {
        "textRun": {
          "content": "Somnolenz "
        }
      },
      {
        "textRun": {
          "textStyle": {
           "link": {"url": "http://www.lern-studio.de?cardtype=mc&id=523489573894573&querymode=type&includeabove=2"},
          },
          "content": ">>>"
        },
      },
      {
        "textRun": {
            "content": "\n"
        },
      }
    ];
  const testPar = {
    "elements": testElmts,
    "bullet": {"nestingLevel": 1},
  }; 
  //console.log(textFromElements(testElmts));
  console.log(findLsLink(testElmts));
  //console.log(extractParagraph(testPar));
}



function extractParagraph(p){
  
  let res = {
    text: textFromElements(p.elements).trim(),
    paragraphLevel: paragraphLevel(p),
    question: null
  };
  const infoFromUrl = findLsLink(p.elements)
      console.log(infoFromUrl)

  if (infoFromUrl){
    console.log(infoFromUrl)
    res['cardType'] = infoFromUrl.type;
    res['mode'] = infoFromUrl.mode;
    res['cardId'] = infoFromUrl.id;
    res['includeAbove'] = infoFromUrl.includeAbove;
    
    const txtBefore = textFromElements(p.elements.slice(0,infoFromUrl.idx)).trim();
    const txtUrl = textFromElements(p.elements.slice(infoFromUrl.idx, infoFromUrl.idx+1)).trim();
    const txtAfter = textFromElements(p.elements.slice(infoFromUrl.idx+1)).trim();
    res['text'] = (txtBefore.trim() + ' ' + txtAfter.trim()).trim();

    res['question'] = txtBefore;
    res['answer'] = null;

    if(res['cardType'] == 'SC'){
        res['answer'] = txtAfter;    
    };
    if(res['cardType'] == 'GAP'){
      res['question'] = txtBefore + ' ... ' + txtAfter;
      res['answer'] = txtUrl;     
    };
    
  }
  console.log(res)
  return res;
}


function findLsLink(elmts){
  for (const [idx, el] of elmts.entries()) {
    //console.log(el)
    if ('textRun' in el && 
        'textStyle' in el.textRun && 
        'link' in el.textRun.textStyle &&
        'url' in el.textRun.textStyle.link){
      //console.log('URL')
      let chck = getUrlAndQueryParams(el.textRun.textStyle.link.url);
      //console.log(chck)
      if(chck.url == "www.lern-studio.de" &&
         'id' in chck.params &&
         'cardtype' in chck.params && 
         'querymode' in chck.params 
        ){
          return {
            'idx': idx,
            'id' : chck.params.id,
            'type': chck.params.cardtype,
            'mode': chck.params.querymode,
            'includeAbove' : 'includeabove' in chck.params ? chck.params.includeabove : null,
          };
         }
    }
  }
  return null;
}



function getUrlAndQueryParams (url){
  // based on https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript

  function removeHttp(url) {
    return url.replace(/^https?:\/\//, '');
  }
  function decode(s) { 
    const pl = /\+/g;  // Regex for replacing addition symbol with a space
    return decodeURIComponent(s.replace(pl, " ")); 
  }

  let baseUrl = removeHttp(url.substring(0, url.indexOf('?')))
  let paramStg = url.substring(url.indexOf('?')+1, url.length)



  let match;
  let urlParams = {};
  const regx = /([^&=]+)=?([^&]*)/g;  
  // "g" modifier specifies a global match; global match finds all matches interatively
  // use regex object instead of regex literal; the regex object keeps track of the last match
  
  while (match = regx.exec(paramStg)){
       urlParams[decode(match[1]).toLowerCase()] = decode(match[2]);
  } 
  return {"url": baseUrl, "params": urlParams};
}

function encodeQueryParams (){
  
}
function test_QueryParams(){
    //var tests = {};
    //tests["simple params"] = "ID=2&first=1&second=b";
    //tests["full url"] = "http://blah.com/?third=c&fourth=d&fifth=e";
    //tests['just ?'] = '?animal=bear&fruit=apple&building=Empire State Building&spaces=these+are+pluses';
    //tests['with equals'] = 'foo=bar&baz=quux&equals=with=extra=equals&grault=garply';
    //tests['no value'] = 'foo=bar&baz=&qux=quux';
    //tests['value omit'] = 'foo=bar&baz&qux=quux';

  console.log( getUrlAndQueryParams("https://lernstudio.de?ID=2&first=1&second=b"));
  console.log( getUrlAndQueryParams("https://lernstudio.de?this=1&this=2&this=3"));
  console.log( getUrlAndQueryParams("https://lernstudio.de?i=main&mode=front&sid=de8d49b78a85a322c4155015fdce22c4&enc=+Hello%20&empty"))
}

