import { map } from "./map";
import Feature from "ol/Feature";
import GeoJSON from "ol/format/GeoJSON";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import "ol/ol.css"; // Stylesheets laden
import { Image as ImageLayer } from "ol/layer"; // Hier bereits als ImageLayer importiert
import { ImageStatic as ImageStaticSource } from "ol/source"; // Hier bereits als ImageStaticSource importiert

let ndviLayer, ndmiLayer, laigreenLayer;
let ndviUrl, ndmiUrl, laigreenUrl; // To store the URLs returned from the server

// Funktion zum Abrufen und Anzeigen der Polygone in der Sidebar
export function loadPolygonsFromDB() {
  fetch("http://127.0.0.1:5000/api/polygons", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      const polygons = data.polygons;
      const sidebarList = document.getElementById("polygon-list");

      if (!sidebarList) {
        console.error("Element 'polygon-list' wurde nicht gefunden.");
        return;
      }

      sidebarList.innerHTML = ""; // Leere die Liste zuerst

      polygons.forEach((polygon) => {
        // Debugging: GeoJSON-Daten ausgeben
        console.log("GeoJSON-Daten: ", polygon.geometry);

        const listItem = document.createElement("li");
        listItem.innerHTML = `
  <input type="checkbox" id="checkbox-${polygon.id}" />
  <label for="checkbox-${polygon.id}">${polygon.name} (${polygon.area.toFixed(
          2
        )} Hektar)</label>
  <button id="zoom-${polygon.id}">Zoom</button>
  <button id="analyze-${polygon.id}">Analyse</button>
  <!-- Checkboxen für NDVI, ndmi und laigreen -->
  <label for="ndvi-toggle-${polygon.id}">NDVI</label>
  <input type="checkbox" id="ndvi-toggle-${polygon.id}" disabled />
  <label for="ndmi-toggle-${polygon.id}">ndmi</label>
  <input type="checkbox" id="ndmi-toggle-${polygon.id}" disabled />
  <label for="laigreen-toggle-${polygon.id}">laigreen</label>
  <input type="checkbox" id="laigreen-toggle-${polygon.id}" disabled />
`;

        const checkbox = listItem.querySelector(`#checkbox-${polygon.id}`);
        const zoomButton = listItem.querySelector(`#zoom-${polygon.id}`);
        const analyzeButton = listItem.querySelector(`#analyze-${polygon.id}`);

        // Füge eine Klickaktion zum Zoomen hinzu
        zoomButton.onclick = () => {
          try {
            console.log("GeoJSON-Daten vor dem Zoom:", polygon.geometry);
            const geojson = new GeoJSON().readFeature(polygon.geometry, {
              dataProjection: "EPSG:4326",
              featureProjection: "EPSG:3857",
            });
            console.log("Feature nach dem Lesen des GeoJSON:", geojson);
            zoomToPolygon(geojson);
          } catch (error) {
            console.error("Fehler beim Lesen der GeoJSON-Daten:", error);
          }
        };

        // Füge die Analyse-Funktion zum Button hinzu
        analyzeButton.onclick = () => {
          start_analyze_polygon(polygon.geometry, polygon.id); // Funktion für die Analyse aufrufen
        };

        // Sichtbarkeit des Polygons steuern
        checkbox.onchange = () => {
          if (checkbox.checked) {
            addPolygonToMap(polygon); // Füge das Polygon hinzu
          } else {
            removePolygonFromMap(polygon.id); // Entferne das Polygon
          }
        };

        sidebarList.appendChild(listItem);
      });
    })
    .catch((error) => {
      console.error("Fehler beim Laden der Polygone:", error);
    });
}

let polygonLayers = {}; // Dictionary zum Speichern der Layer

function addPolygonToMap(polygon) {
  const polygonFeature = new GeoJSON().readFeature(polygon.geometry, {
    featureProjection: "EPSG:3857", // Kartenprojektion
  });

  // Erstelle einen neuen Layer für das Polygon
  const vectorLayer = new VectorLayer({
    source: new VectorSource({
      features: [polygonFeature],
    }),
  });

  // Füge den Layer zur Karte hinzu
  map.addLayer(vectorLayer);

  // Speichere den Layer unter der Polygon-ID
  polygonLayers[polygon.id] = vectorLayer;
}

function removePolygonFromMap(polygonId) {
  // Finde den Layer im Dictionary
  const layerToRemove = polygonLayers[polygonId];

  if (layerToRemove) {
    map.removeLayer(layerToRemove); // Entferne den Layer von der Karte
    delete polygonLayers[polygonId]; // Lösche den Layer aus dem Dictionary
    console.log("Layer entfernt:", polygonId); // Debugging-Log
  } else {
    console.error("Layer nicht gefunden für Polygon-ID:", polygonId);
  }
}

function zoomToPolygon(feature) {
  const geometry = feature.getGeometry();

  // Prüfe, ob die Geometrie existiert und nicht leer ist
  if (!geometry || geometry.getExtent().every(isNaN)) {
    console.error("Ungültige oder leere Geometrie:", geometry);
    return;
  }

  const extent = geometry.getExtent();
  if (!extent || extent.length === 0) {
    console.error("Leerer oder ungültiger Extent:", extent);
    return;
  }

  map.getView().fit(extent, { duration: 1000 });
}

document.addEventListener("DOMContentLoaded", function () {
  const ndviCheckbox = document.getElementById("ndvi-toggle");
  const ndmiCheckbox = document.getElementById("ndmi-toggle");
  const laigreenCheckbox = document.getElementById("laigreen-toggle");

  if (ndviCheckbox) {
    ndviCheckbox.style.display = "block"; // Stelle sicher, dass die Checkbox angezeigt wird
  } else {
    console.error("NDVI-Checkbox nicht gefunden!");
  }

  if (ndmiCheckbox) {
    ndmiCheckbox.style.display = "block"; // Stelle sicher, dass die Checkbox angezeigt wird
  } else {
    console.error("ndmi-Checkbox nicht gefunden!");
  }

  if (laigreenCheckbox) {
    laigreenCheckbox.style.display = "block"; // Stelle sicher, dass die Checkbox angezeigt wird
  } else {
    console.error("laigreen-Checkbox nicht gefunden!");
  }
});

// Funktion zum Starten der Analyse
function start_analyze_polygon(geometry, polygonId) {
  if (typeof geometry === "string") {
    try {
      geometry = JSON.parse(geometry);
    } catch (error) {
      console.error("Fehler beim Parsen der Geometrie:", error);
      return;
    }
  }

  if (!geometry || !geometry.type || !geometry.coordinates) {
    console.error("Ungültige Geometrie:", geometry);
    return;
  }

  const postData = {
    geometry: geometry,
  };

  console.log("Sende Daten an Server:", postData);

  fetch("http://127.0.0.1:5000/api/process_area", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(postData),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Server response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Erfolgreich:", data);

      const geojsonFormat = new GeoJSON();
      const polygonFeature = geojsonFormat.readFeature(geometry, {
        dataProjection: "EPSG:4326",
        featureProjection: "EPSG:3857",
      });
      const imageExtent = polygonFeature.getGeometry().getExtent(); // Calculate the correct extent

      // Enable the analysis tools and attach event listeners
      const ndviCheckbox = document.getElementById(`ndvi-toggle-${polygonId}`);
      const ndmiCheckbox = document.getElementById(`ndmi-toggle-${polygonId}`);
      const laigreenCheckbox = document.getElementById(
        `laigreen-toggle-${polygonId}`
      );

      if (ndviCheckbox) {
        ndviCheckbox.disabled = false;
        ndviCheckbox.onchange = () =>
          toggleLayer(ndviCheckbox, data.ndvi_url, "NDVI", imageExtent);
      }

      if (ndmiCheckbox) {
        ndmiCheckbox.disabled = false;
        ndmiCheckbox.onchange = () =>
          toggleLayer(ndmiCheckbox, data.ndmi_url, "ndmi", imageExtent);
      }

      if (laigreenCheckbox) {
        laigreenCheckbox.disabled = false;
        laigreenCheckbox.onchange = () =>
          toggleLayer(
            laigreenCheckbox,
            data.laigreen_url,
            "laigreen",
            imageExtent
          );
      }
    })
    .catch((error) => {
      console.error("Fehler bei der Analyse:", error);
    });
}

// Global variables to hold the layers
let activeLayers = {};

// Function to toggle layers based on the checkbox state
function toggleLayer(checkbox, url, layerType, imageExtent) {
  if (checkbox.checked) {
    if (!activeLayers[layerType]) {
      const imageLayer = new ImageLayer({
        source: new ImageStaticSource({
          url: url,
          imageExtent: imageExtent, // Use the correct extent
          projection: map.getView().getProjection(),
        }),
      });
      map.addLayer(imageLayer);
      activeLayers[layerType] = imageLayer; // Save the reference to the layer
      console.log(`${layerType} Layer hinzugefügt.`);
    }
  } else {
    // Remove the layer when the checkbox is unchecked
    if (activeLayers[layerType]) {
      map.removeLayer(activeLayers[layerType]);
      delete activeLayers[layerType]; // Remove the reference
      console.log(`${layerType} Layer entfernt.`);
    }
  }
}
