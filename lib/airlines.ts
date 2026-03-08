// Base de données des compagnies aériennes pertinentes

export interface Airline {
  name: string;
  iata: string;
  aliases: string[];
}

export const AIRLINES: Airline[] = [
  // Afrique
  { name: 'Air Sénégal', iata: 'HC', aliases: ['air senegal', 'airsenegal'] },
  { name: "Air Côte d'Ivoire", iata: 'HF', aliases: ['air cote divoire', 'air cote d ivoire'] },
  { name: 'Royal Air Maroc', iata: 'AT', aliases: ['ram', 'royal air maroc'] },
  { name: 'Ethiopian Airlines', iata: 'ET', aliases: ['ethiopian', 'ethiopian airlines'] },
  { name: 'Kenya Airways', iata: 'KQ', aliases: ['kenya airways', 'kenya'] },
  { name: 'South African Airways', iata: 'SA', aliases: ['south african', 'saa'] },
  { name: 'ASKY Airlines', iata: 'KP', aliases: ['asky'] },
  { name: 'Tunisair', iata: 'TU', aliases: ['tunisair'] },
  { name: 'Air Algérie', iata: 'AH', aliases: ['air algerie', 'airalgerie'] },
  { name: 'EgyptAir', iata: 'MS', aliases: ['egyptair', 'egypt air'] },
  { name: 'Rwandair', iata: 'WB', aliases: ['rwandair', 'rwanda air'] },
  { name: 'Air Mauritius', iata: 'MK', aliases: ['air mauritius'] },
  { name: 'Corsair', iata: 'SS', aliases: ['corsair', 'corsair international'] },
  { name: 'Air Austral', iata: 'UU', aliases: ['air austral'] },
  { name: 'Camair-Co', iata: 'QC', aliases: ['camair', 'camair-co', 'cameroon airlines'] },
  // Europe
  { name: 'Air France', iata: 'AF', aliases: ['air france', 'airfrance'] },
  { name: 'Brussels Airlines', iata: 'SN', aliases: ['brussels', 'brussels airlines'] },
  { name: 'Turkish Airlines', iata: 'TK', aliases: ['turkish', 'turkish airlines', 'thy'] },
  { name: 'TAP Portugal', iata: 'TP', aliases: ['tap', 'tap portugal', 'tap air portugal'] },
  { name: 'Iberia', iata: 'IB', aliases: ['iberia'] },
  { name: 'Lufthansa', iata: 'LH', aliases: ['lufthansa'] },
  { name: 'KLM', iata: 'KL', aliases: ['klm', 'klm royal dutch'] },
  { name: 'British Airways', iata: 'BA', aliases: ['british airways', 'british'] },
  { name: 'Swiss', iata: 'LX', aliases: ['swiss', 'swiss international'] },
  { name: 'Transavia', iata: 'TO', aliases: ['transavia'] },
  // Moyen-Orient
  { name: 'Emirates', iata: 'EK', aliases: ['emirates'] },
  { name: 'Qatar Airways', iata: 'QR', aliases: ['qatar', 'qatar airways'] },
  { name: 'Saudia', iata: 'SV', aliases: ['saudia', 'saudi arabian', 'saudi airlines'] },
  { name: 'Etihad', iata: 'EY', aliases: ['etihad', 'etihad airways'] },
  // Amérique
  { name: 'Air Transat', iata: 'TS', aliases: ['transat', 'air transat'] },
  { name: 'Air Canada', iata: 'AC', aliases: ['air canada'] },
  { name: 'Delta', iata: 'DL', aliases: ['delta', 'delta airlines'] },
  { name: 'United', iata: 'UA', aliases: ['united', 'united airlines'] },
];

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

/**
 * Cherche une compagnie aérienne dans un texte
 * Retourne la première correspondance trouvée
 */
export function findAirlineInText(text: string): { airline: Airline; confidence: number } | null {
  const normalized = normalize(text);

  // 1. Recherche par nom complet ou alias (haute confiance)
  for (const airline of AIRLINES) {
    const nameNorm = normalize(airline.name);
    if (normalized.includes(nameNorm)) {
      return { airline, confidence: 0.95 };
    }
    for (const alias of airline.aliases) {
      if (normalized.includes(normalize(alias))) {
        return { airline, confidence: 0.9 };
      }
    }
  }

  // 2. Recherche par code IATA dans un contexte de numéro de vol (ex: AF 123, TK1234)
  const flightNumberPattern = /\b([A-Z]{2})\s*(\d{3,4})\b/g;
  let match;
  while ((match = flightNumberPattern.exec(text)) !== null) {
    const code = match[1];
    const airline = AIRLINES.find(a => a.iata === code);
    if (airline) {
      return { airline, confidence: 0.85 };
    }
  }

  return null;
}

/**
 * Recherche une compagnie par code IATA exact
 */
export function getAirlineByCode(code: string): Airline | undefined {
  return AIRLINES.find(a => a.iata === code.toUpperCase());
}
