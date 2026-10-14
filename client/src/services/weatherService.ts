/**
 * Kota Kinabalu Real-Time Weather Service
 * Fetches actual live weather data for Kota Kinabalu, Sabah via Open-Meteo API.
 * High-reliability fallback & 15-minute caching to eliminate unnecessary network churn.
 */

export interface KotaKinabaluWeather {
  temperature: number;
  condition: string;
  icon: string;
  lastUpdated: string;
}

const CACHE_KEY = 'sesb_bulletin_kk_weather_v1';
const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const DEFAULT_WEATHER: KotaKinabaluWeather = {
  temperature: 28,
  condition: 'Cerah Berawan',
  icon: 'partly_cloudy_day',
  lastUpdated: 'Live',
};

/**
 * Maps WMO standard weather code to clean Malay (Bahasa Melayu) descriptions and Material Symbols.
 */
function mapWmoToCondition(code: number): { condition: string; icon: string } {
  switch (code) {
    case 0:
      return { condition: 'Cerah', icon: 'sunny' };
    case 1:
      return { condition: 'Sebahagian Cerah', icon: 'partly_cloudy_day' };
    case 2:
    case 3:
      return { condition: 'Cerah Berawan', icon: 'partly_cloudy_day' };
    case 45:
    case 48:
      return { condition: 'Berkabus', icon: 'foggy' };
    case 51:
    case 53:
    case 55:
      return { condition: 'Gerimis', icon: 'rainy_light' };
    case 61:
    case 63:
    case 65:
      return { condition: 'Hujan', icon: 'rainy' };
    case 80:
    case 81:
    case 82:
      return { condition: 'Hujan Ribut', icon: 'rainy_heavy' };
    case 95:
    case 96:
    case 99:
      return { condition: 'Ribut Petir', icon: 'thunderstorm' };
    default:
      return { condition: 'Cerah Berawan', icon: 'partly_cloudy_day' };
  }
}

/**
 * Fetches current Kota Kinabalu weather with caching and graceful offline fallback.
 */
export async function fetchKotaKinabaluWeather(): Promise<KotaKinabaluWeather> {
  // 1. Check local storage cache
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_DURATION_MS && parsed.data) {
        return parsed.data;
      }
    }
  } catch {
    // Non-blocking storage error
  }

  // 2. Fetch from Open-Meteo API for Kota Kinabalu (Lat: 5.9804, Lon: 116.0735)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=5.9804&longitude=116.0735&current=temperature_2m,weather_code&timezone=Asia%2FKuala_Lumpur',
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Weather API HTTP error: ${res.status}`);
    }

    const data = await res.json();
    const current = data.current;
    if (current && typeof current.temperature_2m === 'number') {
      const temp = Math.round(current.temperature_2m);
      const code = current.weather_code ?? 2;
      const { condition, icon } = mapWmoToCondition(code);

      const result: KotaKinabaluWeather = {
        temperature: temp,
        condition,
        icon,
        lastUpdated: new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' }),
      };

      try {
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ timestamp: Date.now(), data: result })
        );
      } catch {}

      return result;
    }
  } catch (err) {
    console.warn('[WeatherService] Live weather fetch failed, using fallback:', err);
  }

  // Fallback to cache if available even if stale
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.data) return parsed.data;
    }
  } catch {}

  return DEFAULT_WEATHER;
}
