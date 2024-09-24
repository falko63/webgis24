import "ol/ol.css"; // CSS für OpenLayers
import { Draw } from "ol/interaction";
import { Vector as VectorSource } from "ol/source";
import { Vector as VectorLayer } from "ol/layer";
import { map } from "./map.js"; // Importiere die map-Instanz

// Funktion zum Zeichnen von Polygonen
export function enableDraw() {
  // Vektorquelle für das gezeichnete Gebiet
  const drawSource = new VectorSource({ wrapX: false });

  // Vektorlayer für das gezeichnete Polygon
  const drawLayer = new VectorLayer({
    source: drawSource,
  });

  map.addLayer(drawLayer); // Hier wird die Layer zur Karte hinzugefügt

  // Zeicheninteraktion erstellen
  const draw = new Draw({
    source: drawSource,
    type: "Polygon",
  });

  map.addInteraction(draw);

  // Wenn das Zeichnen abgeschlossen ist
  draw.on("drawend", function (event) {
    const drawnFeature = event.feature;
    const area = drawnFeature.getGeometry().getArea();
    const areaInHectares = area / 10000; // Umrechnung in Hektar

    console.log("Fläche des Polygons in Hektar:", areaInHectares);

    // Begrenzung auf maximal 100 Hektar
    if (areaInHectares > 100) {
      alert("Das Gebiet ist zu groß, bitte zeichne ein kleineres Gebiet.");
      drawSource.removeFeature(drawnFeature); // Entferne das zu große Polygon
    } else {
      // Koordinaten und Fläche weiterverarbeiten
      console.log(
        "Koordinaten des Polygons:",
        drawnFeature.getGeometry().getCoordinates()
      );
    }
  });
}
