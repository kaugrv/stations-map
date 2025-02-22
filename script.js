

var map = L.map('map').setView([48.866667, 2.33333], 20);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 15,
    default: 10,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);


fetch('stations.json')
    .then(response => response.json())
    .then(stations => {
        stations.forEach(station => {
            var marker = L.marker([station.gps.lat, station.gps.lon]).addTo(map);
            marker.bindPopup(`
                <b>${station.name}</b><br><br>
                ${station.history ? station.history.substring(0, 150) : ""}...
                <br><br>
                <a href="${station.url}" target="_blank">
                    <button>Voir plus</button>
                </a>
            `);
            
        });
    })
    .catch(error => {
        console.error('Erreur lors du fetch (mwop) :', error);
    });



