let editMode = false
let stateControlsShown = false
let maxRowId = 0
let selectedRow = null
let finalised = false

const NEW_CHECKLIST_OPTION = '+ New'
// const IMPORT_CHECKLIST_OPTION = '+ Import'

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
        let content, remarks, checked = false
        const isHeading = row.firstElementChild.tagName == 'TH'
        if (isHeading) {
            const [contentCell, deleteCell] = row.children
            decodeRowContent(contentCell)
            content = contentCell.innerText
            encodeRowContent(contentCell)
        } else {
            const [snCell, contentCell, remarksCell, checkboxCell, deleteCell] = row.children
            decodeRowContent(contentCell)
            content = contentCell.innerText
            encodeRowContent(contentCell)
            decodeRowContent(remarksCell)
            remarks = remarksCell.innerText
            encodeRowContent(remarksCell)
            checked = checkboxCell.firstElementChild.checked
        }
        checklist.push({
            id,
            content,
            remarks,
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
    const pageState = document.querySelector('#state')
    if (pageState.innerText) {
        state = JSON.parse(pageState.innerText)
        finalisePage()
    } else {
        state = JSON.parse(window.localStorage.getItem('state') || '{}')
    }

    state.curTableName = state.curTableName || 'Sample Checklist'
    state.checklists = state.checklists || { [state.curTableName]: [] }
}

function exportChecklist() {
    download(JSON.stringify({
        name: state.curTableName,
        checklist: state.checklists[state.curTableName],
    }, null, 2), `${state.curTableName.replace(/\s+/g, '_')}.json`, 'application/json')
}

function finalisePage() {
    finalised = true
    hideElement('#state-controls')
    if (editMode) toggleEditMode()
    hideElement('#state-controls')
    stateControlsShown = editMode = false
    // document.querySelector('#delete-checklist-btn').classList.add('hidden')
    document.querySelector('#finalise-btn').classList.add('hidden')
    document.querySelector('#state').innerText = JSON.stringify(state)
    rebuildAll()
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
        addNewRow(Object.assign(rowData, { save: false }))
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
    if (!finalised) {
        const newOption = document.createElement('option')
        newOption.value = newOption.innerText = NEW_CHECKLIST_OPTION
        dropdown.append(newOption)
    }

    // const importOption = document.createElement('option')
    // importOption.value = importOption.innerText = IMPORT_CHECKLIST_OPTION
    // dropdown.append(importOption)

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

function onImportClick() {
    hideElement('#import-checklist-btn')
    showElement('#import-checklist-box')
}

function onImportInputChange() {
    const fileInput = document.querySelector('#import-checklist')

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

        showElement('#import-checklist-btn')
        hideElement('#import-checklist-box')
    }
    for (const file of fileInput.files) {
        reader.readAsText(file)
    }
    fileInput.value = null

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

    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("sw.js")
    }
}

function onKeyDown(e) {
    console.log(e.ctrlKey, e.shiftKey, e.keyCode)
    if (!finalised && e.ctrlKey && e.key == 'd') { // Ctrl + D
        stateControlsShown = !stateControlsShown
        hideElement('#state-controls', !stateControlsShown)
        e.preventDefault()
    }
    if (stateControlsShown && e.ctrlKey && e.key == 'i') {
        if (e.shiftKey) {
            addNewRow({ heading: true, save: false })
        } else {
            addNewRow({ heading: false, save: false })
        }
        e.preventDefault()
    }
    if (stateControlsShown && e.ctrlKey && e.key == 'e') {
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
        // } else if (dropdown.value == IMPORT_CHECKLIST_OPTION) {
        //     importChecklist()
    } else {
        state.curTableName = dropdown.value
    }

    saveState()
    rebuildCurTable()
}
function onCheckboxClick() {
    saveCurTable()
}

function onContentDblClick(e) {
    const contentCell = e.target.closest("td, th")
    if (!editMode && !contentCell.classList.contains('editable')) return

    const finish = e2 => {
        const content = textarea.value
        contentCell.innerText = content
        encodeRowContent(contentCell)
        selectedRow = null
        saveCurTable()
    }
    const textarea = document.createElement('textarea')
    textarea.classList.add('w-full')
    decodeRowContent(contentCell)
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

function addNewRow({ content = null, remarks = '', id = null, checked = false, heading = false, save = true } = {}) {
    if (id === null) id = maxRowId++

    const prevRow = selectedRow || document.querySelector('#table-body').lastElementChild

    const row = document.querySelector(heading ? '#sample-heading' : '#sample-row').cloneNode(true)
    row.id = `checklist-item-${id}`

    let contentCell, deleteCell
    if (heading) {
        ([contentCell, deleteCell] = row.children)
    } else {
        let snCell, remarksCell, checkboxCell
        ([snCell, contentCell, remarksCell, checkboxCell, deleteCell] = row.children)

        if (prevRow.children.length == 2) {
            snCell.innerText = 1
        } else {
            snCell.innerText = +prevRow.firstElementChild.innerText + 1
        }
        remarksCell.innerText = remarks
        encodeRowContent(remarksCell)
        checkboxCell.firstElementChild.checked = checked
        checkboxCell.addEventListener('click', onCheckboxClick)
    }

    contentCell.innerText = content || document.querySelector('#content').value
    encodeRowContent(contentCell)
    // contentCell.addEventListener('dblclick', )
    if (editMode) showElement(deleteCell)
    showElement(row)

    prevRow.after(row)

    if (!content) document.querySelector('#content').value = ''
    if (save) saveCurTable()
}

function encodeRowContent(row) {
    row.innerHTML = row.innerHTML
        .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
        .replace(/__(.+?)__/g, '<u>$1</u>')
}

function decodeRowContent(row) {
    row.innerHTML = row.innerHTML
        .replace(/<b>(.+?)<\/b>/g, '**$1**')
        .replace(/<u>(.+?)<\/u>/g, '__$1__')
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
(() => {
    const download = (blob, filename, type) => {
        const a = document.createElement("a")
        const file = new Blob([blob], { type })
        a.href = URL.createObjectURL(file)
        a.download = filename
        document.body.append(a)
        a.click()
        a.remove()
    }
    const table = document.querySelector('#mytable')
    const checklist = []
    let maxRowId = 0
    for (const tbody of table.children) {
        for (const row of tbody.children) {
            const isHeading = row.children.length == 2
            if (isHeading) {
                const [contentCell, deleteCell] = row.children
                checklist.push({
                    id: maxRowId++,
                    content: contentCell.innerText,
                    heading: true,
                })
            } else {
                const [snCell, contentCell, checkboxCell, deleteCell] = row.children
                checklist.push({
                    id: maxRowId++,
                    content: contentCell.innerText,
                    checked: false,
                    heading: false,
                })

            }
        }
    }
    download(JSON.stringify({ checklist: checklist.slice(1) }, null, 2), 'checklist.json', 'application/json')
})