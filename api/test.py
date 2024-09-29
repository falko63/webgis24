import ee
from dotenv import load_dotenv
import os
from flask import Flask, request, jsonify

# Lade Umgebungsvariablen aus der .env-Datei
load_dotenv()

# Initialisiere Flask
app = Flask(__name__)

# Verwende deine Service Account Anmeldedaten
service_account = os.getenv('GEE_SERVICE_ACCOUNT')
json_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')

# Initialisiere die Authentifizierung für GEE
try:
    credentials = ee.ServiceAccountCredentials(service_account, json_path)
    ee.Initialize(credentials)
    print("Erfolgreich mit Google Earth Engine verbunden!")
except Exception as e:
    print(f"Fehler bei der GEE-Authentifizierung: {e}")

# Route für die Verarbeitung von GeoJSON
@app.route('/process-geojson', methods=['POST'])
def process_geojson():
    try:
        # Empfange die GeoJSON-Daten aus der POST-Anfrage
        data = request.json
        geometry = data.get('geometry')  # Extrahiere die Geometrie

        if not geometry:
            return jsonify({'error': 'Keine Geometrie angegeben'}), 400
        
        # Erstelle ein GEE Geometry-Objekt aus den GeoJSON-Daten
        aoi = ee.Geometry(geometry)

        # Lade Sentinel-2 Bilddaten, um ein NDVI-Bild zu erzeugen
        sentinel2 = ee.ImageCollection('COPERNICUS/S2') \
            .filterBounds(aoi) \
            .filterDate('2021-01-01', '2021-12-31') \
            .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20)) \
            .median()

        # Berechne den NDVI (Normalized Difference Vegetation Index)
        ndvi = sentinel2.normalizedDifference(['B8', 'B4']).rename('NDVI')

        # Erstelle eine Visualisierungs-URL für den NDVI
        url = ndvi.getThumbURL({
            'min': 0, 
            'max': 1, 
            'palette': ['blue', 'white', 'green'], 
            'dimensions': 512, 
            'region': aoi.getInfo()['coordinates']
        })

        # Erfolgreiche Rückgabe der Visualisierungs-URL
        return jsonify({'url': url})

    except Exception as e:
        print(f"Fehler bei der Verarbeitung: {e}")
        return jsonify({'error': str(e)}), 500

# Basis-Route zum Testen der API
@app.route('/')
def index():
    return "GEE Test-API ist aktiv!"

if __name__ == '__main__':
    app.run(debug=True)

"""

curl -X POST http://127.0.0.1:5000/process-geojson \
  -H "Content-Type: application/json" \
  -d '{geometry: {"type": "Polygon", "coordinates": [[[9.956775885,53.559507401],[9.959945694,53.555424443],[9.969054722,53.559190292],[9.956775885,53.559507401]]]}}'

{"type":"Polygon","coordinates":[[[10.02250946,53.539948994],[10.030234222,53.550454912],[9.984057312,53.551882699],[9.996931915,53.54474328],[10.02250946,53.539948994]]]}

{"geometry": '{"type":"Polygon","coordinates":[9.956775885,53.559507401],[9.959945694,53.555424443],[9.969054722,53.559190292],[9.956775885,53.559507401]]}'}

"""

geometry
: 
"{\"type\":\"Polygon\",\"coordinates\":[[[9.928267365,53.572172471],[9.95420057,53.567186192],[9.912458998,53.552351759],[9.928267365,53.572172471]]]}"