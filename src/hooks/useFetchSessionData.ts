function useFetchSessionData(): Session {
    return {
        questions: [
            {
                sheetId: '',
                cardId: '',
                question: 'Antacida',
                alt_backward: ['Antazidum', 'Antazida'],
                answer: ['Arzneimittel zur Neutralisierung von Magensäure'],
                options: {type:'SC'}
            },
            {
                sheetId: '',
                cardId: '',
                question: 'Analgetika',
                alt_backward: ['Analgetikum'],
                answer: ['Schmerzmittel'],
                options: {type:'SC'}
            },
            {
                sheetId: '',
                cardId: '',
                question: 'Laxantien',
                alt_backward: ['Laxans', 'Laxantium', 'Laxativum', 'Laxativa'],
                answer: ['Abführmittel'],
                options: {type:'SC'}
            }

        ],
        answers: [['Arzneimittel zur Neutralisierung von Magensäure'],
        ['Schmerzmittel'],
        ['Abführmittel'],
        ['Nahrungsergänzungsmittel'],
        ['Steroide']
        ]
    }
}

export default useFetchSessionData;