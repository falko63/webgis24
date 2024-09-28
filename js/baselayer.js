import Group from "ol/layer/Group";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import XYZ from "ol/source/XYZ";

// WMTS TopPlusOpen ---------------------------------------------------------------------
import WMTS, { optionsFromCapabilities } from "ol/source/WMTS";
import WMTSCapabilities from "ol/format/WMTSCapabilities";

let parser = new WMTSCapabilities();

const OSM_Map = new TileLayer({
  id: "OSM",
  title: "OpenStreetMap",
  type: "base",
  visible: true,
  source: new OSM(),
});

// --------------------------------------------------------------------------------------

const topplus_response = await fetch(
  "https://sgx.geodatenzentrum.de/wmts_topplus_web_open/1.0.0/WMTSCapabilities.xml"
);
const topplus_text = await topplus_response.text();
let topplus_result = parser.read(topplus_text);

const WMTS_TopPlusOpen = new TileLayer({
  id: "WMTS_topplusDE",
  title: "WMTS TopPlusOpen DE",
  type: "base",
  visible: false,
  source: new WMTS(
    optionsFromCapabilities(topplus_result, {
      layer: "web",
      matrixSet: "WEBMERCATOR",
    })
  ),
});

// --------------------------------------------------------------------------------------

const basemapde_response = await fetch(
  "https://sgx.geodatenzentrum.de/wmts_basemapde/1.0.0/WMTSCapabilities.xml"
);
const basemapde_text = await basemapde_response.text();
let basemapde_result = parser.read(basemapde_text);

const WMTS_BasemapDE = new TileLayer({
  id: "WMTS_BasemapDE",
  title: "WMTS Basemap DE",
  type: "base",
  visible: false,
  source: new WMTS(
    optionsFromCapabilities(basemapde_result, {
      layer: "de_basemapde_web_raster_farbe",
      matrixSet: "GLOBAL_WEBMERCATOR",
    })
  ),
});

// --------------------------------------------------------------------------------------
// Neuer Satelliten-Layer von ArcGIS
const ArcGIS_World_Imagery = new TileLayer({
  id: "Satellit",
  title: "Satellit",
  type: "base",
  visible: false, // Setze auf 'true', wenn du ihn standardmäßig anzeigen möchtest
  source: new XYZ({
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  }),
});

// --------------------------------------------------------------------------------------

export const BASELAYER = new Group({
  id: "baselayer",
  title: "Basiskarten",
  layers: [
    OSM_Map,
    WMTS_BasemapDE,
    ArcGIS_World_Imagery, // Satelliten-Layer hinzufügen
  ],
});
