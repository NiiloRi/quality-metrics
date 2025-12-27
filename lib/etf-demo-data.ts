/**
 * Demo ETF Data
 *
 * Fictional ETF data for demonstration purposes
 * Maps to demo Crown Jewels stocks
 */

import type { ETFInfo, ETFHolding } from './etf-analyzer';

// Demo ETF database - fictional ETFs
export const DEMO_ETF_DATABASE: Record<string, ETFInfo> = {
  // Quality-focused ETFs
  'DQLT': {
    symbol: 'DQLT',
    name: 'Demo Quality Leaders ETF',
    expenseRatio: 0.06,
    aum: 85.2,
    category: 'Large Cap Quality',
    holdings: 150,
  },
  'DVLG': {
    symbol: 'DVLG',
    name: 'Demo Value Growth ETF',
    expenseRatio: 0.08,
    aum: 42.5,
    category: 'Large Cap Value',
    holdings: 120,
  },
  'DDIV': {
    symbol: 'DDIV',
    name: 'Demo Dividend Achievers ETF',
    expenseRatio: 0.06,
    aum: 120.8,
    category: 'Dividend Growth',
    holdings: 200,
  },
  'DGRO': {
    symbol: 'DGRO',
    name: 'Demo Growth Opportunities ETF',
    expenseRatio: 0.10,
    aum: 35.2,
    category: 'Large Cap Growth',
    holdings: 80,
  },
  'DSPY': {
    symbol: 'DSPY',
    name: 'Demo S&P 500 Index ETF',
    expenseRatio: 0.03,
    aum: 450.0,
    category: 'Large Cap Blend',
    holdings: 500,
  },
  'DTEC': {
    symbol: 'DTEC',
    name: 'Demo Technology Select ETF',
    expenseRatio: 0.12,
    aum: 55.3,
    category: 'Technology',
    holdings: 75,
  },
  'DHLC': {
    symbol: 'DHLC',
    name: 'Demo Healthcare Leaders ETF',
    expenseRatio: 0.15,
    aum: 28.7,
    category: 'Healthcare',
    holdings: 60,
  },
  'DFIN': {
    symbol: 'DFIN',
    name: 'Demo Financial Select ETF',
    expenseRatio: 0.12,
    aum: 38.9,
    category: 'Financials',
    holdings: 65,
  },
  'DMOM': {
    symbol: 'DMOM',
    name: 'Demo Momentum Factor ETF',
    expenseRatio: 0.15,
    aum: 22.4,
    category: 'Momentum',
    holdings: 100,
  },
  'DMIN': {
    symbol: 'DMIN',
    name: 'Demo Minimum Volatility ETF',
    expenseRatio: 0.08,
    aum: 45.6,
    category: 'Low Volatility',
    holdings: 180,
  },
  'DBUY': {
    symbol: 'DBUY',
    name: 'Demo Buyback Leaders ETF',
    expenseRatio: 0.09,
    aum: 15.8,
    category: 'Shareholder Yield',
    holdings: 100,
  },
  'DFCF': {
    symbol: 'DFCF',
    name: 'Demo Free Cash Flow ETF',
    expenseRatio: 0.11,
    aum: 8.5,
    category: 'Quality Factor',
    holdings: 75,
  },
};

// Demo ETF holdings - which demo stocks are in which ETFs
// Uses demo stock symbols from demo-data.ts
export const DEMO_ETF_HOLDINGS: ETFHolding[] = [
  // DQLT - Quality Leaders (high quality focus)
  { etfSymbol: 'DQLT', stockSymbol: 'ACME', weight: 5.2, shares: 850000 },
  { etfSymbol: 'DQLT', stockSymbol: 'CHIP', weight: 4.8, shares: 720000 },
  { etfSymbol: 'DQLT', stockSymbol: 'HLTH', weight: 4.1, shares: 680000 },
  { etfSymbol: 'DQLT', stockSymbol: 'BNKR', weight: 3.5, shares: 590000 },
  { etfSymbol: 'DQLT', stockSymbol: 'FUEL', weight: 2.8, shares: 420000 },

  // DVLG - Value Growth
  { etfSymbol: 'DVLG', stockSymbol: 'ACME', weight: 4.5, shares: 650000 },
  { etfSymbol: 'DVLG', stockSymbol: 'HLTH', weight: 3.8, shares: 550000 },
  { etfSymbol: 'DVLG', stockSymbol: 'BNKR', weight: 4.2, shares: 610000 },
  { etfSymbol: 'DVLG', stockSymbol: 'FUEL', weight: 3.5, shares: 480000 },

  // DDIV - Dividend Achievers
  { etfSymbol: 'DDIV', stockSymbol: 'ACME', weight: 3.2, shares: 520000 },
  { etfSymbol: 'DDIV', stockSymbol: 'HLTH', weight: 4.5, shares: 680000 },
  { etfSymbol: 'DDIV', stockSymbol: 'BNKR', weight: 5.1, shares: 750000 },
  { etfSymbol: 'DDIV', stockSymbol: 'FUEL', weight: 4.8, shares: 620000 },
  { etfSymbol: 'DDIV', stockSymbol: 'RENW', weight: 2.2, shares: 380000 },

  // DGRO - Growth Opportunities
  { etfSymbol: 'DGRO', stockSymbol: 'ACME', weight: 6.5, shares: 920000 },
  { etfSymbol: 'DGRO', stockSymbol: 'CHIP', weight: 7.2, shares: 980000 },
  { etfSymbol: 'DGRO', stockSymbol: 'RENW', weight: 3.8, shares: 520000 },

  // DSPY - S&P 500 Index (broad market)
  { etfSymbol: 'DSPY', stockSymbol: 'ACME', weight: 2.8, shares: 1200000 },
  { etfSymbol: 'DSPY', stockSymbol: 'CHIP', weight: 2.1, shares: 850000 },
  { etfSymbol: 'DSPY', stockSymbol: 'HLTH', weight: 1.9, shares: 780000 },
  { etfSymbol: 'DSPY', stockSymbol: 'BNKR', weight: 1.5, shares: 620000 },
  { etfSymbol: 'DSPY', stockSymbol: 'FUEL', weight: 1.2, shares: 480000 },
  { etfSymbol: 'DSPY', stockSymbol: 'RENW', weight: 0.8, shares: 320000 },

  // DTEC - Technology Select
  { etfSymbol: 'DTEC', stockSymbol: 'ACME', weight: 8.5, shares: 1100000 },
  { etfSymbol: 'DTEC', stockSymbol: 'CHIP', weight: 9.2, shares: 1250000 },

  // DHLC - Healthcare Leaders
  { etfSymbol: 'DHLC', stockSymbol: 'HLTH', weight: 12.5, shares: 1850000 },

  // DFIN - Financial Select
  { etfSymbol: 'DFIN', stockSymbol: 'BNKR', weight: 11.8, shares: 1720000 },

  // DMOM - Momentum Factor
  { etfSymbol: 'DMOM', stockSymbol: 'ACME', weight: 4.2, shares: 580000 },
  { etfSymbol: 'DMOM', stockSymbol: 'CHIP', weight: 5.5, shares: 720000 },
  { etfSymbol: 'DMOM', stockSymbol: 'RENW', weight: 3.1, shares: 420000 },

  // DMIN - Minimum Volatility
  { etfSymbol: 'DMIN', stockSymbol: 'HLTH', weight: 2.8, shares: 450000 },
  { etfSymbol: 'DMIN', stockSymbol: 'BNKR', weight: 2.5, shares: 380000 },
  { etfSymbol: 'DMIN', stockSymbol: 'FUEL', weight: 2.2, shares: 320000 },

  // DBUY - Buyback Leaders
  { etfSymbol: 'DBUY', stockSymbol: 'ACME', weight: 5.8, shares: 780000 },
  { etfSymbol: 'DBUY', stockSymbol: 'CHIP', weight: 4.5, shares: 620000 },
  { etfSymbol: 'DBUY', stockSymbol: 'BNKR', weight: 6.2, shares: 850000 },
  { etfSymbol: 'DBUY', stockSymbol: 'FUEL', weight: 5.5, shares: 720000 },

  // DFCF - Free Cash Flow
  { etfSymbol: 'DFCF', stockSymbol: 'ACME', weight: 7.2, shares: 920000 },
  { etfSymbol: 'DFCF', stockSymbol: 'CHIP', weight: 6.8, shares: 880000 },
  { etfSymbol: 'DFCF', stockSymbol: 'HLTH', weight: 5.5, shares: 720000 },
  { etfSymbol: 'DFCF', stockSymbol: 'FUEL', weight: 4.8, shares: 620000 },
];

// Helper to get demo stock name
export function getDemoStockName(symbol: string): string {
  const names: Record<string, string> = {
    'ACME': 'Acme Technologies Inc',
    'CHIP': 'ChipMaster Systems',
    'HLTH': 'HealthPrime Corp',
    'BNKR': 'BankerFirst Holdings',
    'FUEL': 'FuelCore Energy',
    'RENW': 'RenewEnergy Corp',
  };
  return names[symbol] || symbol;
}
