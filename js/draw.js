import { Draw, Modify } from "ol/interaction";
import { Vector as VectorSource } from "ol/source";
import { Vector as VectorLayer } from "ol/layer";
import { Style, Fill, Stroke, Text } from "ol/style";
import { Overlay } from "ol";
import Collection from "ol/Collection";
import { map } from "./map.js";

let areas = [];
let drawSource = null;
let modify = null;
const MAX_AREA_HECTARES = 1000;
let drawInteraction = null; // Zeichnen-Interaktion, um sie global verfügbar zu machen

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

  map.addLayer(drawLayer);

  drawInteraction = new Draw({
    source: drawSource,
    type: "Polygon",
  });

  map.addInteraction(drawInteraction); // Speichert die Zeicheninteraktion

  drawInteraction.on("drawend", function (event) {
    const drawnFeature = event.feature;
    const area = drawnFeature.getGeometry().getArea();
    const areaInHectares = area / 10000;

    console.log("Fläche des Polygons in Hektar:", areaInHectares);

    if (areaInHectares > MAX_AREA_HECTARES) {
      alert(`Das Gebiet ist zu groß. Maximal ${MAX_AREA_HECTARES} Hektar.`);
      setTimeout(() => {
        drawSource.removeFeature(drawnFeature);
        console.log("Zu großes Gebiet entfernt.");
      }, 100);
    } else {
      const coordinates = drawnFeature.getGeometry().getCoordinates()[0];
      const areaObject = {
        areaInHectares,
        coordinates,
        name: `Gebiet ${areas.length + 1}`,
        feature: drawnFeature,
      };
      areas.push(areaObject);
      console.log("Gezeichnetes Gebiet hinzugefügt:", areaObject);
      updateSidebar();
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

    if (!map.hasFeatureAtPixel(event.pixel)) {
      tooltip.style.display = "none";
    }
  });
}

// Funktion zum Abrufen der Zeichnen-Interaktion
export function getDrawInteraction() {
  return drawInteraction; // Gib die Zeicheninteraktion zurück
}

// Funktion zur Aktivierung des Modify-Modus für ein Gebiet
function enableModifyForFeature(feature) {
  if (modify) {
    map.removeInteraction(modify);
  }

  modify = new Modify({
    features: new Collection([feature]), // Nur dieses Feature kann bearbeitet werden
  });

  map.addInteraction(modify);

  modify.on("modifyend", function () {
    const area = feature.getGeometry().getArea();
    const areaInHectares = area / 10000; // Umrechnung in Hektar

    // Überprüfen, ob das bearbeitete Gebiet zu groß ist
    if (areaInHectares > MAX_AREA_HECTARES) {
      alert(
        `Das bearbeitete Gebiet ist zu groß. Maximal ${MAX_AREA_HECTARES} Hektar.`
      );
      modify.undo(); // Setzt die letzte Bearbeitung zurück, wenn die Fläche zu groß ist
    } else {
      // Suche das bearbeitete Gebiet und aktualisiere die Fläche
      const foundArea = areas.find((areaObj) => areaObj.feature === feature);
      if (foundArea) {
        foundArea.areaInHectares = areaInHectares; // Aktualisiere die Fläche
        updateSidebar(); // Aktualisiere die Sidebar, um die neue Fläche anzuzeigen
      }

      console.log("Polygon bearbeitet:", feature);
    }
  });
}

function deleteFeature(area) {
  drawSource.removeFeature(area.feature);
  areas = areas.filter((a) => a !== area);
  updateSidebar();
}

function updateSidebar() {
  const areasList = document.getElementById("areas-list");
  areasList.innerHTML = "";

  areas.forEach((area, index) => {
    const listItem = document.createElement("li");

    const input = document.createElement("input");
    input.type = "text";
    input.value = area.name;
    input.oninput = function () {
      area.name = input.value;
    };

    const modifyButton = document.createElement("button");
    modifyButton.textContent = "Bearbeiten";
    modifyButton.classList.add("btn", "btn-primary");
    modifyButton.onclick = function () {
      enableModifyForFeature(area.feature);
    };

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Löschen";
    deleteButton.classList.add("btn", "btn-danger");
    deleteButton.onclick = function () {
      deleteFeature(area);
    };

    listItem.appendChild(input);
    listItem.appendChild(modifyButton);
    listItem.appendChild(deleteButton);
    listItem.appendChild(
      document.createTextNode(`: ${area.areaInHectares.toFixed(2)} Hektar`)
    );

    areasList.appendChild(listItem);
  });
}
