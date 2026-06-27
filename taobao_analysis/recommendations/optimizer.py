from models.core import OptimizationRecommendation, DiagnosedProblem


class Optimizer:
    SOLUTIONS_MAP = {
        "流量断崖式下跌": {
            "solutions": [
                "检查搜索权重变化，排查是否有关键词排名下降",
                "优化商品标题和主图，提升搜索点击率",
                "优化直通车推广和主图，稳定付费流量",
                "参与平台活动（聚划算/淘抢购）获取活动流量"
            ],
            "expected_effect": "恢复日均访客至4,000+"
        },
        "退款率过高": {
            "solutions": [
                "分析退款原因分布，针对性改进商品质量",
                "优化商品描述一致性，减少「与描述不符」退款",
                "加强出货质检，降低「质量问题」退款",
                "改进商品包装，降低运输破损率",
                "提供详细的尺码指南和使用说明"
            ],
            "expected_effect": "将退款率降至15%以下"
        },
        "流量过度集中": {
            "solutions": [
                "培育长尾潜力款，分配推广预算到2-5梯队商品",
                "优化滞销款的主图和标题，尝试A/B测试",
                "在爆款详情页加强关联销售，带动长尾款",
                "定期上架新品，分散流量风险"
            ],
            "expected_effect": "Top5流量占比降至40%以下"
        },
        "推广预算缩减": {
            "solutions": [
                "评估各商品ROI，保留高ROI商品投放",
                "调整关键词出价策略，降低CPC",
                "优化人群定向，提高转化率",
                "聚焦核心爆款，集中资源打爆"
            ],
            "expected_effect": "ROI提升至3.5+"
        },
        "付费依赖度过高": {
            "solutions": [
                "提升自然搜索权重，优化SEO",
                "增加内容营销（微淘/短视频/直播）",
                "优化主图点击率，提升自然流量质量",
                "建立私域流量池（微信群/企业微信）"
            ],
            "expected_effect": "自然流量占比提升至60%"
        },
        "超半数商品零成交": {
            "solutions": [
                "每30天清理零动销商品，下架或优化",
                "对滞销商品进行主图和详情页A/B测试",
                "开展清仓活动，回笼资金",
                "集中精力运营TOP 50商品"
            ],
            "expected_effect": "动销率提升至60%以上"
        },
        "老客回购率低": {
            "solutions": [
                "建立会员体系（设置等级和积分）",
                "设计老客专属优惠和复购激励",
                "通过短信/旺旺触达老客",
                "建立私域客户群，定期推送新品"
            ],
            "expected_effect": "老客占比提升至40%"
        },
        "推广ROI未达标": {
            "solutions": [
                "筛选高转化关键词，淘汰低效词",
                "优化落地页体验，提升承接能力",
                "调整出价策略，降低无效点击",
                "测试不同人群定向，找到高价值用户"
            ],
            "expected_effect": "ROI提升至3.5+"
        }
    }

    def generate_recommendations(self, problems: list) -> list:
        recommendations = []

        for problem in problems:
            if problem.description in self.SOLUTIONS_MAP:
                solution_data = self.SOLUTIONS_MAP[problem.description]
                recommendations.append(OptimizationRecommendation(
                    problem_id=problem.id,
                    problem_description=problem.description,
                    severity=problem.severity,
                    solutions=solution_data["solutions"],
                    expected_effect=solution_data["expected_effect"]
                ))

        return recommendations