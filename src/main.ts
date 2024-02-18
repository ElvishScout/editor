import "./style.css";

import { Editor } from "./editor";

const $ = (selector: string) => document.querySelectorAll(selector);

let app = $(".f-app")[0] as HTMLElement;
let title = $("title")[0] as HTMLTitleElement | undefined;
let icon = $("link[rel=icon]")[0] as HTMLLinkElement;

let editor = new Editor(app, title, icon);

document.onkeydown = (ev) => {
  if (ev.target === document.body) {
    ev.preventDefault();
  }
};
