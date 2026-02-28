const TestType = {
  SHOW:0,
  MULTIPLECARDS:2,
  MULTIPLEANSWERS:4,
  SORTPARTS:6,
  SELFASSES:8,
  TYPE:10,
  ALIKES:12,
  MULTIPLECARDS_BW:14,
  SORTPARTS_BW:16,
  SELFASSES_BW:18,
  TYPE_BW:20,
  properties: {
     0: {name: "SHOW", value: 0, minScore:0}, 
     2: {name: "MULTIPLECARDS", value: 2, minScore:5}, 
     4: {name: "MULTIPLEANSWERS", value: 4, minScore:6},
     6: {name: "SORTPARTS", value: 6, minScore:6},
     8: {name: "SELFASSES", value: 8, minScore:6},
     10: {name: "TYPE", value: 10, minScore:9},
     22: {name: "ALIKES", value: 12, minScore:10},
     14: {name: "MULTIPLECARDS_BW", value: 14, minScore:9}, 
     16: {name: "SORTPARTS_BW", value: 16, minScore:10}, 
     18: {name: "SELFASSES_BW", value: 18, minScore:10},
     20: {name: "TYPE_BW", value: 20, minScore:11}
  }
}

const ErrorType = {
  NONE:0,
  MC_WRONG : 1,
  TYPING_MISSPELLED : 2,
  TYPING_WRONG : 3,    
  properties: {
    0: {name: "NONE", value: 0, scoreChange:+1}, 
     1: {name: "MC_WRONG", value: 1, scoreChange:-2}, 
     2: {name: "TYPING_MISSPELLED", value: 2, scoreChange:-1},
     3: {name: "TYPING_WRONG", value: 3, scoreChange:-2}
  },
}   