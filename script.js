
// Service worker (for PWA).
window.addEventListener('load', () => {
    registerSW();
  });

  async function registerSW() {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('./sw.js');
      } catch (e) {
        console.log(`SW registration failed`);
      }
    }
}


// Initialize map.
var map = L.map('map').setView([48.866667, 2.33333], 15);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

let notifTitle ="";
let notifBody = "";

// Fetch all stations info.
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
            if(station.name=="Rue Saint-Maur") {
                notifTitle = station.name;
                notifBody = station.history;
            }
        });
    })
    .catch(error => {
        console.error('Erreur lors du fetch (mwop) :', error);
    });



// Get user's location.
let user_location;
let user_marker;

function init_gps_watch() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(update_position);
    }
    else { 
        alert("Geolocation is not supported by this browser.");
    }
}


function update_position(pos) {
    user_location = pos.coords;

    if (user_marker == null) {
        user_marker = L.circleMarker([user_location.latitude, user_location.longitude], {radius: 10, color: "red"}).addTo(map);
    }
    else {
        user_marker.setLatLng([user_location.latitude, user_location.longitude])
    }
}

// Center map on user's location.
map.locate({setView: true, maxZoom: 16});


// Testing push notifications.
const button = document.getElementById("notifications");
button.addEventListener("click", () => {
  Notification.requestPermission().then((result) => {
    if (result === "granted") {
      pushNotification();
    }
  });
});

function pushNotification() {
    let notifImg ="images/map-pin.png";
    let options = {
      body: notifBody,
      icon: notifImg,
    };
    new Notification(notifTitle, options);
  }
  