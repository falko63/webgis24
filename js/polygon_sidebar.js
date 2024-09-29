import { map } from "./map";
import Feature from "ol/Feature";
import GeoJSON from "ol/format/GeoJSON";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";

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
          <label for="checkbox-${polygon.id}">${
          polygon.name
        } (${polygon.area.toFixed(2)} Hektar)</label>
          <button id="zoom-${polygon.id}">Zoom</button>
          <button id="analyze-${
            polygon.id
          }">Analyse</button> <!-- Neuer Analyse-Button -->
        `;

        const checkbox = listItem.querySelector(`#checkbox-${polygon.id}`);
        const zoomButton = listItem.querySelector(`#zoom-${polygon.id}`);
        const analyzeButton = listItem.querySelector(`#analyze-${polygon.id}`); // Referenz auf den Analyse-Button

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
          start_analyze_polygon(polygon.geometry); // Funktion für die Analyse aufrufen
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

function start_analyze_polygon(geometry) {
  // Show the entire GeoJSON object
  console.log("Analyse für das Polygon mit Geometrie:", geometry);

  // Check if the geometry object and its coordinates exist
  if (geometry && geometry) {
    console.log("Koordinaten des Polygons:", geometry);
  } else {
    console.error(
      "Koordinaten sind nicht vorhanden oder das Geometrie-Objekt ist ungültig"
    );
    return; // Exit if no valid coordinates
  }

  // Post data to the server
  const postData = {
    coordinates: geometry,
  };

  // Make sure the URL is correct, and it should match the Flask API route
  fetch("http://127.0.0.1:5000/api/process_area", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(postData), // Convert the coordinates to JSON
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Server response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Erfolgreich:", data);
      // Add any logic to handle the returned data
    })
    .catch((error) => {
      console.error("Fehler bei der Analyse:", error);
    });
}
