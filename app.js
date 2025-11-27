/* Enhanced Wanjiku Weather Info - app.js
   - Adds 7-day forecast chart (Chart.js)
   - Registers service worker (in index)
   - Placeholder config for paid API providers (e.g., WeatherAPI, BreezoMeter)
*/
const citiesUrl = "cities.json";

function $id(id){return document.getElementById(id)}
const session = localStorage.getItem("wanjiku_session");
if(!session){
  if(!location.pathname.endsWith("login.html")) location.href = "login.html";
}

const searchInput = $id("searchInput"), searchBtn = $id("searchBtn"), suggestions = $id("suggestions");
const cityNameEl = $id("cityName"), currentWeatherEl = $id("currentWeather"), airQualityEl = $id("airQuality"), lifestyleEl = $id("lifestyle");
const result = $id("result"), saveBtn = $id("saveBtn"), savedList = $id("savedList"), savedMsg = $id("savedMsg"), logoutBtn = $id("logoutBtn");
const forecastCanvas = $id("forecastChart");
let forecastChart = null;

let cities = [];
fetch(citiesUrl).then(r=>r.json()).then(j=>{cities=j; initTypeahead()}).catch(e=>console.error(e));

function initTypeahead(){
  searchInput.addEventListener("input", e=>{
    const q = e.target.value.trim().toLowerCase();
    suggestions.innerHTML = "";
    if(!q) return;
    const matches = cities.filter(c=>c.name.toLowerCase().includes(q) || (c.country && c.country.toLowerCase().includes(q)));
    matches.slice(0,10).forEach(c=>{
      const el = document.createElement("div"); el.className = "suggestion";
      el.textContent = c.name + (c.country ? (", "+c.country) : "");
      el.onclick = ()=> selectCity(c);
      suggestions.appendChild(el);
    });
  });
  searchBtn.onclick = ()=> {
    const q = searchInput.value.trim();
    if(!q) return;
    const found = cities.find(c=>c.name.toLowerCase()===q.toLowerCase()) || cities.find(c=>c.name.toLowerCase().includes(q.toLowerCase()));
    if(found) selectCity(found);
    else searchGeocode(q);
  };
  loadSaved();
}

function selectCity(c){
  suggestions.innerHTML = "";
  searchInput.value = c.name;
  showResult();
  cityNameEl.textContent = c.name + (c.country ? (", "+c.country) : "");
  $id("meta").textContent = c.lat && c.lon ? `lat: ${c.lat} lon: ${c.lon}` : 'coordinates unknown — geocoding used';
  const lat = c.lat, lon = c.lon;
  if(lat && lon){
    fetchWeather(lat, lon, true);
    fetchAirQuality(lat, lon);
    fetchWiki(c.name);
  } else {
    searchGeocode(c.name);
  }
}

function showResult(){ result.classList.remove("hidden"); result.classList.add("animated"); }

function fetchWeather(lat, lon, fetchForecast=false){
  currentWeatherEl.textContent = "Loading weather...";
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
  fetch(url).then(r=>r.json()).then(data=>{
    if(data && data.current_weather){
      const cw = data.current_weather;
      currentWeatherEl.innerHTML = `
        <div><strong>Temperature:</strong> ${cw.temperature}°C</div>
        <div><strong>Wind:</strong> ${cw.windspeed} km/h (${cw.winddirection}°)</div>
        <div class="muted">Source: Open-Meteo (no API key)</div>
      `;
      if(data.daily && data.daily.time){
        renderForecastChart(data.daily);
      }
    } else currentWeatherEl.textContent = "Weather data unavailable.";
  }).catch(err=>{
    currentWeatherEl.textContent = "Error fetching weather.";
    console.error(err);
  });
}

function renderForecastChart(daily){
  try{
    const labels = daily.time.map(t=>t);
    const max = daily.temperature_2m_max;
    const min = daily.temperature_2m_min;
    const datasets = [
      {label:'Max °C', data:max, fill:false},
      {label:'Min °C', data:min, fill:false}
    ];
    if(forecastChart) forecastChart.destroy();
    forecastChart = new Chart(forecastCanvas.getContext('2d'), {
      type:'line',
      data:{labels, datasets},
      options:{
        responsive:true,
        interaction:{mode:'index', intersect:false},
        plugins:{legend:{position:'top'}},
        scales:{
          y:{title:{display:true,text:'°C'}}
        }
      }
    });
  }catch(e){ console.warn('Chart error', e) }
}

function fetchAirQuality(lat, lon){
  airQualityEl.textContent = "Loading environment data...";
  const url = `https://api.openaq.org/v2/latest?coordinates=${lat},${lon}&radius=20000&limit=5`;
  fetch(url).then(r=>r.json()).then(data=>{
    if(data && data.results && data.results.length){
      const meas = data.results[0].measurements || [];
      airQualityEl.innerHTML = meas.map(m=>`<div><strong>${m.parameter.toUpperCase()}</strong>: ${m.value} ${m.unit} <span class="muted">(${m.lastUpdated.split('T')[0]})</span></div>`).join("");
      airQualityEl.innerHTML += '<div class="muted">Source: OpenAQ (open data)</div>';
    } else {
      airQualityEl.textContent = "No air-quality measurements found for this location.";
    }
  }).catch(err=>{
    airQualityEl.textContent = "Error fetching environment data.";
    console.error(err);
  });
}

function fetchWiki(name){
  lifestyleEl.textContent = "Loading summary...";
  const safe = encodeURIComponent(name);
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${safe}`;
  fetch(url).then(r=>{
    if(r.status===200) return r.json();
    throw new Error("No wiki");
  }).then(data=>{
    if(data && data.extract){
      lifestyleEl.innerHTML = `<p>${data.extract}</p><p class="muted">Source: Wikipedia</p>`;
    } else lifestyleEl.textContent = "No summary available.";
  }).catch(err=>{
    lifestyleEl.textContent = "No local summary found.";
  });
}

saveBtn.onclick = ()=>{
  const name = cityNameEl.textContent;
  if(!name) return;
  const saved = JSON.parse(localStorage.getItem("wanjiku_saved")||"[]");
  if(saved.includes(name)) {
    savedMsg.textContent = "Already saved";
    return;
  }
  saved.push(name);
  localStorage.setItem("wanjiku_saved", JSON.stringify(saved));
  savedMsg.textContent = "Saved locally";
  loadSaved();
}

function loadSaved(){
  savedList.innerHTML = "";
  const saved = JSON.parse(localStorage.getItem("wanjiku_saved")||"[]");
  if(!saved.length) savedList.innerHTML = "<span class='muted'>No saved places yet.</span>";
  saved.forEach(s=>{
    const el = document.createElement("div"); el.className="saved-item";
    el.textContent = s;
    el.onclick = ()=> {
      const plain = s.split(",")[0].trim();
      const found = cities.find(c=>c.name === plain);
      if(found) selectCity(found);
      else {
        searchInput.value = plain; searchBtn.click();
      }
    };
    savedList.appendChild(el);
  });
}

logoutBtn.onclick = ()=>{
  localStorage.removeItem("wanjiku_session");
  location.href = "login.html";
}

function searchGeocode(q){
  currentWeatherEl.textContent = "Trying geocode...";
  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`).then(r=>r.json()).then(res=>{
    if(res && res[0]){
      const lat = parseFloat(res[0].lat), lon = parseFloat(res[0].lon);
      cityNameEl.textContent = res[0].display_name;
      $id("meta").textContent = `lat: ${lat} lon: ${lon}`;
      showResult();
      fetchWeather(lat, lon); fetchAirQuality(lat, lon); fetchWiki(q);
    } else {
      currentWeatherEl.textContent = "Location not found.";
    }
  }).catch(err=>{
    console.error(err);
    currentWeatherEl.textContent = "Error geocoding location.";
  });
}

// config for paid providers (placeholder)
window.WANJIKU_CONFIG = {
  WEATHER_API_KEY: "", // insert key for paid service if desired
  AQ_API_KEY: ""
};

setInterval(()=>{ savedMsg.textContent = "" }, 5000);
