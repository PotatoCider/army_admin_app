let isCtrlPressed = false
let stateControlsShown = false
let selectedCategory = null

document.addEventListener("DOMContentLoaded", function () {
    loadState()
    rebuildList()

    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("sw.js")
    }
})

document.addEventListener("keydown", function (e) {
    console.log(e.ctrlKey, e.shiftKey, e.key)
    isCtrlPressed = e.ctrlKey
    if (e.ctrlKey && e.key == 'e') {
        toggleEditMode()
        e.preventDefault()
    }
    if (editMode && e.ctrlKey && e.key == 'i') {
        addCategoryRow({ save: true })
        e.preventDefault()
    }
    if (e.key == 'Escape') {
        document.activeElement.blur()
    }
})

function editElement(element) {
    if (!editMode && !element.classList.contains('editable')) return

    const finish = e2 => {
        const content = textarea.value
        element.innerText = content
        selectedCategory = null
        if (!content.trim()) element.parentElement.remove()
        saveCurCategories()
    }
    const textarea = document.createElement('textarea')
    textarea.value = element.innerText
    element.innerText = ''
    element.append(textarea)
    textarea.style.height = 'auto'
    textarea.style.height = textarea.scrollHeight + 'px'
    textarea.focus()
    selectedCategory = element.closest('.category-div')
    textarea.addEventListener('blur', finish)
}

function rebuildList() {
    const sampleCategory = document.querySelector('#sample-category')
    const categoryList = document.querySelector('#category-list')
    categoryList.replaceChildren(sampleCategory)
    for (let i = 0; i < state.categories.length; i++) {
        const name = state.categories[i]
        addCategoryRow({ name, save: false })
    }
}

function addCategoryRow({ name = 'Sample', save } = {}) {
    const newCategory = document.querySelector('#sample-category').cloneNode(true)
    const link = newCategory.firstElementChild

    const prevElement = selectedCategory || document.querySelector('#category-list').lastElementChild

    newCategory.removeAttribute('id')
    link.innerText = name
    link.href = editMode ? '#' : `checklist.html?q=${name.toLowerCase()}`
    link.addEventListener('dblclick', e => editElement(e.target))

    prevElement.after(newCategory)

    showElement(newCategory)

    if (save) saveCurCategories()
}

function saveCurCategories() {
    const categoryList = document.querySelector('#category-list')
    state.categories = []
    for (const category of categoryList.children) {
        if (category.id === 'sample-category') continue
        state.categories.push(category.innerText)
    }
    saveState()
}

let editMode = false
function toggleEditMode() {
    editMode = !editMode
    // document.querySelector('#edit-mode-btn').innerText = `Edit Mode ${editMode ? 'On' : 'Off'}`

    hideElement('#state-controls', !editMode)
    const links = document.querySelectorAll('.category-link')
    for (const link of links) {
        link.href = editMode ? '#' : `checklist.html?q=${link.innerHTML}`
    }
}

function exportAll() {
    download(JSON.stringify(state, null, 2), `all_checklists.json`, 'application/json')
}

function onImportAllClick() {
    hideElement('#import-all-btn')
    showElement('#import-all-input')
}

function onImportAllChange() {
    const fileInput = document.querySelector('#import-all-input')

    if (!fileInput.value) {
        showElement('#import-all-btn')
        hideElement('#import-all-input')
        return
    }
    const reader = new FileReader()
    reader.onload = e => {
        const ok = confirm('This will override everything. Have you made a backup? Are you sure?')
        if (!ok) return
        state = JSON.parse(e.target.result)
        saveState()
        rebuildList()

        showElement('#import-all-btn')
        hideElement('#import-all-input')
    }
    for (const file of fileInput.files) {
        reader.readAsText(file)
    }
    fileInput.value = null
}