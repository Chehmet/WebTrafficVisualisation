// Инициализация карты
const map = L.map('map').setView([20, 0], 2);

// Добавление тайлов (фон карты)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Функция загрузки данных
async function loadTrafficData() {
    const response = await fetch("/data");
    const data = await response.json();

    data.forEach(point => {
        const color = point.suspicious ? "red" : "green";
        const circle = L.circleMarker([point.latitude, point.longitude], {
            radius: 8,
            color: color,
            fillColor: color,
            fillOpacity: 0.7
        }).addTo(map);

        circle.bindPopup(`
            <b>IP:</b> ${point.ip}<br>
            <b>Подозрительный:</b> ${point.suspicious ? "Да" : "Нет"}
        `);

        // Анимация (пульсация)
        setInterval(() => {
            const scale = circle.options.radius === 8 ? 12 : 8;
            circle.setRadius(scale);
        }, 500);
    });
}

// Загрузка данных каждые 5 секунд
setInterval(loadTrafficData, 5000);
loadTrafficData();
