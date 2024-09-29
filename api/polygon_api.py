
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
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})


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

# Route zum Verarbeiten von Gebieten
@app.route('/api/process_area', methods=['POST'])
def process_area():
    print("Verarbeite Gebiet...")
    data = request.json
    print("Empfange Daten:", data)
    coordinates = data.get('coordinates')
    if not coordinates:
        print("Fehler: Keine Koordinaten angegeben")
        return jsonify({'error': 'Keine Koordinaten angegeben'}), 400
    
    # Hier kannst du die GEE-Analyse oder andere Logik hinzufügen

    return jsonify({"message": "Analyse erfolgreich!"})

# Basis-Route
@app.route('/')
def index():
    return "Willkommen bei der Polygon API!"

if __name__ == '__main__':
    app.run(debug=True)
