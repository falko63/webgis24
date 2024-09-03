import { coords_pointermove, coords_click, coords_moveend, coords_change_resolution } from "./coordinates";
import { usar_click } from "./transport";
import { stadtrad_click_sqlite } from "./stadtrad_sqlite";
import { routing_click } from "./routing";


export function map_events(map) {
    // Wird der Mauszeiger über die Karte bewegt,
    // aktualisieren sich ständig die Koordinaten.
    map.on('pointermove', event => {
        coords_pointermove(event);
    })

    // Ein Klick auf die Karte zeigt die Koordinaten an dem Punkt an.
    map.on('click', event => {
        coords_click(event);
        usar_click(map, event);
        stadtrad_click_sqlite(map, event);
        routing_click(event);
    })

    // Nach dem Verändern des Kartenausschnitts wir die 
    // BoundingBox neu ermittelt und angezeigt.
    map.on('moveend', event => {
        coords_moveend(map);
    })

    // Zoomstufe und Auflösung werden angzeigt,
    // wenn sich die Auflösung ändert.
    map.getView().on('change:resolution', event => {
        coords_change_resolution(map);
    })

    // Beim Aufruf des Scripts werden Zoomstufe und Auflösung angzeigt.
    coords_change_resolution(map);
}
