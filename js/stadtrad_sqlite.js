import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Draw from 'ol/interaction/Draw';
import Modify from 'ol/interaction/Modify';
import { Style, Icon } from 'ol/style';
import { transform } from 'ol/proj';
import { format } from 'ol/coordinate';

import { map } from './map';
import { stadtrad_source_sqlite } from './transport';
import { none } from 'ol/centerconstraint';

import { content, overlay, closer } from './popup';


const url_stadtrad_sqlite = 'http://localhost:8082';

let draw, snap, modify; // global so we can remove them later

let feature;


// Erstellen eines temporären Layers
let stadtrad_source_sqlite_temp = new VectorSource();
let stadtrad_layer_sqlite_temp = new VectorLayer({
	visible: true,
	source: stadtrad_source_sqlite_temp,
	style: function(feature, resolution){
        let zoom = parseInt(map.getView().getZoomForResolution(resolution));
        let scale = 0.0039 * Math.pow(zoom, 1.488);
        
        return new Style({
            image: new Icon({
                anchor: [0.5, 1.0],
                anchorXUnits: 'fraction',
                anchorYUnits: 'fraction',
                opacity: 0.7,
                scale: scale,
                src: '../images/stadtrad_new.svg'
            })
        });
	}
});

export { stadtrad_layer_sqlite_temp };

// ---------------------------------------------------------------
// Menü-Funktionen
// ---------------------------------------------------------------

const formStadtrad = document.getElementById("formStadtrad");

const stadtradSpeichern = document.getElementById("stadtrad_btn");

const stadtradControlNone = document.getElementById("stadtrad_none");
const stadtradControlDraw = document.getElementById("stadtrad_draw");
const stadtradControlModify = document.getElementById("stadtrad_modify");
const stadtradControlDelete = document.getElementById("stadtrad_delete");

const stadtradId = document.getElementById("stadtrad_id");
const stadtradStation = document.getElementById("stadtrad_station");
const stadtradLongitude = document.getElementById("stadtrad_lon");
const stadtradLatitude = document.getElementById("stadtrad_lat");

const stadtradMessage = document.getElementById("stadtrad_message");

// NIX: das wird Formular versteckt und alle Aktionen deaktiviert
stadtradControlNone.addEventListener("click", function() {
	// ENABLE andere Menüpunkte 
    stadtradControlDraw.disabled = false;
    stadtradControlModify.disabled = false;
    stadtradControlDelete.disabled = false;
	// Formular ausschalten
    formStadtrad.style.display = "none";

    removeInteractions();

	// Die Quelle, in der das Stadtrad-Feature erstellt wurde, wird geleert.
	stadtrad_source_sqlite_temp.clear();
});

// DRAW: Formular wird angezeigt und createStadtrad aufgerufen
stadtradControlDraw.addEventListener("click", function() {
	// DISABLE andere Menüpunkte 
    stadtradControlModify.disabled = true;
    stadtradControlDelete.disabled = true;
	// Formular anzeigen
    formStadtrad.style.display = "block";
    stadtradId.readOnly = false;

    removeInteractions();

	// Formularinhalte werden gelöscht
	clearForm();

	createStadtrad();
});

// MODIFY: Formular wird angezeigt und modify eingeschaltet
stadtradControlModify.addEventListener("click", function() {
	// DISABLE andere Menüpunkte 
    stadtradControlDraw.disabled = true;
    stadtradControlDelete.disabled = true;
	// Formular anzeigen
    formStadtrad.style.display = "block";
	// Stationsnummer darf nicht geändert werden, da Primärschlüssel
    stadtradId.readOnly = true;

    removeInteractions();

	// Formularinhalte werden gelöscht
	clearForm();

	modify = new Modify({
        source: stadtrad_source_sqlite
    });
	map.addInteraction(modify);
});

// DELETE: das Formular wird versteckt und alle Aktionen deaktiviert
stadtradControlDelete.addEventListener("click", function() {
	// Formular ausschalten
    formStadtrad.style.display = "none";

	removeInteractions();
});


// ---------------------------------------------------------------
// Popup
// ---------------------------------------------------------------

// Features werden ermittelt, die sich an dem angklickten Pixel befinden.
// Die Attribute werden als Popup angezeigt.

function stadtrad_click_sqlite(map, e) {
	// Popup
	feature = map.forEachFeatureAtPixel(e.pixel, (f, layer) => {
		// Dem feature-Objekt wird das Attribut layerTitle hinzugefügt.
		try {
			f.layerId = layer.get("id");
			return f;
		} catch (err) {}
	});

	if (feature) {
		if (feature.layerId == "stadtrad_sqlite") {
            if (stadtradControlModify.checked) {
                //console.log(feature);
				updateStadtrad(feature);
			} else if (stadtradControlDelete.checked) {
				deleteStadtrad(feature);
			} else { // Popup-Fenster
                showPopup(feature);
			}
		}
	}
}

export { stadtrad_click_sqlite };


// ---------------------------------------------------------------
// Erzeugen einer neuen Stadtrad-Station
// ---------------------------------------------------------------

function createStadtrad() {
	// Zeichnen einschalten
	draw = new Draw({
		source: stadtrad_source_sqlite_temp, // Quelle des temporären Layers
		type: 'Point'
	});
	map.addInteraction(draw);
	
	// nach dem Beenden des Zeichnens
	draw.on('drawend', (e) => {
		// Zeichnen ausschalten
		map.removeInteraction(draw);
		
		// das gezeichnete Feature wurde an die Funktion übergeben
		var f = e.feature;
		// die Geometrie aus dem Feature extrahieren, weil die Koordinaten gebraucht werden
		var g = f.getGeometry();
		// in geographische Koordinaten transformieren
		var coord4326 = transform(g.getCoordinates(), 'EPSG:3857', 'EPSG:4326');
		// Koordinaten in das Formular eintragen
        stadtradLongitude.value = format(coord4326, '{x}', 6);
        stadtradLatitude.value = format(coord4326, '{y}', 6);
	}, this);
	
	// das Ändern der Lages des Punktes ermöglichen
	modify = new Modify({
		source: stadtrad_source_sqlite_temp
	});
	map.addInteraction(modify);

	// nach dem Ändern
	modify.on('modifyend', (e) => {
		// alle Features werden übergeben ...
		let features = e.features;
		// ... daher wird nur das erste Feature extrahiert
		let g = features.item(0).getGeometry();
		// in geographische Koordinaten transformieren
		let coord4326 = transform(g.getCoordinates(), 'EPSG:3857', 'EPSG:4326');
		// Koordinaten in das Formular eintragen
        stadtradLongitude.value = format(coord4326, '{x}', 6);
        stadtradLatitude.value = format(coord4326, '{y}', 6);
	});
}

// ---------------------------------------------------------------
// Wenn im Stadtrad-Formular auf Speichern geklickt wird.
// ---------------------------------------------------------------

stadtradSpeichern.addEventListener("click", (e) => {
    //stadtradSpeichern.submit;
    
	// damit keine neue Seite geladen wird
	e.preventDefault();
	
	// Je nachdem welcher Menüpunkt ausgewählt wurde ...
	let url;
	// ... wird entweder eine neue Stadtrad-Station hinzugefügt oder ...
	if (stadtradControlDraw.checked) {
		url = url_stadtrad_sqlite + '/create';
	// die geänderten Daten einer bereits bestehenden Station gespeichert.
	} else if (stadtradControlModify.checked) {
		url = url_stadtrad_sqlite + '/update';
	}

    let data = {
        "id": stadtradId.value,
        "station": stadtradStation.value,
        "longitude": stadtradLongitude.value,
        "latitude": stadtradLatitude.value
    }

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(data)
    })
    .then( response => response.json() )
    .then( data => {
		// Meldung, dass die Daten gespeichert/geändert wurden, werden vom Server geliefert
        stadtradMessage.innerHTML = data.message;

        // Wenn eine neue Stadtrad-Station erstellt wurde, dann ...
        if ( stadtradControlDraw.checked && data.status ) {
            // ... wird das Feature dem Stadtrad-Layer hinzugefügt und ...
            let coordinate = [ stadtradLongitude.value, stadtradLatitude.value ];
            let f = stadtrad_source_sqlite_temp.getClosestFeatureToCoordinate(coordinate);
            // ... die Properties mit den Werten aus dem Formular befüllt.
            f.setProperties({
                'id': stadtradId.value,
                'station': stadtradStation.value,
                'longitude': stadtradLongitude.value,
                'latitude': stadtradLatitude.value
            });
            f.id_ = stadtradId.value;

            // Das neu erzeugte Stadtrad-Feature wird dem Stadtrad-Layer hinzugefügt.
            //stadtrad_layer_sqlite.getSource().addFeature(f);
            stadtrad_source_sqlite.addFeature(f);
            // Die Quelle, in der das Stadtrad-Feature erstellt wurde, wird geleert.
            stadtrad_source_sqlite_temp.clear();
            
            // Stadtrad-Formular verstecken
            formStadtrad.style.display = "none";

            // Auswahl zurücksetzen
            resetSelection();
        }

        // Wenn die Daten einer Stadtrad-Station geändert wurden, ...
        if ( stadtradControlModify.checked && data.status ) {
            // ... werden die geänderten Formulardaten in das Feature geschrieben.
            feature.setProperties({
                'station': stadtradStation.value,
                'longitude': stadtradLongitude.value,
                'latitude': stadtradLatitude.value
            });
            
            // Stadtrad-Formular verstecken
            formStadtrad.style.display = "none";

            // Auswahl zurücksetzen
            resetSelection();
        }

        // Meldung nach 5s wieder verschwinden lassen
		setTimeout(removeMessage, 5000);
    })
    .catch( (error) => {
        //console.log(error);
        stadtradMessage.innerHTML = error;
        setTimeout(removeMessage, 5000);
    });

	// alle Interaktionen (snap, draw, modify) werden deaktiviert
	removeInteractions();
});


// ---------------------------------------------------------------
// Änderungen aus dem Feature in das Formular schreiben
// ---------------------------------------------------------------

function updateStadtrad(f) {
	var coordinate = f.getGeometry().getCoordinates();
	var coord4326 = transform(coordinate, 'EPSG:3857', 'EPSG:4326');
    stadtradId.value = f.id_;
    stadtradStation.value = f.get('station');
    stadtradLongitude.value = format(coord4326, '{x}', 6);
    stadtradLatitude.value = format(coord4326, '{y}', 6);

	modify.on('modifyend', function(e) {
		updateStadtrad(f);
	});
}


// ---------------------------------------------------------------
// Stadtrad-Station löschen
// ---------------------------------------------------------------

// Popup, wenn eine Stadtrad-Station gelöscht werden soll

function deleteStadtrad(f) {
	content.innerHTML = "<p><img src='../images/stadtrad.svg' style='height: 2em;'>" +
						"<span style='margin-left: 10px;'>Station: " + f.id_ + "</span></p>" +
						"<p>" + f.get("station") + "</p>" +
						"<p>Soll die Station gelöscht werden?</p>"
    overlay.setPosition(f.getGeometry().getCoordinates());
    //console.log(f.getGeometry().getCoordinates());

	// Daten per AJAX (Asynchronous JavaScript and XML) übertragen
    popupOk.addEventListener("click", () => {
        //console.log(f.id_);

        //console.log(f);
        try {
            let fid = f.id_;
            stadtrad_source_sqlite.removeFeature(f);
            fetch(url_stadtrad_sqlite + '/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                body: JSON.stringify( { "id": fid } )
            })
            .then( response => response.json() )
            .then( data => {
                // Meldung, dass die Daten gespeichert/geändert wurden, werden vom Server geliefert
                stadtradMessage.innerHTML = data.message;
                // Meldung nach 5s wieder verschwinden lassen
                setTimeout(removeMessage, 5000);
            })
            .catch( error => {
                stadtradMessage.innerHTML = error;
                setTimeout(removeMessage, 5000);
            });
        } catch (error) { }
		
        // Popup schließen
		overlay.setPosition(undefined);
		closer.blur();
	});

    popupCancel.style.display = "inline";

    popupCancel.addEventListener("click", function() {
        // Popup schließen
		overlay.setPosition(undefined);
		closer.blur();
        feature = none;
	});
}

// ---------------------------------------------------------------
// Stadtrad-Station-Popup
// ---------------------------------------------------------------

function showPopup(f) {
    content.innerHTML = "<p><img src='/images/stadtrad.svg' style='height: 2em;'>" +
                        "<span style='margin-left: 10px;'>Station: " + feature.id_ + "</span></p>" +
                        "<p>" + feature.get("station") + "</p>"
    overlay.setPosition(f.getGeometry().getCoordinates());

    popupCancel.style.display = "none";

    popupOk.addEventListener("click", function() {
		// Popup schließen
		overlay.setPosition(undefined);
		closer.blur();
	});
}

// ---------------------------------------------------------------
// Funktionen, die wiederkehrende Aktionen ausführen
// ---------------------------------------------------------------

// Meldung löschen
function removeMessage() {
    stadtradMessage.innerHTML = "";
}

// Interaktionen deaktivieren
function removeInteractions() {
	map.removeInteraction(draw);
	map.removeInteraction(snap);
	map.removeInteraction(modify);
}

// Formularinhalte löschen
function clearForm() {
    stadtradId.value = "";
    stadtradStation.value = "";
    stadtradLongitude.value = "";
    stadtradLatitude.value = "";
}

function resetSelection() {
    // CRUD-Aktionen auf nix setzen und die andere Menüpunkte ENABLEn.
    stadtradControlNone.checked = true;
    stadtradControlDraw.disabled = false;
    stadtradControlModify.disabled = false;
    stadtradControlDelete.disabled = false;
}


// ---------------------------------------------------------------
// Manchmal tritt ein Offset zwischen Mauszeiger und Punkt auf.
// ---------------------------------------------------------------
//map.updateSize();
