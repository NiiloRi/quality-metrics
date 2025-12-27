/**
 * Translations for the app
 *
 * Add all translatable strings here with both English and Finnish versions.
 */

export type Language = 'en' | 'fi';

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.crownJewels': 'Crown Jewels',
    'nav.rankings': 'Rankings',
    'nav.search': 'Search stocks...',

    // Home page - Hero
    'hero.discover': 'Discover',
    'hero.qualityStocks': 'Quality Stocks',
    'hero.subtitle': 'Real-time quality scoring across global markets. Top stocks dynamically ranked by Quality Metrics score.',

    // Home page - Popular stocks
    'popular.title': 'Popular stocks',

    // Home page - Features
    'features.title': 'Data-driven stock analysis',
    'features.subtitle': 'Make informed investment decisions with comprehensive fundamental analysis',
    'features.qualityScore.title': 'Quality Score',
    'features.qualityScore.description': "Fundamental metrics that reveal a company's financial health: profitability, growth, and balance sheet strength.",
    'features.valuation.title': 'Valuation Analysis',
    'features.valuation.description': 'See if a stock is undervalued or overvalued relative to its quality. Fair P/E calculated based on fundamental strength.',
    'features.screener.title': 'Stock Screener',
    'features.screener.description': 'Filter stocks by quality score, valuation, sector, and market cap. Find the best opportunities in the market.',
    'features.openScreener': 'Open Screener',

    // Home page - Quality Metrics
    'qm.title': 'Quality Metrics',
    'qm.subtitle': 'Based on proven value investing principles',

    // Home page - How it works
    'howItWorks.title': 'How valuation works',
    'howItWorks.subtitle': 'Quality determines fair value',
    'howItWorks.step1.title': 'Calculate Quality Score',
    'howItWorks.step1.description': 'Each quality metric is evaluated against proven thresholds. Higher score = higher quality.',
    'howItWorks.step2.title': 'Determine Fair P/E',
    'howItWorks.step2.description': 'Higher quality = higher justified P/E. Quality score directly influences fair valuation.',
    'howItWorks.step3.title': 'Compare to Market Price',
    'howItWorks.step3.description': 'If Current P/E < Fair P/E = Undervalued. The bigger the gap, the better the opportunity.',
    'howItWorks.example': 'Example:',
    'howItWorks.exampleText': "A high-quality stock has Fair P/E of 22.5. If trading at P/E 18, it's ~20% undervalued.",

    // Footer
    'footer.dataProvider': 'Data provided by Financial Modeling Prep & Yahoo Finance',

    // Crown Jewels page
    'crownJewels.title': 'Crown Jewels',
    'crownJewels.subtitle': 'Hidden Gems with exceptional quality and value',
    'crownJewels.loading': 'Loading Crown Jewels...',
    'crownJewels.error': 'Error loading data',
    'crownJewels.retry': 'Try again',
    'crownJewels.filters': 'Filters',
    'crownJewels.allSectors': 'All Sectors',
    'crownJewels.allTiers': 'All Tiers',
    'crownJewels.macroEnvironment': 'Macro Environment',
    'crownJewels.phase': 'Phase',
    'crownJewels.liquidity': 'Liquidity',
    'crownJewels.sentiment': 'Sentiment',
    'crownJewels.sectorOutlook': 'Sector Outlook',
    'crownJewels.stocksFound': 'stocks found',
    'crownJewels.score': 'Score',
    'crownJewels.qmScore': 'QM Score',
    'crownJewels.valueGap': 'Value Gap',
    'crownJewels.roic': 'ROIC 5Y',
    'crownJewels.fcfYield': 'FCF Yield',
    'crownJewels.growth': 'Growth',
    'crownJewels.buybacks': 'Buybacks',

    // Screener page
    'screener.title': 'Stock Screener',
    'screener.subtitle': 'Filter and sort stocks by quality metrics',
    'screener.loading': 'Loading stocks...',
    'screener.noResults': 'No stocks match your criteria',
    'screener.sortBy': 'Sort by',
    'screener.marketCap': 'Market Cap',
    'screener.sector': 'Sector',
    'screener.industry': 'Industry',

    // Common
    'common.undervalued': 'Undervalued',
    'common.overvalued': 'Overvalued',
    'common.fairValue': 'Fair Value',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.billion': 'B',
    'common.million': 'M',
  },

  fi: {
    // Navigation
    'nav.crownJewels': 'Kruununjalokivet',
    'nav.rankings': 'Rankinglista',
    'nav.search': 'Hae osakkeita...',

    // Home page - Hero
    'hero.discover': 'Löydä',
    'hero.qualityStocks': 'Laatuosakkeet',
    'hero.subtitle': 'Reaaliaikainen laatupisteytys globaaleilla markkinoilla. Parhaat osakkeet rankattu Quality Metrics -pisteillä.',

    // Home page - Popular stocks
    'popular.title': 'Suositut osakkeet',

    // Home page - Features
    'features.title': 'Dataohjattu osakeanalyysi',
    'features.subtitle': 'Tee tietoon perustuvia sijoituspäätöksiä kattavalla fundamenttianalyysillä',
    'features.qualityScore.title': 'Laatupisteet',
    'features.qualityScore.description': 'Fundamenttimittarit jotka paljastavat yrityksen taloudellisen terveyden: kannattavuus, kasvu ja taseen vahvuus.',
    'features.valuation.title': 'Arvostusanalyysi',
    'features.valuation.description': 'Näe onko osake ali- vai yliarvostettu suhteessa laatuunsa. Oikea P/E laskettu fundamenttivahvuuden perusteella.',
    'features.screener.title': 'Osakescreener',
    'features.screener.description': 'Suodata osakkeet laatupisteiden, arvostuksen, sektorin ja markkina-arvon mukaan. Löydä parhaat mahdollisuudet.',
    'features.openScreener': 'Avaa Screener',

    // Home page - Quality Metrics
    'qm.title': 'Laatumittarit',
    'qm.subtitle': 'Perustuu todistettuihin arvosijoittamisen periaatteisiin',

    // Home page - How it works
    'howItWorks.title': 'Miten arvostus toimii',
    'howItWorks.subtitle': 'Laatu määrittää käyvän arvon',
    'howItWorks.step1.title': 'Laske laatupisteet',
    'howItWorks.step1.description': 'Jokainen laatumittari arvioidaan todistettuja kynnysarvoja vasten. Korkeampi pistemäärä = korkeampi laatu.',
    'howItWorks.step2.title': 'Määritä oikea P/E',
    'howItWorks.step2.description': 'Korkeampi laatu = korkeampi perusteltu P/E. Laatupisteet vaikuttavat suoraan oikeaan arvostukseen.',
    'howItWorks.step3.title': 'Vertaa markkinahintaan',
    'howItWorks.step3.description': 'Jos nykyinen P/E < oikea P/E = aliarvostettu. Mitä suurempi ero, sitä parempi mahdollisuus.',
    'howItWorks.example': 'Esimerkki:',
    'howItWorks.exampleText': 'Korkealaatuisen osakkeen oikea P/E on 22.5. Jos se käy kauppaa P/E 18:lla, se on ~20% aliarvostettu.',

    // Footer
    'footer.dataProvider': 'Data: Financial Modeling Prep & Yahoo Finance',

    // Crown Jewels page
    'crownJewels.title': 'Kruununjalokivet',
    'crownJewels.subtitle': 'Piilotetut helmet poikkeuksellisella laadulla ja arvolla',
    'crownJewels.loading': 'Ladataan Kruununjalokiviä...',
    'crownJewels.error': 'Virhe ladattaessa dataa',
    'crownJewels.retry': 'Yritä uudelleen',
    'crownJewels.filters': 'Suodattimet',
    'crownJewels.allSectors': 'Kaikki sektorit',
    'crownJewels.allTiers': 'Kaikki tasot',
    'crownJewels.macroEnvironment': 'Makroympäristö',
    'crownJewels.phase': 'Vaihe',
    'crownJewels.liquidity': 'Likviditeetti',
    'crownJewels.sentiment': 'Sentimentti',
    'crownJewels.sectorOutlook': 'Sektorinäkymät',
    'crownJewels.stocksFound': 'osaketta löytyi',
    'crownJewels.score': 'Pisteet',
    'crownJewels.qmScore': 'QM-pisteet',
    'crownJewels.valueGap': 'Arvoero',
    'crownJewels.roic': 'ROIC 5v',
    'crownJewels.fcfYield': 'FCF-tuotto',
    'crownJewels.growth': 'Kasvu',
    'crownJewels.buybacks': 'Takaisinostot',

    // Screener page
    'screener.title': 'Osakescreener',
    'screener.subtitle': 'Suodata ja lajittele osakkeet laatumittareiden mukaan',
    'screener.loading': 'Ladataan osakkeita...',
    'screener.noResults': 'Kriteereitäsi vastaavia osakkeita ei löytynyt',
    'screener.sortBy': 'Lajittele',
    'screener.marketCap': 'Markkina-arvo',
    'screener.sector': 'Sektori',
    'screener.industry': 'Toimiala',

    // Common
    'common.undervalued': 'Aliarvostettu',
    'common.overvalued': 'Yliarvostettu',
    'common.fairValue': 'Käypä arvo',
    'common.yes': 'Kyllä',
    'common.no': 'Ei',
    'common.billion': 'Mrd',
    'common.million': 'M',
  },
};

export function getTranslation(lang: Language, key: string): string {
  return translations[lang][key] || translations['en'][key] || key;
}
