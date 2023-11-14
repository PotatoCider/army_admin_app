let editMode = false
let stateControlsShown = false
let maxRowId = 0;
let selectedRow = null

const NEW_CHECKLIST_OPTION = '+ New'
const IMPORT_CHECKLIST_OPTION = '+ Import'

// class Table {
//     constructor({ curTableName = 'New Table 1', checklists = [] }) {
//         this.curTableName = curTableName
//         this.checklists = checklists
//     }

//     save() {
//         saveCurTable()
//     }


// }

class ChecklistItem {
    constructor({ id = null, content = null, checked = false, heading = false, save = true }) {
        // const maxRowId = state.checklists[state.curTableName].
        this.id = id || maxRowId++
        this.content = content || document.querySelector('#content').value
        this.checked = checked
        this.heading = heading
        this.save(true)
    }

    add() {
    }

    save(push = false) {
        const checklist = state.checklists[state.curTableName]
        if (push) {
            checklist.push(this)
        } else {
            const index = checklist.map(r => r.id).indexOf(this.id)
            checklist[index] = this
        }
    }

    update() {
        const prevRow = document.querySelector('#table-body').lastElementChild

        const row = document.querySelector(heading ? '#sample-heading' : '#sample-row').cloneNode(true)
        row.id = `checklist-item-${id}`

        let contentCell, deleteCell
        if (heading) {
            ([contentCell, deleteCell] = row.children)
        } else {
            let snCell, checkboxCell
            ([snCell, contentCell, checkboxCell, deleteCell] = row.children)

            if (prevRow.children.length == 4) {
                snCell.innerText = +prevRow.firstElementChild.innerText + 1
            } else {
                snCell.innerText = 1
            }
            checkboxCell.firstElementChild.checked = checked
            checkboxCell.addEventListener('click', onCheckboxClick)
        }

        contentCell.innerText = content || document.querySelector('#content').value
        contentCell.addEventListener('dblclick', this.onDblClick.bind(this))
        if (editMode) showElement(deleteCell)
        showElement(row)

        prevRow.after(row)

        if (!content) document.querySelector('#content').value = ''
        if (save) saveCurTable()
    }

    onDblClick() {
        if (!editMode) return

        const finish = e2 => {
            const content = textarea.value
            contentCell.innerText = content
            selectedRow = null
            saveCurTable()
        }
        const contentCell = e.target
        const textarea = document.createElement('textarea')
        textarea.classList.add('w-full')
        textarea.value = contentCell.innerText
        contentCell.innerText = ''
        contentCell.append(textarea)
        textarea.style.height = 'auto'
        textarea.style.height = textarea.scrollHeight + 'px'
        const match = contentCell.parentElement.id.match(/checklist-item-(\d+)/)
        if (match) {
            selectedRow = contentCell.parentElement
        }
        textarea.focus()
        textarea.addEventListener('blur', finish)
    }
}

let state = {
    curTableName: 'sample', checklists: {
        sample: [
            { id: 0, content: 'content', checked: false, heading: false },
        ],
    }
}

function saveCurTable() {
    const children = document.querySelector('#table-body').children
    const checklist = []
    for (const row of children) {
        const match = row.id.match(/checklist-item-(\d+)/)
        if (!match) continue
        const id = match[1]
        let content, checked = false
        const isHeading = row.firstElementChild.tagName == 'TH'
        if (isHeading) {
            const [contentCell, deleteCell] = row.children
            content = contentCell.innerText
        } else {
            const [snCell, contentCell, checkboxCell, deleteCell] = row.children
            content = contentCell.innerText
            checked = checkboxCell.firstElementChild.checked
        }
        checklist.push({
            id,
            content,
            checked,
            heading: isHeading,
        })
    }
    const prevTableName = state.curTableName
    state.curTableName = document.querySelector('#table-name-cell').innerText
    state.checklists[state.curTableName] = checklist

    if (prevTableName !== state.curTableName) {
        delete state.checklists[prevTableName]
        document.querySelector('#checklists-dropdown').value = state.curTableName
        rebuildDropdown()
    }

    saveState()
}

function saveState() {
    window.localStorage.setItem('state', JSON.stringify(state))
}

function loadState() {
    state = JSON.parse(window.localStorage.getItem('state') || '{}')

    state.curTableName = state.curTableName || 'Sample Checklist'
    state.checklists = state.checklists || { [state.curTableName]: [] }
}

function exportChecklist() {
    download(JSON.stringify({
        name: state.curTableName,
        checklist: state.checklists[state.curTableName],
    }, null, 2), `${state.curTableName.replace(/\s+/g, '_')}.json`, 'application/json')
}

function showImportChecklist() {
    showElement('#file-input-box')
    hideElement('#import-checklist-btn')
}

function rebuildAll() {
    rebuildCurTable()
    rebuildDropdown()
}

function rebuildCurTable() {
    const prevScrollX = window.scrollX, prevScrollY = window.scrollY
    deleteAllRows(false)
    const checklist = state.checklists[state.curTableName] || []
    for (const rowData of checklist) {
        const { id, content, checked, heading } = rowData
        if (heading) {
            addNewRow({ content, id, heading: true, save: false })
        } else {
            addNewRow({ content, id, checked, save: false })
        }
    }
    maxRowId = checklist.map(data => data.id).reduce((max, id) => id > max ? +id : max, 0) + 1
    document.querySelector('#table-name-cell').innerText = state.curTableName
    window.scroll(prevScrollX, prevScrollY)
}

function rebuildDropdown() {
    const dropdown = document.querySelector('#checklists-dropdown')
    dropdown.innerHTML = ''
    for (const name in state.checklists) {
        const option = document.createElement('option')
        option.value = option.innerText = name
        dropdown.append(option)
    }

    const newOption = document.createElement('option')
    newOption.value = newOption.innerText = NEW_CHECKLIST_OPTION
    dropdown.append(newOption)

    const importOption = document.createElement('option')
    importOption.value = importOption.innerText = IMPORT_CHECKLIST_OPTION
    dropdown.append(importOption)

    dropdown.value = state.curTableName
}

function deleteChecklist() {
    delete state.checklists[state.curTableName]
    const tableNames = Object.keys(state.checklists)
    if (tableNames.length == 0) {
        addNewChecklist()
        return
    }
    state.curTableName = tableNames[0]
    saveState()
    rebuildAll()
}

function addNewChecklist() {
    let i = 1
    while (`New Table ${i}` in state.checklists) i++
    state.curTableName = `New Table ${i}`
    state.checklists[state.curTableName] = []
    saveState()
    rebuildAll()
}

function importChecklist() {
    const fileInput = document.querySelector('#file-input')
    fileInput.click()
    fileInput.onchange = () => {
        if (!fileInput.value) {
            rebuildDropdown()
            return
        }
        const reader = new FileReader()
        reader.onload = e => {
            const data = JSON.parse(e.target.result)
            state.checklists[data.name] = data.checklist
            state.curTableName = data.name
            rebuildAll()
            saveCurTable()
        }
        for (const file of fileInput.files) {
            reader.readAsText(file)
        }
        fileInput.value = null
    }
}

function deleteAllRows(save = false) {
    const tableBody = document.querySelector('#table-body')
    const sampleRow = document.querySelector('#sample-row')
    const sampleHeading = document.querySelector('#sample-heading')
    tableBody.replaceChildren(sampleRow, sampleHeading)
    if (save) {
        saveCurTable()
    }
}

function deleteRow(row) {
    // get parent row
    while (row.tagName != 'TR' && row.tagName != 'TH') { row = row.parentElement }
    const id = row.id.match(/checklist-item-(\d+)/)[1]
    const checklist = state.checklists[state.curTableName]
    const index = checklist.map(d => d.id).indexOf(id)
    checklist.splice(index, 1)
    rebuildCurTable()
    saveCurTable()
}

// Event Handlers

function onPageLoad() {
    loadState()
    rebuildAll()
}

function onKeyDown(e) {
    console.log(e.ctrlKey, e.shiftKey, e.keyCode)
    if (e.ctrlKey && e.keyCode == 68) { // Ctrl + D
        stateControlsShown = !stateControlsShown
        hideElement('#state-controls', !stateControlsShown)
        e.preventDefault()
    }
    if (stateControlsShown && e.ctrlKey && e.keyCode == 61) {
        if (e.shiftKey) {
            addNewRow({ heading: true })
        } else {
            addNewRow({ heading: false })
        }
        e.preventDefault()
    }
    if (stateControlsShown && e.ctrlKey && e.keyCode == 69) {
        toggleEditMode()
        e.preventDefault()
    }
    if (e.keyCode == 27) {
        document.activeElement.blur()
    }
}

function onDropdownChange() {
    const dropdown = document.querySelector('#checklists-dropdown')
    if (dropdown.value == NEW_CHECKLIST_OPTION) {
        addNewChecklist()
    } else if (dropdown.value == IMPORT_CHECKLIST_OPTION) {
        importChecklist()
    } else {
        state.curTableName = dropdown.value
    }

    saveState()
    rebuildCurTable()
}
function onCheckboxClick() {
    saveCurTable()
}

document.addEventListener("DOMContentLoaded", onPageLoad)
document.onkeydown = onKeyDown

function toggleEditMode() {
    editMode = !editMode
    const deleteButtons = document.querySelectorAll('.delete-btn')
    for (const deleteCell of deleteButtons) {
        hideElement(deleteCell, !editMode)
    }
    hideElement('#delete-heading', !editMode)

    document.querySelector('#edit-mode-btn').innerText = `Edit Mode ${editMode ? 'On' : 'Off'}`
}

function addNewRow({ content = null, id = null, checked = false, heading = false, save = true } = {}) {
    if (id === null) id = maxRowId++

    const prevRow = selectedRow || document.querySelector('#table-body').lastElementChild

    const row = document.querySelector(heading ? '#sample-heading' : '#sample-row').cloneNode(true)
    row.id = `checklist-item-${id}`

    let contentCell, deleteCell
    if (heading) {
        ([contentCell, deleteCell] = row.children)
    } else {
        let snCell, checkboxCell
        ([snCell, contentCell, checkboxCell, deleteCell] = row.children)

        if (prevRow.children.length == 4) {
            snCell.innerText = +prevRow.firstElementChild.innerText + 1
        } else {
            snCell.innerText = 1
        }
        checkboxCell.firstElementChild.checked = checked
        checkboxCell.addEventListener('click', onCheckboxClick)
    }

    contentCell.innerText = content || document.querySelector('#content').value
    contentCell.addEventListener('dblclick', onContentDblClick)
    if (editMode) showElement(deleteCell)
    showElement(row)

    prevRow.after(row)

    if (!content) document.querySelector('#content').value = ''
    if (save) saveCurTable()
}

// Utils

function hideElement(element, hide = true) {
    if (typeof element == 'string') element = document.querySelector(element)
    if (hide) {
        element.classList.add('hidden')
    } else {
        element.classList.remove('hidden')
    }
}

function showElement(element) { return hideElement(element, false) }

function download(blob, filename, type) {
    const a = document.createElement("a")
    const file = new Blob([blob], { type })
    a.href = URL.createObjectURL(file)
    a.download = filename
    document.body.append(a)
    a.click()
    a.remove()
}

// extract data from old format to JSON
// (() => {
//     const download = (blob, filename, type) => {
//         const a = document.createElement("a")
//         const file = new Blob([blob], { type })
//         a.href = URL.createObjectURL(file)
//         a.download = filename
//         document.body.append(a)
//         a.click()
//         a.remove()
//     }
//     const table = document.querySelector('#mytable')
//     const checklist = []
//     let maxRowId = 0
//     for (const tbody of table.children) {
//         for (const row of tbody.children) {
//             const isHeading = row.children.length == 2
//             if (isHeading) {
//                 const [contentCell, deleteCell] = row.children
//                 checklist.push({
//                     id: maxRowId++,
//                     content: contentCell.innerText,
//                     heading: true,
//                 })
//             } else {
//                 const [snCell, contentCell, checkboxCell, deleteCell] = row.children
//                 checklist.push({
//                     id: maxRowId++,
//                     content: contentCell.innerText,
//                     checked: false,
//                     heading: false,
//                 })

//             }
//         }
//     }
//     download(JSON.stringify({ checklist: checklist.slice(1) }, null, 2), 'checklist.json', 'application/json')
// })