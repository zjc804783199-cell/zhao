import {
  BookOpen,
  ChevronRight,
  Target,
  Layers,
  TrendingUp,
  GitBranch,
  Lightbulb,
} from 'lucide-react';

const articles = [
  {
    id: 1,
    title: '分型：走势的最小构成单元',
    category: '基础概念',
    difficulty: '入门',
    description: '顶分型与底分型的定义、识别方法及实战意义，掌握走势分析的起点。',
    icon: Target,
    color: 'from-amber-400 to-orange-500',
  },
  {
    id: 2,
    title: '笔：连接分型的基本单位',
    category: '基础概念',
    difficulty: '入门',
    description: '笔的定义、划分规则以及新笔旧笔的区别，构建走势分析的基础。',
    icon: GitBranch,
    color: 'from-blue-400 to-cyan-500',
  },
  {
    id: 3,
    title: '线段：更高级别的走势构件',
    category: '进阶概念',
    difficulty: '中级',
    description: '线段的定义、特征序列划分以及线段破坏的两种情况。',
    icon: TrendingUp,
    color: 'from-purple-400 to-violet-500',
  },
  {
    id: 4,
    title: '中枢：走势的核心概念',
    category: '核心概念',
    difficulty: '中级',
    description: '中枢的定义、级别、延伸与扩展，理解走势结构的关键。',
    icon: Layers,
    color: 'from-rose-400 to-pink-500',
  },
  {
    id: 5,
    title: '走势类型与趋势',
    category: '核心概念',
    difficulty: '高级',
    description: '盘整与趋势的定义，趋势的结束判定，背驰的理解与应用。',
    icon: Lightbulb,
    color: 'from-emerald-400 to-teal-500',
  },
  {
    id: 6,
    title: '三类买卖点详解',
    category: '实战应用',
    difficulty: '高级',
    description: '第一、二、三类买卖点的定义、形成机制及实战操作策略。',
    icon: Target,
    color: 'from-red-400 to-orange-500',
  },
];

export default function Learn() {
  return (
    <div className="min-h-screen bg-slate-900 pt-24 pb-10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full mb-6">
            <BookOpen className="w-4 h-4 text-violet-400" />
            <span className="text-violet-300 text-sm font-medium">缠论学堂</span>
          </div>
          <h1 className="text-4xl font-serif font-bold text-white mb-4">
            系统学习缠论
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            从基础概念到实战应用，循序渐进掌握缠中说禅理论的核心精髓
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article, index) => {
            const Icon = article.icon;
            return (
              <div
                key={article.id}
                className="group bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6 hover:border-amber-500/30 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${article.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-slate-700/50 text-slate-400 rounded-md">
                      {article.difficulty}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-amber-400 mb-2 font-medium">
                  {article.category}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-amber-300 transition-colors">
                  {article.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                  {article.description}
                </p>

                <div className="flex items-center gap-1 text-amber-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  阅读全文
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 bg-gradient-to-br from-amber-500/10 via-slate-800/50 to-purple-500/10 border border-slate-700/50 rounded-2xl p-8">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-serif font-bold text-white mb-3">
              关于缠中说禅
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              缠中说禅，当代奇人，一个在资本市场中自由驰骋的交易者。其博客"缠中说禅"以"教你炒股票108课"
              闻名于世，构建了一套完整、严谨、可操作的技术分析体系。
            </p>
            <p className="text-slate-400 leading-relaxed text-sm">
              缠论的核心思想是：市场走势是有规律的，这个规律是可以被认知和把握的。
              通过分型、笔、线段、中枢、走势类型等层层递进的概念构建，最终实现对市场走势的完全分类。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
