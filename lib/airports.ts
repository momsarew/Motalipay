// Base de données des aéroports IATA → Ville
// Couvre les corridors principaux : Afrique, Europe, Moyen-Orient, Amérique du Nord

export const AIRPORTS: Record<string, string> = {
  // Afrique de l'Ouest
  DSS: 'Dakar', ABJ: 'Abidjan', ACC: 'Accra', LOS: 'Lagos',
  OUA: 'Ouagadougou', COO: 'Cotonou', NIM: 'Niamey', BKO: 'Bamako',
  CKY: 'Conakry', FNA: 'Freetown', ROB: 'Monrovia', LFW: 'Lomé',
  BJL: 'Banjul', PRM: 'Praia',
  // Afrique du Nord
  CMN: 'Casablanca', RAK: 'Marrakech', ALG: 'Alger', ORN: 'Oran',
  TUN: 'Tunis', CAI: 'Le Caire', TNG: 'Tanger', FEZ: 'Fès',
  AGA: 'Agadir', NBE: 'Enfidha',
  // Afrique Centrale
  DLA: 'Douala', NSI: 'Yaoundé', LBV: 'Libreville', BGF: 'Bangui',
  FIH: 'Kinshasa', BZV: 'Brazzaville', SSG: 'Malabo', POG: 'Port-Gentil',
  // Afrique de l'Est
  NBO: 'Nairobi', ADD: 'Addis-Abeba', DAR: 'Dar es Salaam',
  EBB: 'Entebbe', KGL: 'Kigali', MGQ: 'Mogadiscio', BJM: 'Bujumbura',
  // Afrique Australe
  JNB: 'Johannesburg', CPT: 'Le Cap', MRU: 'Maurice',
  TNR: 'Antananarivo', SEZ: 'Mahé',
  // Afrique — Îles
  RUN: 'La Réunion', NOS: 'Nosy Be', HAH: 'Moroni',
  // France métropolitaine
  CDG: 'Paris', ORY: 'Paris-Orly', LYS: 'Lyon', MRS: 'Marseille',
  NCE: 'Nice', TLS: 'Toulouse', BOD: 'Bordeaux', NTE: 'Nantes',
  LIL: 'Lille', SXB: 'Strasbourg', MPL: 'Montpellier',
  // France d'outre-mer
  PTP: 'Pointe-à-Pitre', FDF: 'Fort-de-France', CAY: 'Cayenne',
  // Europe
  LHR: 'Londres', LGW: 'Londres-Gatwick', BRU: 'Bruxelles',
  AMS: 'Amsterdam', FRA: 'Francfort', MUC: 'Munich',
  MAD: 'Madrid', BCN: 'Barcelone', FCO: 'Rome', MXP: 'Milan',
  IST: 'Istanbul', LIS: 'Lisbonne', GVA: 'Genève', ZRH: 'Zurich',
  VIE: 'Vienne', CPH: 'Copenhague', OSL: 'Oslo', ARN: 'Stockholm',
  ATH: 'Athènes',
  // Moyen-Orient
  DXB: 'Dubaï', DOH: 'Doha', AUH: 'Abu Dhabi',
  JED: 'Djeddah', RUH: 'Riyad', BAH: 'Bahreïn',
  KWI: 'Koweït', MCT: 'Mascate', AMM: 'Amman',
  // Amérique du Nord
  JFK: 'New York', EWR: 'Newark', IAD: 'Washington',
  YUL: 'Montréal', YYZ: 'Toronto', ORD: 'Chicago',
  LAX: 'Los Angeles', MIA: 'Miami', ATL: 'Atlanta',
  // Asie (liaisons fréquentes)
  PEK: 'Pékin', HKG: 'Hong Kong', SIN: 'Singapour',
  BKK: 'Bangkok', DEL: 'New Delhi',
};

// Normalise un nom de ville (minuscule, sans accents)
export function normalizeCity(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Reverse lookup : ville → IATA codes
const cityToIataCache: Map<string, string[]> = new Map();

function buildCityIndex() {
  if (cityToIataCache.size > 0) return;
  for (const [iata, city] of Object.entries(AIRPORTS)) {
    const normalized = normalizeCity(city);
    const existing = cityToIataCache.get(normalized) || [];
    existing.push(iata);
    cityToIataCache.set(normalized, existing);
  }
  // Aliases courants
  const aliases: Record<string, string[]> = {
    'ny': ['JFK'], 'new-york': ['JFK'], 'newyork': ['JFK'],
    'paris': ['CDG'], 'paris-cdg': ['CDG'], 'roissy': ['CDG'], 'orly': ['ORY'],
    'casa': ['CMN'], 'casablanca': ['CMN'],
    'montreal': ['YUL'], 'toronto': ['YYZ'],
    'bruxelles': ['BRU'], 'brussels': ['BRU'],
    'londres': ['LHR'], 'london': ['LHR'],
    'le caire': ['CAI'], 'cairo': ['CAI'],
    'abidjan': ['ABJ'], 'dakar': ['DSS'],
    'addis': ['ADD'], 'addis-abeba': ['ADD'], 'addis ababa': ['ADD'],
    'joburg': ['JNB'], 'johannesburg': ['JNB'],
    'dubai': ['DXB'], 'dubay': ['DXB'],
    'geneve': ['GVA'], 'zurich': ['ZRH'],
    'istanbul': ['IST'],
    'la reunion': ['RUN'], 'reunion': ['RUN'],
    'guadeloupe': ['PTP'], 'martinique': ['FDF'],
  };
  for (const [alias, codes] of Object.entries(aliases)) {
    const normalized = normalizeCity(alias);
    if (!cityToIataCache.has(normalized)) {
      cityToIataCache.set(normalized, codes);
    }
  }
}

export function isValidIATA(code: string): boolean {
  return code.length === 3 && code === code.toUpperCase() && code in AIRPORTS;
}

export function getCityFromIATA(code: string): string | undefined {
  return AIRPORTS[code.toUpperCase()];
}

export function getIATAFromCity(city: string): string | undefined {
  buildCityIndex();
  const normalized = normalizeCity(city);
  const codes = cityToIataCache.get(normalized);
  return codes?.[0];
}

export function getAllIATAForCity(city: string): string[] {
  buildCityIndex();
  const normalized = normalizeCity(city);
  return cityToIataCache.get(normalized) || [];
}
