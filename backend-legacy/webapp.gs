
const userdata = {
  'Slfglkas6h3489srrlzh58KJDFTDssdfHJNFAHF': {'name': 'Volker', email: 'volker@volker.de', id: 'v0001'},
  '7t4dskfgh9etsdfghwe9t5eshgset59sgihs949': {'name': 'Maria', email: 'maria@maria.de', id: 'm0001'}
}
// token length 39 chars
//todo: get userdata from table users

function doPost(request){
  
  var jsonString = request.postData.getDataAsString();
  LogSheet.log(jsonString)
  try {
        var jsonData =  JSON.parse(jsonString);
    } catch (e) {
        return ContentService.createTextOutput('doPost: JSON not valid: ' + jsonString );
    }
  LogSheet.log(jsonData)
  
  if('dataType' in jsonData && 
     'token' in jsonData ){
      LogSheet.log(">1")
    if (jsonData.token in userdata){
      const user = userdata[jsonData.token]
      LogSheet.log (user)


      LogSheet.log(">2")
      if (jsonData.dataType == 'user'){
        LogSheet.log("GET USERDATA")
        return ContentService.createTextOutput(JSON.stringify(user) ).setMimeType(ContentService.MimeType.JSON);
 

      } else if (jsonData.dataType == 'docs'){
        LogSheet.log("GET DOCS")
        const docs = new LsDocs()
        content = docs.dataDct.map(el => ({'book': el.book, 'docTitle': el.docTitle, 'shortDocId': el.shortDocId}))
        LogSheet.log(content)
        return ContentService.createTextOutput(JSON.stringify(content) ).setMimeType(ContentService.MimeType.JSON);
      
      } else if ((jsonData.dataType == 'nextCards') && ('cardSelector' in jsonData)){
        LogSheet.log("GET NEXTCARDS")
        const method = ('method' in jsonData)? jsonData.method : "learnNew";
        const favouritesOnly = ('favouritesOnly' in jsonData)? (String( jsonData.favouritesOnly).toLowerCase() == 'true') : false;
        const content = getNextCards(jsonData.cardSelector, user.id, method, favouritesOnly);  
        //LogSheet.log("content")
        //LogSheet.log(content)
        return ContentService.createTextOutput(JSON.stringify(content) ).setMimeType(ContentService.MimeType.JSON);
      
      } else if ((jsonData.dataType == 'learnings') && ('learnings' in jsonData)){
        LogSheet.log("WRITE LEARNINGS")
        LogSheet.log(">3")  
        try{
          LogSheet.log(">4")  
          const learningsArr = jsonData.learnings.map(l => ({userId: user.id, id: l.cardId, data: JSON.stringify(l.learning)}))
          let dt = new Learnings()
          dt.udpateOrAdd(learningsArr)
        }
        catch(e){
          LogSheet.log(e)  
        }
        LogSheet.log(">6")  

      }
    }
  LogSheet.log(">7")
  
  }
  LogSheet.log(">8")
  return ContentService.createTextOutput('doPost: could not find cardSelector: ' + jsonData.cardSelector ); 
};

// *******************************
// tests

function test_doPost_nextCards(){
  
  const jsondata = JSON.stringify({
            "dataType": "nextCards",
            "token": "adfjkl6h3489pdfghsrrlzh58eotzhwels8ps5o",
            "cardSelector": "HPP-F60"
        }
  )
   
  const request = {
    postData: {
      getDataAsString: ()=> jsondata
    }
  }
  console.log( doPost(request))
}

function test_doPost_nextCardsAll(){
  
  const jsondata = JSON.stringify({
            "dataType": "nextCards",
            "token": "adfjkl6h3489pdfghsrrlzh58eotzhwels8ps5o",
            "cardSelector": "HPP-F60",
            "method":"list",
            "favouritesOnly": "true"
        }
  )
   
  const request = {
    postData: {
      getDataAsString: ()=> jsondata
    }
  }
  console.log( doPost(request))
}


function test_doPost_nextCardsRepeat(){
  
  const jsondata = JSON.stringify({
            "dataType": "nextCards",
            "token": "adfjkl6h3489pdfghsrrlzh58eotzhwels8ps5o",
            "cardSelector": "HPP-F60",
            "method":"repeat",
            "favouritesOnly": "true"
        }
  )
   
  const request = {
    postData: {
      getDataAsString: ()=> jsondata
    }
  }
  console.log( doPost(request))
}


function test_doPost_userdata(){
  
  const jsondata = JSON.stringify({
            "dataType": "user",
            "email":"volker@volker.de",
            "token": "adfjkl6h3489pdfghsrrlzh58eotzhwels8ps5o"
        }
  )
   
  const request = {
    postData: {
      getDataAsString: ()=> jsondata
    }
  }
  console.log( doPost(request).getContent())
}


function test_doPost_docs(){
  
  const jsondata = JSON.stringify({
            "dataType": "docs",
            "token": "adfjkl6h3489pdfghsrrlzh58eotzhwels8ps5o"
        }
  )
   
  const request = {
    postData: {
      getDataAsString: ()=> jsondata
    }
  }
  console.log( doPost(request).getContent())
}


function test_doPost_learnings(){
  
  const jsondata = JSON.stringify({
            "dataType": "learnings",
            "token": "7t4dskfgh9etsdfghwe9t5eshgset59sgihs949",
            "learnings" : [
                  {
                      "cardId": "HPP-F60-1694287373659",
                      "learning": {
                          "score": 5,
                          "lastEdited": "Wed Sep 13 2023 05:01:55 GMT+0200"
                      }
                  },
                  {
                      "cardId": "HPP-F60-1694290961227",
                      "learning": {
                          "score": 6,
                          "lastEdited": "Wed Sep 13 2023 05:01:56 GMT+0200"
                      }
                  }
              ]
        }
  )
   
  const request = {
    postData: {
      getDataAsString: ()=> jsondata
    }
  }
  console.log( doPost(request))
}