import { Draw } from "ol/interaction";
import { Vector as VectorSource } from "ol/source";
import { Vector as VectorLayer } from "ol/layer";
import { Style, Fill, Stroke, Text } from "ol/style"; // Für die Anpassung des Stils
import { Overlay } from "ol"; // Für den Tooltip
import { map } from "./map.js"; // Importiere die map-Instanz

let areas = [];
let drawSource = null; // Globale Variable für das Zeichnen der Quelle

// Funktion zum Zeichnen von Polygonen
export function enableDraw() {
  drawSource = new VectorSource({ wrapX: false });

  const drawLayer = new VectorLayer({
    source: drawSource,
    style: new Style({
      fill: new Fill({
        color: "rgba(0, 0, 128, 0.5)", // Dunklere Farbe für die Gebiete
      }),
      stroke: new Stroke({
        color: "#000080",
        width: 2,
      }),
      text: new Text({
        font: "12px Calibri,sans-serif",
        fill: new Fill({
          color: "#fff",
        }),
      }),
    }),
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

    console.log("Fläche des Polygons in Hektar:", areaInHectares);

    // Überprüfe, ob das Gebiet zu groß ist
    if (areaInHectares > 1000) {
      alert("Das Gebiet ist zu groß, bitte zeichne ein kleineres Gebiet.");

      // Entferne das Polygon, wenn es zu groß ist
      setTimeout(() => {
        drawSource.removeFeature(drawnFeature); // Entferne das zu große Gebiet von der Karte
        console.log("Zu großes Gebiet entfernt.");
      }, 100); // Geringe Verzögerung, um sicherzustellen, dass die Karte aktualisiert wird
    } else {
      const coordinates = drawnFeature.getGeometry().getCoordinates()[0];
      const areaObject = {
        areaInHectares,
        coordinates,
        name: `Gebiet ${areas.length + 1}`,
        feature: drawnFeature, // Speichere das Feature, um es später zu löschen
      };
      areas.push(areaObject);
      console.log("Gezeichnetes Gebiet hinzugefügt:", areaObject);
      updateSidebar(); // Sidebar aktualisieren
    }
  });

  // Tooltip für das Hover-Event
  const tooltip = document.createElement("div");
  tooltip.className = "tooltip";
  document.body.appendChild(tooltip);

  const overlay = new Overlay({
    element: tooltip,
    offset: [10, 0],
    positioning: "bottom-left",
  });

  map.addOverlay(overlay);

  // Mousemove Event für den Tooltip
  map.on("pointermove", function (event) {
    map.forEachFeatureAtPixel(
      event.pixel,
      function (feature) {
        const foundArea = areas.find((area) => area.feature === feature);
        if (foundArea) {
          tooltip.innerHTML = `${
            foundArea.name
          }: ${foundArea.areaInHectares.toFixed(2)} Hektar`;
          overlay.setPosition(event.coordinate);
          tooltip.style.display = "block";
        }
      },
      {
        layerFilter: (layer) => layer === drawLayer,
      }
    );

    // Tooltip ausblenden, wenn die Maus das Gebiet verlässt
    if (!map.hasFeatureAtPixel(event.pixel)) {
      tooltip.style.display = "none";
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

    // Gebietsnamen bearbeiten
    const input = document.createElement("input");
    input.type = "text";
    input.value = area.name;
    input.oninput = function () {
      area.name = input.value; // Speichere den neuen Namen
    };

    // Löschen-Button
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Löschen";
    deleteButton.onclick = function () {
      drawSource.removeFeature(area.feature); // Entferne das Feature von der Karte
      areas = areas.filter((_, i) => i !== index); // Entferne das Gebiet aus der Liste
      updateSidebar(); // Aktualisiere die Sidebar nach dem Löschen
    };

    // Füge das Gebiet und die Bedienelemente hinzu
    listItem.appendChild(input);
    listItem.appendChild(deleteButton);
    listItem.appendChild(
      document.createTextNode(`: ${area.areaInHectares.toFixed(2)} Hektar`)
    );

    areasList.appendChild(listItem); // Füge den Listeneintrag hinzu
  });

  console.log("Aktuelle Liste der gezeichneten Gebiete:", areas);
}
