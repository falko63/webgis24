import "ol/ol.css"; // CSS für OpenLayers
import { Draw } from "ol/interaction";
import { Vector as VectorSource } from "ol/source";
import { Vector as VectorLayer } from "ol/layer";
import { map } from "./map.js"; // Importiere die map-Instanz

const areas = []; // Liste für gezeichnete Gebiete

// Funktion zum Zeichnen von Polygonen
export function enableDraw() {
  const drawSource = new VectorSource({ wrapX: false });

  const drawLayer = new VectorLayer({
    source: drawSource,
  });

  map.addLayer(drawLayer); // Füge den Layer zur Karte hinzu

  const draw = new Draw({
    source: drawSource,
    type: "Polygon",
  });

  map.addInteraction(draw); // Füge die Zeicheninteraktion zur Karte hinzu

  draw.on("drawend", function (event) {
    const drawnFeature = event.feature;
    const area = drawnFeature.getGeometry().getArea();
    const areaInHectares = area / 10000; // Umrechnung in Hektar

    console.log("Fläche des Polygons in Hektar:", areaInHectares); // Debugging

    if (areaInHectares > 100) {
      alert("Das Gebiet ist zu groß, bitte zeichne ein kleineres Gebiet.");
      drawSource.removeFeature(drawnFeature); // Entferne das Polygon, wenn es zu groß ist
    } else {
      const coordinates = drawnFeature.getGeometry().getCoordinates()[0]; // Eckkoordinaten
      areas.push({ areaInHectares, coordinates }); // Füge zur Liste hinzu
      console.log("Gezeichnetes Gebiet hinzugefügt:", {
        areaInHectares,
        coordinates,
      }); // Debugging
      updateSidebar(); // Sidebar aktualisieren
    }
  });
}

// Funktion zur Aktualisierung der Sidebar
function updateSidebar() {
  console.log("Update der Sidebar wird aufgerufen"); // Debugging
  const areasList = document.getElementById("areas-list");
  areasList.innerHTML = ""; // Leere die Liste

  areas.forEach((area, index) => {
    const listItem = document.createElement("li");
    listItem.textContent = `Gebiet ${index + 1}: ${area.areaInHectares.toFixed(
      2
    )} Hektar, Koordinaten: ${JSON.stringify(area.coordinates)}`;
    areasList.appendChild(listItem); // Füge den Listeneintrag hinzu
  });

  console.log("Aktuelle Liste der gezeichneten Gebiete:", areas); // Debugging
}
