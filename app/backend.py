from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder="static")
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
    """Отправляет данные на фронтенд"""
    return jsonify(data_store)

@app.route("/")
def serve_index():
    """Отображает главную страницу"""
    return send_from_directory("static", "index.html")

@app.route("/<path:path>")
def serve_static(path):
    """Раздает статические файлы (JS, CSS, favicon)"""
    return send_from_directory("static", path)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
