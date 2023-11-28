const MAXROUNDS = 10;


interface Session {
    questions: Question[],
    answers: Answer[]
}

    
type MainState = 'CourseSelector' | 'LearnSession' | 'List'
type LearnMethod = 'repeat' | 'learnNew' 


type Answer = string []

interface Question {
    sheetId: string,
    cardId: string,
    question: string,
    alt_backward: string[],
    answer: Answer,
    options: Options,
    answeredInThisSession?: number,
    doneInThisSession?: boolean,
    learning?: Learning
}

interface Options {
    type: "SC" | "MC" | "SYN" | "GAP",
    mode?: string
}

interface Learning {
    lastEdited: any,
    score: number,
    errs?: number,
    fav?: boolean
}

interface Doc{
    book: String,
    docTitle: string,
    shortDocId: string
}



type AnswerLevel = 'WRONG' | 'ALMOST' | 'CORRECT'


interface tActiveComp extends Component {
    audio: any
}

interface cmpProps {
    nextStep:function, 
    audio?:any,
    selectedCourse?: string|null|function,
    setSelectedCourse?: function,
    key?:any
}