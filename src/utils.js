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