from models.core import DiagnosedProblem
from config.settings import DiagnosticsConfig


class ProblemDiagnoser:
    def __init__(self):
        self.config = DiagnosticsConfig()
        self.problems = []
        self.problem_id_counter = 1

    def diagnose_traffic_crash(self, core_metrics):
        if core_metrics.visitors_change < self.config.TRAFFIC_CRASH_THRESHOLD:
            evidence = f"后半15天日均访客从{int(core_metrics.first_half_visitors/15)}降至{int(core_metrics.second_half_visitors/15)} ({core_metrics.visitors_change:.1f}%)"
            self._add_problem(
                description="流量断崖式下跌",
                severity="高",
                impact_dimension="流量健康",
                evidence=evidence
            )

    def diagnose_high_refund_rate(self, core_metrics):
        if core_metrics.avg_refund_rate > self.config.REFUND_RATE_CRITICAL:
            evidence = f"30天平均退款率{core_metrics.avg_refund_rate:.2f}%，远超行业均值(通常<10%)"
            self._add_problem(
                description="退款率过高",
                severity="高",
                impact_dimension="服务健康",
                evidence=evidence
            )

    def diagnose_traffic_concentration(self, traffic_concentration):
        if traffic_concentration['top5_ratio'] > self.config.TOP5_TRAFFIC_CONCENTRATION_THRESHOLD:
            evidence = f"Top5商品占{traffic_concentration['top5_ratio']:.1f}%流量，Top10占{traffic_concentration['top10_ratio']:.1f}%流量"
            self._add_problem(
                description="流量过度集中",
                severity="中",
                impact_dimension="流量健康",
                evidence=evidence
            )

    def diagnose_ad_budget_shrink(self, ad_trend):
        if ad_trend['trend'] == 'decreasing' and ad_trend['change'] < -20:
            evidence = f"后半段日花费从{ad_trend['first_half_avg']:.0f}元降至{ad_trend['second_half_avg']:.0f}元 ({ad_trend['change']:.0f}%)"
            self._add_problem(
                description="推广预算缩减",
                severity="中",
                impact_dimension="财务健康",
                evidence=evidence
            )

    def diagnose_high_paid_dependency(self, cross_analysis):
        if cross_analysis.paid_gmv_ratio > 50:
            natural_ratio = 100 - cross_analysis.paid_gmv_ratio
            evidence = f"{cross_analysis.paid_gmv_ratio:.1f}%成交来自付费推广，自然流量仅占{natural_ratio:.1f}%"
            self._add_problem(
                description="付费依赖度过高",
                severity="中",
                impact_dimension="财务健康",
                evidence=evidence
            )

    def diagnose_zero_sale_products(self, traffic_concentration):
        zero_ratio = traffic_concentration['zero_sale_ratio']
        if zero_ratio > self.config.ZERO_SALE_RATIO_THRESHOLD:
            evidence = f"{traffic_concentration['total_products']}个商品中{traffic_concentration['zero_sale_count']}个无成交 ({zero_ratio:.1f}%)"
            self._add_problem(
                description="超半数商品零成交",
                severity="中",
                impact_dimension="商品运营",
                evidence=evidence
            )

    def diagnose_low_repeat_customer(self, cross_analysis):
        if cross_analysis.old_customer_ratio < 30:
            evidence = f"老客成交仅占{cross_analysis.old_customer_ratio:.1f}%，拉新成本持续走高"
            self._add_problem(
                description="老客回购率低",
                severity="中",
                impact_dimension="客户运营",
                evidence=evidence
            )

    def diagnose_low_roas(self, cross_analysis):
        if cross_analysis.avg_roas < self.config.ROAS_TARGET:
            evidence = f"平均推广ROI仅{cross_analysis.avg_roas:.2f}，未达标({self.config.ROAS_TARGET})"
            self._add_problem(
                description="推广ROI未达标",
                severity="中",
                impact_dimension="财务健康",
                evidence=evidence
            )

    def diagnose_all(self, core_metrics, cross_analysis, traffic_concentration, ad_trend):
        self.problems = []
        self.problem_id_counter = 1

        self.diagnose_traffic_crash(core_metrics)
        self.diagnose_high_refund_rate(core_metrics)
        self.diagnose_traffic_concentration(traffic_concentration)
        self.diagnose_ad_budget_shrink(ad_trend)
        self.diagnose_high_paid_dependency(cross_analysis)
        self.diagnose_zero_sale_products(traffic_concentration)
        self.diagnose_low_repeat_customer(cross_analysis)
        self.diagnose_low_roas(cross_analysis)

        self.problems.sort(key=lambda p: {'高': 0, '中': 1, '低': 2}.get(p.severity, 3))
        return self.problems

    def _add_problem(self, description, severity, impact_dimension, evidence):
        self.problems.append(DiagnosedProblem(
            id=self.problem_id_counter,
            description=description,
            severity=severity,
            impact_dimension=impact_dimension,
            evidence=evidence
        ))
        self.problem_id_counter += 1