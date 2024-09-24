import {
  coords_pointermove,
  coords_click,
  coords_moveend,
  coords_change_resolution,
} from "./coordinates";
import { usar_click } from "./transport";
import { routing_click } from "./routing";

export function map_events(map) {
  // Mausbewegung über die Karte -> Koordinaten aktualisieren
  map.on("pointermove", (event) => {
    coords_pointermove(event);
  });

  // Klick auf die Karte -> Koordinaten anzeigen
  map.on("click", (event) => {
    coords_click(event);
    usar_click(map, event);
    routing_click(event);
  });

  // Nach dem Verschieben -> BoundingBox neu berechnen
  map.on("moveend", (event) => {
    coords_moveend(map);
  });

  // Auflösung ändern -> Zoomstufe und Auflösung aktualisieren
  map.getView().on("change:resolution", (event) => {
    coords_change_resolution(map);
  });

  // Initiale Anzeige von Zoomstufe und Auflösung
  coords_change_resolution(map);
}
