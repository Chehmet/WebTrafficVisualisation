# Traffic Analytics Dashboard

The Traffic Analytics Dashboard is a project designed to visualize web traffic from various locations around the world. The primary goal is to strengthen knowledge in backend development using Python and Flask, as well as frontend development using Three.js for interactive and visually appealing visualizations.

## Features
- **Data Generation**: A Python script reads a CSV file containing traffic data and sends it to a Flask server.
- **Data Receiving**: The Flask server parses the received data and sends it to the frontend.
- **Interactive Visualization**: The frontend uses Three.js to display traffic locations on a globe.
- **Real-time Updates**: The dashboard updates in real-time, showing the most common locations and activity peaks.
- **Docker Deployment**: The entire system is containerized using Docker for easy deployment and reproducibility.

## Components

### Backend (Flask)
The Flask server receives traffic data from the sender script and serves it to the frontend. It includes endpoints for receiving data and serving static files.

### Frontend (Three.js)
The frontend uses Three.js to create an interactive globe that displays traffic locations. It includes a legend, activity chart, and a list of top countries.

### Data Sender (Python Script)
A Python script reads traffic data from a CSV file and sends it to the Flask server at specified intervals.

## How system looks while running
![Screenshot 1](image.png)


## Setup

### Prerequisites
- Docker
- Docker Compose

### Installation
1. Clone the repository:
   ```sh
   git clone https://github.com/chehmet/traffic-analytics-dashboard.git
   cd traffic-analytics-dashboard
   ```
2. Build and run the Docker containers:
   ```sh
   docker-compose up --build
   ```
3. Open your browser and navigate to `http://localhost:5000` to view the dashboard.

## Usage
1. Ensure the sender script is running and sending data to the Flask server.
2. Observe the real-time updates on the dashboard, including the globe visualization and activity charts.

## License
This project is licensed under the MIT License.

## Contact
For any questions or feedback, please contact [me in telegtam](https://t.me/Chehmet).
