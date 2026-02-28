/**
 * @module: LogSheet
 * logs on a sheet 'logSheet' 
 * takes single value or array
 * inserts the sheet if necessary
 * usage:  LogSheet.log("Hello World!")
 */

  (function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.LogSheet = {}));
}(this, (function (exports) { 
    
  'use strict';
  const SheetNameForLogs = 'logSheet';

  function log(logMsg){
    
    var userName =  Session.getActiveUser().getEmail();
    var dateandtime =  Utilities.formatDate(new Date(), "Europe/Berlin", "dd.MM.yyyy HH:mm:ss");
    
    // get the logSheet
    var logSheet 
    if (SpreadsheetApp.getActive().getSheetByName(SheetNameForLogs) === null){
        // logSheet does not exist, enter a new sheet at last position
        logSheet = SpreadsheetApp.getActive().insertSheet(
          SheetNameForLogs,
          SpreadsheetApp.getActive().getSheets().length
        );
    } else{
        // logSheet does exist
        logSheet = SpreadsheetApp.getActive().getSheetByName(SheetNameForLogs)
    }
    
    // remove first 100 lines when log longer than 2000 lines
    if (logSheet.getLastRow() > 2000){
      logSheet.deleteRows(1, 100);
    }
    // write log entry in first empty row on sheet
    if (typeof logMsg == 'string' ){
      logSheet.getRange(logSheet.getLastRow()+1,1,1,3).setValues([[dateandtime,userName,logMsg]]); 
    } else if (logMsg.constructor == Array){
        var data = [dateandtime,userName].concat(logMsg);
        logSheet.getRange(logSheet.getLastRow()+1,1,1,data.length).setValues([data]); 
    } else if(logMsg.constructor == Object){
      try{
        logSheet.getRange(logSheet.getLastRow()+1,1,1,3).setValues([[dateandtime,userName,JSON.stringify(logMsg)]]); 
      }catch{

      }
    }
  }
  exports.log = log;

  Object.defineProperty(exports, '__esModule', { value: true });

})));

function test_LogSheet(){
  LogSheet.log("Hello")
}
