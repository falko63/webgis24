import Group from 'ol/layer/Group';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import Style from 'ol/style/Style';
import { Fill, Icon, Stroke, Text } from 'ol/style';

import { content, overlay } from './popup';

function resolution2zoom(resolution) {
    let equator_length = 40075016.686;
    let tile_size = 256;
    return (Math.log2(equator_length / (tile_size * resolution), 2));
}

export const stadtrad_source_sqlite = new VectorSource({
    format: new GeoJSON(),
    url: 'http://localhost:8082/get'
});


const stadtrad_layer_sqlite = new VectorLayer({
    id: 'stadtrad_sqlite',
    title: 'Stadtrad (Sqlite-DB)',
    visible: false,
    source: stadtrad_source_sqlite,
    style: (feature, resolution) => {
        let idx = feature.get('id');
        let zoom = resolution2zoom(resolution);
        let txt = zoom >= 15 ? feature.get('station') : '';
        let scale = 0.004 * Math.pow(zoom, 1.5);
        scale = zoom >= 11 ? scale : 0.0;

        let styleCache = {};
        styleCache[idx] = [
            new Style({
                image: new Icon({
                    anchor: [0.5, 0.75],
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'fraction',
                    opacity: 0.7,
                    scale: scale,
                    src: '../images/stadtrad.svg'
                }),
                text: new Text({
                    font: '16px Calibri,sans-serif',
                    offsetY: 12,
                    text: txt,
                    fill: new Fill({
                        color: '#000000'
                    }),
                    stroke: new Stroke({
                        color: '#FFFFFF',
                        width: 3
                    })
                }),
                zIndex: -1
            })
        ];
        return styleCache[idx];
    }
});


const openseamap = new TileLayer({
    id: 'openseamap',
    title: 'OpenSeaMap',
    visible: false,
    source: new XYZ({
        url: 'http://tiles.openseamap.org/seamark/{z}/{x}/{y}.png'
    })
});


const usar = new VectorLayer({
    id: 'usar',
    title: 'U|S|A|R',
    visible: false,
    zIndex: 999, // siehe layer.getZIndex(), layer.setZIndex(<int>)
    source: new VectorSource({
        url: '../data/hvvstationen.json',
        format: new GeoJSON()
    }),
    style: (feature, resolution) => {
        let idx = feature.get('OBJECTID');
        let icon = '../images/' + feature.get('ART') + '.png';
        let txt = resolution < 10 ? feature.get('HALTESTELLE') : '';
        let styleCache = {};
        styleCache[idx] = [
            new Style({
                image: new Icon({
                    anchor: [0.5, 15],
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'pixels',
                    opacity: 0.7,
                    src: icon
                }),
                text: new Text({
                    font: '16px Calibri,sans-serif',
                    text: txt,
                    fill: new Fill({
                        color: '#000000'
                    }),
                    stroke: new Stroke({
                        color: '#FFFFFF',
                        width: 3
                    })
                })
            })
        ];
        return styleCache[idx];
    }
});


const usar_scaled = new VectorLayer({
    id: 'usar_scaled',
    title: 'U|S|A|R (scaled icons)',
    visible: false,
    source: new VectorSource({
        url: '../data/hvvstationen.json',
        format: new GeoJSON()
    }),
    style: (feature, resolution) => {
        let idx = feature.get('OBJECTID');
        let icon = '../images/' + feature.get('ART') + '.svg';
        let zoom = resolution2zoom(resolution);
        let txt = zoom >= 15 ? feature.get('HALTESTELLE') : '';
        let scale = 0.004 * Math.pow(zoom, 1.5);
        scale = zoom >= 11 ? scale : 0.0;

        let styleCache = {};
        styleCache[idx] = [
            new Style({
                image: new Icon({
                    anchor: [0.5, 1.0],
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'fraction',
                    opacity: 0.7,
                    scale: scale,
                    src: icon
                }),
                text: new Text({
                    font: '16px Calibri,sans-serif',
                    offsetY: 12,
                    text: txt,
                    fill: new Fill({
                        color: '#000000'
                    }),
                    stroke: new Stroke({
                        color: '#FFFFFF',
                        width: 3
                    })
                }),
                zIndex: 999 // siehe layer.getZIndex(), layer.setZIndex(<int>)
            })
        ];
        return styleCache[idx];
    }
});


export const TRANSPORT = new Group({
    id: 'transport',
    title: 'Verkehr',
    layers: [
        stadtrad_layer_sqlite,
        openseamap,
        usar,
        usar_scaled
    ]
});



// ---------------------------------------------------------------
// Popup
// ---------------------------------------------------------------

// Features werden ermittelt, die sich an dem angklickten Pixel befinden.
// Die Attribute werden als Popup angezeigt.
// Die Funktion usar_click() muss in map_events.js zugefügt werden.

export function usar_click(map, evt) {
	// Popup
	let feature = map.forEachFeatureAtPixel(evt.pixel, (f, layer) => {
		// Dem feature-Objekt wird das Attribut layerTitle hinzugefügt.
		try {
			f.layerId = layer.get("id");
			return f;
		} catch (err) {}
	});

	if (feature) {
		if (feature.layerId == "usar_scaled") {
            //console.log(feature);
            content.innerHTML = 
            "<p><img src='/images/" + feature.get("ART") + ".svg' style='height: 2em;'>" +
            "<span style='margin-left: 10px;'>" + feature.get("HALTESTELLE") + "</span></p>" +
            "<p>Linie: " + feature.get("NR") + "</p>"
            overlay.setPosition(feature.getGeometry().getCoordinates());
        }
	}
}
