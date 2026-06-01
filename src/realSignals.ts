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

export type PublicOpportunitySignal = {
  source: 'weather' | 'search_intent' | 'permits' | 'business_openings' | 'public_bids';
  label: string;
  score: number;
  status: 'live' | 'estimated' | 'api_ready';
  detail: string;
  nextApiStep?: string;
};

export type PublicSignalLayer = {
  totalScore: number;
  confidence: 'Low' | 'Medium' | 'High';
  signals: PublicOpportunitySignal[];
  summary: string;
};

export type LiveSignalSet = {
  status: SignalStatus;
  source: string;
  locationName: string;
  message: string;
  weather?: WeatherSignalSummary;
  search: SearchIntentSignal;
  publicSignals: PublicSignalLayer;
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

const marketProfiles: Record<string, { growth: number; permitHeat: number; businessActivity: number; publicBids: number }> = {
  phoenix: { growth: 22, permitHeat: 24, businessActivity: 18, publicBids: 11 },
  mesa: { growth: 18, permitHeat: 20, businessActivity: 14, publicBids: 9 },
  scottsdale: { growth: 16, permitHeat: 18, businessActivity: 18, publicBids: 8 },
  tempe: { growth: 15, permitHeat: 16, businessActivity: 17, publicBids: 8 },
  chandler: { growth: 18, permitHeat: 19, businessActivity: 16, publicBids: 9 },
  gilbert: { growth: 20, permitHeat: 21, businessActivity: 15, publicBids: 8 },
  peoria: { growth: 16, permitHeat: 18, businessActivity: 13, publicBids: 8 },
  glendale: { growth: 16, permitHeat: 17, businessActivity: 14, publicBids: 9 },
  dallas: { growth: 22, permitHeat: 23, businessActivity: 20, publicBids: 13 },
  houston: { growth: 24, permitHeat: 24, businessActivity: 21, publicBids: 15 },
  austin: { growth: 23, permitHeat: 25, businessActivity: 22, publicBids: 13 },
  tampa: { growth: 19, permitHeat: 20, businessActivity: 18, publicBids: 11 },
  orlando: { growth: 20, permitHeat: 21, businessActivity: 19, publicBids: 11 },
  atlanta: { growth: 18, permitHeat: 19, businessActivity: 18, publicBids: 12 },
  charlotte: { growth: 19, permitHeat: 20, businessActivity: 17, publicBids: 11 },
  denver: { growth: 17, permitHeat: 19, businessActivity: 16, publicBids: 12 },
  buffalo: { growth: 10, permitHeat: 11, businessActivity: 9, publicBids: 10 }
};

const industryOpportunityWeights: Record<SignalIndustry, { permits: number; businessOpenings: number; bids: number }> = {
  hvac: { permits: 1.0, businessOpenings: 0.9, bids: 0.7 },
  roofing: { permits: 1.15, businessOpenings: 0.65, bids: 0.8 },
  plumbing: { permits: 1.0, businessOpenings: 0.8, bids: 0.85 },
  electrical: { permits: 0.95, businessOpenings: 1.0, bids: 0.9 },
  pest: { permits: 0.65, businessOpenings: 0.8, bids: 0.45 },
  garage: { permits: 0.7, businessOpenings: 0.55, bids: 0.35 }
};

export async function fetchLiveSignals(input: SignalRequest): Promise<LiveSignalSet> {
  const fallbackSearch = buildSearchIntent(input);
  const fallbackPublicSignals = buildPublicSignalLayer(input, fallbackSearch);

  try {
    const location = await geocodeCity(input.city);
    if (!location) {
      return {
        status: 'fallback',
        source: 'Estimated public opportunity signals',
        locationName: input.city,
        message: fallbackPublicSignals.summary,
        search: fallbackSearch,
        publicSignals: fallbackPublicSignals
      };
    }

    const weather = await fetchWeatherSummary(location.latitude, location.longitude, input.industry);
    const publicSignals = buildPublicSignalLayer(input, fallbackSearch, weather);
    return {
      status: 'live',
      source: 'Open-Meteo live weather + JobLeak public intelligence models',
      locationName: formatLocation(location),
      message: publicSignals.summary,
      weather,
      search: fallbackSearch,
      publicSignals
    };
  } catch {
    return {
      status: 'error',
      source: 'Estimated public opportunity signals',
      locationName: input.city,
      message: fallbackPublicSignals.summary,
      search: fallbackSearch,
      publicSignals: fallbackPublicSignals
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
  const profile = getMarketProfile(city);
  const score = Math.min(95, 55 + (urgentService ? 18 : 8) + (highValueIndustry ? 10 : 5) + Math.round(profile.growth / 3));
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
      `${input.industry} company ${city.toLowerCase()}`.trim(),
      `${input.industry} bids ${city.toLowerCase()}`.trim(),
      `${input.industry} permits ${city.toLowerCase()}`.trim()
    ]
  };
}

function buildPublicSignalLayer(input: SignalRequest, search: SearchIntentSignal, weather?: WeatherSignalSummary): PublicSignalLayer {
  const city = cleanCity(input.city);
  const profile = getMarketProfile(city);
  const weights = industryOpportunityWeights[input.industry];
  const weatherScore = weather ? Math.min(30, 10 + weather.triggers.length * 8 + weatherUrgencyBoost(weather, input.industry)) : 12;
  const permitScore = Math.min(25, Math.round(profile.permitHeat * weights.permits));
  const businessScore = Math.min(20, Math.round(profile.businessActivity * weights.businessOpenings));
  const bidScore = Math.min(15, Math.round(profile.publicBids * weights.bids));
  const searchScore = Math.min(25, Math.round(search.score / 4));
  const totalScore = Math.min(100, weatherScore + searchScore + permitScore + businessScore + bidScore);
  const confidence: PublicSignalLayer['confidence'] = weather ? (totalScore >= 75 ? 'High' : totalScore >= 58 ? 'Medium' : 'Low') : 'Medium';

  const signals: PublicOpportunitySignal[] = [
    {
      source: 'weather',
      label: weather?.triggers.length ? 'Live weather trigger' : weather ? 'Live weather baseline' : 'Weather model pending',
      score: weatherScore,
      status: weather ? 'live' : 'estimated',
      detail: weather?.triggers.length ? weather.triggers.join(', ') : weather ? 'Forecast loaded with no major urgency spike.' : 'Use Open-Meteo live forecast when location resolves.'
    },
    {
      source: 'search_intent',
      label: 'Search-intent demand',
      score: searchScore,
      status: 'estimated',
      detail: `${search.competition} commercial intent estimate for ${input.service || defaultService(input.industry)} in ${city}.`,
      nextApiStep: 'Replace estimate with Google Ads Keyword Planner metrics via backend OAuth.'
    },
    {
      source: 'permits',
      label: 'Public permit opportunity layer',
      score: permitScore,
      status: 'api_ready',
      detail: `Market profile suggests ${permitScore >= 18 ? 'strong' : permitScore >= 12 ? 'moderate' : 'light'} permit-driven demand for ${input.industry}.`,
      nextApiStep: 'Connect city/county permit open-data feeds one market at a time.'
    },
    {
      source: 'business_openings',
      label: 'Business opening / local activity layer',
      score: businessScore,
      status: 'api_ready',
      detail: `Tracks future signals from new businesses, local listings, remodels, and service-area expansion patterns.`,
      nextApiStep: 'Connect Google Places or approved business listing providers; do not scrape private data.'
    },
    {
      source: 'public_bids',
      label: 'Public contracts and bid listings layer',
      score: bidScore,
      status: 'api_ready',
      detail: `Designed for government/public bid opportunities where licensed contractors can respond legally.`,
      nextApiStep: 'Connect SAM.gov, city procurement portals, or state bid feeds where available.'
    }
  ];

  const strongest = signals.slice().sort((a, b) => b.score - a.score)[0];
  return {
    totalScore,
    confidence,
    signals,
    summary: `${confidence} public opportunity score ${totalScore}/100. Strongest layer: ${strongest.label}. ${strongest.detail}`
  };
}

function weatherUrgencyBoost(weather: WeatherSignalSummary, industry: SignalIndustry) {
  if (industry === 'hvac' && weather.maxTempF >= 100) return 10;
  if (industry === 'hvac' && weather.maxTempF >= 95) return 7;
  if (industry === 'roofing' && weather.maxWindGustMph >= 45) return 10;
  if (industry === 'roofing' && weather.maxWindGustMph >= 35) return 7;
  if (industry === 'plumbing' && weather.minTempF <= 28) return 10;
  if (industry === 'plumbing' && weather.maxPrecipProbability >= 70) return 6;
  if (industry === 'pest' && weather.avgHumidity >= 65 && weather.maxTempF >= 75) return 8;
  return 0;
}

function getMarketProfile(city: string) {
  const key = city.toLowerCase().replace(/[^a-z]/g, ' ').trim().split(/\s+/)[0];
  return marketProfiles[key] || { growth: 14, permitHeat: 15, businessActivity: 12, publicBids: 8 };
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
