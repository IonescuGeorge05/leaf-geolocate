# Leaflet Geolocation Map

A minimal web app that uses LeafletJS to display a fullscreen map centered on the user's current location at zoom 15. If geolocation is unavailable, it falls back to New York City.

## Files
- `index.html` — HTML page with Leaflet CDN links
- `style.css` — Styles to make the map fill the viewport
- `app.js` — Initializes the map, requests geolocation, adds marker and accuracy circle

## Requirements
Geolocation in browsers only works on secure origins: HTTPS or `http://localhost`. Run a local server and open the app on `http://localhost`.

## Quick Start (Windows)

### Option 1: Python (recommended)
1. Open PowerShell in the project folder.
2. Run one of the following:
   - If Python 3 is installed via Microsoft Store/installer:
     ```powershell
     py -m http.server 5173
     ```
   - If `python` is on PATH as Python 3:
     ```powershell
     python -m http.server 5173
     ```
3. Open the browser to `http://localhost:5173`.
4. Allow the site to access location when prompted.

### Option 2: Node.js (npx http-server)
1. Install Node.js from `https://nodejs.org/` if needed.
2. In PowerShell, run:
   ```powershell
   npx http-server -p 5173
   ```
   If prompted to install, confirm with `y`.
3. Open `http://localhost:5173` and allow location.

### Option 3: VS Code Live Server extension
1. Install VS Code and the "Live Server" extension by Ritwick Dey.
2. Open the project folder in VS Code.
3. Right-click `index.html` → "Open with Live Server".
4. The browser opens on a localhost URL; allow location access.

## GitHub Pages
The repo contains a `docs/` folder for GitHub Pages.

Enable Pages:
1. Go to GitHub → Repository → Settings → Pages.
2. Source: `main` branch, Folder: `/docs`.
3. Save. The site will be available at your GitHub Pages URL (e.g., `https://<username>.github.io/leaflet-geolocate/`).

Note: Geolocation works over HTTPS, which GitHub Pages provides.

## Browser Notes
- Works in Chrome, Edge, Firefox.
- If location is blocked, click the lock icon in the address bar → allow location → reload.
- HTTPS is not required on localhost, but is required if you host this elsewhere.

## Troubleshooting
- If the map doesn't center on you and no permission prompt appears, check site permissions for location and reload.
- If nothing loads, ensure the server is running and you're visiting `http://localhost:5173` (not opening `index.html` directly).
- If the terminal shows `404 /favicon.ico`, it's harmless.

## Project Path (on macOS machine where this was created)
`/Users/milan/leaflet-geolocate`

On Windows, the folder can live anywhere (e.g., `C:\Users\<username>\leaflet-geolocate`).
