/* =========================================================
   Atmospheric — Dynamic Weather Dashboard — script.js
   Beginner-friendly, heavily commented.

   DATA SOURCE: OpenWeatherMap (all free-tier, no credit card
   required, except the optional UV Index block — see the
   "OPTIONAL: UV INDEX" section and the PDF documentation).
   ========================================================= */

/* -----------------------------------------------------------
   STEP 0 — Put your OpenWeatherMap API key here.
   Get a free one at https://openweathermap.org/api
   (Sign up -> confirm email -> "My API Keys" -> copy the key)
   New keys can take a few minutes to a couple of hours to activate.
----------------------------------------------------------- */
const API_KEY = "51f34e70c274172ec2eb9bcaaf8b0e6c"; // <-- replace this!

/* Free-tier classic endpoints (no card required) */
const CURRENT_URL  = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";
const TILE_URL     = "https://tile.openweathermap.org/map/precipitation_new"; // radar tiles

/* Optional, needs a (free but card-verified) One Call 3.0 subscription.
   The dashboard works fine without it — UV Index just shows "N/A". */
const ONECALL_URL  = "https://api.openweathermap.org/data/3.0/onecall";

/* -----------------------------------------------------------
   STEP 1 — Grab every element we'll update.
----------------------------------------------------------- */
const cityInput      = document.getElementById("cityInput");
const searchBtn       = document.getElementById("searchBtn");
const locationBtn     = document.getElementById("locationBtn");
const unitF            = document.getElementById("unitF");
const unitC            = document.getElementById("unitC");

const errorBanner     = document.getElementById("errorBanner");
const errorText        = document.getElementById("errorText");
const loadingState    = document.getElementById("loadingState");
const dashboardGrid   = document.getElementById("dashboardGrid");
const emptyState       = document.getElementById("emptyState");

const cityName    = document.getElementById("cityName");
const heroIcon    = document.getElementById("heroIcon");
const currentTemp = document.getElementById("currentTemp");
const currentDesc = document.getElementById("currentDesc");
const tempHigh    = document.getElementById("tempHigh");
const tempLow     = document.getElementById("tempLow");

const hourlyChart        = document.getElementById("hourlyChart");
const hourlyLabels        = document.getElementById("hourlyLabels");
const hourlyFloatingTemp = document.getElementById("hourlyFloatingTemp");

const forecastList = document.getElementById("forecastList");

const radarLink  = document.getElementById("radarLink");
const radarImage = document.getElementById("radarImage");

const uvValue = document.getElementById("uvValue");
const uvLabel = document.getElementById("uvLabel");
const uvBar   = document.getElementById("uvBar");

const humidityValue = document.getElementById("humidityValue");
const dewPointNote  = document.getElementById("dewPointNote");

const windSpeedValue = document.getElementById("windSpeedValue");
const windUnit         = document.getElementById("windUnit");
const windArrow         = document.getElementById("windArrow");
const windDirection     = document.getElementById("windDirection");

const visibilityValue = document.getElementById("visibilityValue");
const visibilityUnit    = document.getElementById("visibilityUnit");
const visibilityNote     = document.getElementById("visibilityNote");

/* -----------------------------------------------------------
   STEP 2 — App state.
   `units` is either "imperial" (°F, mph, miles) or "metric" (°C, m/s, km).
   `lastQuery` remembers the last successful search so the unit
   toggle can re-fetch without the user typing the city again.
----------------------------------------------------------- */
let units = "imperial";
let lastQuery = null; // { type: "city", city } or { type: "coords", lat, lon }

/* -----------------------------------------------------------
   STEP 3 — Event listeners
----------------------------------------------------------- */
searchBtn.addEventListener("click", handleSearch);

cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleSearch();
});

locationBtn.addEventListener("click", handleUseMyLocation);

unitF.addEventListener("click", () => setUnits("imperial"));
unitC.addEventListener("click", () => setUnits("metric"));

/* Set the initial active state on the unit toggle */
setUnitToggleUI();

/* -----------------------------------------------------------
   STEP 4 — Handlers
----------------------------------------------------------- */
function handleSearch() {
  const city = cityInput.value.trim();
  if (!city) {
    showError("Please type a city name first.");
    return;
  }
  lastQuery = { type: "city", city };
  loadDashboard();
}

function handleUseMyLocation() {
  if (!navigator.geolocation) {
    showError("Geolocation is not supported by your browser.");
    return;
  }
  showLoading();
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      lastQuery = { type: "coords", lat: pos.coords.latitude, lon: pos.coords.longitude };
      loadDashboard();
    },
    () => {
      hideLoading();
      showError("Unable to get your location. Please allow location access, or search manually.");
    }
  );
}

function setUnits(newUnits) {
  if (units === newUnits) return;
  units = newUnits;
  setUnitToggleUI();
  if (lastQuery) loadDashboard(); // re-fetch with the new units
}

function setUnitToggleUI() {
  unitF.classList.toggle("active", units === "imperial");
  unitC.classList.toggle("active", units === "metric");
}

/* -----------------------------------------------------------
   STEP 5 — Orchestrator: runs the current + forecast requests,
   then renders every part of the dashboard.
----------------------------------------------------------- */
async function loadDashboard() {
  showLoading();
  clearError();

  try {
    const current = await fetchCurrentWeather();
    const { lat, lon } = current.coord;

    // Run the forecast request in parallel with the (optional) UV request
    const [forecast, uvi] = await Promise.all([
      fetchForecast(lat, lon),
      fetchUvIndexSafely(lat, lon),
    ]);

    renderCurrent(current);
    renderHourly(forecast);
    renderDaily(forecast);
    renderRadar(lat, lon);
    renderUV(uvi);

    emptyState.classList.add("hidden");
    dashboardGrid.classList.remove("hidden");
  } catch (err) {
    showError(err.message || "Something went wrong while fetching the weather.");
    dashboardGrid.classList.add("hidden");
    emptyState.classList.remove("hidden");
  } finally {
    hideLoading();
  }
}

/* -----------------------------------------------------------
   STEP 6 — API calls
----------------------------------------------------------- */
async function fetchCurrentWeather() {
  const url = lastQuery.type === "city"
    ? `${CURRENT_URL}?q=${encodeURIComponent(lastQuery.city)}&appid=${API_KEY}&units=${units}`
    : `${CURRENT_URL}?lat=${lastQuery.lat}&lon=${lastQuery.lon}&appid=${API_KEY}&units=${units}`;

  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(friendlyError(res.status, data.message));
  return data;
}

async function fetchForecast(lat, lon) {
  const url = `${FORECAST_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${units}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(friendlyError(res.status, data.message));
  return data;
}

/* ---------- OPTIONAL: UV INDEX (One Call 3.0) ----------
   This endpoint requires a One Call 3.0 subscription (free up to
   1,000 calls/day, but OpenWeatherMap asks for a card on file).
   If it's not set up, we simply show "N/A" instead of breaking
   the rest of the dashboard. See the PDF docs to enable it. */
async function fetchUvIndexSafely(lat, lon) {
  try {
    const url = `${ONECALL_URL}?lat=${lat}&lon=${lon}&exclude=minutely,hourly,daily,alerts&appid=${API_KEY}&units=${units}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.current?.uvi === "number" ? data.current.uvi : null;
  } catch {
    return null; // fail silently — UV Index is a nice-to-have, not core data
  }
}

function friendlyError(status, message) {
  if (status === 401) return "Invalid or inactive API key. Check script.js — new keys can take up to ~2 hours to activate.";
  if (status === 404) return "City not found. Try \u201cCity, CountryCode\u201d, e.g. \u201cSpringfield, US\u201d.";
  if (status === 429) return "Too many requests right now. Please wait a moment and try again.";
  return message || "Something went wrong while fetching the weather.";
}

/* -----------------------------------------------------------
   STEP 7 — Render: current conditions (hero card)
----------------------------------------------------------- */
function renderCurrent(data) {
  cityName.textContent = `${data.name}${data.sys?.country ? ", " + data.sys.country : ""}`;
  currentTemp.textContent = Math.round(data.main.temp);
  currentDesc.textContent = capitalize(data.weather[0].description);
  tempHigh.textContent = `${Math.round(data.main.temp_max)}°`;
  tempLow.textContent = `${Math.round(data.main.temp_min)}°`;

  const { icon, colorClass } = mapWeatherIcon(data.weather[0].icon);
  heroIcon.textContent = icon;
  heroIcon.className = `material-symbols-outlined text-4xl ${colorClass}`;
  heroIcon.style.fontVariationSettings = "'FILL' 1";

  // Humidity
  humidityValue.textContent = data.main.humidity;
  const dewPoint = calculateDewPoint(data.main.temp, data.main.humidity, units);
  dewPointNote.textContent = `The dew point is ${Math.round(dewPoint)}° right now.`;

  // Wind
  windUnit.textContent = units === "imperial" ? "mph" : "m/s";
  windSpeedValue.textContent = Math.round(data.wind.speed);
  windDirection.textContent = degToCompass(data.wind.deg ?? 0);
  windArrow.style.transform = `rotate(${(data.wind.deg ?? 0)}deg)`;

  // Visibility (API always returns meters, regardless of units)
  visibilityUnit.textContent = units === "imperial" ? "mi" : "km";
  const visRaw = data.visibility ?? 10000; // meters
  const visConverted = units === "imperial" ? visRaw / 1609.34 : visRaw / 1000;
  visibilityValue.textContent = visConverted.toFixed(1).replace(/\.0$/, "");
  visibilityNote.textContent = visRaw >= 9000 ? "Perfectly clear view." : "Reduced visibility.";
}

/* -----------------------------------------------------------
   STEP 8 — Render: 24-hour SVG line chart
----------------------------------------------------------- */
function renderHourly(forecast) {
  const points = forecast.list.slice(0, 8); // 8 x 3-hour steps = 24 hours
  const temps = points.map((p) => p.main.temp);
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const range = max - min || 1;

  const chartWidth = 400;
  const topY = 20, bottomY = 80;
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * chartWidth;
    const y = bottomY - ((p.main.temp - min) / range) * (bottomY - topY);
    return { x, y, temp: p.main.temp };
  });

  const pathD = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");

  hourlyChart.innerHTML = `
    <path d="${pathD}" fill="none" stroke="var(--color-primary)" stroke-linecap="round" stroke-linejoin="round" stroke-width="4"></path>
    <circle class="animate-pulse" cx="${coords[0].x}" cy="${coords[0].y}" fill="var(--color-primary)" r="6"></circle>
  `;

  // Floating "now" temperature label above the first point
  hourlyFloatingTemp.style.left = `${coords[0].x}px`;
  hourlyFloatingTemp.style.top = `${coords[0].y - 22}px`;
  hourlyFloatingTemp.textContent = `${Math.round(points[0].main.temp)}°`;

  // X-axis labels: 5 evenly spread across the 8 points
  const labelIdxs = [0, 2, 4, 6, 7];
  hourlyLabels.innerHTML = labelIdxs.map((i, idx) => {
    const label = idx === 0 ? "Now" : formatHour(points[i].dt, forecast.city.timezone);
    return `<span>${label}</span>`;
  }).join("");
}

/* -----------------------------------------------------------
   STEP 9 — Render: 5-day forecast list
----------------------------------------------------------- */
function renderDaily(forecast) {
  const tz = forecast.city.timezone; // seconds offset from UTC
  const groups = {}; // dateKey -> array of entries

  forecast.list.forEach((entry) => {
    const localDate = new Date((entry.dt + tz) * 1000);
    const key = localDate.toISOString().slice(0, 10);
    (groups[key] ||= []).push(entry);
  });

  const dateKeys = Object.keys(groups).slice(0, 5);

  const days = dateKeys.map((key, idx) => {
    const entries = groups[key];
    const temps = entries.map((e) => e.main.temp);
    const min = Math.min(...temps);
    const max = Math.max(...temps);

    // Prefer the entry closest to local noon as the "representative" icon
    const noonEntry = entries.reduce((best, e) => {
      const hour = new Date((e.dt + tz) * 1000).getUTCHours();
      const bestHour = new Date((best.dt + tz) * 1000).getUTCHours();
      return Math.abs(hour - 12) < Math.abs(bestHour - 12) ? e : best;
    }, entries[0]);

    const label = idx === 0 ? "Today" : new Date((entries[0].dt + tz) * 1000)
      .toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });

    return { label, min, max, icon: noonEntry.weather[0].icon, isFirst: idx === 0 };
  });

  const globalMin = Math.min(...days.map((d) => d.min));
  const globalMax = Math.max(...days.map((d) => d.max));
  const globalRange = (globalMax - globalMin) || 1;

  forecastList.innerHTML = days.map((day) => {
    const { icon, colorClass } = mapWeatherIcon(day.icon);
    const leftPct = ((day.min - globalMin) / globalRange) * 100;
    const rightPct = 100 - ((day.max - globalMin) / globalRange) * 100;

    return `
      <div class="forecast-row">
        <span class="w-12 font-medium ${day.isFirst ? "" : "text-text-muted"}">${day.label}</span>
        <div class="flex items-center justify-center w-12 ${colorClass}">
          <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">${icon}</span>
        </div>
        <div class="flex items-center gap-3 flex-1 ml-4">
          <span class="text-sm font-medium text-text-muted w-6 text-right">${Math.round(day.min)}°</span>
          <div class="flex-1 h-2 rounded-full bg-surface-variant overflow-hidden relative">
            <div class="absolute inset-y-0 gradient-bar rounded-full" style="left:${leftPct}%; right:${rightPct}%;"></div>
          </div>
          <span class="text-sm font-medium w-6 text-right">${Math.round(day.max)}°</span>
        </div>
      </div>
    `;
  }).join("");
}

/* -----------------------------------------------------------
   STEP 10 — Render: precipitation radar tile preview
   Uses OpenWeatherMap's free Weather Maps tile layer.
----------------------------------------------------------- */
function renderRadar(lat, lon) {
  const zoom = 6;
  const { x, y } = latLonToTile(lat, lon, zoom);
  const tileImageUrl = `${TILE_URL}/${zoom}/${x}/${y}.png?appid=${API_KEY}`;
  radarImage.style.backgroundImage = `url("${tileImageUrl}")`;
  radarLink.href = `https://openweathermap.org/weathermap?basemap=map&cities=true&layer=precipitation&lat=${lat}&lon=${lon}&zoom=8`;
}

/* -----------------------------------------------------------
   STEP 11 — Render: UV Index (or "N/A" if unavailable)
----------------------------------------------------------- */
function renderUV(uvi) {
  if (uvi === null || uvi === undefined) {
    uvValue.textContent = "N/A";
    uvLabel.textContent = "Enable One Call 3.0";
    uvBar.style.width = "0%";
    return;
  }
  uvValue.textContent = Math.round(uvi);
  uvBar.style.width = `${Math.min((uvi / 11) * 100, 100)}%`;

  if (uvi < 3) uvLabel.textContent = "Low";
  else if (uvi < 6) uvLabel.textContent = "Moderate";
  else if (uvi < 8) uvLabel.textContent = "High";
  else if (uvi < 11) uvLabel.textContent = "Very High";
  else uvLabel.textContent = "Extreme";
}

/* -----------------------------------------------------------
   STEP 12 — Small helpers
----------------------------------------------------------- */

// Maps an OpenWeatherMap icon code (e.g. "10d") to a Material Symbol
// name + a Tailwind text-color class, echoing the original mockup.
function mapWeatherIcon(owmIcon) {
  const code = owmIcon.slice(0, 2);
  const isNight = owmIcon.endsWith("n");

  const table = {
    "01": { icon: isNight ? "clear_night" : "sunny", colorClass: "text-accent" },
    "02": { icon: isNight ? "partly_cloudy_night" : "partly_cloudy_day", colorClass: "text-accent" },
    "03": { icon: "cloud", colorClass: "text-text-muted" },
    "04": { icon: "cloud", colorClass: "text-text-muted" },
    "09": { icon: "rainy", colorClass: "text-primary" },
    "10": { icon: "rainy", colorClass: "text-primary" },
    "11": { icon: "thunderstorm", colorClass: "text-primary" },
    "13": { icon: "ac_unit", colorClass: "text-primary" },
    "50": { icon: "foggy", colorClass: "text-text-muted" },
  };

  return table[code] || { icon: "help", colorClass: "text-text-muted" };
}

function degToCompass(deg) {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

// Standard "slippy map" lat/lon -> tile x/y formula
function latLonToTile(lat, lon, zoom) {
  const latRad = (lat * Math.PI) / 180;
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lon + 180) / 360) * n);
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { x, y };
}

// Simple Magnus-formula dew point approximation.
// Expects temp in the currently selected unit; converts to Celsius first.
function calculateDewPoint(temp, humidity, unitSystem) {
  const tempC = unitSystem === "imperial" ? ((temp - 32) * 5) / 9 : temp;
  const a = 17.27, b = 237.7;
  const alpha = (a * tempC) / (b + tempC) + Math.log(humidity / 100);
  const dewC = (b * alpha) / (a - alpha);
  return unitSystem === "imperial" ? (dewC * 9) / 5 + 32 : dewC;
}

function formatHour(unixSeconds, tzOffsetSeconds) {
  const date = new Date((unixSeconds + tzOffsetSeconds) * 1000);
  let hours = date.getUTCHours();
  const suffix = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours} ${suffix}`;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function showLoading() {
  loadingState.classList.remove("hidden");
  dashboardGrid.classList.add("hidden");
  emptyState.classList.add("hidden");
}

function hideLoading() {
  loadingState.classList.add("hidden");
}

function showError(msg) {
  errorText.textContent = msg;
  errorBanner.classList.remove("hidden");
}

function clearError() {
  errorBanner.classList.add("hidden");
}
