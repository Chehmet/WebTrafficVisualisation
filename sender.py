import csv
import json
import time
import requests
import os

CSV_FILE = os.path.join(os.getcwd(), "ip_addresses.csv") 
SERVER_URL = "http://127.0.0.1:5000"

def send_data(csv_file, server_url):
    with open(csv_file, newline='', encoding="utf-8") as file:
        reader = csv.DictReader(file, delimiter=',')  # Changed delimiter to comma
        # Convert fieldnames to lowercase with underscores
        reader.fieldnames = [name.lower().replace(" ", "_") for name in reader.fieldnames]
        data = list(reader)

    for row in data:
        package = {
            "ip": row["ip_address"],
            "latitude": float(row["latitude"]),
            "longitude": float(row["longitude"]),
            "timestamp": int(row["timestamp"]),
            "suspicious": float(row["suspicious"])  # Changed to float since your data has 0.0
        }

        response = requests.post(f"{server_url}/receive", json=package)
        print(f"Sent: {package}, Response: {response.status_code}")
        time.sleep(0.1)  

if __name__ == "__main__":
    send_data(CSV_FILE, SERVER_URL)