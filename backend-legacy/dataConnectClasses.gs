function testData (){
  const compare = ['userId','id']
  let dt = new Data('learning', ['userId', 'id', 'data'],compare)
  console.log(dt.data)
  console.log(dt.dataDct)

  const updts = [ 
                     { userId: 'v0001',
                     id: 'HPP-F60-1694290961227',
                     data: '{"lastEdited":"","score":"4"}' } ,
                     { userId: 'm0001',
                     id: 'HPP-F60-1694287373659',
                     data: '{"lastEdited":"","score":"4"}' }, 
                     { userId: 'm001',
                     id: 'HPP-F60-1694287XXXXX',
                     data: '{"lastEdited":"","score":"4"}' }  ]
  
  dt.udpateOrAdd(updts)


}

function testData2 (){
  const updts = [ 
                     { userId: 'v0001',
                     id: 'HPP-F61-1694290961227',
                     data: '{"lastEdited":"","score":"4"}' } ,
                     { userId: 'm0001',
                     id: 'HPP-F61-1694287373659',
                     data: '{"lastEdited":"","score":"5"}' }, 
                     { userId: 'm001',
                     id: 'HPP-F61-1694287XXXXX',
                     data: '{"lastEdited":"","score":"6"}' }  ]
 
  let dt = new Learnings()
  dt.udpateOrAdd(updts)


}

function test_123123(){
  const arr = new Array(5).fill(0)
  const arr2 = arr.map((x,i) => i)
  console.log(arr2)
}

class Data{
  constructor(sheetname, headers, compare){

    function camalize(str) {
      return str.toString().toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
    } 

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    this.sheet = spreadsheet.getSheetByName(sheetname);
    
    const dataRange = this.sheet.getDataRange()
    const headerRange = this.sheet.getRange(1,1,1,dataRange.getNumColumns())
    const headersOnSheetCamelized = headerRange.getValues()[0].map(el => camalize(el.trim()))
    this.headers = Object.fromEntries(headers.map(h => [h, headersOnSheetCamelized.indexOf(h)]))
    // e.g. { userId: 0, id: 1, data: 2 }
    this.headerInv = Object.fromEntries(Object.entries(this.headers).map(a => a.reverse()))
    // e.g. { '0': 'userId', '1': 'id', '2': 'data' }
    this.compare=compare
  }
  get data(){
    return this.sheet.getDataRange().getValues()
    .slice(1)                                  // remove header row
    .filter(rw => rw.join("").trim() !== "");  // filter emtpy rows
  }
  get dataDct(){
    console.log(this.headers)
    return this.data.map(rw => Object.fromEntries(rw.map((el,idx) => [this.headerInv[idx], el] )))

  }

  udpateOrAdd (updts){
    const data = this.sheet.getDataRange().getValues()
    const numCols = data[0].length;
    console.log("0")
    console.log(this.headers)
    const compareIdx = this.compare.map( c => (c in this.headers ? this.headers[c] : null) )
 
    console.log(compareIdx)
    const dummyArr = new Array(numCols).fill(0).map((_,i)=>i.toString()) // ['0','1','2',...]

    const updtsArr = updts.map( u => dummyArr.map(i => u[this.headerInv[i]]))
    console.log("1")
    console.log(updtsArr)
    
    const dataRange = this.sheet.getDataRange()



    // combine relevant columns for comparison in single string, so they can be compared in one loop
    const dataKeys = data.map(rw => compareIdx.map(i => rw[i]).join('@@'))
    console.log(dataKeys)
    const updtsKeys = updtsArr.map(rw => compareIdx.map(i => rw[i]).join('@@'))
    LogSheet.log("update existing learnings")
    LogSheet.log(updtsKeys)
    console.log("2")

    let adds = []
    updtsKeys.forEach((u,uIdx) => {
      let found = false;    
      dataKeys.forEach((d,dIdx) => {
        if (d == u){
          const changeRange = this.sheet.getRange((dIdx+1),1,1,numCols); // +1 because of header row
          console.log(updtsArr[uIdx])
          changeRange.setValues([updtsArr[uIdx]])
          found = true;
        } 
      })
      if (!found){ 
        adds.push(updtsArr[uIdx])
      }
    })
    this.add (adds)
  }
 
  add (adds){
    LogSheet.log("write new learnings")
    LogSheet.log(adds)
    const data = this.sheet.getDataRange().getValues()
    const numCols = data[0].length;
    const startRow = data.length + 1;
    const newDataRange = this.sheet.getRange(startRow,1,adds.length,numCols)
    newDataRange.setValues(adds)
  }

  
}

// ===================

class LsDocs extends Data {
  constructor(){
    const sheetname = 'docs'
    const headers = ['book', 'docTitle', 'googleDocId', 'shortDocId']
    const compare = ['shortDocId']
    super(sheetname, headers,  compare)
  }
}


class Learnings extends Data {
  constructor(){
    const sheetname = 'learning'
    const headers = ['userId', 'id', 'data']
    const compare = ['userId','id']
    super(sheetname, headers,  compare)
  }
}

// ===================

//sconst headers = ['sheetId', 'cardId', 'question', 'answers', 'options','lastEdited']

class DateFormatter extends Date {
  getFormattedDate() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${this.getDate()}-${months[this.getMonth()]}-${this.getFullYear()}`;
  }
}

