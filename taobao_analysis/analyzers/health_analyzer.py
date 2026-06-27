import pandas as pd
from models.core import HealthScore
from config.settings import DiagnosticsConfig


class HealthAnalyzer:
    def __init__(self):
        self.config = DiagnosticsConfig()

    def calculate_traffic_health(self, core_metrics, traffic_concentration) -> int:
        score = 100
        factors = []

        if core_metrics.visitors_change < self.config.TRAFFIC_CRASH_THRESHOLD:
            score -= 30
            factors.append(f"流量下降{abs(core_metrics.visitors_change)}%")

        if traffic_concentration['top5_ratio'] > self.config.TOP5_TRAFFIC_CONCENTRATION_THRESHOLD:
            score -= 20
            factors.append(f"Top5流量占比{traffic_concentration['top5_ratio']}%")

        if traffic_concentration['zero_sale_ratio'] > self.config.ZERO_SALE_RATIO_THRESHOLD:
            score -= 15
            factors.append(f"零成交商品{traffic_concentration['zero_sale_ratio']}%")

        return max(0, min(100, score))

    def calculate_conversion_health(self, core_metrics, cross_analysis) -> int:
        score = 100
        factors = []

        if core_metrics.avg_conversion_rate < self.config.CONVERSION_RATE_TARGET:
            gap = self.config.CONVERSION_RATE_TARGET - core_metrics.avg_conversion_rate
            score -= int(gap * 3)
            factors.append(f"转化率{core_metrics.avg_conversion_rate}%")

        if cross_analysis.old_customer_ratio < self.config.REPEAT_CUSTOMER_RATIO_TARGET:
            gap = self.config.REPEAT_CUSTOMER_RATIO_TARGET - cross_analysis.old_customer_ratio
            score -= int(gap * 1.5)
            factors.append(f"老客占比{cross_analysis.old_customer_ratio}%")

        return max(0, min(100, score))

    def calculate_service_health(self, core_metrics) -> int:
        score = 100

        if core_metrics.avg_refund_rate > self.config.REFUND_RATE_CRITICAL:
            score -= 40
        elif core_metrics.avg_refund_rate > self.config.REFUND_RATE_WARNING:
            score -= 20

        return max(0, min(100, score))

    def calculate_financial_health(self, cross_analysis, ad_trend) -> int:
        score = 100

        if cross_analysis.avg_roas < self.config.ROAS_TARGET:
            gap = self.config.ROAS_TARGET - cross_analysis.avg_roas
            score -= int(gap * 20)

        if cross_analysis.paid_gmv_ratio > self.config.NATURAL_TRAFFIC_RATIO_THRESHOLD:
            score -= 20

        if ad_trend['trend'] == 'decreasing' and ad_trend['change'] < -20:
            score -= 15

        return max(0, min(100, score))

    def calculate_overall_health(self, traffic: int, conversion: int, service: int, financial: int) -> int:
        overall = (
            traffic * self.config.TRAFFIC_HEALTH_WEIGHT +
            conversion * self.config.CONVERSION_HEALTH_WEIGHT +
            service * self.config.SERVICE_HEALTH_WEIGHT +
            financial * self.config.FINANCIAL_HEALTH_WEIGHT
        )
        return int(round(overall))

    def analyze_health(self, core_metrics, cross_analysis, traffic_concentration, ad_trend) -> HealthScore:
        traffic_health = self.calculate_traffic_health(core_metrics, traffic_concentration)
        conversion_health = self.calculate_conversion_health(core_metrics, cross_analysis)
        service_health = self.calculate_service_health(core_metrics)
        financial_health = self.calculate_financial_health(cross_analysis, ad_trend)
        overall_score = self.calculate_overall_health(traffic_health, conversion_health, service_health, financial_health)

        return HealthScore(
            traffic_health=traffic_health,
            conversion_health=conversion_health,
            service_health=service_health,
            financial_health=financial_health,
            overall_score=overall_score
        )