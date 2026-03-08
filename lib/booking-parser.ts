import { ParsedBooking } from '@/types';
import { AIRPORTS, isValidIATA, getCityFromIATA, getIATAFromCity, normalizeCity } from './airports';
import { findAirlineInText } from './airlines';

// ============================================
// Moteur d'extraction de réservations aériennes
// Extraction par regex/heuristiques — pas de LLM
// ============================================

const FRENCH_MONTHS: Record<string, string> = {
  janvier: '01', février: '02', fevrier: '02', mars: '03', avril: '04',
  mai: '05', juin: '06', juillet: '07', août: '08', aout: '08',
  septembre: '09', octobre: '10', novembre: '11', décembre: '12', decembre: '12',
};

const ENGLISH_MONTHS: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

const GDS_MONTHS: Record<string, string> = {
  JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
  JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12',
};

// ---- Extracteurs individuels ----

function extractRoute(text: string): { origine?: string; destination?: string; confidence: number } {
  // Pattern: CDG-DSS, CDG/DSS, CDG → DSS, CDG > DSS, CDG - DSS
  const routePattern = /\b([A-Z]{3})\s*[-\/→>–—]\s*([A-Z]{3})\b/;
  const match = text.match(routePattern);
  if (match && isValidIATA(match[1]) && isValidIATA(match[2])) {
    return { origine: match[1], destination: match[2], confidence: 0.95 };
  }
  return { confidence: 0 };
}

function extractIATACodes(text: string): { codes: string[]; confidence: number } {
  const pattern = /\b([A-Z]{3})\b/g;
  const matches: string[] = [];
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const code = match[1];
    // Exclure les mots courants de 3 lettres et codes airline
    const excluded = new Set(['THE', 'FOR', 'AND', 'NOT', 'ARE', 'BUT', 'ALL', 'CAN', 'HER', 'WAS',
      'ONE', 'OUR', 'OUT', 'VOL', 'VOL', 'REF', 'PNR', 'EUR', 'USD', 'XOF', 'MAD',
      'PAX', 'ADT', 'CHD', 'INF', 'TTC', 'HRS', 'MIN', 'SEC', 'SMS', 'PDF']);
    if (!excluded.has(code) && isValidIATA(code) && !matches.includes(code)) {
      matches.push(code);
    }
  }
  return { codes: matches, confidence: matches.length > 0 ? 0.9 : 0 };
}

function extractCityNames(text: string): { villes: Array<{ nom: string; iata: string }>; confidence: number } {
  const normalized = normalizeCity(text);
  const results: Array<{ nom: string; iata: string; position: number }> = [];

  // Chercher chaque ville connue dans le texte
  for (const [iata, ville] of Object.entries(AIRPORTS)) {
    const villeNorm = normalizeCity(ville);
    if (villeNorm.length < 4) continue; // Ignorer les noms trop courts
    const pos = normalized.indexOf(villeNorm);
    if (pos !== -1) {
      // Vérifier que c'est un mot entier (pas un sous-mot)
      const before = pos > 0 ? normalized[pos - 1] : ' ';
      const after = pos + villeNorm.length < normalized.length ? normalized[pos + villeNorm.length] : ' ';
      if (/[\s,.\-;:()\/]/.test(before) || pos === 0) {
        if (/[\s,.\-;:()\/]/.test(after) || pos + villeNorm.length === normalized.length) {
          // Éviter les doublons (CDG et ORY sont tous deux "Paris")
          if (!results.find(r => r.iata === iata)) {
            results.push({ nom: ville, iata, position: pos });
          }
        }
      }
    }
  }

  // Trier par position dans le texte (premier = origine, deuxième = destination)
  results.sort((a, b) => a.position - b.position);

  // Dédupliquer par ville (garder le premier IATA code)
  const unique = results.filter((r, i, arr) =>
    i === arr.findIndex(x => normalizeCity(x.nom) === normalizeCity(r.nom))
  );

  return {
    villes: unique.map(r => ({ nom: r.nom, iata: r.iata })),
    confidence: unique.length >= 2 ? 0.85 : unique.length === 1 ? 0.7 : 0,
  };
}

function extractPrice(text: string): { prix?: number; confidence: number } {
  const patterns = [
    // 680,00 EUR ou 680.00 EUR ou 680,00€ ou 680€
    { regex: /(\d[\d\s]*\d)[.,](\d{2})\s*(?:€|EUR|euros?)/i, conf: 0.95 },
    { regex: /(?:€|EUR)\s*(\d[\d\s]*\d)[.,](\d{2})/i, conf: 0.95 },
    // Prix avec label : "prix: 680" ou "montant: 680,00"
    { regex: /(?:prix|tarif|montant|total|fare|amount|cout|coût|price)\s*[:#]?\s*(\d[\d\s]*\d)[.,]?(\d{0,2})\s*(?:€|EUR|euros?)?/i, conf: 0.9 },
    // Nombre seul avec symbole monétaire
    { regex: /(\d{3,5})[.,](\d{2})\s*(?:€|EUR)/i, conf: 0.9 },
    // Montant simple type "680 €" ou "680€"
    { regex: /(\d{3,5})\s*(?:€|EUR)/i, conf: 0.85 },
  ];

  for (const { regex, conf } of patterns) {
    const match = text.match(regex);
    if (match) {
      const intPart = match[1].replace(/\s/g, '');
      const decPart = match[2] || '00';
      const prix = parseFloat(`${intPart}.${decPart}`);
      // Vérifier que c'est un prix de billet réaliste (50€ - 15000€)
      if (prix >= 50 && prix <= 15000) {
        return { prix, confidence: conf };
      }
    }
  }

  // Fallback : chercher un nombre dans la plage typique d'un billet
  const fallback = text.match(/\b(\d{3,5})[.,]?(\d{0,2})\b/g);
  if (fallback) {
    for (const num of fallback) {
      const prix = parseFloat(num.replace(',', '.'));
      if (prix >= 100 && prix <= 5000) {
        return { prix, confidence: 0.5 };
      }
    }
  }

  return { confidence: 0 };
}

function extractDate(text: string): { date?: string; confidence: number } {
  // ISO : 2025-03-15
  const iso = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) {
    return { date: `${iso[1]}-${iso[2]}-${iso[3]}`, confidence: 0.95 };
  }

  // GDS : 15MAR25 ou 15MAR2025
  const gds = text.match(/\b(\d{2})(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(\d{2,4})\b/);
  if (gds) {
    const day = gds[1];
    const month = GDS_MONTHS[gds[2]];
    const year = gds[3].length === 2 ? `20${gds[3]}` : gds[3];
    return { date: `${year}-${month}-${day}`, confidence: 0.95 };
  }

  // Français : "15 mars 2025"
  const frenchPattern = /\b(\d{1,2})\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s+(\d{4})\b/i;
  const french = text.match(frenchPattern);
  if (french) {
    const day = french[1].padStart(2, '0');
    const month = FRENCH_MONTHS[french[2].toLowerCase()];
    return { date: `${french[3]}-${month}-${day}`, confidence: 0.9 };
  }

  // Anglais : "15 Mar 2025" ou "Mar 15, 2025"
  const englishPattern = /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{4})\b/i;
  const english = text.match(englishPattern);
  if (english) {
    const day = english[1].padStart(2, '0');
    const month = ENGLISH_MONTHS[english[2].toLowerCase().substring(0, 3)];
    return { date: `${english[3]}-${month}-${day}`, confidence: 0.9 };
  }

  // Européen : 15/03/2025 ou 15.03.2025 ou 15-03-2025
  const european = text.match(/\b(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{4})\b/);
  if (european) {
    const day = european[1].padStart(2, '0');
    const month = european[2].padStart(2, '0');
    const year = european[3];
    if (parseInt(month) <= 12 && parseInt(day) <= 31) {
      return { date: `${year}-${month}-${day}`, confidence: 0.8 };
    }
  }

  // Court : 15/03/25
  const short = text.match(/\b(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2})\b/);
  if (short) {
    const day = short[1].padStart(2, '0');
    const month = short[2].padStart(2, '0');
    const year = `20${short[3]}`;
    if (parseInt(month) <= 12 && parseInt(day) <= 31) {
      return { date: `${year}-${month}-${day}`, confidence: 0.7 };
    }
  }

  return { confidence: 0 };
}

function extractReference(text: string): { reference?: string; confidence: number } {
  // Avec label : PNR: ABC123, REF: XY1234, BOOKING: ABCDEF
  const labeled = text.match(/(?:PNR|REF|BOOKING|DOSSIER|REFERENCE|CONFIRMATION|CONF|LOCATOR)\s*[:#\-]?\s*([A-Z0-9]{5,8})\b/i);
  if (labeled) {
    return { reference: labeled[1].toUpperCase(), confidence: 0.9 };
  }

  // Format PNR classique : 6 caractères alphanumériques (ex: AB1C2D)
  // On cherche après avoir filtré les IATA codes et mots courants
  const candidates = text.match(/\b([A-Z][A-Z0-9]{5})\b/g);
  if (candidates) {
    for (const candidate of candidates) {
      // Exclure les IATA codes (3 lettres), les mots courants
      if (candidate.length === 6 && !isValidIATA(candidate.substring(0, 3))) {
        // Vérifier que c'est bien un mix lettres/chiffres (pas un mot)
        if (/\d/.test(candidate) && /[A-Z]/.test(candidate)) {
          return { reference: candidate, confidence: 0.7 };
        }
      }
    }
  }

  return { confidence: 0 };
}

// ---- Fonction principale ----

export function parseBookingText(text: string): ParsedBooking {
  const result: ParsedBooking = { confidence: {} };

  // 1. Route directe (CDG-DSS, CDG → DSS)
  const route = extractRoute(text);
  if (route.origine && route.destination) {
    result.origine = route.origine;
    result.destination = route.destination;
    result.ville_origine = getCityFromIATA(route.origine);
    result.ville_destination = getCityFromIATA(route.destination);
    result.confidence['origine'] = route.confidence;
    result.confidence['destination'] = route.confidence;
    result.confidence['ville_origine'] = route.confidence;
    result.confidence['ville_destination'] = route.confidence;
  }

  // 2. IATA codes individuels (si pas de route trouvée)
  if (!result.origine) {
    const iata = extractIATACodes(text);
    if (iata.codes.length >= 2) {
      result.origine = iata.codes[0];
      result.destination = iata.codes[1];
      result.ville_origine = getCityFromIATA(iata.codes[0]);
      result.ville_destination = getCityFromIATA(iata.codes[1]);
      result.confidence['origine'] = iata.confidence;
      result.confidence['destination'] = iata.confidence;
      result.confidence['ville_origine'] = iata.confidence;
      result.confidence['ville_destination'] = iata.confidence;
    } else if (iata.codes.length === 1) {
      result.origine = iata.codes[0];
      result.ville_origine = getCityFromIATA(iata.codes[0]);
      result.confidence['origine'] = iata.confidence;
      result.confidence['ville_origine'] = iata.confidence;
    }
  }

  // 3. Noms de villes (si pas de codes IATA)
  if (!result.ville_origine) {
    const cities = extractCityNames(text);
    if (cities.villes.length >= 2) {
      result.ville_origine = cities.villes[0].nom;
      result.ville_destination = cities.villes[1].nom;
      result.origine = cities.villes[0].iata;
      result.destination = cities.villes[1].iata;
      result.confidence['ville_origine'] = cities.confidence;
      result.confidence['ville_destination'] = cities.confidence;
      result.confidence['origine'] = cities.confidence * 0.9;
      result.confidence['destination'] = cities.confidence * 0.9;
    } else if (cities.villes.length === 1) {
      result.ville_origine = cities.villes[0].nom;
      result.origine = cities.villes[0].iata;
      result.confidence['ville_origine'] = cities.confidence;
      result.confidence['origine'] = cities.confidence * 0.9;
    }
  }

  // Résolution bidirectionnelle : compléter ce qui manque
  if (result.origine && !result.ville_origine) {
    result.ville_origine = getCityFromIATA(result.origine);
    if (result.ville_origine) result.confidence['ville_origine'] = (result.confidence['origine'] || 0) * 0.9;
  }
  if (result.destination && !result.ville_destination) {
    result.ville_destination = getCityFromIATA(result.destination);
    if (result.ville_destination) result.confidence['ville_destination'] = (result.confidence['destination'] || 0) * 0.9;
  }
  if (result.ville_origine && !result.origine) {
    const iata = getIATAFromCity(result.ville_origine);
    if (iata) {
      result.origine = iata;
      result.confidence['origine'] = (result.confidence['ville_origine'] || 0) * 0.85;
    }
  }
  if (result.ville_destination && !result.destination) {
    const iata = getIATAFromCity(result.ville_destination);
    if (iata) {
      result.destination = iata;
      result.confidence['destination'] = (result.confidence['ville_destination'] || 0) * 0.85;
    }
  }

  // 4. Prix
  const price = extractPrice(text);
  if (price.prix) {
    result.prix = price.prix;
    result.confidence['prix'] = price.confidence;
  }

  // 5. Date
  const date = extractDate(text);
  if (date.date) {
    result.date_vol = date.date;
    result.confidence['date_vol'] = date.confidence;
  }

  // 6. Compagnie
  const airline = findAirlineInText(text);
  if (airline) {
    result.compagnie = airline.airline.name;
    result.confidence['compagnie'] = airline.confidence;
  }

  // 7. Référence
  const ref = extractReference(text);
  if (ref.reference) {
    result.reference_billet = ref.reference;
    result.confidence['reference_billet'] = ref.confidence;
  }

  return result;
}
