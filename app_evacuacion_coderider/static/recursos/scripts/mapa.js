// mapa.js
window.map = L.map('mapa').setView([2.4419, -76.6063], 14); // Popayán, Colombia

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(window.map);