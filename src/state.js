
// sample state, gets overriden by loadState on page load
let state = {
    // used in /checklist.html
    curTableName: 'sample',
    checklists: {
        sample: [
            { id: 0, content: 'content', checked: false, heading: false },
        ],
    },

    // used in /my_checklists.html
    categories: [],
}


function saveState() {
    window.localStorage.setItem('state', JSON.stringify(state))
}

function loadState() {
    // const pageState = document.querySelector('#state')
    // if (pageState.innerText) {
    //     state = JSON.parse(pageState.innerText)
    //     finalisePage()
    // } else {
    state = JSON.parse(window.localStorage.getItem('state') || '{}')
    // }

    state.curTableName = state.curTableName || 'Sample Checklist'
    state.checklists = state.checklists || { [state.curTableName]: [] }
    state.categories = state.categories || ['Sample']
}