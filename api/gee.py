import ee
from dotenv import load_dotenv


"""
Login daten für gee:
email:falko.behre97@gmail.com
pw: Petr0siliu$63
"""

load_dotenv()
# Initialisiere Earth Engine
ee.Initialize()

# Erstelle ein Polygon für das Analysegebiet
polygon = ee.Geometry.Polygon([[
    [9.956775885, 53.559507401],
    [9.959945694, 53.555424443],
    [9.969054722, 53.559190292],
    [9.956775885, 53.559507401]
]])

# Lade Sentinel-2-Daten
sentinel2 = ee.ImageCollection('COPERNICUS/S2') \
    .filterBounds(polygon) \
    .filterDate('2021-01-01', '2021-12-31') \
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20)) \
    .median() \
    .clip(polygon)

# Berechne den NDVI (Normalised Difference Vegetation Index)
ndvi = sentinel2.normalizedDifference(['B8', 'B4']).rename('NDVI')

# Visualisierungseinstellungen
ndvi_params = {'min': 0, 'max': 1, 'palette': ['blue', 'white', 'green']}

# Erzeuge eine URL zur Visualisierung
url = ndvi.getThumbURL({'region': polygon.getInfo(), 'min': 0, 'max': 1, 'dimensions': 512})
print('NDVI Visualization URL:', url)
