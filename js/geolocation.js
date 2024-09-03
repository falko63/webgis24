/*
import Feature from 'ol/Feature';
import { Geolocation } from 'ol';
import { Point } from "ol/geom";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
*/

import Feature from 'ol/Feature.js';
import {Geolocation} from "ol";
import Point from 'ol/geom/Point.js';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style.js';
import {Vector as VectorSource} from 'ol/source.js';
import {Vector as VectorLayer} from 'ol/layer.js';
import { map, map_view } from './map';

// https://openlayers.org/en/latest/examples/geolocation.html

const geolocation = new Geolocation({
    // enableHighAccuracy must be set to true to have the heading value
    trackingOptions: {
        enableHighAccuracy: true
    },
    projection: map_view.getProjection()
});

function el(id) { return document.getElementById(id); }

//el('track').addEventListener('change', (e) => {
// this funktioniert nicht mit Pfeilfunktionen, weil sie nicht ihren eigenen Bereich 
// binden, sondern ihn vom übergeordneten Bereich erben, der in diesem Fall das 
// Fenster oder das globale Objekt ist.
el('track').addEventListener('change', function (e) {
        geolocation.setTracking(this.checked);
    if (this.checked) {
        map.addLayer(track_layer);
    } else {
        map.removeLayer(track_layer);
    }
});

// update the HTML page when the position changes
geolocation.on('change', (e) => {
    el('accuracy').innerText = geolocation.getAccuracy() + ' [m]';
    el('altitude').innerText = geolocation.getAltitude() + ' [m]';
    el('altitudeAccuracy').innerText = geolocation.getAltitudeAccuracy() + ' [m]';
    el('heading').innerText = geolocation.getHeading() + ' [rad]';
    el('speed').innerText = geolocation.getSpeed() + ' [m/s]';
});

// handle geolocation error
geolocation.on('error', function (error) {
    const info = document.getElementById('info');
    info.innerHTML = error.message;
    info.style.display = '';
});

const accuracyFeature = new Feature();
geolocation.on('change:accuracyGeometry', function () {
    accuracyFeature.setGeometry(geolocation.getAccuracyGeometry());
});

const positionFeature = new Feature();
positionFeature.setStyle(
    new Style({
        image: new CircleStyle({
            radius: 6,
            fill: new Fill({
                color: '#3399CC',
            }),
            stroke: new Stroke({
                color: '#fff',
                width: 2,
            }),
        }),
    })
);

geolocation.on('change:position', function () {
    const coordinates = geolocation.getPosition();
    positionFeature.setGeometry(coordinates ? new Point(coordinates) : null);
});

const track_layer = new VectorLayer({
    source: new VectorSource({
        features: [accuracyFeature, positionFeature]
    })
})