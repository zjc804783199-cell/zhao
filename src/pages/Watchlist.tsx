import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Trash2, ChevronRight, Plus } from 'lucide-react';
import { useWatchlistStore } from '../store/watchlist';
import { generateMockKLine, getStockInfo } from '../utils/mock/stockData';

export default function Watchlist() {
  const navigate = useNavigate();
  const { items, removeItem, loadFromStorage } = useWatchlistStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const getStockData = (code: string) => {
    const data = generateMockKLine(code, 100);
    return getStockInfo(code, data);
  };

  return (
    <div className="min-h-screen bg-slate-900 pt-24 pb-10">
      <div className="max-w-5xl mx-auto px-6">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-white">我的自选</h1>
              <p className="text-sm text-slate-400">共 {items.length} 只股票</p>
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">暂无自选股</h3>
            <p className="text-slate-400 text-sm mb-6">
              搜索股票并添加到自选，方便快速查看
            </p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-semibold rounded-lg hover:from-amber-300 hover:to-amber-400 transition-all"
            >
              <Plus className="w-4 h-4" />
              添加自选股
            </button>
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">代码</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">名称</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">最新价</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">涨跌幅</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {items.map((item) => {
                  const info = getStockData(item.code);
                  const isUp = info.changePercent >= 0;
                  return (
                    <tr
                      key={item.code}
                      className="hover:bg-slate-700/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/analysis/${item.code}`)}
                    >
                      <td className="px-6 py-4 text-sm font-mono text-amber-400">{item.code}</td>
                      <td className="px-6 py-4 text-sm text-white">{item.name}</td>
                      <td className="px-6 py-4 text-sm text-right font-mono text-white">
                        {info.currentPrice.toFixed(2)}
                      </td>
                      <td className={`px-6 py-4 text-sm text-right font-mono ${isUp ? 'text-red-400' : 'text-green-400'}`}>
                        {isUp ? '+' : ''}{info.changePercent.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/analysis/${item.code}`);
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-700/50 rounded-lg transition-all"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeItem(item.code);
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
