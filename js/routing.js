import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import { Point } from "ol/geom";
import { Icon, Stroke, Style } from "ol/style";
import Polyline from "ol/format/Polyline";
import { transform } from "ol/proj";
import { format } from "ol/coordinate";

import { map } from "./map";

import { api_key } from "./api_keys";

// Die folgenden DOM-Elemente werden hier nicht verwendet, daher setzen wir sie auf `null`,
// um Fehler zu vermeiden, wenn sie im HTML nicht vorhanden sind.
const waypoints = document.getElementById("waypoints") || null;
const waypoint_add = document.getElementById("waypoint-add") || null;
const waypoint_remove = document.getElementById("waypoint-remove") || null;
const waypoint_up = document.getElementById("waypoint-up") || null;
const waypoint_down = document.getElementById("waypoint-down") || null;
const route_get = document.getElementById("route-get") || null;
const route_zoom = document.getElementById("route-zoom") || null;
const route_remove = document.getElementById("route-remove") || null;
const route_info = document.getElementById("route-info") || null;
const distance = document.getElementById("distance") || null;
const time = document.getElementById("time") || null;
const mouseLon = document.getElementById("mouseLon") || null;
const mouseLat = document.getElementById("mouseLat") || null;

// Hilfsfunktionen
function removeOptions(selectElement) {
  if (!selectElement) return; // Vermeide Fehler, wenn selectElement nicht existiert
  while (selectElement.options.length) {
    selectElement.remove(0);
  }
}

function listboxMove(listbox, direction) {
  if (!listbox) return; // Vermeide Fehler, wenn listbox nicht existiert
  let selIndex = listbox.selectedIndex;
  if (selIndex === -1) {
    alert("Bitte wähle eine Option aus, um sie zu verschieben.");
    return;
  }
  let increment = direction === "up" ? -1 : 1;
  if (
    selIndex + increment < 0 ||
    selIndex + increment > listbox.options.length - 1
  ) {
    return;
  }
  let selValue = listbox.options[selIndex].value;
  let selText = listbox.options[selIndex].text;
  listbox.options[selIndex].value = listbox.options[selIndex + increment].value;
  listbox.options[selIndex].text = listbox.options[selIndex + increment].text;
  listbox.options[selIndex + increment].value = selValue;
  listbox.options[selIndex + increment].text = selText;
  listbox.selectedIndex = selIndex + increment;
}

// Routing
let routeLayer;

export function routing_click(event) {
  if (!mouseLon || !mouseLat) return; // Vermeide Fehler, wenn mouseLon/mouseLat nicht existieren
  let coord3857 = event.coordinate;
  let coord4326 = transform(coord3857, "EPSG:3857", "EPSG:4326");

  mouseLon.innerText = format(coord4326, "{x}", 6);
  mouseLat.innerText = format(coord4326, "{y}", 6);
}

// Waypoint zur Route hinzufügen
if (waypoint_add) {
  waypoint_add.addEventListener("click", (e) => {
    let lat = mouseLat ? mouseLat.textContent : "";
    let lon = mouseLon ? mouseLon.textContent : "";
    let pos = lon + "," + lat;
    let option = document.createElement("option");
    option.text = pos;
    option.value = pos;
    waypoints && waypoints.add(option);
  });
}

// Waypoint entfernen
if (waypoint_remove) {
  waypoint_remove.addEventListener("click", (e) => {
    waypoints && waypoints.remove(waypoints.selectedIndex);
  });

  waypoints &&
    waypoints.addEventListener("dblclick", (e) => {
      waypoints.remove(waypoints.selectedIndex);
    });
}

// Waypoint up
if (waypoint_up) {
  waypoint_up.addEventListener("click", (e) => {
    listboxMove(waypoints, "up");
  });
}

// Waypoint down
if (waypoint_down) {
  waypoint_down.addEventListener("click", (e) => {
    listboxMove(waypoints, "down");
  });
}

// Route entfernen
if (route_remove) {
  route_remove.addEventListener("click", (e) => {
    removeOptions(waypoints);
    distance && (distance.textContent = "");
    time && (time.textContent = "");
    map.removeLayer(routeLayer);
  });
}

// Zoom to Route
if (route_zoom) {
  route_zoom.addEventListener("click", (e) => {
    if (routeLayer) {
      let layerExtent = routeLayer.getSource().getExtent();
      map.getView().fit(layerExtent, { padding: [40, 420, 10, 20] });
    }
  });
}

// Route berechnen
if (route_get) {
  route_get.addEventListener("click", (e) => {
    map.removeLayer(routeLayer);
    let w = [];
    for (let i = 0; i < waypoints.options.length; i++) {
      w.push("[" + waypoints.options[i].value + "]");
    }
    let wps = '{"coordinates":[' + w.join(",") + "]}";

    fetch("https://api.openrouteservice.org/v2/directions/driving-car", {
      method: "POST",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json; charset=utf-8",
        Authorization: api_key,
      },
      body: wps,
    })
      .then((response) => response.json())
      .then((data) => {
        let polyline = data.routes[0].geometry;

        let route = new Polyline({
          factor: 1e5, // WICHTIG!!!
        }).readGeometry(polyline, {
          dataProjection: "EPSG:4326",
          featureProjection: "EPSG:3857",
        });

        let routeCoords = route.getCoordinates();
        let routeLength = routeCoords.length;

        let routeFeature = new Feature({
          type: "route",
          geometry: route,
        });

        let startIcon = new Feature({
          type: "start",
          geometry: new Point(routeCoords[0]),
        });

        let endIcon = new Feature({
          type: "finish",
          geometry: new Point(routeCoords[routeLength - 1]),
        });

        let styles = {
          route: new Style({
            stroke: new Stroke({
              width: 6,
              color: [0, 0, 0, 0.8],
            }),
          }),
          start: new Style({
            image: new Icon({
              anchor: [0, 1],
              scale: 0.1,
              src: "../images/flag_green.svg",
            }),
          }),
          finish: new Style({
            image: new Icon({
              anchor: [0, 1],
              scale: 0.1,
              src: "../images/flag_red.svg",
            }),
          }),
        };

        routeLayer = new VectorLayer({
          visible: true,
          source: new VectorSource({
            features: [routeFeature, startIcon, endIcon],
          }),
          style: (feature) => {
            return styles[feature.get("type")];
          },
        });

        map.addLayer(routeLayer);

        if (distance) {
          distance.textContent =
            Math.round(data.routes[0].summary.distance / 100) / 10;
        }
        if (time) {
          let ttime = data.routes[0].summary.duration;
          let sek = ttime % 60;
          let min = ((ttime - sek) / 60) % 60;
          let std = ((ttime - sek) / 60 - min) / 60;
          let totaltime =
            ("00" + std).slice(-2) +
            ":" +
            ("00" + min).slice(-2) +
            ":" +
            ("00" + sek).slice(-2);
          time.textContent = totaltime;
        }
      })
      .catch((error) => {
        route_info && (route_info.textContent = String(error));
      });
  });
}
