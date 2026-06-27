export interface KLineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Fractal {
  index: number;
  type: 'top' | 'bottom';
  high: number;
  low: number;
  price: number;
}

export interface Stroke {
  startIndex: number;
  endIndex: number;
  direction: 'up' | 'down';
  startPrice: number;
  endPrice: number;
  high: number;
  low: number;
}

export interface Segment {
  startIndex: number;
  endIndex: number;
  direction: 'up' | 'down';
  startPrice: number;
  endPrice: number;
  high: number;
  low: number;
}

export interface Center {
  startIndex: number;
  endIndex: number;
  high: number;
  low: number;
  level: number;
}

export type BuySellPointType = 'buy1' | 'buy2' | 'buy3' | 'sell1' | 'sell2' | 'sell3';

export interface BuySellPoint {
  index: number;
  type: BuySellPointType;
  price: number;
}

export interface ChanLunResult {
  fractals: Fractal[];
  strokes: Stroke[];
  segments: Segment[];
  centers: Center[];
  buySellPoints: BuySellPoint[];
}

export interface StockInfo {
  code: string;
  name: string;
  currentPrice: number;
  changePercent: number;
  changeAmount: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  volume: number;
  amount: number;
}

export type TimeFrame = '1min' | '5min' | '30min' | 'day' | 'week';

export interface WatchlistItem {
  code: string;
  name: string;
  addedAt: number;
}
