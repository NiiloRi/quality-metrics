/**
 * Financial Modeling Prep API Client
 */

import type {
  IncomeStatement,
  BalanceSheet,
  CashFlowStatement,
  KeyMetrics,
  Quote,
  CompanyProfile,
} from '@/types/stock';

// FMP uses new /stable/ endpoint structure (as of 2025)
const BASE_URL = 'https://financialmodelingprep.com/stable';
const API_KEY = process.env.FMP_API_KEY;

async function fetchFMP<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const searchParams = new URLSearchParams({ ...params, apikey: API_KEY || '' });
  const url = `${BASE_URL}${endpoint}?${searchParams.toString()}`;

  const response = await fetch(url, {
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!response.ok) {
    throw new Error(`FMP API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function getIncomeStatements(symbol: string, limit = 5): Promise<IncomeStatement[]> {
  return fetchFMP<IncomeStatement[]>('/income-statement', { symbol, limit: String(limit) });
}

export async function getBalanceSheets(symbol: string, limit = 5): Promise<BalanceSheet[]> {
  return fetchFMP<BalanceSheet[]>('/balance-sheet-statement', { symbol, limit: String(limit) });
}

export async function getCashFlowStatements(symbol: string, limit = 5): Promise<CashFlowStatement[]> {
  return fetchFMP<CashFlowStatement[]>('/cash-flow-statement', { symbol, limit: String(limit) });
}

export async function getKeyMetrics(symbol: string, limit = 5): Promise<KeyMetrics[]> {
  return fetchFMP<KeyMetrics[]>('/key-metrics', { symbol, limit: String(limit) });
}

export async function getQuote(symbol: string): Promise<Quote | null> {
  const quotes = await fetchFMP<Quote[]>('/quote', { symbol });
  return quotes[0] || null;
}

export async function getProfile(symbol: string): Promise<CompanyProfile | null> {
  const profiles = await fetchFMP<CompanyProfile[]>('/profile', { symbol });
  return profiles[0] || null;
}

export async function searchStocks(query: string): Promise<{ symbol: string; name: string; exchange: string }[]> {
  return fetchFMP('/search', { query, limit: '10' });
}

export interface FMPStockData {
  profile: CompanyProfile | null;
  quote: Quote | null;
  income: IncomeStatement[];
  balance: BalanceSheet[];
  cashFlow: CashFlowStatement[];
  metrics: KeyMetrics[];
}

export async function getFullStockData(symbol: string): Promise<FMPStockData> {
  const [profile, quote, income, balance, cashFlow, metrics] = await Promise.all([
    getProfile(symbol),
    getQuote(symbol),
    getIncomeStatements(symbol, 6),
    getBalanceSheets(symbol, 6),
    getCashFlowStatements(symbol, 6),
    getKeyMetrics(symbol, 6),
  ]);

  return { profile, quote, income, balance, cashFlow, metrics };
}
