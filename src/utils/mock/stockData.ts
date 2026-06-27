import type { KLineData, StockInfo } from '../../types';

const stockNames: Record<string, string> = {
  '600519': '贵州茅台',
  '000001': '平安银行',
  '601318': '中国平安',
  '000858': '五粮液',
  '600036': '招商银行',
  '002594': '比亚迪',
  '601899': '紫金矿业',
  '000333': '美的集团',
  '600900': '长江电力',
  '601166': '兴业银行',
  '300750': '宁德时代',
  '600276': '恒瑞医药',
  '000651': '格力电器',
  '601088': '中国神华',
  '002415': '海康威视',
};

export function getStockName(code: string): string {
  return stockNames[code] || `股票${code}`;
}

export function getHotStocks(): { code: string; name: string }[] {
  return Object.entries(stockNames).map(([code, name]) => ({ code, name }));
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function generateMockKLine(
  code: string,
  count: number = 300,
  basePrice: number = 100
): KLineData[] {
  const seed = code.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const random = seededRandom(seed);
  const data: KLineData[] = [];

  let price = basePrice;
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  for (let i = count - 1; i >= 0; i--) {
    const time = Math.floor((now - i * dayMs) / 1000);
    const volatility = 0.02 + random() * 0.03;
    const trend = Math.sin(i / 30) * 0.005 + (random() - 0.5) * 0.01;

    const open = price;
    const changePercent = trend + (random() - 0.5) * volatility;
    const close = open * (1 + changePercent);
    const high = Math.max(open, close) * (1 + random() * volatility * 0.5);
    const low = Math.min(open, close) * (1 - random() * volatility * 0.5);
    const volume = Math.floor(1000000 + random() * 5000000);

    data.push({
      time,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    });

    price = close;
  }

  return data;
}

export function getStockInfo(code: string, klineData: KLineData[]): StockInfo {
  const last = klineData[klineData.length - 1];
  const prev = klineData[klineData.length - 2];
  const changeAmount = Number((last.close - prev.close).toFixed(2));
  const changePercent = Number(((changeAmount / prev.close) * 100).toFixed(2));

  let high = last.high;
  let low = last.low;
  let totalVolume = 0;
  let totalAmount = 0;

  const recentDays = Math.min(20, klineData.length);
  for (let i = klineData.length - recentDays; i < klineData.length; i++) {
    const k = klineData[i];
    high = Math.max(high, k.high);
    low = Math.min(low, k.low);
    totalVolume += k.volume;
    totalAmount += k.close * k.volume;
  }

  return {
    code,
    name: getStockName(code),
    currentPrice: last.close,
    changePercent,
    changeAmount,
    high: Number(high.toFixed(2)),
    low: Number(low.toFixed(2)),
    open: last.open,
    prevClose: prev.close,
    volume: last.volume,
    amount: Number(totalAmount.toFixed(0)),
  };
}
