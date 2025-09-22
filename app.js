(function() {
  // ----- Mapbox Setup -----
  mapboxgl.accessToken = 'pk.eyJ1IjoiZ2lvbmVzY3UiLCJhIjoiY21mY2x4enFqMDA3aTJuc2J0ZXl6a2VudiJ9.NVJTYpC_XPM6xfCQW97CXw';
  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v11',
    center: [0,0],
    zoom: 14
  });

  // ----- Remove default Mapbox geolocate button -----
  document.querySelectorAll('.mapboxgl-ctrl-geolocate').forEach(btn => btn.remove());

  // ----- User & login state -----
  let userMarker = null;
  let userCoords = null;
  let isLoggedIn = false;

  // Track station markers with their type and coords
  let stationMarkers = [];

  const overpassMirrors = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.openstreetmap.fr/api/interpreter",
    "https://overpass.nchc.org.tw/api/interpreter"
  ];

  // ----- Auth Elements -----
  const loginModal = document.getElementById("login-modal");
  const loginBtn = document.getElementById("login-btn");
  const closeLogin = document.getElementById("close-login");
  const permanentLoginBtn = document.getElementById("permanent-login-btn");

  auth.onAuthStateChanged(user => {
    if(user) { 
      isLoggedIn = true; 
      permanentLoginBtn.textContent="Logout"; 
    } else { 
      isLoggedIn=false; 
      permanentLoginBtn.textContent="Log In"; 
    }
  });

  permanentLoginBtn.addEventListener("click", () => {
    if(isLoggedIn) auth.signOut();
    else window.location.href="login.html";
  });

  closeLogin.addEventListener("click", () => { loginModal.style.display="none"; });
  loginModal.addEventListener("click", e => {
    if(!e.target.closest(".modal-content")) loginModal.style.display="none";
  });
  loginBtn.addEventListener("click", () => { window.location.href="login.html"; });

  // ----- Helper: Add Marker -----
  function addStationMarker(lat, lon, name, type){
    if(type === "fuel") return; // TEMPORARY hide normal fuel stations

    const color = type==='fuel'?'red':type==='charging'?'green':'blue';
    const marker = new mapboxgl.Marker({color})
      .setLngLat([lon, lat])
      .addTo(map);

    marker.getElement().addEventListener("click", ()=>{
      if(!isLoggedIn && (type==='charging'||type==='hybrid')){
        loginModal.style.display="flex";
      } else {
        const popupHTML = `
          <div class="station-popup">
            <button class="popup-close">&times;</button>
            <h3>${name||"Unknown"}</h3>
            <p>Type: <span class="station-type">${type}</span></p>
            <a class="directions-btn" href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}" target="_blank">Get Directions</a>
          </div>`;

        const popup = new mapboxgl.Popup({closeButton:false})
          .setHTML(popupHTML);

        marker.setPopup(popup).togglePopup();

        // Close button functionality
        popup.on("open", () => {
          const btn = popup.getElement().querySelector(".popup-close");
          if(btn) btn.addEventListener("click", () => popup.remove());
        });
      }
    });

    stationMarkers.push({marker, lat, lon, type});
  }

  // ----- Remove markers outside current bounds -----
  function pruneMarkers(bounds){
    stationMarkers = stationMarkers.filter(item => {
      const {lat, lon, marker} = item;
      if(!bounds.contains([lon, lat])){
        marker.remove();
        return false;
      }
      return true;
    });
  }

  // ----- Fetch Fuel Stations (rotate mirrors, retry) -----
  async function fetchFuelStations(bounds){
    const south = bounds.getSouth();
    const west  = bounds.getWest();
    const north = bounds.getNorth();
    const east  = bounds.getEast();

    const query = `[out:json][timeout:25];
      (node["amenity"="fuel"](${south},${west},${north},${east});
       way["amenity"="fuel"](${south},${west},${north},${east});
       relation["amenity"="fuel"](${south},${west},${north},${east}););
      out center tags;`;

    const params = new URLSearchParams({ data: query });

    for (let i = 0; i < overpassMirrors.length; i++) {
      const url = `${overpassMirrors[i]}?${params.toString()}`;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) throw new Error("Not JSON");
        const data = await res.json();
        data.elements.forEach(el=>{
          const elLat=el.lat||el.center?.lat;
          const elLon=el.lon||el.center?.lon;
          if(!elLat||!elLon) return;
          const tags = el.tags||{};
          const type = tags["fuel:electricity"]==="yes"?"hybrid":"fuel";
          addStationMarker(elLat, elLon, tags.name, type);
        });
        return; // stop after success
      } catch(e){
        console.warn(`Mirror ${overpassMirrors[i]} failed: ${e.message}`);
        continue; // try next mirror
      }
    }
    console.error("All Overpass mirrors failed!");
  }

  // ----- Fetch Charging Stations -----
  async function fetchChargingStations(bounds){
    const center = bounds.getCenter();
    const lat = center.lat;
    const lon = center.lng;

    try{
      const url = `https://api.openchargemap.io/v3/poi/?output=json&latitude=${lat}&longitude=${lon}&distance=20&distanceunit=KM&maxresults=100&key=e2197ea8-2eaa-414b-8058-89db6787de30`;
      const res = await fetch(url);
      const data = await res.json();
      data.forEach(st=>{
        const pos = st.AddressInfo;
        if(pos?.Latitude && pos?.Longitude){
          addStationMarker(pos.Latitude,pos.Longitude,pos.Title,"charging");
        }
      });
    } catch(e){ console.error("Charging fetch error", e); }
  }

  // ----- Fetch Stations for View -----
  async function fetchStationsForView(){
    const bounds = map.getBounds();
    pruneMarkers(bounds); 
    await fetchFuelStations(bounds);
    await fetchChargingStations(bounds);
  }

  // ----- Show User Location -----
  function showUserLocationPopup(){
    if(!userCoords) return;

    if(userMarker){
        userMarker.setLngLat(userCoords);
        // Reattach popup if removed
        if(!userMarker.getPopup()){
            userMarker.setPopup(
                new mapboxgl.Popup({className:'popup-here', closeButton:true})
                    .setHTML("<strong>You are here</strong>")
            );
        }
    } else {
        userMarker = new mapboxgl.Marker({color:"blue"})
            .setLngLat(userCoords)
            .setPopup(
                new mapboxgl.Popup({className:'popup-here', closeButton:true})
                    .setHTML("<strong>You are here</strong>")
            )
            .addTo(map);
    }

    // Open popup
    userMarker.togglePopup();
}

  function onGeoSuccess(pos){
    userCoords=[pos.coords.longitude,pos.coords.latitude];
    map.setCenter(userCoords);
    showUserLocationPopup();
    fetchStationsForView();
  }

  function onGeoError(err){
    console.error("Geolocation error", err);
    alert("Could not get your location");
  }

  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(onGeoSuccess, onGeoError);
  }

  // ----- Update stations when map moves (debounced) -----
  let fetchTimeout;
  map.on("moveend", () => {
    clearTimeout(fetchTimeout);
    fetchTimeout = setTimeout(fetchStationsForView, 1500);
  });

  // ----- Recenter Button -----
  const recenterBtn = document.getElementById("recenter-btn");
  recenterBtn.addEventListener("click", () => {
    if(userCoords){
      map.flyTo({center:userCoords, zoom:14});
      showUserLocationPopup();
    } else if(navigator.geolocation){
      navigator.geolocation.getCurrentPosition(position => {
        userCoords=[position.coords.longitude,position.coords.latitude];
        map.flyTo({center:userCoords, zoom:14});
        showUserLocationPopup();
      }, () => alert("Could not get your location"));
    } else {
      alert("Geolocation not supported by your browser.");
    }
  });

})();
