
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv
import os
from sqlalchemy import text


# Lade Umgebungsvariablen aus der .env-Datei
load_dotenv()

app = Flask(__name__)

# CORS für die gesamte App aktivieren
CORS(app, resources={r"/*": {"origins": "*"}})


# Verwende die Umgebungsvariable für die Datenbank-URI
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Beispiel-Modell für Polygone
class Polygon(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    area = db.Column(db.Float, nullable=False)
    geometry = db.Column(db.String, nullable=False)  # Als String speichern

# Route für die API (GET) - hole die Geometrie als GeoJSON
@app.route('/api/polygons', methods=['GET'])
def get_polygons():
    query = """
        SELECT id, name, area, ST_AsGeoJSON(geometry) as geometry 
        FROM polygon;
    """
    result = db.session.execute(text(query)).fetchall()

    polygons = []
    for row in result:
        polygons.append({
            'id': row.id,
            'name': row.name,
            'area': row.area,
            'geometry': row.geometry  # GeoJSON als String
        })

    return jsonify({'polygons': polygons})

# Route zum Hinzufügen eines neuen Polygons (POST)
@app.route('/api/polygon', methods=['POST'])
def add_polygon():
    data = request.get_json()
    name = data.get('name')
    area = data.get('area')
    geometry = data.get('geometry')

    # Verwandle das GeoJSON-Format in eine Geometrie
    query = """
        INSERT INTO polygon (name, area, geometry) 
        VALUES (:name, :area, ST_GeomFromGeoJSON(:geometry));
    """
    db.session.execute(text(query), {'name': name, 'area': area, 'geometry': geometry})
    db.session.commit()

    return jsonify({'message': 'Polygon erfolgreich hinzugefügt!'}), 201


import ee
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


@app.route('/api/process_area', methods=['POST'])
def process_area():
    data = request.json  # Check if JSON data is received
    geometry = data.get('geometry')  # Extract coordinates from JSON
    
    if not geometry:
        return jsonify({'error': 'No coordinates provided'}), 400  # Return 400 if no geometry or coordinates are found
    
    try:
        geometry = ee.Geometry(geometry)
        # Your GEE logic goes here, ensure that the GEE API is correctly set up
        ndvi_expression = '(B8 - B4) / (B8 + B4)'
        ndvi_palette = ['blue', 'white', 'green']
        ndvi_min_max = [0, 1]  # NDVI range
        
        # Fetch Sentinel-2 images
        sentinel2 = ee.ImageCollection('COPERNICUS/S2') \
            .filterBounds(ee.Geometry(geometry)) \
            .filterDate('2021-01-01', '2021-12-31') \
            .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20)) \
            .median()

        # Generate visualization URL
        visualization_url = generate_visualization_url(
            sentinel2, 
            ndvi_expression, 
            ndvi_palette, 
            ndvi_min_max, 
            geometry
        )

        return jsonify({'url': visualization_url})
    except Exception as e:
        # Log the error and return a 500 response with the error message
        print(f"Error during GEE analysis: {e}")
        return jsonify({'error': str(e)}), 500


def generate_visualization_url(image, index_expression, palette, min_max, geometry, dimensions=512):
    # Create dictionary of Sentinel-2 bands to be used in the index expression
    bands = {
        'B2': image.select('B2'), 'B3': image.select('B3'),
        'B4': image.select('B4'), 'B5': image.select('B5'),
        'B6': image.select('B6'), 'B7': image.select('B7'),
        'B8': image.select('B8'), 'B8a': image.select('B8A'),
        'B11': image.select('B11')
    }
    
    # Apply the index expression to the image (e.g., NDVI, EVI, etc.)
    index_image = image.expression(index_expression, bands).rename('index')
    
    # Convert the fetched geometry (GeoJSON) into an ee.Geometry object for GEE processing
    aoi = ee.Geometry(geometry)
    
    # Generate the visualization URL using the index image and geometry (AOI)
    url = index_image.getThumbURL({
        'min': min_max[0], 'max': min_max[1], 
        'dimensions': dimensions, 
        'palette': palette, 
        'region': aoi  # Use the geometry's coordinates for the region
    })
    
    return url

# Basis-Route
@app.route('/')
def index():
    return "Willkommen bei der Polygon API!"

if __name__ == '__main__':
    app.run(debug=True)
