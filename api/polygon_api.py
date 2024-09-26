from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv
import os
from sqlalchemy import text  # Importiere Text für rohe SQL-Abfragen

# Lade Umgebungsvariablen aus der .env-Datei
load_dotenv()

app = Flask(__name__)

# CORS für die gesamte App aktivieren
CORS(app, resources={r"/api/*": {"origins": "*"}})

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
@app.route('/api/polygons', methods=['POST'])
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

# Basis-Route
@app.route('/')
def index():
    return "Willkommen bei der Polygon API!"

if __name__ == '__main__':
    app.run(debug=True)
