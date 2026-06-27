import type { KLineData, Fractal, Stroke, Segment, Center, BuySellPoint, ChanLunResult } from '../../types';

export function identifyFractals(klines: KLineData[]): Fractal[] {
  const fractals: Fractal[] = [];
  if (klines.length < 5) return fractals;

  for (let i = 2; i < klines.length - 2; i++) {
    const prev2 = klines[i - 2];
    const prev1 = klines[i - 1];
    const curr = klines[i];
    const next1 = klines[i + 1];
    const next2 = klines[i + 2];

    const isTop =
      curr.high > prev1.high &&
      curr.high > next1.high &&
      curr.high > prev2.high &&
      curr.high > next2.high &&
      prev1.high > prev2.high &&
      next1.high > next2.high;

    if (isTop) {
      fractals.push({
        index: i,
        type: 'top',
        high: curr.high,
        low: curr.low,
        price: curr.high,
      });
      continue;
    }

    const isBottom =
      curr.low < prev1.low &&
      curr.low < next1.low &&
      curr.low < prev2.low &&
      curr.low < next2.low &&
      prev1.low < prev2.low &&
      next1.low < next2.low;

    if (isBottom) {
      fractals.push({
        index: i,
        type: 'bottom',
        high: curr.high,
        low: curr.low,
        price: curr.low,
      });
    }
  }

  return fractals;
}

export function generateStrokes(klines: KLineData[], fractals: Fractal[]): Stroke[] {
  const strokes: Stroke[] = [];
  if (fractals.length < 2) return strokes;

  const validFractals: Fractal[] = [fractals[0]];

  for (let i = 1; i < fractals.length; i++) {
    const curr = fractals[i];
    const last = validFractals[validFractals.length - 1];

    if (curr.type === last.type) {
      if (curr.type === 'top' && curr.price > last.price) {
        validFractals[validFractals.length - 1] = curr;
      } else if (curr.type === 'bottom' && curr.price < last.price) {
        validFractals[validFractals.length - 1] = curr;
      }
      continue;
    }

    const klineDiff = Math.abs(curr.index - last.index);
    if (klineDiff < 4) continue;

    validFractals.push(curr);
  }

  for (let i = 0; i < validFractals.length - 1; i++) {
    const start = validFractals[i];
    const end = validFractals[i + 1];

    let high = Math.max(start.high, end.high);
    let low = Math.min(start.low, end.low);
    for (let j = start.index; j <= end.index; j++) {
      high = Math.max(high, klines[j].high);
      low = Math.min(low, klines[j].low);
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
    const first = strokes[i];
    const second = strokes[i + 1];
    const third = strokes[i + 2];

    if (
      first.direction === second.direction ||
      second.direction === third.direction
    ) {
      i++;
      continue;
    }

    const direction = first.direction;
    let startIndex = first.startIndex;
    let endIndex = third.endIndex;
    let startPrice = first.startPrice;
    let endPrice = third.endPrice;
    let high = Math.max(first.high, second.high, third.high);
    let low = Math.min(first.low, second.low, third.low);

    let j = i + 3;
    let lastEnd = third.endIndex;

    while (j < strokes.length) {
      const curr = strokes[j];

      if (direction === 'up') {
        if (curr.direction === 'down' && curr.endPrice < second.low) {
          break;
        }
      } else {
        if (curr.direction === 'up' && curr.endPrice > second.high) {
          break;
        }
      }

      high = Math.max(high, curr.high);
      low = Math.min(low, curr.low);
      endIndex = curr.endIndex;
      endPrice = curr.endPrice;
      lastEnd = curr.endIndex;
      j++;
    }

    segments.push({
      startIndex,
      endIndex,
      direction: direction as 'up' | 'down',
      startPrice,
      endPrice,
      high,
      low,
    });

    i = j - 1 < i + 3 ? i + 3 : j - 1;
  }

  return segments;
}

export function identifyCenters(strokes: Stroke[]): Center[] {
  const centers: Center[] = [];
  if (strokes.length < 5) return centers;

  let i = 0;
  while (i < strokes.length - 4) {
    const z1 = strokes[i];
    const z2 = strokes[i + 1];
    const z3 = strokes[i + 2];

    const gg = Math.min(z1.high, z3.high);
    const dd = Math.max(z1.low, z3.low);

    if (gg <= dd) {
      i++;
      continue;
    }

    let centerHigh = gg;
    let centerLow = dd;
    let startIdx = z1.startIndex;
    let endIdx = z3.endIndex;
    let level = 1;

    let j = i + 3;
    let extendCount = 0;
    while (j < strokes.length - 1) {
      const nextStroke = strokes[j];
      const nextStroke2 = strokes[j + 1];

      if (nextStroke.direction === z2.direction) {
        const overlapHigh = Math.min(centerHigh, nextStroke.high);
        const overlapLow = Math.max(centerLow, nextStroke.low);

        if (overlapHigh > overlapLow) {
          centerHigh = Math.min(centerHigh, nextStroke.high);
          centerLow = Math.max(centerLow, nextStroke.low);
          endIdx = nextStroke.endIndex;
          extendCount++;
          j++;
          continue;
        }
      }

      if (nextStroke2) {
        const overlapHigh = Math.min(centerHigh, nextStroke2.high);
        const overlapLow = Math.max(centerLow, nextStroke2.low);

        if (overlapHigh > overlapLow) {
          centerHigh = Math.min(centerHigh, nextStroke2.high);
          centerLow = Math.max(centerLow, nextStroke2.low);
          endIdx = nextStroke2.endIndex;
          extendCount++;
          j += 2;
          continue;
        }
      }

      break;
    }

    if (extendCount >= 6) {
      level = 2;
    }

    centers.push({
      startIndex: startIdx,
      endIndex: endIdx,
      high: centerHigh,
      low: centerLow,
      level,
    });

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

  for (let c = 0; c < centers.length; c++) {
    const center = centers[c];

    const strokesInCenter: Stroke[] = [];
    for (const s of strokes) {
      if (s.startIndex >= center.startIndex && s.endIndex <= center.endIndex) {
        strokesInCenter.push(s);
      }
    }

    if (strokesInCenter.length < 3) continue;

    const centerStrokesBefore: Stroke[] = [];
    for (const s of strokes) {
      if (s.endIndex < center.startIndex) {
        centerStrokesBefore.push(s);
      }
    }

    if (centerStrokesBefore.length >= 2) {
      const lastEntering = centerStrokesBefore[centerStrokesBefore.length - 1];
      if (lastEntering.direction === 'down') {
        const firstStroke = centerStrokesBefore[0];
        const enteringHigh = lastEntering.high;
        const enteringLow = lastEntering.low;
        const prevLow = firstStroke.low;

        if (enteringLow < prevLow && enteringHigh < center.low) {
          const buy1Index = lastEntering.endIndex;
          if (buy1Index < klines.length) {
            points.push({
              index: buy1Index,
              type: 'buy1',
              price: lastEntering.endPrice,
            });
          }
        }
      }
    }

    const strokesAfterCenter: Stroke[] = [];
    for (const s of strokes) {
      if (s.startIndex > center.endIndex) {
        strokesAfterCenter.push(s);
      }
    }

    if (strokesAfterCenter.length >= 2) {
      const firstAfter = strokesAfterCenter[0];
      const secondAfter = strokesAfterCenter[1];

      if (firstAfter.direction === 'up' && secondAfter.direction === 'down') {
        if (secondAfter.endPrice > center.low && secondAfter.low > center.low) {
          let hasBuy1 = false;
          for (const p of points) {
            if (p.type === 'buy1' && p.index < center.startIndex) {
              hasBuy1 = true;
              break;
            }
          }
          if (hasBuy1) {
            points.push({
              index: secondAfter.endIndex,
              type: 'buy2',
              price: secondAfter.endPrice,
            });
          }
        }

        if (secondAfter.low > center.high) {
          points.push({
            index: secondAfter.endIndex,
            type: 'buy3',
            price: secondAfter.endPrice,
          });
        }
      }

      if (firstAfter.direction === 'down' && secondAfter.direction === 'up') {
        if (secondAfter.endPrice < center.high && secondAfter.high < center.high) {
          let hasSell1 = false;
          for (const p of points) {
            if (p.type === 'sell1' && p.index < center.startIndex) {
              hasSell1 = true;
              break;
            }
          }
          if (hasSell1) {
            points.push({
              index: secondAfter.endIndex,
              type: 'sell2',
              price: secondAfter.endPrice,
            });
          }
        }

        if (secondAfter.high < center.low) {
          points.push({
            index: secondAfter.endIndex,
            type: 'sell3',
            price: secondAfter.endPrice,
          });
        }
      }
    }

    if (centerStrokesBefore.length >= 2) {
      const lastEntering = centerStrokesBefore[centerStrokesBefore.length - 1];
      if (lastEntering.direction === 'up') {
        const firstStroke = centerStrokesBefore[0];
        const enteringHigh = lastEntering.high;
        const prevHigh = firstStroke.high;

        if (enteringHigh > prevHigh && enteringHigh > center.high) {
          const sell1Index = lastEntering.endIndex;
          if (sell1Index < klines.length) {
            points.push({
              index: sell1Index,
              type: 'sell1',
              price: lastEntering.endPrice,
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
