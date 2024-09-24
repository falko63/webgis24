import { enableDraw } from "./draw.js"; // Importiere die Zeichenfunktion

let openBar = undefined;

const infobar_open_width = 350;
const infobar_close_width = 60;
const infobar_padding_left = 20;
const infobar_total =
  infobar_open_width + infobar_close_width + infobar_padding_left;

function info(bar) {
  if (openBar == undefined) {
    infoOpen(bar);
  } else if (openBar == bar) {
    infoCloseAll();
  } else if (openBar != bar) {
    infoCloseAll();
    infoOpen(bar);
  }

  // Zeichenfunktion aktivieren, wenn der 'draw'-Button gewählt wurde
  if (bar === "draw") {
    enableDraw(window.map); // Hier wird die Zeichenfunktion mit der Karte aktiviert
    console.log("Zeichnen aktiviert");
  }
}

window.info = info; // Stelle sicher, dass die Funktion global verfügbar ist

function infoOpen(bar) {
  document.getElementById(bar).style.width = infobar_open_width + "px";
  document.getElementById(bar).style.paddingLeft = infobar_padding_left + "px";
  document.getElementById("main").style.marginLeft = infobar_total + "px";
  openBar = bar;
}

function infoCloseAll() {
  let bars = document.getElementsByClassName("infobar");
  for (let bar of bars) {
    bar.style.width = "0";
    bar.style.paddingLeft = "0";
  }
  document.getElementById("main").style.marginLeft = infobar_close_width + "px";
  openBar = undefined;
}

window.infoCloseAll = infoCloseAll;
