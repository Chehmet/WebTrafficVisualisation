import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const UPDATE_INTERVAL = 4000;
const POINT_LIFETIME = 10000;
const MAX_CHART_POINTS = 20;
const OPENCAGE_API_KEY = '0119a06457e145afa85e67718e1778b1';

let scene, camera, renderer, globe;
let raycaster;
let mouse;
let controls;
let activePoints = new Map();
let countryStats = new Map();
let activityHistory = [];
let totalCount = 0;
let normalCount = 0;
let suspiciousCount = 0;
let activityChart;
let tooltip;
let pointsGroup;

function init() {
    const canvas = document.getElementById('map');
    if (!canvas) {
        console.error('Canvas element with id "map" not found.');
        return;
    }

    initializeTooltip();
    initScene();
    initChart();
    loadTrafficData();
    setInterval(loadTrafficData, UPDATE_INTERVAL);
    animate();
}

function initializeTooltip() {
    tooltip = document.createElement('div');
    tooltip.id = 'tooltip';
    tooltip.style.position = 'absolute';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.background = '#333';
    tooltip.style.color = '#fff';
    tooltip.style.padding = '8px';
    tooltip.style.borderRadius = '4px';
    tooltip.style.display = 'none';
    tooltip.style.zIndex = 1000;
    document.body.appendChild(tooltip);
}

function initScene() {
    const canvasContainer = document.getElementById('map');
    const width = canvasContainer.clientWidth;
    const height = canvasContainer.clientHeight;

    renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvasContainer });
    renderer.setSize(width, height);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 150;

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('worldmap.jpg', (texture) => {
        const sphereGeometry = new THREE.SphereGeometry(50, 64, 64);
        const sphereMaterial = new THREE.MeshBasicMaterial({ map: texture });
        globe = new THREE.Mesh(sphereGeometry, sphereMaterial);
        scene.add(globe);
    });

    pointsGroup = new THREE.Group();
    scene.add(pointsGroup);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    const container = document.getElementById('map');
    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

function onMouseMove(event) {
    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
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
            animation: { duration: 500 }
        }
    });
}

async function loadTrafficData() {
    try {
        const response = await fetch('/data');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

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
        const key = `${point.latitude},${point.longitude}`;
        if (!activePoints.has(key)) {
            newPointsCount++;
            addPointToGlobe(point, currentTime);
            updateCounters(point);
        }
    });

    updateActivityHistory(newPointsCount);
    removeExpiredPoints(currentTime);
}

function latLonToVector3(lat, lon, radius = 50) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
        -(radius * Math.sin(phi) * Math.cos(theta)),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    );
}

function addPointToGlobe(point, timestamp) {
    const color = point.suspicious ? 0xff4d4d : 0x5cb85c;
    const geometry = new THREE.SphereGeometry(0.8, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color });
    const marker = new THREE.Mesh(geometry, material);
    marker.userData = { ...point };
    pointsGroup.add(marker);

    const position = latLonToVector3(point.latitude, point.longitude);
    marker.position.copy(position);

    getCountry(point.latitude, point.longitude).then(country => {
        marker.userData.country = country;
        countryStats.set(country, (countryStats.get(country) || 0) + 1);
        updateCountryList();
    });

    activePoints.set(`${point.latitude},${point.longitude}`, {
        marker,
        timestamp
    });

    setTimeout(() => {
        removePointFromGlobe(`${point.latitude},${point.longitude}`);
    }, POINT_LIFETIME);
}

async function getCountry(lat, lon) {
    try {
        const res = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=${OPENCAGE_API_KEY}`);
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        return data.results[0]?.components?.country || 'Unknown';
    } catch (e) {
        console.error('Error fetching country:', e);
        return 'Unknown';
    }
}

function removePointFromGlobe(key) {
    const entry = activePoints.get(key);
    if (entry) {
        pointsGroup.remove(entry.marker);
        activePoints.delete(key);
    }
}

function updateCounters(point) {
    totalCount++;
    point.suspicious ? suspiciousCount++ : normalCount++;
}

function updateActivityHistory(newPoints) {
    activityHistory.push(newPoints);
    if (activityHistory.length > MAX_CHART_POINTS) activityHistory.shift();
    activityChart.data.datasets[0].data = [...activityHistory];
    activityChart.update();
}

function removeExpiredPoints(currentTime) {
    for (let [key, value] of activePoints) {
        if (currentTime - value.timestamp > POINT_LIFETIME) {
            removePointFromGlobe(key);
        }
    }
}

function updateUI() {
    document.getElementById('total-count').textContent = totalCount;
    document.getElementById('normal-count').textContent = normalCount;
    document.getElementById('suspicious-count').textContent = suspiciousCount;
}

function updateCountryList() {
    const topCountries = [...countryStats.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const countryList = document.getElementById('top-countries');
    countryList.innerHTML = '';

    topCountries.forEach(([country, count]) => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="country-name">${country}</span><span class="country-count">${count}</span>`;
        countryList.appendChild(li);
    });
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(pointsGroup.children);

    tooltip.style.display = 'none';

    if (intersects.length > 0) {
        const intersectedObject = intersects[0].object;
        if (intersectedObject.userData) {
            const userData = intersectedObject.userData;
            tooltip.style.display = 'block';
            tooltip.style.left = `${mouse.x * 0.5 * window.innerWidth + window.innerWidth/2 + 10}px`;
            tooltip.style.top = `${-mouse.y * 0.5 * window.innerHeight + window.innerHeight/2 + 10}px`;
            tooltip.innerHTML = `
                <strong>IP:</strong> ${userData.ip || 'N/A'}<br>
                <strong>Location:</strong> ${userData.latitude ? userData.latitude.toFixed(4) : 'N/A'}, ${userData.longitude ? userData.longitude.toFixed(4) : 'N/A'}<br>
                <strong>Country:</strong> ${userData.country || 'Unknown'}<br>
                <strong>Status:</strong> <span style="color:${userData.suspicious ? '#ff4d4d' : '#5cb85c'}">${userData.suspicious ? 'Suspicious' : 'Normal'}</span>
            `;
        }
    }
}

document.addEventListener('DOMContentLoaded', init);
