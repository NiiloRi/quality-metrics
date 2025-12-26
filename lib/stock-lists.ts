// Stock lists for scanning
// User has 5,000 API calls/day, each stock uses ~6 calls

export type Market = 'US' | 'Europe';

// US Stocks (~200)
export const US_STOCKS = [
  // Mega caps
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK.B', 'UNH', 'JNJ',
  'XOM', 'JPM', 'V', 'PG', 'MA', 'HD', 'CVX', 'ABBV', 'MRK', 'LLY',
  'AVGO', 'PEP', 'KO', 'COST', 'TMO', 'CSCO', 'WMT', 'MCD', 'CRM', 'ACN',
  'ADBE', 'ABT', 'DHR', 'NKE', 'LIN', 'TXN', 'CMCSA', 'PM', 'NEE', 'VZ',

  // Technology
  'ORCL', 'AMD', 'QCOM', 'IBM', 'INTC', 'NOW', 'INTU', 'AMAT', 'ADI', 'LRCX',
  'KLAC', 'MU', 'SNPS', 'CDNS', 'FTNT', 'PANW', 'MRVL', 'HPQ', 'DELL', 'CTSH',
  'NXPI', 'MCHP', 'TEL', 'ON', 'STX', 'WDC', 'HPE', 'KEYS', 'ANSS', 'SWKS',

  // Healthcare
  'PFE', 'AMGN', 'BMY', 'GILD', 'MDT', 'ISRG', 'SYK', 'REGN', 'VRTX', 'BSX',
  'ZTS', 'CI', 'HCA', 'ELV', 'HUM', 'MCK', 'CAH', 'DXCM', 'IDXX', 'ILMN',
  'A', 'BIO', 'COO', 'WAT', 'RMD', 'ALGN', 'IQV', 'HOLX', 'MTD', 'PKI',

  // Financial
  'BAC', 'WFC', 'GS', 'MS', 'BLK', 'SCHW', 'C', 'AXP', 'CB', 'PNC',
  'USB', 'MMC', 'CME', 'ICE', 'AON', 'TFC', 'MET', 'AIG', 'PRU', 'AFL',
  'TRV', 'ALL', 'COF', 'DFS', 'SPGI', 'MSCI', 'MCO', 'NDAQ', 'FIS', 'CINF',

  // Consumer
  'DIS', 'SBUX', 'BKNG', 'LOW', 'TJX', 'MAR', 'YUM', 'ORLY', 'AZO', 'ROST',
  'CMG', 'DHI', 'LEN', 'NVR', 'PHM', 'TOL', 'GM', 'F', 'TGT', 'BBY',
  'ULTA', 'DG', 'DLTR', 'EBAY', 'ETSY', 'W', 'CHWY', 'LULU', 'GPS', 'ANF',

  // Industrial
  'CAT', 'DE', 'UNP', 'HON', 'GE', 'RTX', 'BA', 'LMT', 'MMM', 'UPS',
  'FDX', 'EMR', 'ETN', 'ITW', 'PH', 'ROK', 'DOV', 'SWK', 'CMI', 'PCAR',
  'WM', 'RSG', 'GWW', 'FAST', 'FTV', 'AME', 'ODFL', 'XYL', 'IR', 'CARR',

  // Energy
  'SLB', 'COP', 'EOG', 'PXD', 'MPC', 'VLO', 'PSX', 'OXY', 'KMI', 'WMB',
  'HAL', 'DVN', 'BKR', 'HES', 'FANG', 'APA', 'MRO', 'OKE', 'TRGP', 'LNG',

  // Utilities & Real Estate
  'DUK', 'SO', 'D', 'AEP', 'SRE', 'EXC', 'XEL', 'WEC', 'ED', 'PEG',
  'AMT', 'PLD', 'CCI', 'EQIX', 'SPG', 'PSA', 'O', 'WELL', 'AVB', 'EQR',

  // Materials
  'APD', 'ECL', 'SHW', 'NEM', 'FCX', 'NUE', 'VMC', 'MLM', 'DOW', 'DD',

  // Communication
  'T', 'TMUS', 'NFLX', 'ATVI', 'EA', 'TTWO', 'MTCH', 'ZG', 'SPOT', 'RBLX',
];

// European & Nordic Stocks (~150)
export const EUROPE_STOCKS = [
  // === SUOMI (Finland) - ~20 ===
  'NOKIA.HE',      // Nokia
  'NESTE.HE',      // Neste
  'FORTUM.HE',     // Fortum
  'UPM.HE',        // UPM-Kymmene
  'SAMPO.HE',      // Sampo
  'KNEBV.HE',      // Kone
  'STERV.HE',      // Stora Enso
  'ORNBV.HE',      // Orion
  'ELISA.HE',      // Elisa
  'KESKOB.HE',     // Kesko
  'NDA-FI.HE',     // Nordea
  'WRT1V.HE',      // Wärtsilä
  'METSB.HE',      // Metsä Board
  'KEMIRA.HE',     // Kemira
  'TIETO.HE',      // TietoEVRY
  'CGCBV.HE',      // Cargotec
  'VALMT.HE',      // Valmet
  'QTCOM.HE',      // Qt Group
  'MEKKO.HE',      // Metso
  'HUH1V.HE',      // Huhtamäki

  // === RUOTSI (Sweden) - ~25 ===
  'VOLV-B.ST',     // Volvo
  'ERIC-B.ST',     // Ericsson
  'ATCO-A.ST',     // Atlas Copco
  'INVE-B.ST',     // Investor AB
  'SAND.ST',       // Sandvik
  'ABB.ST',        // ABB
  'SEB-A.ST',      // SEB
  'SHB-A.ST',      // Handelsbanken
  'SWED-A.ST',     // Swedbank
  'ASSA-B.ST',     // ASSA ABLOY
  'HM-B.ST',       // H&M
  'ESSITY-B.ST',   // Essity
  'SKF-B.ST',      // SKF
  'ALFA.ST',       // Alfa Laval
  'ELUX-B.ST',     // Electrolux
  'HEXA-B.ST',     // Hexagon
  'SECU-B.ST',     // Securitas
  'TELIA.ST',      // Telia
  'KINV-B.ST',     // Kinnevik
  'BOL.ST',        // Boliden
  'NIBE-B.ST',     // NIBE Industrier
  'EVO.ST',        // Evolution Gaming
  'SAGA-B.ST',     // Saab
  'SWMA.ST',       // Swedish Match
  'GETI-B.ST',     // Getinge

  // === TANSKA (Denmark) - ~15 ===
  'NOVO-B.CO',     // Novo Nordisk
  'DSV.CO',        // DSV
  'MAERSK-B.CO',   // Maersk
  'CARL-B.CO',     // Carlsberg
  'ORSTED.CO',     // Ørsted
  'COLO-B.CO',     // Coloplast
  'VWS.CO',        // Vestas Wind
  'DEMANT.CO',     // Demant
  'GN.CO',         // GN Store Nord
  'PNDORA.CO',     // Pandora
  'ROCK-B.CO',     // Rockwool
  'TRYG.CO',       // Tryg
  'JYSK.CO',       // Jyske Bank
  'AMBU-B.CO',     // Ambu
  'FLS.CO',        // FLSmidth

  // === NORJA (Norway) - ~10 ===
  'EQNR.OL',       // Equinor
  'DNB.OL',        // DNB
  'TEL.OL',        // Telenor
  'MOWI.OL',       // Mowi (Marine Harvest)
  'ORK.OL',        // Orkla
  'YAR.OL',        // Yara
  'SALM.OL',       // SalMar
  'AKER.OL',       // Aker
  'STB.OL',        // Storebrand
  'BAKKA.OL',      // Bakkafrost

  // === SAKSA (Germany) - ~25 ===
  'SAP.DE',        // SAP
  'SIE.DE',        // Siemens
  'ALV.DE',        // Allianz
  'BAS.DE',        // BASF
  'DTE.DE',        // Deutsche Telekom
  'MRK.DE',        // Merck
  'BMW.DE',        // BMW
  'MBG.DE',        // Mercedes-Benz
  'VOW3.DE',       // Volkswagen
  'ADS.DE',        // Adidas
  'DBK.DE',        // Deutsche Bank
  'BAYN.DE',       // Bayer
  'IFX.DE',        // Infineon
  'HEI.DE',        // HeidelbergCement
  'FRE.DE',        // Fresenius
  'HEN3.DE',       // Henkel
  'RWE.DE',        // RWE
  'EON.DE',        // E.ON
  'MUV2.DE',       // Munich Re
  'DPW.DE',        // Deutsche Post
  'CON.DE',        // Continental
  'LIN.DE',        // Linde
  'VNA.DE',        // Vonovia
  'SRT3.DE',       // Sartorius
  'PUM.DE',        // Puma

  // === RANSKA (France) - ~20 ===
  'MC.PA',         // LVMH
  'OR.PA',         // L'Oréal
  'TTE.PA',        // TotalEnergies
  'SAN.PA',        // Sanofi
  'AIR.PA',        // Airbus
  'BNP.PA',        // BNP Paribas
  'SU.PA',         // Schneider Electric
  'AI.PA',         // Air Liquide
  'KER.PA',        // Kering
  'RI.PA',         // Pernod Ricard
  'DG.PA',         // Vinci
  'CAP.PA',        // Capgemini
  'CS.PA',         // AXA
  'SGO.PA',        // Saint-Gobain
  'EN.PA',         // Bouygues
  'DSY.PA',        // Dassault Systèmes
  'HO.PA',         // Thales
  'EL.PA',         // EssilorLuxottica
  'VIE.PA',        // Veolia
  'ORA.PA',        // Orange

  // === ALANKOMAAT (Netherlands) - ~15 ===
  'ASML.AS',       // ASML
  'INGA.AS',       // ING Group
  'PHIA.AS',       // Philips
  'HEIA.AS',       // Heineken
  'AD.AS',         // Ahold Delhaize
  'UNA.AS',        // Unilever
  'AKZA.AS',       // Akzo Nobel
  'ABN.AS',        // ABN AMRO
  'WKL.AS',        // Wolters Kluwer
  'RAND.AS',       // Randstad
  'DSM.AS',        // DSM
  'NN.AS',         // NN Group
  'PRX.AS',        // Prosus
  'ASM.AS',        // ASM International
  'IMCD.AS',       // IMCD

  // === SVEITSI (Switzerland) - ~15 ===
  'NESN.SW',       // Nestlé
  'ROG.SW',        // Roche
  'NOVN.SW',       // Novartis
  'UBSG.SW',       // UBS
  'CSGN.SW',       // Credit Suisse
  'ABBN.SW',       // ABB
  'SREN.SW',       // Swiss Re
  'ZURN.SW',       // Zurich Insurance
  'LONN.SW',       // Lonza
  'GEBN.SW',       // Geberit
  'GIVN.SW',       // Givaudan
  'SCMN.SW',       // Swisscom
  'SIKA.SW',       // Sika
  'PGHN.SW',       // Partners Group
  'BARN.SW',       // Barry Callebaut

  // === MUUT (Other) - ~5 ===
  'INGA.BR',       // KBC Group (Belgium)
  'ABI.BR',        // AB InBev (Belgium)
  'SOLB.BR',       // Solvay (Belgium)
  'IBE.MC',        // Iberdrola (Spain)
  'ITX.MC',        // Inditex (Spain)
];

// Helper functions
export function getStocksForMarket(market: Market): string[] {
  return market === 'US' ? US_STOCKS : EUROPE_STOCKS;
}

export function getAllStockSymbols(): string[] {
  return [...US_STOCKS, ...EUROPE_STOCKS];
}

export function getStockCount(market: Market): number {
  return getStocksForMarket(market).length;
}

export function getTotalStockCount(): number {
  return US_STOCKS.length + EUROPE_STOCKS.length;
}

// Batch stocks into groups for rate limiting
export function batchStocks(symbols: string[], batchSize: number): string[][] {
  const batches: string[][] = [];
  for (let i = 0; i < symbols.length; i += batchSize) {
    batches.push(symbols.slice(i, i + batchSize));
  }
  return batches;
}

export const SECTORS = [
  'Technology',
  'Healthcare',
  'Financial Services',
  'Consumer Cyclical',
  'Consumer Defensive',
  'Industrials',
  'Energy',
  'Utilities',
  'Real Estate',
  'Basic Materials',
  'Communication Services',
];
