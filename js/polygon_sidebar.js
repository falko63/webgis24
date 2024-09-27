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
        `;

        const checkbox = listItem.querySelector(`#checkbox-${polygon.id}`);
        const zoomButton = listItem.querySelector(`#zoom-${polygon.id}`);

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

        // Sichtbarkeit des Polygons steuern
        checkbox.onchange = () => {
          if (checkbox.checked) {
            addPolygonToMap(polygon.geometry);
          } else {
            removePolygonFromMap(polygon.geometry);
          }
        };

        sidebarList.appendChild(listItem);
      });
    })
    .catch((error) => {
      console.error("Fehler beim Laden der Polygone:", error);
    });
}

function addPolygonToMap(geojson) {
  const polygonFeature = new GeoJSON().readFeature(geojson, {
    dataProjection: "EPSG:3857", // Die Daten liegen in EPSG:3857 vor
    featureProjection: "EPSG:3857", // Die Karte verwendet ebenfalls EPSG:3857
  });

  const vectorLayer = new VectorLayer({
    source: new VectorSource({
      features: [polygonFeature],
    }),
  });

  map.addLayer(vectorLayer);
}

function removePolygonFromMap(geometry) {
  const layersToRemove = [];

  map.getLayers().forEach(function (layer) {
    if (layer instanceof VectorLayer) {
      const source = layer.getSource();
      if (source) {
        source.getFeatures().forEach(function (feature) {
          if (
            feature.getGeometry().getCoordinates().toString() ===
            geometry.toString()
          ) {
            layersToRemove.push(layer);
          }
        });
      }
    }
  });

  layersToRemove.forEach(function (layer) {
    map.removeLayer(layer);
  });
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
