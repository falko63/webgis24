# pylint: disable=missing-module-docstring
# pylint: disable=missing-class-docstring
# pylint: disable=missing-function-docstring
# pylint: disable=unused-argument
# pylint: disable=attribute-defined-outside-init
# pylint: disable=line-too-long

# pip install --upgrade flask
# pip install --upgrade flask_cors
# pip install --upgrade watchdog

import os
import sqlite3
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
app.config['DEBUG'] = True
app.config['JSON_AS_ASCII'] = False

CORS(app)

database = (os.path.split(os.path.abspath(__file__)))[0] + "/stadtrad.db"

@app.route('/')
def index():
    return { "message": "Stadtrad-API (Sqlite)" }

@app.route('/get')
def get_stadtrad():
    with sqlite3.connect(database) as con:
        con.row_factory = sqlite3.Row  # Dictionary Cursor
        cur = con.cursor()
        cur.execute('SELECT * FROM stadtrad;')
        feature_collection = {
            "type": "FeatureCollection"
        }
        features = []
        for row in cur.fetchall():
            feature = {
                "type": "Feature",
                "id": row['id'],
                "properties": { "station": row['station'] },
                "geometry": {
                    "type": "Point",
                    "coordinates": [ row['longitude'], row['latitude'] ]
                }
            }
            features.append(feature)
        feature_collection.update( { "features": features } )
        return jsonify(feature_collection)

@app.route('/get/<sid>')
def get_stadtrad_by_id(sid):
    with sqlite3.connect(database) as con:
        con.row_factory = sqlite3.Row  # Dictionary Cursor
        cur = con.cursor()
        cur.execute(f'SELECT * FROM stadtrad WHERE id={sid};')
        results = cur.fetchone()
        if results is None:
            return { "message": "Datensatz nicht vorhanden!" }

        feature_collection = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "id": results['id'],
                    "properties": { "station": results['station'] },
                    "geometry": {
                        "type": "Point",
                        "coordinates": [ results['longitude'], results['latitude'] ]
                    }
                }
            ]
        }
        return jsonify(feature_collection)

@app.route('/create', methods=['POST'])
def create_stadtrad():
    content = request.get_json()
    print(content)
    try:
        with sqlite3.connect(database) as con:
            cur = con.cursor()
            cur.execute("""INSERT INTO stadtrad
                           VALUES (:id, :station, :longitude, :latitude)""", content)
    except sqlite3.Error as err:
        return { "status": False,
                 "message": "Ein Fehler ist aufgetreten!",
                 "error": str(err) }

    return { "status": True, "message": "Datensatz eingefügt!" }

@app.route('/update', methods=['PUT', 'POST'])
def update_stadtrad():
    content = request.get_json()
    try:
        with sqlite3.connect(database) as con:
            cur = con.cursor()
            cur.execute("""UPDATE stadtrad SET station=:station,
                                               longitude=:longitude,
                                               latitude=:latitude
                            WHERE id=:id;""", content)
    except sqlite3.Error as err:
        return { "status": False,
                 "message": "Ein Fehler ist aufgetreten!",
                 "error": str(err) }

    return { "status": True, "message": "Datensatz geändert!" }

@app.route('/delete', methods=['DELETE'])
def delete_stadtrad():
    content = request.get_json()
    try:
        with sqlite3.connect(database) as con:
            cur = con.cursor()
            cur.execute("DELETE FROM stadtrad WHERE id=:id;", content)
    except sqlite3.Error as err:
        return { "status": False,
                 "message": "Ein Fehler ist aufgetreten!",
                 "error": str(err) }

    return { "status": True, "message": "Datensatz gelöscht!" }


if __name__ == '__main__':
    PORT = 8082
    app.run(host='0.0.0.0', port=PORT)
