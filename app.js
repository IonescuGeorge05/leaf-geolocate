(function() {
  // ----- Mapbox Setup -----
  mapboxgl.accessToken = 'pk.eyJ1IjoiZ2lvbmVzY3UiLCJhIjoiY21mY2x4enFqMDA3aTJuc2J0ZXl6a2VudiJ9.NVJTYpC_XPM6xfCQW97CXw';
  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v11',
    center: [0,0],
    zoom: 14
  });
  
  map.addControl(new mapboxgl.NavigationControl());

  let userMarker = null;
  let userCoords = null;
  let isLoggedIn = false;

  // ----- Auth Elements -----
  const loginModal = document.getElementById("login-modal");
  const loginBtn = document.getElementById("login-btn");
  const closeLogin = document.getElementById("close-login");
  const permanentLoginBtn = document.getElementById("permanent-login-btn");

  auth.onAuthStateChanged(user => {
    if(user) { isLoggedIn = true; permanentLoginBtn.textContent="Logout"; }
    else { isLoggedIn=false; permanentLoginBtn.textContent="Log In"; }
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
    const color = type==='fuel'?'red':type==='charging'?'green':'blue';
    const marker = new mapboxgl.Marker({color})
      .setLngLat([lon, lat])
      .addTo(map);

    marker.getElement().addEventListener("click", ()=>{
      if(!isLoggedIn && (type==='charging'||type==='hybrid')){
        loginModal.style.display="flex";
      } else {
        const popup = new mapboxgl.Popup({closeButton:true})
          .setHTML(`<b>${name||"Unknown"}</b><br/>Type:${type}<br/><a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}" target="_blank">Get Directions</a>`);
        marker.setPopup(popup).togglePopup();
      }
    });
  }

  // ----- Fetch Fuel Stations -----
  async function fetchFuelStations(lat, lon){
    const bounds = `${lat-0.05},${lon-0.05},${lat+0.05},${lon+0.05}`;
    const query = `[out:json][timeout:25];(node["amenity"="fuel"](${bounds});way["amenity"="fuel"](${bounds});relation["amenity"="fuel"](${bounds}););out center tags;`;
    try{
      const res = await fetch("https://overpass-api.de/api/interpreter?data="+encodeURIComponent(query));
      const data = await res.json();
      data.elements.forEach(el=>{
        const elLat=el.lat||el.center?.lat;
        const elLon=el.lon||el.center?.lon;
        if(!elLat||!elLon) return;
        const tags = el.tags||{};
        const type = tags["fuel:electricity"]==="yes"?"hybrid":"fuel";
        addStationMarker(elLat, elLon, tags.name, type);
      });
    } catch(e){ console.error("Fuel fetch error", e); }
  }

  // ----- Fetch Charging Stations -----
  async function fetchChargingStations(lat, lon){
    try{
      const url = `https://api.openchargemap.io/v3/poi/?output=json&latitude=${lat}&longitude=${lon}&distance=10&distanceunit=KM&maxresults=50&key=e2197ea8-2eaa-414b-8058-89db6787de30`;
      const res = await fetch(url);
      const data = await res.json();
      data.forEach(st=>{
        const pos = st.AddressInfo;
        addStationMarker(pos.Latitude,pos.Longitude,pos.Title,"charging");
      });
    } catch(e){ console.error("Charging fetch error", e); }
  }

  // ----- Show User Location -----
  function onGeoSuccess(pos){
    userCoords=[pos.coords.longitude,pos.coords.latitude];
    map.setCenter(userCoords);

    if(userMarker) userMarker.setLngLat(userCoords);
    else{
      userMarker=new mapboxgl.Marker({color:"blue"})
        .setLngLat(userCoords)
        .setPopup(new mapboxgl.Popup().setText("You are here"))
        .addTo(map)
        .togglePopup();
    }

    // Fetch stations around user
    fetchFuelStations(pos.coords.latitude, pos.coords.longitude);
    fetchChargingStations(pos.coords.latitude, pos.coords.longitude);
  }

  function onGeoError(err){
    console.error("Geolocation error", err);
    alert("Could not get your location");
  }

  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(onGeoSuccess, onGeoError);
  }

  // ----- Recenter Button -----
  document.getElementById("recenter-btn").addEventListener("click", () => {
    if(userCoords) map.setCenter(userCoords);
  });

})();
