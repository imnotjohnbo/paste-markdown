(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global['paste-markdown'] = {}));
}(this, (function (exports) { 'use strict';

  function insertText(textarea, text) {
      var _a, _b, _c;
      const before = textarea.value.slice(0, (_a = textarea.selectionStart) !== null && _a !== void 0 ? _a : undefined);
      const after = textarea.value.slice((_b = textarea.selectionEnd) !== null && _b !== void 0 ? _b : undefined);
      let canInsertText = true;
      textarea.contentEditable = 'true';
      try {
          canInsertText = document.execCommand('insertText', false, text);
      }
      catch (error) {
          canInsertText = false;
      }
      textarea.contentEditable = 'false';
      if (canInsertText && !textarea.value.slice(0, (_c = textarea.selectionStart) !== null && _c !== void 0 ? _c : undefined).endsWith(text)) {
          canInsertText = false;
      }
      if (!canInsertText) {
          try {
              document.execCommand('ms-beginUndoUnit');
          }
          catch (e) {
          }
          textarea.value = before + text + after;
          try {
              document.execCommand('ms-endUndoUnit');
          }
          catch (e) {
          }
          textarea.dispatchEvent(new CustomEvent('change', { bubbles: true, cancelable: true }));
      }
  }

  function install$3(el) {
      el.addEventListener('dragover', onDragover$1);
      el.addEventListener('drop', onDrop$1);
      el.addEventListener('paste', onPaste$3);
  }
  function uninstall$3(el) {
      el.removeEventListener('dragover', onDragover$1);
      el.removeEventListener('drop', onDrop$1);
      el.removeEventListener('paste', onPaste$3);
  }
  function onDrop$1(event) {
      const transfer = event.dataTransfer;
      if (!transfer)
          return;
      if (hasFile$1(transfer))
          return;
      if (!hasLink(transfer))
          return;
      const links = extractLinks(transfer);
      if (!links.some(isImageLink))
          return;
      event.stopPropagation();
      event.preventDefault();
      const field = event.currentTarget;
      if (!(field instanceof HTMLTextAreaElement))
          return;
      insertText(field, links.map(linkify$1).join(''));
  }
  function onDragover$1(event) {
      const transfer = event.dataTransfer;
      if (transfer)
          transfer.dropEffect = 'link';
  }
  function onPaste$3(event) {
      const transfer = event.clipboardData;
      if (!transfer || !hasLink(transfer))
          return;
      const links = extractLinks(transfer);
      if (!links.some(isImageLink))
          return;
      event.stopPropagation();
      event.preventDefault();
      const field = event.currentTarget;
      if (!(field instanceof HTMLTextAreaElement))
          return;
      insertText(field, links.map(linkify$1).join(''));
  }
  function linkify$1(link) {
      return isImageLink(link) ? `\n![](${link})\n` : link;
  }
  function hasFile$1(transfer) {
      return Array.from(transfer.types).indexOf('Files') >= 0;
  }
  function hasLink(transfer) {
      return Array.from(transfer.types).indexOf('text/uri-list') >= 0;
  }
  function extractLinks(transfer) {
      return (transfer.getData('text/uri-list') || '').split('\r\n');
  }
  const IMAGE_RE = /\.(gif|png|jpe?g)$/i;
  function isImageLink(url) {
      return IMAGE_RE.test(url);
  }

  function install$2(el) {
      el.addEventListener('paste', onPaste$2);
  }
  function uninstall$2(el) {
      el.removeEventListener('paste', onPaste$2);
  }
  function onPaste$2(event) {
      const transfer = event.clipboardData;
      if (!transfer || !hasPlainText(transfer))
          return;
      const field = event.currentTarget;
      if (!(field instanceof HTMLTextAreaElement))
          return;
      const text = transfer.getData('text/plain');
      if (!text)
          return;
      if (!isURL(text))
          return;
      if (isWithinLink(field))
          return;
      const selectedText = field.value.substring(field.selectionStart, field.selectionEnd);
      if (!selectedText.length)
          return;
      if (isURL(selectedText.trim()))
          return;
      event.stopPropagation();
      event.preventDefault();
      insertText(field, linkify(selectedText, text));
  }
  function hasPlainText(transfer) {
      return Array.from(transfer.types).includes('text/plain');
  }
  function isWithinLink(textarea) {
      const selectionStart = textarea.selectionStart || 0;
      if (selectionStart > 1) {
          const previousChars = textarea.value.substring(selectionStart - 2, selectionStart);
          return previousChars === '](';
      }
      else {
          return false;
      }
  }
  function linkify(selectedText, text) {
      return `[${selectedText}](${text})`;
  }
  function isURL(url) {
      return /^https?:\/\//i.test(url);
  }

  function install$1(el) {
      el.addEventListener('dragover', onDragover);
      el.addEventListener('drop', onDrop);
      el.addEventListener('paste', onPaste$1);
  }
  function uninstall$1(el) {
      el.removeEventListener('dragover', onDragover);
      el.removeEventListener('drop', onDrop);
      el.removeEventListener('paste', onPaste$1);
  }
  function onDrop(event) {
      const transfer = event.dataTransfer;
      if (!transfer)
          return;
      if (hasFile(transfer))
          return;
      const textToPaste = generateText(transfer);
      if (!textToPaste)
          return;
      event.stopPropagation();
      event.preventDefault();
      const field = event.currentTarget;
      if (field instanceof HTMLTextAreaElement) {
          insertText(field, textToPaste);
      }
  }
  function onDragover(event) {
      const transfer = event.dataTransfer;
      if (transfer)
          transfer.dropEffect = 'copy';
  }
  function onPaste$1(event) {
      if (!event.clipboardData)
          return;
      const textToPaste = generateText(event.clipboardData);
      if (!textToPaste)
          return;
      event.stopPropagation();
      event.preventDefault();
      const field = event.currentTarget;
      if (field instanceof HTMLTextAreaElement) {
          insertText(field, textToPaste);
      }
  }
  function hasFile(transfer) {
      return Array.from(transfer.types).indexOf('Files') >= 0;
  }
  function columnText(column) {
      const noBreakSpace = '\u00A0';
      const text = (column.textContent || '').trim().replace(/\|/g, '\\|').replace(/\n/g, ' ');
      return text || noBreakSpace;
  }
  function tableHeaders(row) {
      return Array.from(row.querySelectorAll('td, th')).map(columnText);
  }
  function tableMarkdown(node) {
      const rows = Array.from(node.querySelectorAll('tr'));
      const firstRow = rows.shift();
      if (!firstRow)
          return '';
      const headers = tableHeaders(firstRow);
      const spacers = headers.map(() => '--');
      const header = `${headers.join(' | ')}\n${spacers.join(' | ')}\n`;
      const body = rows
          .map(row => {
          return Array.from(row.querySelectorAll('td')).map(columnText).join(' | ');
      })
          .join('\n');
      return `\n${header}${body}\n\n`;
  }
  function generateText(transfer) {
      if (Array.from(transfer.types).indexOf('text/html') === -1)
          return;
      const html = transfer.getData('text/html');
      if (!/<table/i.test(html))
          return;
      const parser = new DOMParser();
      const parsedDocument = parser.parseFromString(html, 'text/html');
      let table = parsedDocument.querySelector('table');
      table = !table || table.closest('[data-paste-markdown-skip]') ? null : table;
      if (!table)
          return;
      const formattedTable = tableMarkdown(table);
      return html.replace(/<meta.*?>/, '').replace(/<table[.\S\s]*<\/table>/, `\n${formattedTable}`);
  }

  function install(el) {
      el.addEventListener('paste', onPaste);
  }
  function uninstall(el) {
      el.removeEventListener('paste', onPaste);
  }
  function onPaste(event) {
      const transfer = event.clipboardData;
      if (!transfer || !hasMarkdown(transfer))
          return;
      const field = event.currentTarget;
      if (!(field instanceof HTMLTextAreaElement))
          return;
      const text = transfer.getData('text/x-gfm');
      if (!text)
          return;
      event.stopPropagation();
      event.preventDefault();
      insertText(field, text);
  }
  function hasMarkdown(transfer) {
      return Array.from(transfer.types).indexOf('text/x-gfm') >= 0;
  }

  function subscribe(el) {
      install$1(el);
      install$3(el);
      install$2(el);
      install(el);
      return {
          unsubscribe: () => {
              uninstall$1(el);
              uninstall$3(el);
              uninstall$2(el);
              uninstall(el);
          }
      };
  }

  exports.installImageLink = install$3;
  exports.installLink = install$2;
  exports.installTable = install$1;
  exports.installText = install;
  exports.subscribe = subscribe;
  exports.uninstallImageLink = uninstall$3;
  exports.uninstallLink = uninstall$2;
  exports.uninstallTable = uninstall$1;
  exports.uninstallText = uninstall;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
