(function () {
  const map = L.map("map");
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  let userMarker = null;
  let userCoords = null;
  let isLoggedIn = false;

  const loginModal = document.getElementById("login-modal");
  const loginBtn = document.getElementById("login-btn");
  const closeLogin = document.getElementById("close-login");
  const permanentLoginBtn = document.getElementById("permanent-login-btn");

  // Auth state
  auth.onAuthStateChanged((user) => {
    if (user) {
      isLoggedIn = true;
      permanentLoginBtn.textContent = "Logout";
    } else {
      isLoggedIn = false;
      permanentLoginBtn.textContent = "Log In";
    }
  });

  permanentLoginBtn.addEventListener("click", () => {
    if (isLoggedIn) auth.signOut();
    else window.location.href = "login.html";
  });

  closeLogin.addEventListener("click", () => { loginModal.style.display = "none"; });
  loginModal.addEventListener("click", e => {
    if (!e.target.closest(".modal-content")) loginModal.style.display = "none";
  });
  loginBtn.addEventListener("click", () => { window.location.href = "login.html"; });

  function addStationMarker(lat, lon, name, type) {
    let color = type === "fuel" ? "red" : type === "charging" ? "green" : "blue";
    const marker = L.circleMarker([lat, lon], { radius: 8, fillColor: color, color:"#000", weight:1, opacity:1, fillOpacity:0.8 }).addTo(map);
    marker.on("click", () => {
      if (!isLoggedIn && (type === "charging" || type === "hybrid")) loginModal.style.display = "flex";
      else marker.bindPopup(`<b>${name||"Unknown"}</b><br/>Type:${type}<br/><a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}" target="_blank">Get Directions</a>`, {closeButton:true}).openPopup();
    });
  }

  async function fetchFuelStations(bounds) {
    const query = `[out:json][timeout:25];(node["amenity"="fuel"](${bounds});way["amenity"="fuel"](${bounds});relation["amenity"="fuel"](${bounds}););out center tags;`;
    try {
      const res = await fetch("https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query));
      const data = await res.json();
      data.elements.forEach(el => {
        const lat = el.lat||el.center?.lat;
        const lon = el.lon||el.center?.lon;
        if(!lat||!lon) return;
        const tags = el.tags||{};
        const type = tags["fuel:electricity"]==="yes"?"hybrid":"fuel";
        addStationMarker(lat, lon, tags.name, type);
      });
    } catch(e){ console.error("Fuel fetch error", e);}
  }

  async function fetchChargingStations(lat, lon) {
    try {
      const url = `https://api.openchargemap.io/v3/poi/?output=json&latitude=${lat}&longitude=${lon}&distance=10&distanceunit=KM&maxresults=50&key=e2197ea8-2eaa-414b-8058-89db6787de30`;
      const res = await fetch(url);
      const data = await res.json();
      data.forEach(st => {
        const pos = st.AddressInfo;
        addStationMarker(pos.Latitude, pos.Longitude, pos.Title, "charging");
      });
    } catch(e){ console.error("Charging fetch error", e);}
  }

  function onGeoSuccess(pos) {
    userCoords = [pos.coords.latitude, pos.coords.longitude];
    map.setView(userCoords, 14);
    if(userMarker) userMarker.setLatLng(userCoords);
    else userMarker = L.marker(userCoords).addTo(map).bindPopup("You are here").openPopup();
    const bounds = `${userCoords[0]-0.05},${userCoords[1]-0.05},${userCoords[0]+0.05},${userCoords[1]+0.05}`;
    fetchFuelStations(bounds);
    fetchChargingStations(userCoords[0], userCoords[1]);
  }

  function onGeoError(err) {
    console.error("Geolocation error", err);
    alert("Could not get your location");
  }

  if(navigator.geolocation) navigator.geolocation.getCurrentPosition(onGeoSuccess, onGeoError);

  document.getElementById("recenter-btn").addEventListener("click", () => {
    if(userCoords) map.setView(userCoords, 14);
  });
})();
