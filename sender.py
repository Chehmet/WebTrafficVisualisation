import csv
import time
import requests
import os

CSV_FILE = os.path.join(os.getcwd(), "ip_addresses.csv")
SERVER_URL = os.getenv('BACKEND_URL', "http://backend:5000")

def send_data(csv_file, server_url):
    time.sleep(5)

    with open(csv_file, newline='', encoding="utf-8") as file:
        reader = csv.DictReader(file, delimiter=',')
        reader.fieldnames = [name.lower().replace(" ", "_") for name in reader.fieldnames]
        data = list(reader)

    for row in data:
        package = {
            "ip": row["ip_address"],
            "latitude": float(row["latitude"]),
            "longitude": float(row["longitude"]),
            "timestamp": int(row["timestamp"]),
            "suspicious": float(row["suspicious"])
        }

        try:
            response = requests.post(f"{server_url}/receive", json=package, timeout=5)
            print(f"Sent: {package}, Response: {response.status_code}")
        except requests.exceptions.ConnectionError as e:
            print(f"Connection Error sending data: {e}")
        except Exception as e:
            print(f"Error sending data: {e}")
        time.sleep(0.1)

if __name__ == "__main__":
    send_data(CSV_FILE, SERVER_URL)
