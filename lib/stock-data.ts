/**
 * Unified Stock Data Fetcher
 * US: FMP API (Starter plan)
 * Europe: Yahoo Finance (ilmainen)
 */

import { getFullStockData as getFmpData, type FMPStockData } from './fmp';
import { getYahooStockData, type YahooStockData } from './yahoo';
import type { Market } from './db';

export type DataSource = 'FMP' | 'Yahoo';

export interface UnifiedStockData extends FMPStockData {
  dataSource: DataSource;
}

export async function getStockData(symbol: string, market: Market): Promise<UnifiedStockData> {
  if (market === 'US') {
    const data = await getFmpData(symbol);
    return { ...data, dataSource: 'FMP' };
  } else {
    const data = await getYahooStockData(symbol);
    return { ...data, dataSource: 'Yahoo' };
  }
}
