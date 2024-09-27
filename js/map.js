import { createLayerPanel } from "./layerpanel";

import { Map, View } from "ol";
import { fromLonLat, get as getProjection } from "ol/proj"; // Sicherstellen, dass die Projektion korrekt verwendet wird

import { BASELAYER } from "./baselayer";

import { overlay } from "./popup";

// Startkoordinaten in EPSG:4326 (Longitude, Latitude)
const start_center = fromLonLat([10.005, 53.54], "EPSG:3857"); // Konvertiere nach Web Mercator (EPSG:3857)
const start_zoom = 13;

export let map = new Map({
  target: "map",
  overlays: [overlay], // Popup
  view: new View({
    center: start_center,
    zoom: start_zoom,
    projection: getProjection("EPSG:3857"), // Stelle sicher, dass die Karte in EPSG:3857 gezeichnet wird
  }),
});

map.addLayer(BASELAYER);

// Layer erzeugen
createLayerPanel("baselayer", [BASELAYER]);
