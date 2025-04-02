const UPDATE_INTERVAL = 4000;
const POINT_LIFETIME = 15000;
const MAX_CHART_POINTS = 20;

let map;
let activePoints = new Map();
let countryStats = new Map();
let activityHistory = [];
let totalCount = 0;
let normalCount = 0;
let suspiciousCount = 0;
let activityChart;

function init() {
    console.log("Initializing application...");
    
    try {
        initMap();
        initChart();
        loadTrafficData();
        setInterval(loadTrafficData, UPDATE_INTERVAL);
    } catch (error) {
        console.error("Initialization error:", error);
    }
}

function initMap() {
    map = L.map('map', {
        center: [20, 0],
        zoom: 2,
        zoomControl: true,
        preferCanvas: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
    }).addTo(map);

    console.log("Map initialized successfully");
}

function initChart() {
    const ctx = document.getElementById('activity-chart').getContext('2d');
    
    activityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array(MAX_CHART_POINTS).fill(''),
            datasets: [{
                label: 'Active Connections',
                data: Array(MAX_CHART_POINTS).fill(0),
                borderColor: '#4facfe',
                backgroundColor: 'rgba(79, 172, 254, 0.1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: true }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                },
                x: {
                    grid: { display: false },
                    ticks: { display: false }
                }
            },
            animation: {
                duration: 500
            }
        }
    });
    
    console.log("Chart initialized successfully");
}

async function loadTrafficData() {
    try {
        const response = await fetch('/data');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`Received ${data.length} data points`);
        
        processDataPoints(data);
        updateUI();
    } catch (error) {
        console.error('Error loading traffic data:', error);
    }
}

function processDataPoints(data) {
    const currentTime = Date.now();
    let newPointsCount = 0;

    data.forEach(point => {
        const pointKey = `${point.latitude},${point.longitude}`;
        
        if (!activePoints.has(pointKey)) {
            newPointsCount++;
            addPointToMap(point, currentTime);
            updateCounters(point);
        }
    });

    updateActivityHistory(newPointsCount);
    removeExpiredPoints(currentTime);
}

function addPointToMap(point, timestamp) {
    const pointKey = `${point.latitude},${point.longitude}`;
    const color = point.suspicious ? '#ff4d4d' : '#5cb85c';
    
    const marker = L.circleMarker([point.latitude, point.longitude], {
        radius: 8,
        color: color,
        fillColor: color,
        fillOpacity: 0.7,
        weight: 1
    }).addTo(map);
    
    let growing = true;
    const pulseInterval = setInterval(() => {
        marker.setRadius(growing ? 10 : 8);
        growing = !growing;
    }, 1000);
    
    getCountry(point.latitude, point.longitude).then(country => {
        marker.bindPopup(`
            <div class="popup-content">
                <p><strong>IP:</strong> ${point.ip}</p>
                <p><strong>Location:</strong> ${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}</p>
                <p><strong>Country:</strong> ${country}</p>
                <p><strong>Status:</strong> <span style="color:${color}">${
                    point.suspicious ? 'Suspicious' : 'Normal'
                }</span></p>
            </div>
        `);
        
        countryStats.set(country, (countryStats.get(country) || 0) + 1);
    });
    
    activePoints.set(pointKey, {
        marker: marker,
        timestamp: timestamp,
        pulseInterval: pulseInterval
    });
}

async function getCountry(lat, lon) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=3`
        );
        const data = await response.json();
        return data.address?.country || 'Unknown';
    } catch (error) {
        console.error("Error fetching country:", error);
        return 'Unknown';
    }
}

function updateCounters(point) {
    totalCount++;
    if (point.suspicious) {
        suspiciousCount++;
    } else {
        normalCount++;
    }
}

function updateActivityHistory(newPoints) {
    activityHistory.push(newPoints);
    if (activityHistory.length > MAX_CHART_POINTS) {
        activityHistory.shift();
    }
    
    activityChart.data.datasets[0].data = [...activityHistory];
    activityChart.update();
}

function removeExpiredPoints(currentTime) {
    activePoints.forEach((point, key) => {
        if (currentTime - point.timestamp > POINT_LIFETIME) {
            map.removeLayer(point.marker);
            clearInterval(point.pulseInterval);
            activePoints.delete(key);
        }
    });
}

function updateUI() {
    document.getElementById('total-count').textContent = totalCount;
    document.getElementById('normal-count').textContent = normalCount;
    document.getElementById('suspicious-count').textContent = suspiciousCount;
    
    updateCountryList();
}

function updateCountryList() {
    const topCountries = [...countryStats.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const countryList = document.getElementById('top-countries');
    countryList.innerHTML = '';
    
    topCountries.forEach(([country, count]) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="country-name">${country}</span>
            <span class="country-count">${count}</span>
        `;
        countryList.appendChild(li);
    });
}

document.addEventListener('DOMContentLoaded', init);