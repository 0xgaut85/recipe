/**
 * Technical Indicators
 * Calculate EMA, RSI, SMA, and other indicators from OHLCV data
 */

import { OHLCVCandle } from "./birdeye";

/**
 * Calculate Simple Moving Average (SMA)
 */
export function calculateSMA(data: number[], period: number): number[] {
  const result: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
      continue;
    }
    
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push(sum / period);
  }
  
  return result;
}

/**
 * Calculate Exponential Moving Average (EMA)
 */
export function calculateEMA(data: number[], period: number): number[] {
  const result: number[] = [];
  const multiplier = 2 / (period + 1);
  
  // Start with SMA for the first EMA value
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
      continue;
    }
    
    if (i === period - 1) {
      result.push(ema);
      continue;
    }
    
    ema = (data[i] - ema) * multiplier + ema;
    result.push(ema);
  }
  
  return result;
}

/**
 * Calculate Relative Strength Index (RSI)
 */
export function calculateRSI(data: number[], period: number = 14): number[] {
  const result: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  
  // Calculate price changes
  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  // Calculate RSI
  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      result.push(NaN);
      continue;
    }
    
    const avgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
    
    if (avgLoss === 0) {
      result.push(100);
      continue;
    }
    
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    result.push(rsi);
  }
  
  return result;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(
  data: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): {
  macd: number[];
  signal: number[];
  histogram: number[];
} {
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);
  
  // MACD line
  const macd = fastEMA.map((fast, i) => fast - slowEMA[i]);
  
  // Signal line (EMA of MACD)
  const validMacd = macd.filter((v) => !isNaN(v));
  const signalEMA = calculateEMA(validMacd, signalPeriod);
  
  // Pad signal line to match MACD length
  const signal: number[] = [];
  let signalIndex = 0;
  for (let i = 0; i < macd.length; i++) {
    if (isNaN(macd[i])) {
      signal.push(NaN);
    } else {
      signal.push(signalEMA[signalIndex] || NaN);
      signalIndex++;
    }
  }
  
  // Histogram
  const histogram = macd.map((m, i) => m - signal[i]);
  
  return { macd, signal, histogram };
}

/**
 * Calculate Bollinger Bands
 */
export function calculateBollingerBands(
  data: number[],
  period: number = 20,
  stdDev: number = 2
): {
  upper: number[];
  middle: number[];
  lower: number[];
} {
  const middle = calculateSMA(data, period);
  const upper: number[] = [];
  const lower: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      upper.push(NaN);
      lower.push(NaN);
      continue;
    }
    
    const slice = data.slice(i - period + 1, i + 1);
    const mean = middle[i];
    const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
    const std = Math.sqrt(variance);
    
    upper.push(mean + stdDev * std);
    lower.push(mean - stdDev * std);
  }
  
  return { upper, middle, lower };
}

/**
 * Calculate Volume Weighted Average Price (VWAP)
 */
export function calculateVWAP(candles: OHLCVCandle[]): number[] {
  const result: number[] = [];
  let cumulativeTPV = 0;
  let cumulativeVolume = 0;
  
  for (const candle of candles) {
    const typicalPrice = (candle.high + candle.low + candle.close) / 3;
    cumulativeTPV += typicalPrice * candle.volume;
    cumulativeVolume += candle.volume;
    
    result.push(cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : 0);
  }
  
  return result;
}

/**
 * Check if price is above EMA
 */
export function isPriceAboveEMA(
  candles: OHLCVCandle[],
  period: number
): boolean {
  if (candles.length < period) {
    return false;
  }
  
  const closes = candles.map((c) => c.close);
  const ema = calculateEMA(closes, period);
  const lastEMA = ema[ema.length - 1];
  const lastClose = closes[closes.length - 1];
  
  return !isNaN(lastEMA) && lastClose > lastEMA;
}

/**
 * Check if price just crossed above EMA
 */
export function priceJustCrossedAboveEMA(
  candles: OHLCVCandle[],
  period: number
): boolean {
  if (candles.length < period + 1) {
    return false;
  }
  
  const closes = candles.map((c) => c.close);
  const ema = calculateEMA(closes, period);
  
  const currentClose = closes[closes.length - 1];
  const previousClose = closes[closes.length - 2];
  const currentEMA = ema[ema.length - 1];
  const previousEMA = ema[ema.length - 2];
  
  return (
    !isNaN(currentEMA) &&
    !isNaN(previousEMA) &&
    previousClose <= previousEMA &&
    currentClose > currentEMA
  );
}

/**
 * Check if RSI is oversold
 */
export function isRSIOversold(
  candles: OHLCVCandle[],
  period: number = 14,
  threshold: number = 30
): boolean {
  const closes = candles.map((c) => c.close);
  const rsi = calculateRSI(closes, period);
  const lastRSI = rsi[rsi.length - 1];
  
  return !isNaN(lastRSI) && lastRSI < threshold;
}

/**
 * Check if RSI is overbought
 */
export function isRSIOverbought(
  candles: OHLCVCandle[],
  period: number = 14,
  threshold: number = 70
): boolean {
  const closes = candles.map((c) => c.close);
  const rsi = calculateRSI(closes, period);
  const lastRSI = rsi[rsi.length - 1];
  
  return !isNaN(lastRSI) && lastRSI > threshold;
}

/**
 * Get latest indicator values
 */
export function getLatestIndicators(candles: OHLCVCandle[]): {
  price: number;
  ema20: number;
  ema50: number;
  ema100: number;
  ema200: number;
  rsi14: number;
  sma20: number;
  vwap: number;
} {
  const closes = candles.map((c) => c.close);
  
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);
  const ema100 = calculateEMA(closes, 100);
  const ema200 = calculateEMA(closes, 200);
  const rsi14 = calculateRSI(closes, 14);
  const sma20 = calculateSMA(closes, 20);
  const vwap = calculateVWAP(candles);
  
  return {
    price: closes[closes.length - 1] || 0,
    ema20: ema20[ema20.length - 1] || 0,
    ema50: ema50[ema50.length - 1] || 0,
    ema100: ema100[ema100.length - 1] || 0,
    ema200: ema200[ema200.length - 1] || 0,
    rsi14: rsi14[rsi14.length - 1] || 0,
    sma20: sma20[sma20.length - 1] || 0,
    vwap: vwap[vwap.length - 1] || 0,
  };
}
