from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
import os

# Lade Umgebungsvariablen aus der .env-Datei
load_dotenv()

app = Flask(__name__)

# Verwende die Umgebungsvariable für die Datenbank-URI
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False



db = SQLAlchemy(app)

# Beispiel-Modell für Polygone
class Polygon(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    area = db.Column(db.Float, nullable=False)
    geometry = db.Column(db.String, nullable=False)  # Geometrie als WKT (Well-known Text)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'area': self.area,
            'geometry': self.geometry
        }

# Route für die API
@app.route('/api/polygons', methods=['GET'])
def get_polygons():
    polygons = Polygon.query.all()
    return {'polygons': [polygon.to_dict() for polygon in polygons]}

# Route zum Hinzufügen eines neuen Polygons
@app.route('/api/polygons', methods=['POST'])
def add_polygon():
    data = request.get_json()  # JSON-Daten aus der Anfrage extrahieren
    name = data.get('name')
    area = data.get('area')
    geometry = data.get('geometry')

    # Neues Polygon erstellen
    new_polygon = Polygon(name=name, area=area, geometry=geometry)
    db.session.add(new_polygon)
    db.session.commit()

    return jsonify({'message': 'Polygon erfolgreich hinzugefügt!'}), 201

# Basis-Route hinzufügen
@app.route('/')
def index():
    return "Willkommen bei der Polygon API! Verwende /api/polygons, um die API aufzurufen."

if __name__ == '__main__':
    app.run(debug=True)
