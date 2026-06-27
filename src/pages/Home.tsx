import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  TrendingUp,
  Target,
  Layers,
  GitBranch,
  ArrowRight,
  Zap,
  BookOpen,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { getHotStocks, generateMockKLine, getStockInfo } from '../utils/mock/stockData';

export default function Home() {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const hotStocks = getHotStocks().slice(0, 10);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/analysis/${searchValue.trim()}`);
    }
  };

  const handleStockClick = (code: string) => {
    navigate(`/analysis/${code}`);
  };

  const features = [
    {
      icon: Target,
      title: '精准分型识别',
      description: '自动识别顶底分型，严格遵循缠论定义，确保分析准确性',
      color: 'from-amber-400 to-orange-500',
    },
    {
      icon: Layers,
      title: '中枢智能构建',
      description: '多级别中枢自动识别，区间精确定位，把握走势结构',
      color: 'from-purple-400 to-violet-500',
    },
    {
      icon: TrendingUp,
      title: '买卖点判断',
      description: '一二三类买卖点自动标注，辅助交易决策',
      color: 'from-rose-400 to-red-500',
    },
    {
      icon: GitBranch,
      title: '多级别联立',
      description: '分钟/日/周多周期切换，大处着眼小处着手',
      color: 'from-emerald-400 to-teal-500',
    },
  ];

  const getStockPreview = (code: string) => {
    const data = generateMockKLine(code, 300);
    return getStockInfo(code, data);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="relative pt-32 pb-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-6 animate-fade-in">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300 text-sm font-medium">缠中说禅技术分析</span>
            </div>

            <h1 className="text-5xl font-serif font-bold text-white mb-6 leading-tight animate-slide-up">
              用<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">缠论</span>
              洞察市场走势
            </h1>

            <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-slide-up animation-delay-100">
              基于缠中说禅理论的智能分析平台，自动识别分型、笔、线段、中枢与买卖点，
              让复杂的技术分析变得简单直观。
            </p>

            <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-6 animate-slide-up animation-delay-200">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl opacity-30 group-hover:opacity-50 transition-opacity blur" />
                <div className="relative flex items-center bg-slate-800 rounded-xl overflow-hidden">
                  <Search className="w-5 h-5 text-slate-500 ml-5" />
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder="输入股票代码，如 600519、000001..."
                    className="flex-1 px-4 py-4 bg-transparent text-white placeholder-slate-500 focus:outline-none text-lg"
                  />
                  <button
                    type="submit"
                    className="m-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-semibold rounded-lg hover:from-amber-300 hover:to-amber-400 transition-all flex items-center gap-2"
                  >
                    分析
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>

            <div className="flex items-center justify-center gap-2 text-slate-500 text-sm animate-slide-up animation-delay-300">
              <span>热门股票：</span>
              {hotStocks.slice(0, 5).map((stock) => (
                <button
                  key={stock.code}
                  onClick={() => handleStockClick(stock.code)}
                  className="px-2 py-1 hover:text-amber-400 transition-colors"
                >
                  {stock.code}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <section className="py-20 px-6 bg-slate-800/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-serif font-bold text-white mb-4">核心功能</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              完整的缠论分析工具链，从基础分型到高级买卖点，全方位辅助您的投资决策
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group relative bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6 hover:border-amber-500/30 transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <Flame className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-2xl font-serif font-bold text-white">热门股票</h2>
                <p className="text-slate-500 text-sm">点击股票代码查看缠论分析</p>
              </div>
            </div>
          </div>

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
                {hotStocks.map((stock) => {
                  const info = getStockPreview(stock.code);
                  const isUp = info.changePercent >= 0;
                  return (
                    <tr
                      key={stock.code}
                      className="hover:bg-slate-700/30 transition-colors cursor-pointer"
                      onClick={() => handleStockClick(stock.code)}
                    >
                      <td className="px-6 py-4 text-sm font-mono text-amber-400">{stock.code}</td>
                      <td className="px-6 py-4 text-sm text-white">{stock.name}</td>
                      <td className="px-6 py-4 text-sm text-right font-mono text-white">
                        {info.currentPrice.toFixed(2)}
                      </td>
                      <td className={`px-6 py-4 text-sm text-right font-mono ${isUp ? 'text-red-400' : 'text-green-400'}`}>
                        {isUp ? '+' : ''}{info.changePercent.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 text-sm">
                          分析
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-gradient-to-b from-slate-900 to-slate-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full mb-5">
                <BookOpen className="w-4 h-4 text-violet-400" />
                <span className="text-violet-300 text-sm font-medium">缠论学堂</span>
              </div>
              <h2 className="text-3xl font-serif font-bold text-white mb-5">
                学习缠论，掌握市场规律
              </h2>
              <p className="text-slate-400 mb-6 leading-relaxed">
                缠中说禅理论是一套完整的技术分析体系，涵盖分型、笔、线段、中枢、走势类型等核心概念。
                通过系统学习，您将获得洞察市场结构的能力。
              </p>
              <div className="space-y-3 mb-8">
                {['分型与笔的基础概念', '线段划分与中枢构建', '走势类型与买卖点', '多级别联立分析'].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <ChevronRight className="w-3 h-3 text-amber-400" />
                    </div>
                    <span className="text-slate-300">{item}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate('/learn')}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-amber-500/30 text-amber-400 rounded-lg hover:bg-amber-500/10 transition-all"
              >
                进入学堂
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/20 to-purple-500/20 rounded-3xl blur-2xl" />
              <div className="relative bg-slate-800/80 backdrop-blur border border-slate-700/50 rounded-2xl p-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-slate-700/30 rounded-xl">
                    <div className="text-2xl font-bold text-amber-400 mb-1">108</div>
                    <div className="text-xs text-slate-400">教你炒股票</div>
                  </div>
                  <div className="text-center p-4 bg-slate-700/30 rounded-xl">
                    <div className="text-2xl font-bold text-purple-400 mb-1">5</div>
                    <div className="text-xs text-slate-400">核心概念</div>
                  </div>
                  <div className="text-center p-4 bg-slate-700/30 rounded-xl">
                    <div className="text-2xl font-bold text-rose-400 mb-1">3</div>
                    <div className="text-xs text-slate-400">类买卖点</div>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl">
                  <p className="text-amber-200 text-sm italic leading-relaxed">
                    "市场从来都是明白人挣糊涂人的钱。在市场经济中，你只要是人，就会有情绪，
                    有贪婪恐惧，而这一切，都是市场可以利用的弱点。"
                  </p>
                  <p className="text-amber-400 text-sm mt-3 text-right">—— 缠中说禅</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-10 px-6 border-t border-slate-800">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-slate-900" />
            </div>
            <span className="text-lg font-serif font-bold text-amber-400">缠论智析</span>
          </div>
          <p className="text-slate-500 text-sm">仅供学习研究使用，不构成任何投资建议</p>
          <p className="text-slate-600 text-xs mt-2">© 2024 缠论智析 ChanLun Analysis</p>
        </div>
      </footer>
    </div>
  );
}
