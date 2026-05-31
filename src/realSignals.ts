export type SignalIndustry = 'roofing' | 'hvac' | 'plumbing' | 'electrical' | 'pest' | 'garage';
export type SignalStatus = 'idle' | 'loading' | 'live' | 'fallback' | 'error';

export type WeatherSignalSummary = {
  maxTempF: number;
  minTempF: number;
  maxWindGustMph: number;
  maxPrecipProbability: number;
  totalPrecipIn: number;
  avgHumidity: number;
  triggers: string[];
};

export type SearchIntentSignal = {
  score: number;
  competition: 'Low' | 'Medium' | 'High';
  cpcTier: 'Low' | 'Medium' | 'High';
  source: 'estimated' | 'google_ads_api_ready';
  keywords: string[];
};

export type LiveSignalSet = {
  status: SignalStatus;
  source: string;
  locationName: string;
  message: string;
  weather?: WeatherSignalSummary;
  search: SearchIntentSignal;
};

type SignalRequest = {
  industry: SignalIndustry;
  city: string;
  service: string;
};

type GeoResult = {
  name: string;
  admin1?: string;
  country_code?: string;
  latitude: number;
  longitude: number;
};

type GeocodingResponse = {
  results?: GeoResult[];
};

type ForecastResponse = {
  daily?: {
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
    precipitation_sum?: number[];
    wind_gusts_10m_max?: number[];
  };
  hourly?: {
    relative_humidity_2m?: number[];
  };
};

export async function fetchLiveSignals(input: SignalRequest): Promise<LiveSignalSet> {
  const fallbackSearch = buildSearchIntent(input);

  try {
    const location = await geocodeCity(input.city);
    if (!location) {
      return {
        status: 'fallback',
        source: 'Estimated search intent only',
        locationName: input.city,
        message: 'Could not match this city to a live weather location yet. Showing search-intent estimate.',
        search: fallbackSearch
      };
    }

    const weather = await fetchWeatherSummary(location.latitude, location.longitude, input.industry);
    return {
      status: 'live',
      source: 'Open-Meteo forecast + JobLeak search estimate',
      locationName: formatLocation(location),
      message: weather.triggers.length > 0 ? `Live weather triggers found: ${weather.triggers.join(', ')}` : 'Live weather loaded. No major urgency trigger found, so search intent and launch readiness carry more weight.',
      weather,
      search: fallbackSearch
    };
  } catch {
    return {
      status: 'error',
      source: 'Estimated search intent only',
      locationName: input.city,
      message: 'Live weather could not be loaded. Showing search-intent estimate until the signal request succeeds.',
      search: fallbackSearch
    };
  }
}

async function geocodeCity(city: string): Promise<GeoResult | null> {
  const query = city.trim() || 'Phoenix, AZ';
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`);
  if (!response.ok) return null;
  const data = (await response.json()) as GeocodingResponse;
  return data.results?.[0] || null;
}

async function fetchWeatherSummary(latitude: number, longitude: number, industry: SignalIndustry): Promise<WeatherSignalSummary> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_gusts_10m_max',
    hourly: 'relative_humidity_2m',
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    precipitation_unit: 'inch',
    timezone: 'auto',
    forecast_days: '5'
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!response.ok) throw new Error('Forecast request failed');
  const data = (await response.json()) as ForecastResponse;

  const maxTempF = round(max(data.daily?.temperature_2m_max));
  const minTempF = round(min(data.daily?.temperature_2m_min));
  const maxWindGustMph = round(max(data.daily?.wind_gusts_10m_max));
  const maxPrecipProbability = round(max(data.daily?.precipitation_probability_max));
  const totalPrecipIn = round(sum(data.daily?.precipitation_sum), 1);
  const avgHumidity = round(avg(data.hourly?.relative_humidity_2m));
  const triggers = buildWeatherTriggers({ maxTempF, minTempF, maxWindGustMph, maxPrecipProbability, totalPrecipIn, avgHumidity }, industry);

  return { maxTempF, minTempF, maxWindGustMph, maxPrecipProbability, totalPrecipIn, avgHumidity, triggers };
}

function buildWeatherTriggers(weather: Omit<WeatherSignalSummary, 'triggers'>, industry: SignalIndustry) {
  const triggers: string[] = [];
  if ((industry === 'hvac' || industry === 'electrical') && weather.maxTempF >= 95) triggers.push(`heat ${weather.maxTempF}F`);
  if ((industry === 'hvac' || industry === 'plumbing') && weather.minTempF <= 32) triggers.push(`cold ${weather.minTempF}F`);
  if ((industry === 'roofing' || industry === 'garage') && weather.maxWindGustMph >= 35) triggers.push(`wind gusts ${weather.maxWindGustMph} mph`);
  if ((industry === 'roofing' || industry === 'plumbing') && (weather.maxPrecipProbability >= 60 || weather.totalPrecipIn >= 0.5)) triggers.push(`rain risk ${weather.maxPrecipProbability}%`);
  if (industry === 'pest' && weather.avgHumidity >= 60 && weather.maxTempF >= 70) triggers.push(`pest weather ${weather.maxTempF}F / ${weather.avgHumidity}% humidity`);
  return triggers;
}

function buildSearchIntent(input: SignalRequest): SearchIntentSignal {
  const service = input.service || defaultService(input.industry);
  const city = cleanCity(input.city);
  const urgentService = /repair|emergency|leak|damage|drain|spring|ac|furnace|pest|rodent|termite/i.test(service);
  const highValueIndustry = ['hvac', 'plumbing', 'roofing', 'garage'].includes(input.industry);
  const score = Math.min(95, 58 + (urgentService ? 18 : 8) + (highValueIndustry ? 10 : 5) + (city ? 5 : 0));
  return {
    score,
    competition: score >= 82 ? 'High' : score >= 70 ? 'Medium' : 'Low',
    cpcTier: highValueIndustry ? 'High' : 'Medium',
    source: 'estimated',
    keywords: [
      `${service.toLowerCase()} ${city.toLowerCase()}`.trim(),
      `${service.toLowerCase()} near me`,
      `same day ${service.toLowerCase()}`,
      `emergency ${service.toLowerCase()}`,
      `${input.industry} company ${city.toLowerCase()}`.trim()
    ]
  };
}

function defaultService(industry: SignalIndustry) {
  const map: Record<SignalIndustry, string> = {
    hvac: 'AC Repair',
    roofing: 'Roof Repair',
    plumbing: 'Emergency Plumbing',
    electrical: 'Emergency Electrician',
    pest: 'Pest Control',
    garage: 'Garage Door Repair'
  };
  return map[industry];
}

function formatLocation(location: GeoResult) {
  return [location.name, location.admin1, location.country_code].filter(Boolean).join(', ');
}

function cleanCity(city: string) {
  return city.split(',')[0].trim() || city.trim();
}

function max(values?: number[]) {
  return values && values.length ? Math.max(...values.filter((value) => Number.isFinite(value))) : 0;
}

function min(values?: number[]) {
  return values && values.length ? Math.min(...values.filter((value) => Number.isFinite(value))) : 0;
}

function sum(values?: number[]) {
  return values?.reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0) || 0;
}

function avg(values?: number[]) {
  if (!values?.length) return 0;
  const finite = values.filter((value) => Number.isFinite(value));
  return finite.length ? sum(finite) / finite.length : 0;
}

function round(value: number, digits = 0) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
