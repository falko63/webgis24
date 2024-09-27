import { Draw, Modify } from "ol/interaction";
import { Vector as VectorSource } from "ol/source";
import { Vector as VectorLayer } from "ol/layer";
import { Style, Fill, Stroke, Text } from "ol/style";
import { Overlay } from "ol";
import Collection from "ol/Collection";
import { map } from "./map.js";
import GeoJSON from "ol/format/GeoJSON";
import { toLonLat } from "ol/proj"; // Importiere toLonLat für die Umrechnung

let areas = [];
let drawSource = null;
let modify = null;
const MAX_AREA_HECTARES = 1000;
let drawInteraction = null; // Zeicheninteraktion global verfügbar machen

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

  map.addInteraction(drawInteraction);

  // Zeichnen abgeschlossen
  drawInteraction.on("drawend", function (event) {
    const drawnFeature = event.feature;
    const area = drawnFeature.getGeometry().getArea();
    const areaInHectares = area / 10000;

    if (areaInHectares > MAX_AREA_HECTARES) {
      alert(`Das Gebiet ist zu groß. Maximal ${MAX_AREA_HECTARES} Hektar.`);
      setTimeout(() => {
        drawSource.removeFeature(drawnFeature);
      }, 100);
    } else {
      const areaObject = {
        areaInHectares,
        coordinates: drawnFeature.getGeometry().getCoordinates(),
        name: `Gebiet ${areas.length + 1}`,
        feature: drawnFeature,
      };
      areas.push(areaObject);

      console.log("Aktualisiertes Areas-Array:", areas); // Debugging-Ausgabe

      // Aktualisiere die Sidebar mit den neuen Gebieten
      updateDrawSidebar();

      // Optional: Button für das Speichern hinzufügen
      createSaveButton(areaObject);
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

// Funktion zur Aktivierung des Modify-Modus für ein Gebiet
function enableModifyForFeature(feature) {
  if (modify) {
    map.removeInteraction(modify);
  }

  modify = new Modify({
    features: new Collection([feature]), // Nur dieses Feature kann bearbeitet werden
  });

  map.addInteraction(modify);

  modify.on("modifyend", function (event) {
    const modifiedFeature = event.features.getArray()[0]; // Das bearbeitete Feature
    const area = modifiedFeature.getGeometry().getArea();
    const areaInHectares = area / 10000;

    if (areaInHectares > MAX_AREA_HECTARES) {
      alert(
        `Das bearbeitete Gebiet ist zu groß. Maximal ${MAX_AREA_HECTARES} Hektar.`
      );
      modify.undo(); // Wenn das Gebiet zu groß ist, rückgängig machen
    } else {
      // Aktualisiere die Area-Daten nach der Bearbeitung
      const foundArea = areas.find(
        (areaObj) => areaObj.feature === modifiedFeature
      );
      if (foundArea) {
        foundArea.areaInHectares = areaInHectares;
        updateDrawSidebar(); // Sidebar neu laden
      }

      console.log("Polygon bearbeitet:", modifiedFeature);

      // Speichern-Button nach Bearbeitung neu erstellen
      createSaveButton(foundArea); // Zeige den Speichern-Button wieder an
    }
  });
}

function deleteFeature(area) {
  drawSource.removeFeature(area.feature);
  areas = areas.filter((a) => a !== area);
  updateDrawSidebar();
}

// Funktion zum Erstellen des Buttons zum Speichern
function createSaveButton(polygon) {
  // Prüfe, ob der Button bereits existiert und entferne ihn, um Duplikate zu vermeiden
  let existingButton = document.getElementById("save-polygon-btn");
  if (existingButton) {
    existingButton.remove();
  }

  // Button erstellen
  const saveButton = document.createElement("button");
  saveButton.id = "save-polygon-btn";
  saveButton.textContent = "Polygon speichern";
  saveButton.classList.add("btn", "btn-success");

  // Füge den Button der Sidebar hinzu (Zeichnen Sidebar)
  const sidebar = document.getElementById("drawn-areas-list"); // Achte darauf, dass drawn-areas-list existiert
  if (sidebar) {
    sidebar.appendChild(saveButton);
  } else {
    console.error("Element 'drawn-areas-list' nicht gefunden.");
  }

  // Event für das Speichern des Polygons in der DB
  saveButton.onclick = function () {
    savePolygonToDB(polygon);
    saveButton.remove(); // Button nach dem Speichern entfernen
  };
}

// Funktion zum Speichern des Polygons in der Datenbank
function savePolygonToDB(polygon) {
  const geoJsonFormat = new GeoJSON();

  // Transformiere die Koordinaten von EPSG:3857 (Kartenprojektion) nach EPSG:4326 (WGS84)
  const geometry = geoJsonFormat.writeGeometry(polygon.feature.getGeometry(), {
    dataProjection: "EPSG:4326", // Zielprojektion für die Speicherung in der DB (WGS84)
    featureProjection: "EPSG:3857", // Projektion der Zeichnung in der Karte (Web Mercator)
  });

  const data = {
    name: polygon.name,
    area: polygon.areaInHectares,
    geometry: geometry, // GeoJSON-Koordinaten speichern in EPSG:4326
  };

  fetch("http://127.0.0.1:5000/api/polygon", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*", // Dieser Header sorgt dafür, dass die Anfrage erlaubt wird
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Erfolgreich gespeichert:", data);
      alert("Polygon erfolgreich in der Datenbank gespeichert.");
    })
    .catch((error) => {
      console.error("Fehler beim Speichern:", error);
      alert("Fehler beim Speichern des Polygons in der Datenbank.");
    });
}

// Funktion zum Aktualisieren der Sidebar mit den gezeichneten Gebieten
function updateDrawSidebar() {
  console.log("updateDrawSidebar wird aufgerufen"); // Debugging-Ausgabe
  const areasList = document.getElementById("drawn-areas-list"); // Verwende die Liste für gezeichnete Gebiete

  if (!areasList) {
    console.error("Element 'drawn-areas-list' nicht gefunden!");
    return;
  }

  areasList.innerHTML = ""; // Leere die Liste zuerst

  areas.forEach((area, index) => {
    const listItem = document.createElement("li");

    // Nameingabe für das Gebiet
    const input = document.createElement("input");
    input.type = "text";
    input.value = area.name;
    input.oninput = function () {
      area.name = input.value;
    };

    // Bearbeiten-Button
    const modifyButton = document.createElement("button");
    modifyButton.textContent = "Bearbeiten";
    modifyButton.classList.add("btn", "btn-primary");
    modifyButton.onclick = function () {
      enableModifyForFeature(area.feature);
    };

    // Löschen-Button
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

    areasList.appendChild(listItem); // Füge den Eintrag zur Liste hinzu
  });
}
