import { transform } from "ol/proj";
import { format } from "ol/coordinate";

function coords_pointermove(event) {
  let coord3857 = event.coordinate;
  let coord4326 = transform(coord3857, "EPSG:3857", "EPSG:4326");

  const mouseCoord3857Elem = document.getElementById("mouseCoord3857");
  const mouseCoord4326Elem = document.getElementById("mouseCoord4326");

  if (mouseCoord3857Elem) {
    mouseCoord3857Elem.innerHTML = format(coord3857, "{x}, {y}", 2);
  }

  if (mouseCoord4326Elem) {
    mouseCoord4326Elem.innerHTML = format(coord4326, "{x}, {y}", 6);
  }
}

function coords_click(event) {
  let coord3857 = event.coordinate;
  let coord4326 = transform(coord3857, "EPSG:3857", "EPSG:4326");
  let lat = format(coord4326, "{y}", 6);
  let lon = format(coord4326, "{x}", 6);

  const mouseCoord4326ClickedAtElem = document.getElementById(
    "mouseCoord4326ClickedAt"
  );
  const mouseCoord3857ClickedAtElem = document.getElementById(
    "mouseCoord3857ClickedAt"
  );

  if (mouseCoord4326ClickedAtElem) {
    mouseCoord4326ClickedAtElem.value = lon + "," + lat;
  }

  if (mouseCoord3857ClickedAtElem) {
    mouseCoord3857ClickedAtElem.value = format(coord3857, "{x},{y}", 2);
  }
}

function coords_moveend(map) {
  let bbox = map.getView().calculateExtent(map.getSize());

  const bboxElem = document.getElementById("bbox");
  const centerElem = document.getElementById("center");

  if (bboxElem) {
    bboxElem.value =
      bbox[0].toFixed(2) +
      "," +
      bbox[1].toFixed(2) +
      "," +
      bbox[2].toFixed(2) +
      "," +
      bbox[3].toFixed(2);
  }

  if (centerElem) {
    let center = transform(map.getView().getCenter(), "EPSG:3857", "EPSG:4326");
    centerElem.value = format(center, "{x},{y}", 6);
  }
}

function coords_change_resolution(map) {
  const zoomElem = document.getElementById("zoom");
  const resolutionElem = document.getElementById("resolution");

  if (zoomElem) {
    zoomElem.value = map.getView().getZoom();
  }

  if (resolutionElem) {
    resolutionElem.value = map.getView().getResolution();
  }
}

// Clipboard-Funktion
function copy2clipboard(element_id) {
  const text = document.getElementById(element_id);
  if (text) {
    text.select();
    navigator.clipboard.writeText(text.value);
  }
}

// Funktion global verfügbar machen
window.copy2clipboard = copy2clipboard;

export {
  coords_pointermove,
  coords_click,
  coords_moveend,
  coords_change_resolution,
};
