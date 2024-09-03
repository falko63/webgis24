import { transform } from "ol/proj";
import { format } from "ol/coordinate";

function coords_pointermove(event) {
    let coord3857 = event.coordinate;
    let coord4326 = transform(coord3857, 'EPSG:3857', 'EPSG:4326');
    document.getElementById('mouseCoord3857').innerHTML = format(coord3857, "{x}, {y}", 2);
    document.getElementById('mouseCoord4326').innerHTML = format(coord4326, "{x}, {y}", 6);
}

function coords_click(event) {
    let coord3857 = event.coordinate;
    let coord4326 = transform(coord3857, 'EPSG:3857', 'EPSG:4326');
    let lat = format(coord4326, "{y}", 6);
    let lon = format(coord4326, "{x}", 6);
    document.getElementById('mouseCoord4326ClickedAt').value = lon + "," + lat;
    document.getElementById('mouseCoord3857ClickedAt').value = format(coord3857, "{x},{y}", 2);
}

function coords_moveend(map) {
    let bbox = map.getView().calculateExtent(map.getSize());
    document.getElementById('bbox').value = bbox[0].toFixed(2) + "," +
                                            bbox[1].toFixed(2) + "," +
                                            bbox[2].toFixed(2) + "," +
                                            bbox[3].toFixed(2);

    let center = transform(map.getView().getCenter(), 'EPSG:3857', 'EPSG:4326');
    document.getElementById('center').value = format(center, "{x},{y}", 6);
}

function coords_change_resolution(map) {
    document.getElementById('zoom').value = map.getView().getZoom();
    document.getElementById('resolution').value = map.getView().getResolution();
}

// window.navigator liefert Informationen über das System und den Browser 
// des Benutzers. Neben dem Clipboard gehört auch Geolocation dazu.
// siehe https://www.mediaevent.de/javascript/window.html
function copy2clipboard(element_id) {
    const text = document.getElementById(element_id);
    text.select();
    navigator.clipboard.writeText(text.value);
}

// Die Funktion copy2clipboard() wird dem window-Objekt hinzugefügt.
// Damit kann in bspw. in der index.html auf diese Funktion
// zugegriffen werden. Die Namen müssen nicht identisch sein. 
window.copy2clipboard = copy2clipboard;

export { coords_pointermove, coords_click, coords_moveend, coords_change_resolution };
