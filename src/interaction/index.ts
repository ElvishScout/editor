import "./style.css";

export class SplashBox {
  parent: HTMLElement;
  box: HTMLDivElement;
  display: HTMLParagraphElement;

  #promise: Promise<void> | null;

  constructor(parent: HTMLElement) {
    this.parent = parent;

    this.box = document.createElement("div");
    this.box.classList.add("f-splashbox");
    this.box.style.display = "none";
    this.display = document.createElement("p");
    this.display.classList.add("f-splashbox-display");
    this.box.appendChild(this.display);
    this.parent.appendChild(this.box);

    this.#promise = null;
  }

  show(msg: string, time: number = 1000) {
    let doit = (resolve: () => void) => {
      this.display.innerText = msg;
      this.box.style.opacity = "1";
      this.box.style.marginTop = "0px";
      this.box.style.display = "block";

      setTimeout(() => {
        let opacity = 1;
        let marginTop = 0;
        let t = setInterval(() => {
          opacity -= 0.05;
          marginTop += 1;
          if (opacity < 0) {
            clearInterval(t);
            this.box.style.display = "none";
            resolve();
          } else {
            this.box.style.opacity = `${opacity}`;
            this.box.style.marginTop = `${marginTop}px`;
          }
        }, 20);
      }, time);
    };

    if (this.#promise === null) {
      this.#promise = new Promise<void>(doit);
    } else {
      this.#promise = this.#promise.then(() => new Promise<void>(doit));
    }
  }
}
