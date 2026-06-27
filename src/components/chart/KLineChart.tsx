import { useEffect, useRef, useMemo } from 'react';
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  createSeriesMarkers,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time,
  type ISeriesMarkersPluginApi,
} from 'lightweight-charts';
import type { KLineData, ChanLunResult } from '../../types';

interface KLineChartProps {
  data: KLineData[];
  chanLunResult: ChanLunResult;
  showFractals?: boolean;
  showStrokes?: boolean;
  showSegments?: boolean;
  showCenters?: boolean;
  showBuySellPoints?: boolean;
}

export default function KLineChart({
  data,
  chanLunResult,
  showFractals = true,
  showStrokes = true,
  showSegments = true,
  showCenters = true,
  showBuySellPoints = true,
}: KLineChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const strokeLineRef = useRef<ISeriesApi<'Line'> | null>(null);
  const segmentLineRef = useRef<ISeriesApi<'Line'> | null>(null);
  const centerLinesRef = useRef<ISeriesApi<'Line'>[]>([]);

  const chartData = useMemo<CandlestickData<Time>[]>(() => {
    return data.map((k) => ({
      time: k.time as Time,
      open: k.open,
      high: k.high,
      low: k.low,
      close: k.close,
    }));
  }, [data]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#0F172A' },
        textColor: '#94A3B8',
      },
      grid: {
        vertLines: { color: '#1E293B' },
        horzLines: { color: '#1E293B' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#D4AF37',
          width: 1,
          style: 2,
        },
        horzLine: {
          color: '#D4AF37',
          width: 1,
          style: 2,
        },
      },
      rightPriceScale: {
        borderColor: '#1E293B',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: '#1E293B',
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#E74C3C',
      downColor: '#27AE60',
      borderUpColor: '#E74C3C',
      borderDownColor: '#27AE60',
      wickUpColor: '#E74C3C',
      wickDownColor: '#27AE60',
    });

    const markers = createSeriesMarkers<Time>(candlestickSeries, []);

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    markersRef.current = markers;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      candlestickSeriesRef.current = null;
      markersRef.current = null;
      strokeLineRef.current = null;
      segmentLineRef.current = null;
      centerLinesRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!candlestickSeriesRef.current || chartData.length === 0) return;
    candlestickSeriesRef.current.setData(chartData);
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [chartData]);

  useEffect(() => {
    if (!markersRef.current) return;

    const markers: Array<{
      time: Time;
      position: 'aboveBar' | 'belowBar';
      color: string;
      shape: 'arrowUp' | 'arrowDown' | 'circle';
      text: string;
      size?: number;
    }> = [];

    if (showFractals && chanLunResult.strokes && chanLunResult.strokes.length > 0) {
      const strokeFractals: Array<{
        index: number;
        type: 'top' | 'bottom';
        price: number;
      }> = [];

      for (let i = 0; i < chanLunResult.strokes.length; i++) {
        const stroke = chanLunResult.strokes[i];
        const startType: 'top' | 'bottom' = stroke.direction === 'up' ? 'bottom' : 'top';
        const endType: 'top' | 'bottom' = stroke.direction === 'up' ? 'top' : 'bottom';

        if (i === 0) {
          strokeFractals.push({
            index: stroke.startIndex,
            type: startType,
            price: stroke.startPrice,
          });
        }

        strokeFractals.push({
          index: stroke.endIndex,
          type: endType,
          price: stroke.endPrice,
        });
      }

      for (const fractal of strokeFractals) {
        if (fractal.index >= 0 && fractal.index < data.length) {
          markers.push({
            time: data[fractal.index].time as Time,
            position: fractal.type === 'top' ? 'aboveBar' : 'belowBar',
            color: fractal.type === 'top' ? '#F59E0B' : '#8B5CF6',
            shape: 'circle',
            text: fractal.type === 'top' ? '顶' : '底',
            size: 1,
          });
        }
      }
    }

    if (showBuySellPoints && chanLunResult.buySellPoints) {
      const pointLabels: Record<string, string> = {
        buy1: '一买',
        buy2: '二买',
        buy3: '三买',
        sell1: '一卖',
        sell2: '二卖',
        sell3: '三卖',
      };
      const pointColors: Record<string, string> = {
        buy1: '#E74C3C',
        buy2: '#F97316',
        buy3: '#FBBF24',
        sell1: '#27AE60',
        sell2: '#10B981',
        sell3: '#34D399',
      };

      for (const point of chanLunResult.buySellPoints) {
        if (point.index >= 0 && point.index < data.length) {
          const isBuy = point.type.startsWith('buy');
          markers.push({
            time: data[point.index].time as Time,
            position: isBuy ? 'belowBar' : 'aboveBar',
            color: pointColors[point.type],
            shape: isBuy ? 'arrowUp' : 'arrowDown',
            text: pointLabels[point.type],
            size: 2,
          });
        }
      }
    }

    markersRef.current.setMarkers(markers);
  }, [chanLunResult, data, showFractals, showBuySellPoints]);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = chartRef.current;

    if (strokeLineRef.current) {
      chart.removeSeries(strokeLineRef.current);
      strokeLineRef.current = null;
    }
    if (segmentLineRef.current) {
      chart.removeSeries(segmentLineRef.current);
      segmentLineRef.current = null;
    }
    for (const line of centerLinesRef.current) {
      chart.removeSeries(line);
    }
    centerLinesRef.current = [];

    if (showStrokes && chanLunResult.strokes && chanLunResult.strokes.length > 0) {
      const strokeLine = chart.addSeries(LineSeries, {
        color: '#D4AF37',
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });

      const strokeData: Array<{ time: Time; value: number }> = [];
      for (let i = 0; i < chanLunResult.strokes.length; i++) {
        const stroke = chanLunResult.strokes[i];
        if (stroke.startIndex < data.length && stroke.endIndex < data.length) {
          if (i === 0) {
            strokeData.push({
              time: data[stroke.startIndex].time as Time,
              value: stroke.startPrice,
            });
          }
          strokeData.push({
            time: data[stroke.endIndex].time as Time,
            value: stroke.endPrice,
          });
        }
      }
      strokeLine.setData(strokeData);
      strokeLineRef.current = strokeLine;
    }

    if (showSegments && chanLunResult.segments && chanLunResult.segments.length > 0) {
      const segmentLine = chart.addSeries(LineSeries, {
        color: '#8B5CF6',
        lineWidth: 3,
        priceLineVisible: false,
        lastValueVisible: false,
      });

      const segmentData: Array<{ time: Time; value: number }> = [];
      for (let i = 0; i < chanLunResult.segments.length; i++) {
        const seg = chanLunResult.segments[i];
        if (seg.startIndex < data.length && seg.endIndex < data.length) {
          if (i === 0) {
            segmentData.push({
              time: data[seg.startIndex].time as Time,
              value: seg.startPrice,
            });
          }
          segmentData.push({
            time: data[seg.endIndex].time as Time,
            value: seg.endPrice,
          });
        }
      }
      segmentLine.setData(segmentData);
      segmentLineRef.current = segmentLine;
    }

    if (showCenters && chanLunResult.centers && chanLunResult.centers.length > 0) {
      for (let i = 0; i < chanLunResult.centers.length; i++) {
        const center = chanLunResult.centers[i];
        if (center.startIndex < data.length && center.endIndex < data.length) {
          const highLine = chart.addSeries(LineSeries, {
            color: 'rgba(59, 130, 246, 0.6)',
            lineWidth: 1,
            lineStyle: 2,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          const lowLine = chart.addSeries(LineSeries, {
            color: 'rgba(59, 130, 246, 0.6)',
            lineWidth: 1,
            lineStyle: 2,
            priceLineVisible: false,
            lastValueVisible: false,
          });

          highLine.setData([
            { time: data[center.startIndex].time as Time, value: center.high },
            { time: data[center.endIndex].time as Time, value: center.high },
          ]);
          lowLine.setData([
            { time: data[center.startIndex].time as Time, value: center.low },
            { time: data[center.endIndex].time as Time, value: center.low },
          ]);

          centerLinesRef.current.push(highLine, lowLine);
        }
      }
    }
  }, [chanLunResult, data, showStrokes, showSegments, showCenters]);

  return (
    <div ref={chartContainerRef} className="w-full rounded-lg overflow-hidden" style={{ height: 500 }} />
  );
}
