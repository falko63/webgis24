import Overlay from "ol/Overlay";

// Zugriff auf die Popup-Elemente herstellen.
// Aber hier lassen wir die Popups ungenutzt.
let container = document.getElementById("popup");
export let content = null; // Popups deaktivieren
export let closer = null; // Popups deaktivieren
let popupOk = null; // Popups deaktivieren
let popupCancel = null; // Popups deaktivieren

// Keine Event-Listener hinzufügen, Popups bleiben ungenutzt
if (popupCancel) {
  popupCancel.style.display = "none";
}

// Overlay bleibt bestehen, um potentielle Abhängigkeiten zu wahren
export let overlay = new Overlay({
  element: container, // Wir übergeben das container Element, aber nutzen es nicht
  autoPan: {
    autoPanAnimation: {
      duration: 250,
    },
  },
});
