(function () {
  const map = L.map("map");
  const tiles = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors",
  });
  tiles.addTo(map);

  function setViewWithMarker(lat, lng, zoom) {
    map.setView([lat, lng], zoom);
    const marker = L.marker([lat, lng]).addTo(map);
    marker.bindPopup("You are here").openPopup();
  }

  function onGeoSuccess(position) {
    const { latitude, longitude, accuracy } = position.coords;
    setViewWithMarker(latitude, longitude, 15);
    if (Number.isFinite(accuracy)) {
      L.circle([latitude, longitude], { radius: accuracy, color: "#1368CE", fillColor: "#1368CE", fillOpacity: 0.1 }).addTo(map);
    }
  }

  function onGeoError(err) {
    console.warn("Geolocation failed:", err && err.message ? err.message : err);
    // Fallback: New York City
    const fallback = { lat: 40.7128, lng: -74.0060, zoom: 12 };
    setViewWithMarker(fallback.lat, fallback.lng, fallback.zoom);
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(onGeoSuccess, onGeoError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  } else {
    onGeoError(new Error("Geolocation not supported"));
  }
})();
