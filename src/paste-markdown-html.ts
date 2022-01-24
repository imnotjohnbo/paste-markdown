import {insertText} from './text'

export function install(el: HTMLElement): void {
  el.addEventListener('paste', onPaste)
}

export function uninstall(el: HTMLElement): void {
  el.removeEventListener('paste', onPaste)
}

function onPaste(event: ClipboardEvent) {
  const transfer = event.clipboardData
  if (!transfer || !hasHTML(transfer)) return

  const field = event.currentTarget
  if (!(field instanceof HTMLTextAreaElement)) return
  if (isSelection(field)) return

  let text = transfer.getData('text/plain')
  const textHTML = transfer.getData('text/html')
  if (!textHTML) return
  if (!text) return

  text = text.trim()

  event.stopPropagation()
  event.preventDefault()

  const parser = new DOMParser()
  const doc = parser.parseFromString(textHTML, 'text/html')

  // TODO: fix hr, which has no innerText
  // The problem is transform replaces the innerText of the element,
  // but hr has no innerText.
  // A solution might be to get the innerText of the next sibling, or previous
  // sibling, and use that as the replacement.
  const hr = doc.getElementsByTagName('hr')
  let markdown = transformHr(hr, text, hrify)

  const a = doc.getElementsByTagName('a')
  markdown = transform(a, markdown, linkify)

  const levels = ['1', '2', '3', '4', '5', '6']
  levels.forEach((level: string) => {
    const headers = doc.getElementsByTagName('h' + level) as HTMLCollectionOf<HTMLElement>
    markdown = transform(headers, markdown, headerify, level)
  });

  const bold = doc.getElementsByTagName('strong')
  markdown = transform(bold, markdown, boldify)

  const italics = doc.getElementsByTagName('em')
  markdown = transform(italics, markdown, italify)

  // Ordered Lists (<ol>, <li)
  // Unordered Lists (<ul>, <li>)
  // Task lists (<ul>, <li>)
  // Summary details 
  // Blockquotes (<blockquote>)
  let blockquote = doc.getElementsByTagName('blockquote')
  // remove all newlines in blockquotes
  Array.from(blockquote).forEach(b => {
    b.innerText = b.innerText.replace(/\n/g, ' ').trim()
  })
  markdown = transform(blockquote, markdown, blockquotify)

  let code = doc.getElementsByTagName('code')
  code = Array.from(code).filter(c => c.parentElement?.tagName !== 'PRE') as any
  markdown = transform(code, markdown, codify)

  const pre = doc.querySelectorAll('pre>code')
  markdown = transform(pre as any, markdown, preify)

  // Do not insert if no transforms have been made
  markdown !== text && insertText(field, markdown)
}

function transformHr(element: HTMLCollectionOf<HTMLElement>, text: string, transformer: any, ...args: any): string {
  let markdown = ''
  Array.from(element).forEach((el: HTMLElement) => {
    const next = el.nextElementSibling as HTMLElement
    if (!next) return
    const {part, index} = trimBefore(text, next.innerText)
    markdown += part + transformer(el, args)
    text = text.slice(index)
  })
  markdown += text
  return markdown
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

function trimBefore(text: string, search: string): {part: string, index: number} {
  const index = text.indexOf(search)
  return { 
    part: text.substring(0, index - 1),
    index
  }
}

function trimAfter(text: string, search: string): {part: string, index: number} {
  const index = text.indexOf(search) + search.length
  return { 
    part: text.substring(0, index),
    index
  }
}

function hasHTML(transfer: DataTransfer): boolean {
  return Array.from(transfer.types).includes('text/html')
}

function isSelection(textarea: HTMLTextAreaElement): boolean {
  return textarea.selectionStart !== textarea.selectionEnd;
}

function linkify(element: HTMLAnchorElement): string {
  return `[${element.innerText}](${element.href})`
}

function headerify(header: HTMLElement, level: number): string {
  return `${'#'.repeat(level)} ${header.innerText}`
}

function preify(pre: HTMLPreElement): string {
  return `\`\`\`
${pre.innerText}
\`\`\``
}

function codify(code: HTMLElement): string {
  return `\`${code.innerText}\``
}

function boldify(bold: HTMLElement): string {
  return `**${bold.innerText}**`
}

function italify(italics: HTMLElement): string {
  return `*${italics.innerText}*`
}

function hrify(hr: HTMLHRElement): string {
  return `
---
`
}

function blockquotify(blockquote: HTMLQuoteElement): string {
  return `> ${blockquote.innerText}`
}