import { enableDraw } from "./draw.js"; // Importiere nur die Zeichenfunktion
import { loadPolygonsFromDB } from "./polygon_sidebar.js"; // Importiere die Funktion zum Laden von Polygonen
import { map } from "./map.js"; // Stelle sicher, dass wir auf die Karte zugreifen könne

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
      console.log("Zeichenfunktion aktiviert und drawn-areas sichtbar.");
    }
  }

  // Polygon-Liste laden, wenn der 'polygon-sidebar'-Button gewählt wurde
  if (bar === "polygon-sidebar") {
    loadPolygonsFromDB(); // Lade gespeicherte Polygone
    console.log("Polygon-Sidebar geöffnet und Polygone geladen.");
  }
}

window.info = info; // Globale Funktion für das Öffnen der Sidebars

function infoOpen(bar) {
  // Schließe zunächst alle anderen geöffneten Sidebars
  infoCloseAll();

  // Zeige die entsprechende Sidebar an
  document.getElementById(bar).style.display = "block"; // Sichtbar machen
  document.getElementById(bar).classList.add("infobar_open");
  document.getElementById("main").classList.add("with-sidebar"); // Kartenbreite anpassen
  openBar = bar;
}

function infoCloseAll() {
  // Schließe alle Sidebars
  let bars = document.getElementsByClassName("infobar");
  for (let bar of bars) {
    bar.classList.remove("infobar_open");
    bar.style.display = "none"; // Unsichtbar machen
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

window.infoCloseAll = infoCloseAll; // Globale Funktion zum Schließen aller Sidebars
