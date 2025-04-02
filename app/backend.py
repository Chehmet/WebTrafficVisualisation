from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
CORS(app)

data_store = []

@app.route("/receive", methods=["POST"])
def receive_data():
    package = request.get_json()
    data_store.append(package)
    print(f"Received: {package}")
    return jsonify({"status": "received"}), 200

@app.route("/data", methods=["GET"])
def get_data():
    return jsonify(data_store)

@app.route("/")
def serve_index():
    return send_from_directory(app.static_folder, "index.html")

@app.route("/<path:path>")
def serve_static(path):
    return send_from_directory(app.static_folder, path)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)