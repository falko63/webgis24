import { map_events } from "./map_events";
import { createLayerPanel } from "./layerpanel";

import { Map, View } from "ol";
import { fromLonLat } from "ol/proj";

import { BASELAYER } from "./baselayer";
import { TRANSPORT } from "./transport";

import { Vector as VectorLayer } from "ol/layer";

import { overlay } from "./popup";

const start_center = fromLonLat([10.005, 53.54]);
const start_zoom = 13;

export let map = new Map({
  target: "map",
  overlays: [overlay], // Popup
});
map.addLayer(BASELAYER);
map.addLayer(TRANSPORT);

// View für die Karte einstellen
export let map_view = new View({
  center: start_center,
  zoom: start_zoom,
});
map.setView(map_view);

// Map Events
map_events(map);

// Layer erzeugen
createLayerPanel("baselayer", [BASELAYER, TRANSPORT]);
