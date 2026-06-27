import type { KLineData, Fractal, Stroke, Segment, Center, BuySellPoint, ChanLunResult } from '../../types';

interface MergedKLine {
  index: number;
  high: number;
  low: number;
  open: number;
  close: number;
  time: number;
}

function handleInclusion(klines: KLineData[]): MergedKLine[] {
  if (klines.length < 2) {
    return klines.map((k, i) => ({
      index: i,
      high: k.high,
      low: k.low,
      open: k.open,
      close: k.close,
      time: k.time,
    }));
  }

  const result: MergedKLine[] = [
    {
      index: 0,
      high: klines[0].high,
      low: klines[0].low,
      open: klines[0].open,
      close: klines[0].close,
      time: klines[0].time,
    },
  ];

  let direction: 'up' | 'down' | null = null;

  for (let i = 1; i < klines.length; i++) {
    const curr = klines[i];
    const last = result[result.length - 1];

    const isInclusion = curr.high <= last.high && curr.low >= last.low;
    const isReverseInclusion = curr.high >= last.high && curr.low <= last.low;

    if (result.length < 2) {
      if (isInclusion || isReverseInclusion) {
        if (curr.close >= curr.open) {
          result[result.length - 1] = {
            ...last,
            high: Math.max(last.high, curr.high),
            low: Math.max(last.low, curr.low),
            index: i,
            close: curr.close,
            time: curr.time,
          };
        } else {
          result[result.length - 1] = {
            ...last,
            high: Math.min(last.high, curr.high),
            low: Math.min(last.low, curr.low),
            index: i,
            close: curr.close,
            time: curr.time,
          };
        }
        continue;
      } else {
        result.push({
          index: i,
          high: curr.high,
          low: curr.low,
          open: curr.open,
          close: curr.close,
          time: curr.time,
        });
        continue;
      }
    }

    const secondLast = result[result.length - 2];
    if (!direction) {
      direction = last.high > secondLast.high ? 'up' : 'down';
    }

    if (isInclusion || isReverseInclusion) {
      if (direction === 'up') {
        result[result.length - 1] = {
          ...last,
          high: Math.max(last.high, curr.high),
          low: Math.max(last.low, curr.low),
          index: i,
          close: curr.close,
          time: curr.time,
        };
      } else {
        result[result.length - 1] = {
          ...last,
          high: Math.min(last.high, curr.high),
          low: Math.min(last.low, curr.low),
          index: i,
          close: curr.close,
          time: curr.time,
        };
      }
    } else {
      const newDirection = curr.high > last.high ? 'up' : 'down';
      if (newDirection !== direction) {
        direction = newDirection;
      }
      result.push({
        index: i,
        high: curr.high,
        low: curr.low,
        open: curr.open,
        close: curr.close,
        time: curr.time,
      });
    }
  }

  return result;
}

function identifyFractalsFromMerged(merged: MergedKLine[]): Fractal[] {
  const fractals: Fractal[] = [];
  if (merged.length < 3) return fractals;

  for (let i = 1; i < merged.length - 1; i++) {
    const prev = merged[i - 1];
    const curr = merged[i];
    const next = merged[i + 1];

    const isTop = curr.high > prev.high && curr.high > next.high;
    const isBottom = curr.low < prev.low && curr.low < next.low;

    if (isTop) {
      fractals.push({
        index: curr.index,
        type: 'top',
        high: curr.high,
        low: curr.low,
        price: curr.high,
      });
    }

    if (isBottom) {
      fractals.push({
        index: curr.index,
        type: 'bottom',
        high: curr.high,
        low: curr.low,
        price: curr.low,
      });
    }
  }

  return fractals;
}

export function identifyFractals(klines: KLineData[]): Fractal[] {
  const merged = handleInclusion(klines);
  return identifyFractalsFromMerged(merged);
}

export function generateStrokes(klines: KLineData[], fractals: Fractal[]): Stroke[] {
  const strokes: Stroke[] = [];
  if (fractals.length < 2) return strokes;

  const validFractals: Fractal[] = [];

  for (let i = 0; i < fractals.length; i++) {
    const curr = fractals[i];

    if (validFractals.length === 0) {
      validFractals.push(curr);
      continue;
    }

    const last = validFractals[validFractals.length - 1];

    if (curr.type === last.type) {
      if (curr.type === 'top') {
        if (curr.price > last.price) {
          validFractals[validFractals.length - 1] = curr;
        }
      } else {
        if (curr.price < last.price) {
          validFractals[validFractals.length - 1] = curr;
        }
      }
      continue;
    }

    const klineDiff = Math.abs(curr.index - last.index);
    if (klineDiff < 4) continue;

    validFractals.push(curr);
  }

  if (validFractals.length < 2) return strokes;

  for (let i = 0; i < validFractals.length - 1; i++) {
    const start = validFractals[i];
    const end = validFractals[i + 1];

    let high = Math.max(start.high, end.high);
    let low = Math.min(start.low, end.low);
    const startIdx = Math.min(start.index, end.index);
    const endIdx = Math.max(start.index, end.index);
    for (let j = startIdx; j <= endIdx; j++) {
      if (j >= 0 && j < klines.length) {
        high = Math.max(high, klines[j].high);
        low = Math.min(low, klines[j].low);
      }
    }

    strokes.push({
      startIndex: start.index,
      endIndex: end.index,
      direction: start.type === 'bottom' ? 'up' : 'down',
      startPrice: start.price,
      endPrice: end.price,
      high,
      low,
    });
  }

  return strokes;
}

export function generateSegments(strokes: Stroke[]): Segment[] {
  const segments: Segment[] = [];
  if (strokes.length < 3) return segments;

  let i = 0;
  while (i < strokes.length - 2) {
    const s1 = strokes[i];
    const s2 = strokes[i + 1];
    const s3 = strokes[i + 2];

    if (s1.direction === s2.direction || s2.direction === s3.direction) {
      i++;
      continue;
    }

    const direction = s1.direction;
    let segStartIdx = s1.startIndex;
    let segEndIdx = s3.endIndex;
    let segStartPrice = s1.startPrice;
    let segEndPrice = s3.endPrice;
    let segHigh = Math.max(s1.high, s2.high, s3.high);
    let segLow = Math.min(s1.low, s2.low, s3.low);

    let j = i + 3;
    let lastStroke = s3;

    while (j < strokes.length) {
      const curr = strokes[j];

      if (direction === 'up') {
        if (curr.direction === 'down' && curr.endPrice < s2.low) {
          break;
        }
        if (curr.direction === 'up' && curr.endPrice > lastStroke.endPrice) {
          lastStroke = curr;
          segEndIdx = curr.endIndex;
          segEndPrice = curr.endPrice;
          segHigh = Math.max(segHigh, curr.high);
          segLow = Math.min(segLow, curr.low);
          j++;
          continue;
        }
      } else {
        if (curr.direction === 'up' && curr.endPrice > s2.high) {
          break;
        }
        if (curr.direction === 'down' && curr.endPrice < lastStroke.endPrice) {
          lastStroke = curr;
          segEndIdx = curr.endIndex;
          segEndPrice = curr.endPrice;
          segHigh = Math.max(segHigh, curr.high);
          segLow = Math.min(segLow, curr.low);
          j++;
          continue;
        }
      }

      segHigh = Math.max(segHigh, curr.high);
      segLow = Math.min(segLow, curr.low);
      segEndIdx = curr.endIndex;
      segEndPrice = curr.endPrice;
      j++;
    }

    segments.push({
      startIndex: segStartIdx,
      endIndex: segEndIdx,
      direction: direction as 'up' | 'down',
      startPrice: segStartPrice,
      endPrice: segEndPrice,
      high: segHigh,
      low: segLow,
    });

    i = j - 1 > i + 2 ? j - 1 : i + 3;
  }

  return segments;
}

export function identifyCenters(strokes: Stroke[]): Center[] {
  const centers: Center[] = [];
  if (strokes.length < 5) return centers;

  let i = 0;
  while (i <= strokes.length - 3) {
    const z1 = strokes[i];
    const z2 = strokes[i + 1];
    const z3 = strokes[i + 2];

    if (z1.direction === z2.direction || z2.direction === z3.direction) {
      i++;
      continue;
    }

    const zg = Math.min(z1.high, z3.high);
    const zd = Math.max(z1.low, z3.low);

    if (zg <= zd) {
      i++;
      continue;
    }

    let centerHigh = zg;
    let centerLow = zd;
    let startIdx = z1.startIndex;
    let endIdx = z3.endIndex;
    let strokeCount = 3;

    let j = i + 3;
    while (j < strokes.length) {
      const next = strokes[j];
      const overlapHigh = Math.min(centerHigh, next.high);
      const overlapLow = Math.max(centerLow, next.low);

      if (overlapHigh > overlapLow) {
        centerHigh = Math.min(centerHigh, next.high);
        centerLow = Math.max(centerLow, next.low);
        endIdx = next.endIndex;
        strokeCount++;
        j++;
      } else {
        break;
      }
    }

    if (strokeCount >= 5) {
      centers.push({
        startIndex: startIdx,
        endIndex: endIdx,
        high: centerHigh,
        low: centerLow,
        level: strokeCount >= 9 ? 2 : 1,
      });
    }

    i = j;
  }

  return centers;
}

export function identifyBuySellPoints(
  klines: KLineData[],
  strokes: Stroke[],
  centers: Center[]
): BuySellPoint[] {
  const points: BuySellPoint[] = [];
  if (centers.length === 0 || strokes.length < 5) return points;

  for (let ci = 0; ci < centers.length; ci++) {
    const center = centers[ci];

    const strokesBefore: Stroke[] = [];
    for (const s of strokes) {
      if (s.endIndex < center.startIndex) {
        strokesBefore.push(s);
      }
    }

    const strokesAfter: Stroke[] = [];
    for (const s of strokes) {
      if (s.startIndex > center.endIndex) {
        strokesAfter.push(s);
      }
    }

    if (strokesBefore.length >= 2) {
      const lastBefore = strokesBefore[strokesBefore.length - 1];
      const secondLastBefore = strokesBefore[strokesBefore.length - 2];

      if (lastBefore.direction === 'down') {
        if (lastBefore.endPrice < secondLastBefore.startPrice && lastBefore.endPrice < center.low) {
          points.push({
            index: lastBefore.endIndex,
            type: 'buy1',
            price: lastBefore.endPrice,
          });
        }
      }

      if (lastBefore.direction === 'up') {
        if (lastBefore.endPrice > secondLastBefore.startPrice && lastBefore.endPrice > center.high) {
          points.push({
            index: lastBefore.endIndex,
            type: 'sell1',
            price: lastBefore.endPrice,
          });
        }
      }
    }

    if (strokesAfter.length >= 2) {
      const firstAfter = strokesAfter[0];
      const secondAfter = strokesAfter[1];

      if (firstAfter.direction === 'up' && secondAfter.direction === 'down') {
        if (secondAfter.low > center.high) {
          points.push({
            index: secondAfter.endIndex,
            type: 'buy3',
            price: secondAfter.endPrice,
          });
        } else if (secondAfter.low > center.low) {
          const hasBuy1 = points.some(p => p.type === 'buy1' && p.index < center.startIndex);
          if (hasBuy1) {
            points.push({
              index: secondAfter.endIndex,
              type: 'buy2',
              price: secondAfter.endPrice,
            });
          }
        }
      }

      if (firstAfter.direction === 'down' && secondAfter.direction === 'up') {
        if (secondAfter.high < center.low) {
          points.push({
            index: secondAfter.endIndex,
            type: 'sell3',
            price: secondAfter.endPrice,
          });
        } else if (secondAfter.high < center.high) {
          const hasSell1 = points.some(p => p.type === 'sell1' && p.index < center.startIndex);
          if (hasSell1) {
            points.push({
              index: secondAfter.endIndex,
              type: 'sell2',
              price: secondAfter.endPrice,
            });
          }
        }
      }
    }
  }

  const uniquePoints: BuySellPoint[] = [];
  const seen = new Set<string>();
  for (const p of points) {
    const key = `${p.index}-${p.type}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniquePoints.push(p);
    }
  }

  return uniquePoints.sort((a, b) => a.index - b.index);
}

export function analyzeChanLun(klines: KLineData[]): ChanLunResult {
  const fractals = identifyFractals(klines);
  const strokes = generateStrokes(klines, fractals);
  const segments = generateSegments(strokes);
  const centers = identifyCenters(strokes);
  const buySellPoints = identifyBuySellPoints(klines, strokes, centers);

  return {
    fractals,
    strokes,
    segments,
    centers,
    buySellPoints,
  };
}
