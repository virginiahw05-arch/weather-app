Wanjiku Weather Info — Enhanced (v2)
------------------------------------

Enhancements included:
- Larger cities list (many Kenyan towns included).
- PWA support: manifest.json + service-worker.js (installable, caches app shell).
- 7-day forecast chart rendered with Chart.js (CDN).
- Improved UI micro-interactions and animations.
- Placeholder configuration for paid API providers (add keys to app.js window.WANJIKU_CONFIG).
- Still a client-side demo: authentication and saved data are stored in localStorage.

Notes:
- Service Worker caches app shell; API responses are network-first (so live data will be fetched when online).
- To test PWA features, serve the directory over HTTPS or use localhost.
- You can integrate paid providers by swapping the Open-Meteo/OpenAQ calls with your provider and storing the API key in WANJIKU_CONFIG.

Files in the ZIP:
- index.html, login.html, styles.css, app.js, cities.json, manifest.json, service-worker.js, icons/, README.txt
