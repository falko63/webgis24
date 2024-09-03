import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import { Point } from "ol/geom";
import { Icon, Stroke, Style } from "ol/style";
import Polyline from 'ol/format/Polyline';
import { transform } from "ol/proj";
import { format } from "ol/coordinate";

import { map } from './map';

import { api_key } from "./api_keys";

const waypoints = document.getElementById("waypoints");
const waypoint_add = document.getElementById("waypoint-add");
const waypoint_remove = document.getElementById("waypoint-remove");
const waypoint_up = document.getElementById("waypoint-up");
const waypoint_down = document.getElementById("waypoint-down");
const route_get = document.getElementById("route-get");
const route_zoom = document.getElementById("route-zoom");
const route_remove = document.getElementById("route-remove");
const route_info = document.getElementById("route-info");
const distance = document.getElementById("distance");
const time = document.getElementById("time");
const mouseLon = document.getElementById("mouseLon");
const mouseLat = document.getElementById("mouseLat");

// Hilfsfunktionen

function removeOptions(selectElement) {
    while (selectElement.options.length) {
        selectElement.remove(0)
    }
};

function listboxMove(listbox, direction) {
    let selIndex = listbox.selectedIndex;
    if (-1 == selIndex) {
        alert("PLease select an option to move.");
        return;
    }
    let increment = -1;
    if (direction == 'up')
        increment = -1;
    else
        increment = 1;
    if ((selIndex + increment) < 0 ||
        (selIndex + increment) > (listbox.options.length-1)) {
        return;
    }
    let selValue = listbox.options[selIndex].value;
    let selText = listbox.options[selIndex].text;
    listbox.options[selIndex].value = listbox.options[selIndex+increment].value;
    listbox.options[selIndex].text = listbox.options[selIndex+increment].text;
    listbox.options[selIndex+increment].value = selValue;
    listbox.options[selIndex+increment].text = selText;
    listbox.selectedIndex = selIndex + increment;
};

// Routing

let routeLayer;

export function routing_click(event) {
    let coord3857 = event.coordinate;
    let coord4326 = transform(coord3857, 'EPSG:3857', 'EPSG:4326');

    mouseLon.innerText = format(coord4326, "{x}", 6);
    mouseLat.innerText = format(coord4326, "{y}", 6);
}

// Waypoint zur Route hinzufügen
waypoint_add.addEventListener("click", (e) => {
    let lat = mouseLat.textContent;
    let lon = mouseLon.textContent;
    let pos = lon + "," + lat;
    let option = document.createElement("option");
    option.text = pos;
    option.value = pos;
    waypoints.add(option);
});

// Waypoint entfernen
waypoint_remove.addEventListener("click", (e) => {
    waypoints.remove(waypoints.selectedIndex);
});
waypoints.addEventListener("dblclick", (e) => {
    waypoints.remove(waypoints.selectedIndex);
});

// Waypoint up
waypoint_up.addEventListener("click", (e) => {
    listboxMove(waypoints, "up");
});

// Waypoint down
waypoint_down.addEventListener("click", (e) => {
    listboxMove(waypoints, "down");
});

// Route entfernen
route_remove.addEventListener("click", (e) => {
    removeOptions(waypoints);
    distance.textContent = "";
    time.textContent = "";
    map.removeLayer(routeLayer);
});

// Zoom to Route
route_zoom.addEventListener("click", (e) => {
    let layerExtent = routeLayer.getSource().getExtent();
    //console.log(layerExtent);
    map.getView().fit(layerExtent, { padding: [40, 420, 10, 20] });
}); 

// Route berechnen
route_get.addEventListener("click", (e) => {
    map.removeLayer(routeLayer);
    let w = Array();
    for (let i=0; i < waypoints.options.length; i++) {
        w.push("[" + waypoints.options[i].value + "]");
    }
    let wps = '{"coordinates":[' + w.join(",") + "]}";
    //console.log(wps);
    // {"coordinates":[[9.961509,53.560074],[10.018902,53.543537],[9.941189,53.528680],[10.077667,53.557899]]}

    fetch('https://api.openrouteservice.org/v2/directions/driving-car', {
        method: 'POST',
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json; charset=utf-8',
            "Authorization": api_key
        },
        body: wps
    })
    .then( response => response.json() )
    .then( data => {
        //console.log(data);
        //console.log(data.routes[0].summary.distance);
        //console.log(data.routes[0].summary.duration);
        //console.log(data.routes[0].geometry);
        //console.log(data.routes.length);

        let polyline = data.routes[0].geometry;

        let route = new Polyline({
            factor: 1e5  // WICHTIG!!!
        }).readGeometry(polyline, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
        });
        //console.log(route);

        let routeCoords = route.getCoordinates();
        let routeLength = routeCoords.length;

        let routeFeature = new Feature({
            type: 'route',
            geometry: route            
        });

        let startIcon = new Feature({
            type: 'start',
            geometry: new Point(routeCoords[0])
        });

        let endIcon = new Feature({
            type: 'finish',
            geometry: new Point(routeCoords[routeLength-1])
        });

        let styles = {
            'route': new Style({
                stroke: new Stroke({
                    width: 6,
                    color: [0, 0, 0, 0.8]
                })
            }),
            'start': new Style({
                image: new Icon({
                    anchor: [0, 1],
                    scale: 0.1,
                    src: '../images/flag_green.svg'
                })
            }),
            'finish': new Style({
                image: new Icon({
                    anchor: [0, 1],
                    scale: 0.1,
                    src: '../images/flag_red.svg'
                })
            })
        };

        routeLayer = new VectorLayer({
            visible: true,
            source: new VectorSource({
                features: [routeFeature, startIcon, endIcon]
            }),
            style: (feature) => {
                return styles[feature.get('type')];
            }
        });

        map.addLayer(routeLayer);

        distance.textContent = Math.round(data.routes[0].summary.distance/100)/10;
        let ttime = data.routes[0].summary.duration;
        let sek = ttime % 60;
        let min = ((ttime - sek) / 60) % 60;
        let std = (((ttime - sek) / 60) - min) / 60;
        let totaltime = ('00'+std).slice(-2) + ':' +
                        ('00'+min).slice(-2) + ':' +
                        ('00'+sek).slice(-2);
        time.textContent = totaltime;
    })
    .catch( error => {
        route_info.textContent = str(error);
    });
});
