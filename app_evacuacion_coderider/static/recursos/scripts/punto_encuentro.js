// punto_encuentro.js

// Variables globales para gestionar las capas
let capaPuntosEncuentro = null;
let capaMarcadoresRuta = null; // Grupo para limpiar los marcadores de origen y destino
let controlRuta = null; // Instancia para la línea de ruta estilo InDrive
let listaPuntosGlobal = []; // Almacena los puntos para calcular rutas

// Variables para el trazado manual
let modoManualActivo = false;
let waypointsManuales = [];
let capaMarcadoresManuales = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log("punto_encuentro.js CARGADO");

    const btnRuta = document.getElementById('btn-ruta');
    const btnPuntos = document.getElementById('btn-puntos');
    const btnModoManual = document.getElementById('btn-modo-manual');
    const btnLimpiar = document.getElementById('btn-limpiar-rutas');

    if (btnRuta) {
        btnRuta.addEventListener('click', obtenerGeolocalizacionYRuta);
    }

    if (btnPuntos) {
        btnPuntos.addEventListener('click', cargarPuntosEncuentro);
    }

    if (btnModoManual) {
        btnModoManual.addEventListener('click', alternarModoManual);
    }

    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', limpiarRutasYMarcadores);
    }
});

/**
 * Carga los puntos de encuentro desde el archivo JSON y los coloca en el mapa
 */
async function cargarPuntosEncuentro() {
    console.log("SE PRESIONÓ EL BOTÓN PUNTOS");

    if (!window.map) {
        console.error("El objeto window.map no existe. Inicialízalo en mapa.js.");
        return;
    }

    if (typeof URL_JSON === 'undefined') {
        console.error("URL_JSON no está definida en el HTML.");
        return;
    }

    try {
        const respuesta = await fetch(URL_JSON);
        if (!respuesta.ok) {
            throw new Error(`Error al cargar JSON: ${respuesta.status}`);
        }

        const datos = await respuesta.json();

        if (Array.isArray(datos)) {
            listaPuntosGlobal = datos;
        } else if (datos && Array.isArray(datos.puntos_encuentro)) {
            listaPuntosGlobal = datos.puntos_encuentro;
        } else {
            console.error("Estructura de JSON no reconocida.");
            return;
        }

        if (capaPuntosEncuentro) {
            window.map.removeLayer(capaPuntosEncuentro);
        }
        capaPuntosEncuentro = L.layerGroup().addTo(window.map);

        const contenedorLista = document.getElementById('lista-puntos');
        if (contenedorLista) {
            contenedorLista.innerHTML = '';
        }

        listaPuntosGlobal.forEach((punto, index) => {
            const lat = punto.lat || punto.latitud;
            const lng = punto.lng || punto.longitud || punto.lon;
            const nombre = punto.nombre || `Punto ${index + 1}`;
            const descripcion = punto.descripcion || 'Punto de encuentro seguro';

            if (lat && lng) {
                const marcador = L.marker([lat, lng]);
                marcador.bindPopup(`
                    <div style="font-family: sans-serif;">
                        <h4 style="margin: 0 0 5px 0; color: #0275d8;">📍 ${nombre}</h4>
                        <p style="margin: 0;">${descripcion}</p>
                    </div>
                `);
                capaPuntosEncuentro.addLayer(marcador);

                if (contenedorLista) {
                    const item = document.createElement('div');
                    item.className = 'reporte';
                    item.innerHTML = `
                        <strong>📍 ${nombre}</strong>
                        <p>${descripcion}</p>
                        <small>Coordenadas: ${lat}, ${lng}</small>
                    `;
                    contenedorLista.appendChild(item);
                }
            }
        });

        if (listaPuntosGlobal.length > 0) {
            const primerPunto = listaPuntosGlobal[0];
            const lat = primerPunto.lat || primerPunto.latitud;
            const lng = primerPunto.lng || primerPunto.longitud || primerPunto.lon;
            if (lat && lng) {
                window.map.setView([lat, lng], 15);
            }
        }

    } catch (error) {
        console.error("Error al procesar los puntos de encuentro:", error);
    }
}

/**
 * Traza una ruta específica entre las 2 coordenadas por defecto o cargadas desde el JSON
 */
async function obtenerGeolocalizacionYRuta() {
    console.log("Calculando ruta predeterminada...");

    if (!window.map) {
        console.error("El mapa no está listo.");
        return;
    }

    if (!listaPuntosGlobal || listaPuntosGlobal.length < 2) {
        await cargarPuntosEncuentro();
    }

    let origen = [2.4419, -76.6063];  // Parque Caldas
    let destino = [2.4632, -76.5898]; // Campanario Norte
    let nombreOrigen = "Parque Caldas";
    let nombreDestino = "Campanario Norte";

    if (listaPuntosGlobal && listaPuntosGlobal.length >= 2) {
        const p1 = listaPuntosGlobal[0];
        const p2 = listaPuntosGlobal[1];

        origen = [
            parseFloat(p1.lat || p1.latitud),
            parseFloat(p1.lng || p1.longitud || p1.lon)
        ];
        destino = [
            parseFloat(p2.lat || p2.latitud),
            parseFloat(p2.lng || p2.longitud || p2.lon)
        ];
        nombreOrigen = p1.nombre || nombreOrigen;
        nombreDestino = p2.nombre || nombreDestino;
    }

    if (capaMarcadoresRuta) {
        window.map.removeLayer(capaMarcadoresRuta);
    }
    capaMarcadoresRuta = L.layerGroup().addTo(window.map);

    const marcadorOrigen = L.circleMarker(origen, {
        radius: 9,
        fillColor: "#28a745",
        color: "#ffffff",
        weight: 2,
        fillOpacity: 0.95
    }).bindPopup(`<b>📍 Origen:</b> ${nombreOrigen}`);

    const marcadorDestino = L.circleMarker(destino, {
        radius: 9,
        fillColor: "#d9534f",
        color: "#ffffff",
        weight: 2,
        fillOpacity: 0.95
    }).bindPopup(`<b>🏁 Destino:</b> ${nombreDestino}`);

    capaMarcadoresRuta.addLayer(marcadorOrigen);
    capaMarcadoresRuta.addLayer(marcadorDestino);

    window.map.fitBounds([origen, destino], { padding: [40, 40] });

    trazarRutaVial([L.latLng(origen[0], origen[1]), L.latLng(destino[0], destino[1])]);
}

/**
 * Activa o desactiva la captura de clics en el mapa para trazar rutas dinámicamente
 */
function alternarModoManual() {
    if (!window.map) return;

    modoManualActivo = !modoManualActivo;
    const btn = document.getElementById('btn-modo-manual');

    if (modoManualActivo) {
        if (btn) {
            btn.textContent = "🛑 Detener trazado manual";
            btn.style.backgroundColor = "#dc3545";
        }
        window.map.getContainer().style.cursor = "crosshair";
        window.map.on('click', agregarPuntoManual);
    } else {
        if (btn) {
            btn.textContent = "✏️ Activar trazado manual";
            btn.style.backgroundColor = "";
        }
        window.map.getContainer().style.cursor = "";
        window.map.off('click', agregarPuntoManual);
    }
}

/**
 * Captura las coordenadas del clic sobre el mapa y actualiza la ruta activa
 */
function agregarPuntoManual(e) {
    const { lat, lng } = e.latlng;

    if (!capaMarcadoresManuales) {
        capaMarcadoresManuales = L.layerGroup().addTo(window.map);
    }

    waypointsManuales.push(L.latLng(lat, lng));

    const numeroPunto = waypointsManuales.length;
    const color = numeroPunto === 1 ? "#28a745" : "#0d6efd";

    const marcador = L.circleMarker([lat, lng], {
        radius: 8,
        fillColor: color,
        color: "#ffffff",
        weight: 2,
        fillOpacity: 0.95
    }).bindPopup(`<b>Punto ${numeroPunto}</b><br>Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);

    capaMarcadoresManuales.addLayer(marcador);

    if (waypointsManuales.length >= 2) {
        trazarRutaVial(waypointsManuales);
    }
}

/**
 * Realiza el cálculo vial con OSRM para cualquier arreglo de waypoints recibido
 */
function trazarRutaVial(puntosRuta) {
    if (typeof L.Routing === 'undefined') {
        console.error("Leaflet Routing Machine no está cargado en el HTML.");
        return;
    }

    if (controlRuta) {
        window.map.removeControl(controlRuta);
    }

    const routerOSRM = L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1',
        profile: 'driving',
        useHints: false
    });

    controlRuta = L.Routing.control({
        waypoints: puntosRuta,
        router: routerOSRM,
        routeOptions: {
            overview: 'full' // Asegura el trazado por las calles
        },
        lineOptions: {
            styles: [
                { color: '#004085', weight: 8, opacity: 0.4 },
                { color: '#00cc66', weight: 5, opacity: 0.95 }
            ],
            missingRouteTolerance: 1
        },
        addWaypoints: true,
        draggableWaypoints: true,
        fitSelectedRoutes: false,
        show: false,
        createMarker: function() { return null; }
    }).addTo(window.map);

    controlRuta.on('routesfound', function(e) {
        const rutas = e.routes;
        const resumen = rutas[0].summary;
        const distanciaKm = (resumen.totalDistance / 1000).toFixed(2);
        const tiempoMin = Math.round(resumen.totalTime / 60);

        console.log(`Ruta trazada: ${distanciaKm} km | Tiempo estimado: ${tiempoMin} min`);
    });
}

/**
 * Limpia las capas de ruta y resetea los waypoints del mapa
 */
function limpiarRutasYMarcadores() {
    waypointsManuales = [];

    if (controlRuta) {
        window.map.removeControl(controlRuta);
        controlRuta = null;
    }

    if (capaMarcadoresManuales) {
        window.map.removeLayer(capaMarcadoresManuales);
        capaMarcadoresManuales = null;
    }

    if (capaMarcadoresRuta) {
        window.map.removeLayer(capaMarcadoresRuta);
        capaMarcadoresRuta = null;
    }

    console.log("Rutas y marcadores limpiados del mapa.");
} 