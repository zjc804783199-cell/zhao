import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star,
  StarOff,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import KLineChart from '../components/chart/KLineChart';
import { generateMockKLine, getStockInfo, getStockName } from '../utils/mock/stockData';
import { analyzeChanLun } from '../utils/chanlun/analyzer';
import { useWatchlistStore } from '../store/watchlist';
import type { TimeFrame } from '../types';

const timeFrames: { key: TimeFrame; label: string }[] = [
  { key: 'day', label: '日线' },
  { key: '30min', label: '30分钟' },
  { key: '5min', label: '5分钟' },
  { key: '1min', label: '1分钟' },
  { key: 'week', label: '周线' },
];

export default function Analysis() {
  const { code = '600519' } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { addItem, removeItem, isInWatchlist, loadFromStorage } = useWatchlistStore();

  const [timeFrame, setTimeFrame] = useState<TimeFrame>('day');
  const [showFractals, setShowFractals] = useState(true);
  const [showStrokes, setShowStrokes] = useState(true);
  const [showSegments, setShowSegments] = useState(true);
  const [showCenters, setShowCenters] = useState(true);
  const [showBuySellPoints, setShowBuySellPoints] = useState(true);
  const [activeTab, setActiveTab] = useState<'fractals' | 'strokes' | 'centers' | 'points'>('points');

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const klineData = useMemo(() => {
    let count = 300;
    if (timeFrame === 'week') count = 200;
    if (timeFrame === '30min') count = 500;
    if (timeFrame === '5min') count = 800;
    if (timeFrame === '1min') count = 1000;
    return generateMockKLine(code, count);
  }, [code, timeFrame]);

  const stockInfo = useMemo(() => {
    return getStockInfo(code, klineData);
  }, [code, klineData]);

  const chanLunResult = useMemo(() => {
    return analyzeChanLun(klineData);
  }, [klineData]);

  const inWatchlist = isInWatchlist(code);
  const isUp = stockInfo.changePercent >= 0;

  const toggleWatchlist = () => {
    if (inWatchlist) {
      removeItem(code);
    } else {
      addItem(code, getStockName(code));
    }
  };

  const generateConclusion = () => {
    const points = chanLunResult.buySellPoints;
    const centers = chanLunResult.centers;
    const lastPoint = points.length > 0 ? points[points.length - 1] : null;

    let signal = '观望';
    let signalType = 'neutral';
    let reasons: string[] = [];

    if (lastPoint) {
      if (lastPoint.type.startsWith('buy')) {
        signal = '偏多';
        signalType = 'bullish';
        reasons.push(`近期出现${lastPoint.type === 'buy1' ? '一买' : lastPoint.type === 'buy2' ? '二买' : '三买'}信号`);
      } else {
        signal = '偏空';
        signalType = 'bearish';
        reasons.push(`近期出现${lastPoint.type === 'sell1' ? '一卖' : lastPoint.type === 'sell2' ? '二卖' : '三卖'}信号`);
      }
    }

    if (centers.length > 0) {
      const lastCenter = centers[centers.length - 1];
      const currentPrice = stockInfo.currentPrice;

      if (currentPrice > lastCenter.high) {
        reasons.push('当前价格在中枢上方，走势偏强');
      } else if (currentPrice < lastCenter.low) {
        reasons.push('当前价格在中枢下方，走势偏弱');
      } else {
        reasons.push('当前价格在中枢区间内，震荡走势');
      }
    }

    reasons.push(`当前周期已识别 ${centers.length} 个中枢`);
    reasons.push(`共识别 ${points.length} 个买卖点信号`);

    return { signal, signalType, reasons };
  };

  const conclusion = generateConclusion();

  return (
    <div className="min-h-screen bg-slate-900 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-amber-400 text-sm mb-4 flex items-center gap-1 transition-colors"
          >
            ← 返回
          </button>

          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-serif font-bold text-white">{stockInfo.name}</h1>
                  <span className="text-sm text-slate-400 font-mono">{stockInfo.code}</span>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className={`text-4xl font-bold font-mono ${isUp ? 'text-red-400' : 'text-green-400'}`}>
                    {stockInfo.currentPrice.toFixed(2)}
                  </span>
                  <div className={`flex items-center gap-1 ${isUp ? 'text-red-400' : 'text-green-400'}`}>
                    {isUp ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                    <span className="text-lg font-mono">
                      {isUp ? '+' : ''}{stockInfo.changePercent.toFixed(2)}%
                    </span>
                    <span className="text-sm">
                      {isUp ? '+' : ''}{stockInfo.changeAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={toggleWatchlist}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                    inWatchlist
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:border-amber-500/30 hover:text-amber-400'
                  }`}
                >
                  {inWatchlist ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                  {inWatchlist ? '已自选' : '加自选'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 md:grid-cols-6 gap-4 mt-6 pt-6 border-t border-slate-700/50">
              <div>
                <div className="text-xs text-slate-500 mb-1">今开</div>
                <div className="text-sm text-white font-mono">{stockInfo.open.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">昨收</div>
                <div className="text-sm text-white font-mono">{stockInfo.prevClose.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">最高</div>
                <div className="text-sm text-red-400 font-mono">{stockInfo.high.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">最低</div>
                <div className="text-sm text-green-400 font-mono">{stockInfo.low.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">成交量</div>
                <div className="text-sm text-white font-mono">{(stockInfo.volume / 10000).toFixed(0)}万</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">成交额</div>
                <div className="text-sm text-white font-mono">{(stockInfo.amount / 100000000).toFixed(2)}亿</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div className="flex items-center gap-1 bg-slate-700/50 rounded-lg p-1">
                  {timeFrames.map((tf) => (
                    <button
                      key={tf.key}
                      onClick={() => setTimeFrame(tf.key)}
                      className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                        timeFrame === tf.key
                          ? 'bg-amber-500/20 text-amber-400 font-medium'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFractals(!showFractals)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
                      showFractals ? 'text-amber-400 bg-amber-500/10' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {showFractals ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    分型
                  </button>
                  <button
                    onClick={() => setShowStrokes(!showStrokes)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
                      showStrokes ? 'text-amber-400 bg-amber-500/10' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {showStrokes ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    笔
                  </button>
                  <button
                    onClick={() => setShowSegments(!showSegments)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
                      showSegments ? 'text-purple-400 bg-purple-500/10' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {showSegments ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    线段
                  </button>
                  <button
                    onClick={() => setShowCenters(!showCenters)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
                      showCenters ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {showCenters ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    中枢
                  </button>
                  <button
                    onClick={() => setShowBuySellPoints(!showBuySellPoints)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
                      showBuySellPoints ? 'text-rose-400 bg-rose-500/10' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {showBuySellPoints ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    买卖点
                  </button>
                </div>
              </div>

              <KLineChart
                data={klineData}
                chanLunResult={chanLunResult}
                showFractals={showFractals}
                showStrokes={showStrokes}
                showSegments={showSegments}
                showCenters={showCenters}
                showBuySellPoints={showBuySellPoints}
              />
            </div>

            <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  conclusion.signalType === 'bullish' ? 'bg-red-500/20' :
                  conclusion.signalType === 'bearish' ? 'bg-green-500/20' : 'bg-slate-700'
                }`}>
                  {conclusion.signalType === 'bullish' ? (
                    <TrendingUp className="w-5 h-5 text-red-400" />
                  ) : conclusion.signalType === 'bearish' ? (
                    <TrendingDown className="w-5 h-5 text-green-400" />
                  ) : (
                    <Clock className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">缠论分析结论</h3>
                  <p className="text-sm text-slate-400">{timeFrames.find(t => t.key === timeFrame)?.label}级别</p>
                </div>
                <div className="ml-auto">
                  <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                    conclusion.signalType === 'bullish' ? 'bg-red-500/20 text-red-400' :
                    conclusion.signalType === 'bearish' ? 'bg-green-500/20 text-green-400' :
                    'bg-slate-700 text-slate-300'
                  }`}>
                    {conclusion.signal}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {conclusion.reasons.map((reason, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-300">{reason}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-200/80 leading-relaxed">
                    风险提示：以上分析仅供学习研究参考，不构成任何投资建议。
                    股市有风险，投资需谨慎。请结合自身风险承受能力独立决策。
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl overflow-hidden">
              <div className="flex border-b border-slate-700/50">
                {[
                  { key: 'points', label: '买卖点' },
                  { key: 'centers', label: '中枢' },
                  { key: 'strokes', label: '笔/线段' },
                  { key: 'fractals', label: '分型' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as typeof activeTab)}
                    className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                      activeTab === tab.key
                        ? 'text-amber-400'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                    {activeTab === tab.key && (
                      <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-amber-400 rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              <div className="p-4 max-h-[560px] overflow-y-auto">
                {activeTab === 'points' && (
                  <div className="space-y-2">
                    {chanLunResult.buySellPoints.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 text-sm">
                        暂无买卖点信号
                      </div>
                    ) : (
                      [...chanLunResult.buySellPoints].reverse().map((point, idx) => {
                        const isBuy = point.type.startsWith('buy');
                        const labels: Record<string, string> = {
                          buy1: '第一类买点',
                          buy2: '第二类买点',
                          buy3: '第三类买点',
                          sell1: '第一类卖点',
                          sell2: '第二类卖点',
                          sell3: '第三类卖点',
                        };
                        return (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg border ${
                              isBuy
                                ? 'bg-red-500/5 border-red-500/20'
                                : 'bg-green-500/5 border-green-500/20'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-sm font-medium ${isBuy ? 'text-red-400' : 'text-green-400'}`}>
                                {labels[point.type]}
                              </span>
                              <span className="text-xs text-slate-500">
                                第 {point.index} 根K线
                              </span>
                            </div>
                            <div className="text-white font-mono text-lg">
                              {point.price.toFixed(2)}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {activeTab === 'centers' && (
                  <div className="space-y-3">
                    {chanLunResult.centers.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 text-sm">
                        暂无识别到的中枢
                      </div>
                    ) : (
                      [...chanLunResult.centers].reverse().map((center, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-blue-400">
                              中枢 #{chanLunResult.centers.length - idx}
                            </span>
                            <span className="text-xs text-slate-500">
                              {center.level === 2 ? '高级别' : '标准'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-slate-500 text-xs">上沿</span>
                              <div className="text-white font-mono">{center.high.toFixed(2)}</div>
                            </div>
                            <div>
                              <span className="text-slate-500 text-xs">下沿</span>
                              <div className="text-white font-mono">{center.low.toFixed(2)}</div>
                            </div>
                          </div>
                          <div className="mt-2 pt-2 border-t border-slate-700/50">
                            <div className="text-xs text-slate-500">
                              区间振幅: {(((center.high - center.low) / center.low) * 100).toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'strokes' && (
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-slate-300 mb-2">
                        笔 ({chanLunResult.strokes.length})
                      </div>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {[...chanLunResult.strokes].slice(-20).reverse().map((stroke, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs py-1.5 px-2 rounded hover:bg-slate-700/30">
                            <span className={stroke.direction === 'up' ? 'text-red-400' : 'text-green-400'}>
                              {stroke.direction === 'up' ? '↑ 向上笔' : '↓ 向下笔'}
                            </span>
                            <span className="text-slate-400 font-mono">
                              {stroke.startPrice.toFixed(2)} - {stroke.endPrice.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="pt-3 border-t border-slate-700/50">
                      <div className="text-sm font-medium text-slate-300 mb-2">
                        线段 ({chanLunResult.segments.length})
                      </div>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {[...chanLunResult.segments].reverse().map((seg, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs py-1.5 px-2 rounded hover:bg-slate-700/30">
                            <span className={seg.direction === 'up' ? 'text-purple-400' : 'text-violet-400'}>
                              {seg.direction === 'up' ? '↗ 向上线段' : '↘ 向下线段'}
                            </span>
                            <span className="text-slate-400 font-mono">
                              {seg.startPrice.toFixed(2)} - {seg.endPrice.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'fractals' && (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {[...chanLunResult.fractals].slice(-30).reverse().map((fractal, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-700/30">
                        <span className={`text-sm ${fractal.type === 'top' ? 'text-amber-400' : 'text-purple-400'}`}>
                          {fractal.type === 'top' ? '顶分型' : '底分型'}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {fractal.price.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
