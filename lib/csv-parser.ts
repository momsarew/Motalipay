// Parser CSV léger côté client
// Auto-détection du délimiteur (`;` français vs `,` anglais)

export interface CSVParseResult {
  headers: string[];
  rows: Record<string, string>[];
  errors: string[];
}

function detectDelimiter(headerLine: string): string {
  const semicolons = (headerLine.match(/;/g) || []).length;
  const commas = (headerLine.match(/,/g) || []).length;
  return semicolons >= commas ? ';' : ',';
}

function parseLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  fields.push(current.trim());
  return fields;
}

export function parseCSV(text: string): CSVParseResult {
  const errors: string[] = [];

  // Gérer le BOM UTF-8
  let cleaned = text;
  if (cleaned.charCodeAt(0) === 0xFEFF) {
    cleaned = cleaned.substring(1);
  }

  // Séparer les lignes
  const lines = cleaned.split(/\r?\n/).filter(line => line.trim().length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [], errors: ['Fichier vide'] };
  }

  // Détecter le délimiteur
  const delimiter = detectDelimiter(lines[0]);

  // Parser les headers
  const headers = parseLine(lines[0], delimiter).map(h =>
    h.toLowerCase().replace(/\s+/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  );

  // Mapper les headers connus (utilisation d'une Map pour éviter les clés dupliquées)
  const headerMap = new Map<string, string>([
    ['ville_origine', 'ville_origine'], ['origin', 'ville_origine'], ['depart', 'ville_origine'], ['from', 'ville_origine'],
    ['ville_destination', 'ville_destination'], ['arrivee', 'ville_destination'], ['to', 'ville_destination'],
    ['prix', 'prix'], ['price', 'prix'], ['tarif', 'prix'], ['montant', 'prix'], ['amount', 'prix'],
    ['origine', 'origine'], ['origin_code', 'origine'], ['iata_origine', 'origine'], ['code_depart', 'origine'], ['code_origine', 'origine'],
    ['destination', 'destination'], ['dest_code', 'destination'], ['iata_destination', 'destination'], ['code_arrivee', 'destination'], ['code_destination', 'destination'],
    ['date_vol', 'date_vol'], ['date', 'date_vol'], ['flight_date', 'date_vol'], ['date_depart', 'date_vol'],
    ['compagnie', 'compagnie'], ['airline', 'compagnie'], ['company', 'compagnie'],
    ['reference_billet', 'reference_billet'], ['reference', 'reference_billet'], ['ref', 'reference_billet'], ['booking_ref', 'reference_billet'], ['pnr', 'reference_billet'],
  ]);

  const mappedHeaders = headers.map(h => headerMap.get(h) || h);

  // Vérifier les headers requis
  if (!mappedHeaders.includes('ville_origine') || !mappedHeaders.includes('ville_destination') || !mappedHeaders.includes('prix')) {
    errors.push('Colonnes requises manquantes : ville_origine, ville_destination, prix');
    return { headers: mappedHeaders, rows: [], errors };
  }

  // Parser les lignes
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = parseLine(lines[i], delimiter);

    if (fields.length < mappedHeaders.length) {
      errors.push(`Ligne ${i + 1} : nombre de colonnes insuffisant (${fields.length}/${mappedHeaders.length})`);
      continue;
    }

    const row: Record<string, string> = {};
    for (let j = 0; j < mappedHeaders.length; j++) {
      if (fields[j]) {
        row[mappedHeaders[j]] = fields[j];
      }
    }

    // Validation minimale
    if (!row.ville_origine || !row.ville_destination || !row.prix) {
      errors.push(`Ligne ${i + 1} : ville_origine, ville_destination ou prix manquant`);
      continue;
    }

    const prix = parseFloat(row.prix.replace(',', '.'));
    if (isNaN(prix) || prix <= 0) {
      errors.push(`Ligne ${i + 1} : prix invalide "${row.prix}"`);
      continue;
    }
    row.prix = prix.toString();

    rows.push(row);
  }

  return { headers: mappedHeaders, rows, errors };
}

export function generateTemplateCSV(): string {
  return [
    'ville_origine;ville_destination;prix;origine;destination;date_vol;compagnie;reference_billet',
    'Paris;Dakar;680;CDG;DSS;2025-06-15;Air Sénégal;ABC123',
    'Lyon;Casablanca;420;LYS;CMN;2025-07-01;Royal Air Maroc;XY4567',
  ].join('\n');
}
