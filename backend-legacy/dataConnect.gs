
function getData(name, firstCol, numCol){
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(name);
  return sheet.getDataRange().getValues()
    .filter(rw => rw.join("").trim() !== "");  // filter emtpy rows
}


function getCards(cardSelector){
  let data = getData('cards', 1, 5)
  return data.map(rw => ({
      sheetId: rw[0],
      cardId:	rw[1],
      question:	rw[2],
      answer: robustJsonParse(rw[3]),
      options: robustJsonParse(rw[4])
    }))
  .filter(cd => cd.cardId.startsWith(cardSelector+"-"))
}

function getLearning(userId = null){
  let data = getData('learning', 1, 3)
    .map(rw => ({
      userId: rw[0],
      cardId:	rw[1],
      data:	robustJsonParse(rw[2])
    }))
  if(userId){
    return data.filter(el => (el.userId == userId))
  }
  return data;
}

function getLearning2(userId){
  let data = {};
  getData('learning', 1, 3)
    .map(rw => ({
      userId: rw[0],
      cardId:	rw[1],
      data:	robustJsonParse(rw[2])
    }))
    .filter(el => (el.userId == userId))
    .forEach(rw => data[rw.cardId] = rw.data)
  return data;
}


function getUsers(){
  let data = getData('users', 1, 4)
  return data.map(rw => ({
    userId: rw[0],
    name:	rw[1],
    email:	rw[2],
    token:	rw[3],
  }))
}

function getDocs(){
  let data = getData('docs', 1, 3)
  return data.map(rw => ({
    book: rw[0],
    sheetTitle:	rw[1],
    sheetId:	rw[2]
  }))
}

function test_getters(){
  console.log(getCards());
  console.log(getUsers());
  console.log(getDocs());
  console.log(getLearning());
  console.log(getLearning('v0001'));
  console.log(getLearning('m0002'));
  console.log(getLearning2('v0001'));

}

function test_getters2(){
  const cards = getNextCards('HPP-F60', 'v0001', 'learnNew', false);
  console.log(cards)
  console.log(cards.questions.length)
  console.log(cards.answers.length)
}

const NUMBER_CARDS_PER_SESSION = 30;
const NUMBER_ANSWERS = 100;
const TRESHOLD_NEW_VS_REPEAT = 7;
  
function getNextCards(cardSelector, userId, method, favouritesOnly){
  
  function getCardsAll(cards){
    const cardsInLearning = cards;
    return [...cardsInLearning,...newCards]
  }
  function diffHours( d1, d2) {
    return Math.abs((d2 - d1) / (1000 * 60 * 60)) 
  }

  function getCardsLearnNew(cards){
    // first use cards that have already been learned but have a low score; exclude recently learned cards
    // cards with highest score below TRESHOLD_NEW_VS_REPEAT are compeleted first
    const cardsInLearning = cards.filter(cd => ('score' in cd.learning && cd.learning.score < TRESHOLD_NEW_VS_REPEAT))
                                .filter(cd => diffHours(new Date(),new Date(cd.learning.lastEdited)) > 2)  // learned longer than 2h ago
                                .sort((cd1,cd2) => (cd2.learning.score - cd1.learning.score))   // sort descending
                                .slice(0,NUMBER_CARDS_PER_SESSION);
    const numberNewCards = NUMBER_CARDS_PER_SESSION - cardsInLearning.length;
    // fill up with cards that don't have an entry learning yet
    const newCards =  cards.filter(cd => !('score' in cd.learning)).slice(0,numberNewCards)   
    return [...cardsInLearning,...newCards]
  }

  function getCardsRepeat(cards){
    function repeatScore(learning){
      const daysPassed = (new Date() - new Date(learning.lastEdited)) / (1000*60*60*24)
      //console.log("DATE")
      //console.log(daysPassed)
      return learning.score / (daysPassed+(1+Math.random(0.3)))  // TODO? add exp. modifier?
    }
    return cards.filter(cd => ('score' in cd.learning && cd.learning.score >= TRESHOLD_NEW_VS_REPEAT))
                                .sort((cd1,cd2) => (repeatScore(cd2.learning) - repeatScore(cd1.learning)))   // sort descending
                                .slice(0,NUMBER_CARDS_PER_SESSION);
  
  }
  
  const learning = getLearning2(userId)
  //console.log (learning)
  const cards = getCards(cardSelector)
    .map(el => ({...el,...{learning:learning[el.cardId]||{}}}))
    .filter(el =>(!favouritesOnly) || el.learning.favourite)
  //console.log(cards)
  //console.log("getCardsRepeat(cards)")
  //console.log(getCardsRepeat(cards).length)
  //console.log(getCardsRepeat(cards))
  
  const answers = cards.map( cd => cd.answer).slice(0,NUMBER_ANSWERS)

  switch (method) {
    case 'list':
      return {questions: cards, answers: answers}
      break;
    case 'learnNew':
      return {questions: getCardsLearnNew(cards), answers: answers}
      break;
    case 'repeat':  
    default:
      return {questions: getCardsRepeat(cards), answers: answers}
  } 
}
