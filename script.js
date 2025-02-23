
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

let notifTitle = "";
let notifBody = "";

// Fetch all stations info.
let stations = [];

fetch('stations.json')
    .then(response => response.json())
    .then(data => {
        stations = data;
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

// Get user's location.
let userLocation;
let userMarker;

function initGPSWatch() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(updatePosition);
        // alert("DEBUG: GPS watch init'd");
    }
    else { 
        alert("Geolocation is not supported by this browser.");
    }
}


function updatePosition(pos) {
    userLocation = pos.coords;

    if (userMarker == null) {
        userMarker = L.circleMarker([userLocation.latitude, userLocation.longitude], {radius: 10, color: "red"}).addTo(map);
    }
    else {
        userMarker.setLatLng([userLocation.latitude, userLocation.longitude])
    }

    // alert("DEBUG: GPS updat'd " + userMarker);

    findNearestStation(userLocation.latitude, userLocation.longitude);
}

// Haversine formula to calculate distance between two points.
function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
}

function findNearestStation(lat, lon) {
    let nearestStation = null;
    let minDistance = Infinity;

    stations.forEach(station => {
        const distance = haversine(lat, lon, station.gps.lat, station.gps.lon);
        if (distance < minDistance) {
            minDistance = distance;
            nearestStation = station;
        }
    });

    if (nearestStation) {
        notifTitle = nearestStation.name;
        notifBody = nearestStation.history ? nearestStation.history : " ";
        sendNotification();
    }
}

// Center map on user's location.
map.locate({setView: true, maxZoom: 16});

// Testing push notifications.
const button = document.getElementById("notifications");
button.addEventListener("click", grantNotificationPermission);

function grantNotificationPermission() {
    Notification.requestPermission().then((result) => {
        if (result === "granted") {
            notifTitle = "Metro Stories";
            notifBody = "Permission granted";
            sendNotification();
        }
    });
    // button.removeEventListener("click", grantNotificationPermission);
}

function sendNotification() {
    let notifImg = "images/map-pin.png";
    let options = {
        body: notifBody,
        icon: notifImg,
    };
    new Notification(notifTitle, options);
}
