import "./style.css";

import { SplashBox } from "../interaction";

const storage = localStorage || window.localStorage;

const iconSaved64 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAAE0lEQVQoz2P8z4AfMDGMKhhBCgAwHwEfCv0SogAAAABJRU5ErkJggg==";
const iconUnsaved64 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAATElEQVQoz2P8z4AfMDEMvAIWBHOLPEMxQxQDA8Myhl6fh1gUMBQz5DIwMDAw5DIwMORhsyIKC4s0Ry7DwkJxQy/U8GUMvQhBxqEQ1ACuZwv4o0JqTgAAAABJRU5ErkJggg==";

const milestoneKeys = [" ", "Tab", "Enter", "Backspace", "Delete"];

export class Editor {
  parent: HTMLElement;
  textarea: HTMLTextAreaElement;
  title?: HTMLElement;
  icon?: HTMLLinkElement;
  anchor: HTMLAnchorElement;
  history: [string, number, number][];
  historyIndex: number;
  historyPushed: boolean;
  saved: boolean;
  loaded: boolean;

  splashBox: SplashBox;

  lastKeyDown: string;

  constructor(parent: HTMLElement, title?: HTMLElement, icon?: HTMLLinkElement) {
    this.parent = parent;
    this.title = title;
    this.icon = icon;
    this.anchor = document.createElement("a");
    this.history = [["", 0, 0]];
    this.historyIndex = 0;
    this.historyPushed = true;
    this.saved = false;
    this.loaded = false;

    this.splashBox = new SplashBox(this.parent);

    this.lastKeyDown = "";

    if (this.icon) {
      this.icon.setAttribute("href", iconUnsaved64);
    }

    this.textarea = document.createElement("textarea");
    this.textarea.classList.add("f-editor");
    this.parent.appendChild(this.textarea);

    this.textarea.onkeydown = (ev) => {
      if (ev.altKey || ev.ctrlKey) {
        let command = this.getCommand(
          (ev.altKey ? "Alt+" : "") + (ev.ctrlKey ? "Ctrl+" : "") + (ev.shiftKey ? "Shift+" : "") + ev.key
        );
        if (command) {
          ev.preventDefault();
          command.call(this);
        }
        return;
      }

      if (milestoneKeys.includes(ev.key)) {
        if (this.lastKeyDown !== ev.key) {
          this.pushHistory();
        }
      }

      this.lastKeyDown = ev.key;

      let { value, selectionStart, selectionEnd } = this.textarea;

      switch (ev.key) {
        case "Tab":
          ev.preventDefault();
          if (ev.shiftKey) {
            this.unindent();
          } else {
            if (selectionStart === selectionEnd) {
              this.setEditor(value.slice(0, selectionStart) + "\t" + value.slice(selectionEnd), selectionStart + 1);
            } else {
              this.indent();
            }
          }
          break;

        case "Enter":
          ev.preventDefault();
          let i = selectionStart - 1;
          for (; i >= 0 && value[i] !== "\n"; i--);
          let lineStart = ++i;
          for (; i < value.length && value[i] === "\t"; i++);
          let paddingTabs = i - lineStart;
          for (; i < value.length && value[i] !== "\n"; i++);
          let lineEnd = i;

          this.setEditor(
            value.slice(0, value.slice(lineStart, lineEnd).trim().length ? selectionStart : lineStart) +
              "\n" +
              "\t".repeat(paddingTabs) +
              value.slice(selectionEnd),
            selectionStart + paddingTabs + 1
          );
          break;
      }
    };

    this.textarea.oninput = () => {
      if (this.title) {
        this.title.innerHTML = this.getTitle();
      }
      if (this.icon) {
        this.icon.href = iconUnsaved64;
      }
      this.historyPushed = false;
      this.saved = false;
      this.loaded = false;
    };
  }

  getCommand(command: string) {
    switch (command) {
      case "Ctrl+z":
        return this.undo;
      case "Ctrl+Shift+z":
      case "Ctrl+y":
        return this.redo;
      case "Ctrl+s":
        return this.save;
      case "Ctrl+r":
        return this.load;
      case "Ctrl+d":
        return this.download;
    }
    return undefined;
  }

  setEditor(text: string, selectionStart: number, selectionEnd?: number) {
    if (this.textarea.value !== text) {
      this.textarea.value = text;
      this.textarea.selectionStart = selectionStart;
      this.textarea.selectionEnd = selectionEnd || selectionStart;
      this.textarea.blur();
      this.textarea.focus();
      this.textarea.dispatchEvent(new Event("input"));
    }
  }

  getTitle() {
    return this.textarea.value.split("\n")[0].trim() || "Untitled";
  }

  pushHistory() {
    if (!this.historyPushed && this.textarea.value !== this.history[this.historyIndex][0]) {
      this.history.splice(++this.historyIndex);
      this.history.push([this.textarea.value, this.textarea.selectionStart, this.textarea.selectionEnd]);
      this.historyPushed = true;
    }
  }

  undo() {
    this.pushHistory();
    if (this.historyIndex > 0) {
      this.setEditor(...this.history[--this.historyIndex]);
      this.historyPushed = true;
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.setEditor(...this.history[++this.historyIndex]);
    }
  }

  save() {
    if (!this.saved) {
      let expireTime = new Date();
      expireTime.setDate(expireTime.getDate() + 7);
      try {
        document.cookie = `key=;expires=${expireTime.toUTCString()}`;
        storage.setItem("text", this.textarea.value);
        storage.setItem("start", this.textarea.selectionStart.toString());
        storage.setItem("end", this.textarea.selectionEnd.toString());

        if (this.icon) {
          this.icon.href = iconSaved64;
        }

        this.saved = true;
        this.splashBox.show("File saved.");
      } catch (err) {
        this.splashBox.show(`Failed to save file:\n${err}`);
      }
    }
  }

  load() {
    if (!this.loaded) {
      let key = /key=([^;]*)(;|$)/.exec(document.cookie)?.[1];
      let text: string | null;
      if (key !== undefined && (text = storage.getItem("text")) !== null) {
        let start = storage.getItem("start");
        let end = storage.getItem("end");
        this.setEditor(text, start ? parseInt(start) : 0, end ? parseInt(end) : undefined);

        this.loaded = true;
        this.splashBox.show("File loaded.");
      } else {
        this.splashBox.show(`File not found.`);
      }
    }
  }

  download() {
    this.anchor.href = `data:text/plain,${this.textarea.value}`;

    let title = this.getTitle()
      .replace(/[/\*:?"<>|]/g, " ")
      .trim();
    if (!title.includes(".")) {
      title += ".txt";
    }

    this.anchor.download = title;
    this.anchor.click();
  }

  #lineInfo(position: number) {
    let { value } = this.textarea;

    let i = position - 1;
    for (; i >= 0 && value[i] !== "\n"; i--);
    let lineStart = ++i;
    for (; i < value.length && value[i] === "\t"; i++);
    let paddingTabs = i - lineStart;
    for (; i < value.length && value[i] !== "\n"; i++);
    let lineEnd = i;

    return [lineStart, lineEnd, paddingTabs];
  }

  indent() {
    let { value, selectionStart, selectionEnd } = this.textarea;

    let [firstLineStart, firstLineEnd, firstLinePaddingTabs] = this.#lineInfo(selectionStart);
    let [lastLineStart, lastLineEnd, lastLinePaddingTabs] = this.#lineInfo(selectionEnd);

    this.textarea.value =
      value.slice(0, firstLineStart) +
      value
        .slice(firstLineStart, lastLineEnd)
        .split("\n")
        .map((line) => "\t" + line)
        .join("\n") +
      value.slice(lastLineEnd);

    this.textarea.selectionStart =
      firstLinePaddingTabs < selectionStart - firstLineStart ? selectionStart + 1 : selectionStart;

    this.textarea.selectionEnd =
      lastLinePaddingTabs < selectionEnd - lastLineStart
        ? selectionEnd + this.textarea.value.length - value.length
        : selectionEnd + this.textarea.value.length - value.length - 1;
  }

  unindent() {
    let { value, selectionStart, selectionEnd } = this.textarea;

    let [firstLineStart, firstLineEnd, firstLinePaddingTabs] = this.#lineInfo(selectionStart);
    let [lastLineStart, lastLineEnd, lastLinePaddingTabs] = this.#lineInfo(selectionEnd);

    this.textarea.value =
      value.slice(0, firstLineStart) +
      value
        .slice(firstLineStart, lastLineEnd)
        .split("\n")
        .map((line) => (line.startsWith("\t") ? line.slice(1) : line))
        .join("\n") +
      value.slice(lastLineEnd);

    this.textarea.selectionEnd =
      lastLinePaddingTabs <= selectionEnd - lastLineStart
        ? selectionEnd + this.textarea.value.length - value.length
        : selectionEnd + this.textarea.value.length - value.length + 1;

    this.textarea.selectionStart =
      firstLinePaddingTabs <= selectionStart - firstLineStart ? selectionStart - 1 : selectionStart;
  }
}
