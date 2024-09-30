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
    ArcGIS_World_Imagery, // Satelliten-Layer hinzufügen
  ],
});
