import { NextResponse } from 'next/server';
import { getFullStockData } from '@/lib/fmp';
import { calculateQMScore, calculateValuation } from '@/lib/qm-calculator';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const upperSymbol = symbol.toUpperCase();

    const data = await getFullStockData(upperSymbol);

    if (!data.quote || !data.profile) {
      return NextResponse.json(
        { error: 'Stock not found' },
        { status: 404 }
      );
    }

    // Calculate QM score
    const qmScore = calculateQMScore({
      quote: data.quote,
      income: data.income,
      balance: data.balance,
      cashFlow: data.cashFlow,
    });

    // Calculate P/E from market cap and latest net income
    const latestNetIncome = data.income[0]?.netIncome || 0;
    const calculatedPE = latestNetIncome > 0
      ? data.quote.marketCap / latestNetIncome
      : null;

    // Calculate valuation
    const valuation = calculateValuation(qmScore, calculatedPE);

    return NextResponse.json({
      profile: data.profile,
      quote: data.quote,
      qmScore,
      valuation,
      historicalData: {
        income: data.income,
        balance: data.balance,
        cashFlow: data.cashFlow,
        metrics: data.metrics,
      },
    });
  } catch (error) {
    console.error('Stock API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock data' },
      { status: 500 }
    );
  }
}
