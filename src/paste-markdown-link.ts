import {insertText} from './text'

export function install(el: HTMLElement): void {
  el.addEventListener('paste', onPaste)
}

export function uninstall(el: HTMLElement): void {
  el.removeEventListener('paste', onPaste)
}

function onPaste(event: ClipboardEvent) {
  const transfer = event.clipboardData
  if (!transfer || !hasPlainText(transfer) || !hasHTMLText(transfer)) return

  const field = event.currentTarget
  if (!(field instanceof HTMLTextAreaElement)) return

  const text = transfer.getData('text/plain')
  if (!text) return

  if (isWithinSelection(field)) {
    if (!isURL(text)) return
    if (isWithinLink(field)) return

    const selectedText = field.value.substring(field.selectionStart, field.selectionEnd)
    if (!selectedText.length) return
    // Prevent linkification when replacing an URL
    // Trim whitespace in case whitespace is selected by mistake or by intention
    if (isURL(selectedText.trim())) return

    event.stopPropagation()
    event.preventDefault()

    insertText(field, linkifyOld(selectedText, text))
  } else {
    const html = transfer.getData('text/html')
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html')

    const a = doc.getElementsByTagName('a')
    const markdown = transform(a, text, linkify)

    if (markdown === text) return
    
    event.stopPropagation()
    event.preventDefault()

    insertText(field, markdown)
  }
}

function transform(elements: HTMLCollectionOf<HTMLElement>, text: string, transformer: any, ...args: any): string {
  let markdown = ''
  Array.from(elements).forEach((element: HTMLElement) => {
    const {part, index} = trimAfter(text, element.innerText)
    markdown += part.replace(element.innerText, transformer(element, args))
    text = text.slice(index)
  })
  markdown += text
  return markdown
}

function trimAfter(text: string, search: string): {part: string, index: number} {
  const index = text.indexOf(search) + search.length
  return { 
    part: text.substring(0, index),
    index
  }
}

function hasPlainText(transfer: DataTransfer): boolean {
  return Array.from(transfer.types).includes('text/plain')
}

function hasHTMLText(transfer: DataTransfer): boolean {
  return Array.from(transfer.types).includes('text/html')
}

function isWithinLink(textarea: HTMLTextAreaElement): boolean {
  const selectionStart = textarea.selectionStart || 0

  if (selectionStart > 1) {
    const previousChars = textarea.value.substring(selectionStart - 2, selectionStart)
    return previousChars === ']('
  } else {
    return false
  }
}

function isWithinSelection(textarea: HTMLTextAreaElement): boolean {
  return textarea.selectionStart !== textarea.selectionEnd
}

function linkifyOld(selectedText: string, text: string): string {
  return `[${selectedText}](${text})`
}

function linkify(element: HTMLAnchorElement): string {
  return `[${element.innerText}](${element.href})`
}

function isURL(url: string): boolean {
  return /^https?:\/\//i.test(url)
}
