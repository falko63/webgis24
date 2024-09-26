/*
import Feature from 'ol/Feature.js';
import {Geolocation} from "ol";
import Point from 'ol/geom/Point.js';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style.js';
import {Vector as VectorSource} from 'ol/source.js';
import {Vector as VectorLayer} from 'ol/layer.js';
import { map, map_view } from './map';

const geolocation = new Geolocation({
    trackingOptions: {
        enableHighAccuracy: true
    },
    projection: map_view.getProjection()
});

function el(id) { return document.getElementById(id); }

// Diese Zeile entfernt, da 'track' im DOM anscheinend fehlt
// el('track').addEventListener('change', function (e) {
//     geolocation.setTracking(this.checked);
//     if (this.checked) {
//         map.addLayer(track_layer);
//     } else {
//         map.removeLayer(track_layer);
//     }
// });

geolocation.on('change', (e) => {
    // Event-Listener für Geolokalisierungsänderungen
});

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
});
*/
