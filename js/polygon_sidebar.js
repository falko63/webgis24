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
          const geojson = new GeoJSON().readFeature(polygon.geometry, {
            featureProjection: "EPSG:3857", // Pass die Projektion an
          });
          zoomToPolygon(geojson);
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
    featureProjection: "EPSG:3857",
  });

  const vectorLayer = new VectorLayer({
    source: new VectorSource({
      features: [polygonFeature],
    }),
  });

  map.addLayer(vectorLayer);
}

function removePolygonFromMap(geojson) {
  const polygonFeature = new GeoJSON().readFeature(geojson, {
    featureProjection: "EPSG:3857",
  });

  map.getLayers().forEach(function (layer) {
    const source = layer.getSource();
    if (source && source instanceof VectorSource) {
      source.getFeatures().forEach(function (feature) {
        if (
          feature.getGeometry().getCoordinates().toString() ===
          polygonFeature.getGeometry().getCoordinates().toString()
        ) {
          source.removeFeature(feature);
        }
      });
    }
  });
}

function zoomToPolygon(feature) {
  map.getView().fit(feature.getGeometry().getExtent(), {
    duration: 1000,
  });
}
