// sismos_api.js

document.addEventListener('DOMContentLoaded', () => {
    cargarSismos();
});

async function cargarSismos() {
    // 1. Validar que la URL y el mapa existan
    if (typeof URL_API_SISMOS === 'undefined') {
        console.error("URL_API_SISMOS no está definida.");
        return;
    }

    if (!window.map) {
        console.error("El objeto window.map no existe. Asegúrate de que mapa.js cargue primero.");
        return;
    }

    try {
        // 2. Hacer la petición a la API de la USGS
        const respuesta = await fetch(URL_API_SISMOS);
        
        if (!respuesta.ok) {
            throw new Error(`Error en la petición: ${respuesta.status}`);
        }

        const datos = await respuesta.json();
        
        // 3. Crear una capa de grupo para los sismos
        const capaSismos = L.layerGroup().addTo(window.map);

        // 4. Recorrer los sismos y agregarlos al mapa como círculos
        datos.features.forEach(sismo => {
            const [longitud, latitud, profundidad] = sismo.geometry.coordinates;
            const magnitud = sismo.properties.mag;
            const lugar = sismo.properties.place;
            const fecha = new Date(sismo.properties.time).toLocaleString('es-ES');

            // Determinar color según la magnitud del sismo
            let color = '#28a745'; // Leve (< 4.0)
            if (magnitud >= 6.0) {
                color = '#dc3545'; // Grave (>= 6.0)
            } else if (magnitud >= 4.5) {
                color = '#fd7e14'; // Moderado (4.5 - 5.9)
            }

            // Crear un marcador circular proporcional a la magnitud
            const circulo = L.circleMarker([latitud, longitud], {
                radius: Math.max(magnitud * 2.5, 4),
                fillColor: color,
                color: '#000',
                weight: 1,
                opacity: 0.8,
                fillOpacity: 0.6
            });

            // Contenido del popup interactivo al hacer clic
            circulo.bindPopup(`
                <div style="font-family: sans-serif;">
                    <h4 style="margin: 0 0 5px 0; color: ${color};">Sismo Mag. ${magnitud}</h4>
                    <p style="margin: 0 0 3px 0;"><strong>Ubicación:</strong> ${lugar}</p>
                    <p style="margin: 0 0 3px 0;"><strong>Profundidad:</strong> ${profundidad} km</p>
                    <p style="margin: 0;"><strong>Fecha:</strong> ${fecha}</p>
                </div>
            `);

            capaSismos.addLayer(circulo);
        });

        console.log(`Se cargaron ${datos.features.length} sismos en el mapa.`);

    } catch (error) {
        console.error("Error al obtener los datos de sismos:", error);
    }
}