// ---------------------------------------------------------------
// Popup
// ---------------------------------------------------------------

import Overlay from 'ol/Overlay';

// Zugriff auf die Popup-Elemente herstellen.
export let content = document.getElementById('popup-content');
let container = document.getElementById('popup');
export let closer = document.getElementById('popup-closer');
let popupOk = document.getElementById("popupOk");
let popupCancel = document.getElementById("popupCancel");

// Cancel-Button ausblenden
popupCancel.style.display = "none";

// Popup schließen mit OK-Button
popupOk.addEventListener("click", function() {
    overlay.setPosition(undefined);
    // Die blur()-Methode entfernt den Fokus von einem Element.
    closer.blur();
});

// Einen click-Handler zufügen, um das Popup zu schließen.
/*
closer.onclick = function() {
    overlay.setPosition(undefined);
    closer.blur();
};
*/
// https://stackoverflow.com/questions/6348494/addeventlistener-vs-onclick#:~:text=addEventListener%20can%20add%20multiple%20events,can%20stop%20the%20event%20propagation.
// https://dev.to/brainiacneit/differentiating-onclick-and-addeventlistener-in-javascript-30ke
// onclick kann als HTML-Attribut hinzugefügt werden, wohingegen ein addEventListener
// nur innerhalb von <script>-Elementen hinzugefügt werden kann.
// addEventListener sollte die bevorzugte Wahl sein, da es alles kann, was onclick
// kann und noch mehr.
closer.addEventListener("click", function() {
    overlay.setPosition(undefined);
    closer.blur();
});

// Ein Overlay erstellen, um das Popup auf der Karte zu verankern.
export let overlay = new Overlay({
    element: container,
    autoPan: {
        autoPanAnimation: {
            duration: 250
        }
    }
});
