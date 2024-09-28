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
    try:
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
    except Exception as e:
        return {'error': str(e)}

# Beispielgeometrie zum Testen (ersetze sie durch die tatsächlichen Geometriedaten)
geometry_example = {
    "type": "Polygon",
    "coordinates": [[[9.956775885, 53.559507401],
                     [9.959945694, 53.555424443],
                     [9.969054722, 53.559190292],
                     [9.956775885, 53.559507401]]]
}

# Führe die Analyse durch und gebe die Ergebnisse aus
result = process_polygon_analysis(geometry_example)
print(result)
