(function () {
  // =============================
  // Initialize Leaflet map
  // =============================
  const map = L.map("map");
  const tiles = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors",
  });
  tiles.addTo(map);

  // =============================
  // Marker layer for PROFI supermarkets
  // =============================
  const markers = L.layerGroup().addTo(map);

  // =============================
  // Add marker at user location
  // =============================
  function setViewWithMarker(lat, lng, zoom) {
    map.setView([lat, lng], zoom);
    const marker = L.marker([lat, lng]).addTo(map);
    marker.bindPopup("You are here").openPopup();
  }

  function onGeoSuccess(position) {
    const { latitude, longitude, accuracy } = position.coords;
    setViewWithMarker(latitude, longitude, 15);
    if (Number.isFinite(accuracy)) {
      L.circle([latitude, longitude], {
        radius: accuracy,
        color: "#1368CE",
        fillColor: "#1368CE",
        fillOpacity: 0.1
      }).addTo(map);
    }
  }

  function onGeoError(err) {
    console.warn("Geolocation failed:", err && err.message ? err.message : err);
    // Fallback: Deta, Romania
    const fallback = { lat: 45.389, lng: 21.224, zoom: 14 };
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

  // =============================
  // Fetch PROFI supermarkets from OSM (Overpass API)
  // =============================
  async function addProfiFromOSM() {
    const bbox = [45.37, 21.20, 45.42, 21.25]; // Deta area
    const query = `
      [out:json][timeout:25];
      (
        node["shop"="supermarket"]["brand"="profi"](${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]});
        way["shop"="supermarket"]["brand"="profi"](${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]});
        relation["shop"="supermarket"]["brand"="profi"](${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]});
      );
      out center tags;
    `;
    const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);
    
    try {
      const res = await fetch(url);
      const data = await res.json();

      console.log("Overpass results:", data.elements.length, data.elements); // debug

      const found = [];
      data.elements.forEach(el => {
        const lat = el.lat ?? el.center?.lat;
        const lon = el.lon ?? el.center?.lon;
        if (!lat || !lon) return;

        const name = el.tags?.name || 'PROFI';
        const address = [
          el.tags?.['addr:street'],
          el.tags?.['addr:housenumber'],
          el.tags?.['addr:city']
        ].filter(Boolean).join(' ') || 'Deta';

        found.push([lat, lon]);
        L.marker([lat, lon], { title: name })
          .bindPopup(`<b>${name}</b><br>${address}`)
          .addTo(markers);
      });

      if (found.length) map.fitBounds(found);

      // fallback: if no results, hardcode 2 known PROFI stores
      if (found.length === 0) {
        console.warn("No PROFI found via OSM — using fallback coordinates");
        const fallbackProfi = [
          { name: "PROFI Victoriei", coords: [45.3947, 21.2249], address: "Str. Victoriei 23, Deta" },
          { name: "PROFI Mihai Viteazu", coords: [45.3959, 21.2310], address: "Str. Mihai Viteazu 2, Deta" }
        ];
        fallbackProfi.forEach(p => {
          L.marker(p.coords, { title: p.name })
            .bindPopup(`<b>${p.name}</b><br>${p.address}`)
            .addTo(markers);
        });
        map.fitBounds(fallbackProfi.map(p => p.coords).map(c => [c[0], c[1]]));
      }

    } catch (err) {
      console.error("Failed to fetch PROFI data:", err);
    }
  }

  addProfiFromOSM();
})();
