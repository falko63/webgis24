import { enableDraw, getDrawInteraction } from "./draw.js"; // Importiere die Zeichenfunktion und hole die Zeicheninteraktion
import { map } from "./map.js"; // Stelle sicher, dass wir auf die Karte zugreifen können

let openBar = undefined;
let drawInteraction = null; // Halte die Interaktion, um sie zu entfernen, wenn die Sidebar geschlossen wird

const infobar_open_width = 250; // Breite der Sidebar
const infobar_close_width = 60; // Breite der Sidebar-Buttons

function info(bar) {
  if (openBar === bar) {
    // Wenn die gleiche Sidebar erneut geklickt wird, schließe sie
    infoCloseAll();
    return;
  } else if (openBar !== undefined) {
    // Schließe die aktuelle offene Sidebar, bevor die neue geöffnet wird
    infoCloseAll();
  }

  // Öffne die neue Sidebar
  infoOpen(bar);

  // Zeichenfunktion aktivieren, wenn der 'draw'-Button gewählt wurde
  if (bar === "draw") {
    if (drawInteraction === null) {
      enableDraw(); // Zeichnen aktivieren
      drawInteraction = getDrawInteraction(); // Speichere die Zeicheninteraktion

      // Stelle sicher, dass der Bereich für gezeichnete Gebiete sichtbar wird
      const drawnAreas = document.getElementById("drawn-areas");
      drawnAreas.style.display = "block"; // Sichtbar machen
      console.log("Zeichenfunktion aktiviert und drawn-areas sichtbar.");
    }
  }
}

window.info = info; // Globale Funktion

function infoOpen(bar) {
  document.getElementById(bar).classList.add("infobar_open"); // Sidebar öffnen
  document.getElementById("main").classList.add("with-sidebar"); // Kartenbreite anpassen
  openBar = bar;
}

function infoCloseAll() {
  // Schließe alle Sidebars
  let bars = document.getElementsByClassName("infobar");
  for (let bar of bars) {
    bar.classList.remove("infobar_open");
  }

  // Setze die Karte auf volle Breite zurück
  document.getElementById("main").classList.remove("with-sidebar");

  // Entferne die Zeicheninteraktion, wenn sie aktiv war
  if (drawInteraction !== null) {
    map.removeInteraction(drawInteraction);
    drawInteraction = null;
    console.log("Zeichenfunktion deaktiviert.");
  }

  openBar = undefined;
}

window.infoCloseAll = infoCloseAll;
