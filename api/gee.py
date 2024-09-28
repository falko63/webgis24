import ee
import os
from dotenv import load_dotenv

# Lade Umgebungsvariablen aus der .env-Datei
load_dotenv()

# Der Service Account und der Pfad zur JSON-Datei
service_account = os.getenv('GEE_SERVICE_ACCOUNT')
json_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')

# Erstelle die Anmeldedaten mit dem Service Account
credentials = ee.ServiceAccountCredentials(service_account, json_path)

# Initialisiere Earth Engine mit den Service Account Credentials
ee.Initialize(credentials)

def process_polygon_analysis(geometry):
    # Erstelle ein Geometry-Objekt aus den Geometriedaten
    polygon = ee.Geometry(geometry)

    # Lade Sentinel-2-Daten
    sentinel2 = ee.ImageCollection('COPERNICUS/S2') \
        .filterBounds(polygon) \
        .filterDate('2021-01-01', '2021-12-31') \
        .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20)) \
        .median() \
        .clip(polygon)

    # Berechne den NDVI (Normalized Difference Vegetation Index)
    ndvi = sentinel2.normalizedDifference(['B8', 'B4']).rename('NDVI')

    # Erzeuge eine URL zur Visualisierung
    url = ndvi.getThumbURL({'region': polygon.getInfo(), 'min': 0, 'max': 1, 'dimensions': 512})
    return {'NDVI': ndvi.getInfo(), 'url': url}
