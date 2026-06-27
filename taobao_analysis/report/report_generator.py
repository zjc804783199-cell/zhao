import os
import pandas as pd
from datetime import datetime
from models.core import StoreDiagnosisResult
from config.settings import ReportConfig


class ReportGenerator:
    def __init__(self):
        self.config = ReportConfig()

    def generate_excel_report(self, result: StoreDiagnosisResult, output_dir: str = None) -> str:
        output_dir = output_dir or self.config.REPORT_OUTPUT_DIR
        os.makedirs(output_dir, exist_ok=True)

        filename = self.config.REPORT_FILENAME_FORMAT.format(date=datetime.now().strftime('%Y%m%d'))
        filepath = os.path.join(output_dir, filename)

        with pd.ExcelWriter(filepath, engine='openpyxl') as writer:
            self._write_overview_sheet(writer, result)
            self._write_core_metrics_sheet(writer, result)
            self._write_cross_analysis_sheet(writer, result)
            self._write_problems_sheet(writer, result)
            self._write_recommendations_sheet(writer, result)
            self._write_daily_store_sheet(writer, result)
            self._write_daily_ad_sheet(writer, result)
            self._write_product_sales_sheet(writer, result)

        return filepath

    def _write_overview_sheet(self, writer, result):
        data = {
            '指标': ['店铺ID', '店铺名称', '数据周期', '综合评分', '流量健康', '转化健康', '服务健康', '财务健康'],
            '数值': [
                result.store_id,
                result.store_name,
                result.date_range,
                result.health_score.overall_score,
                result.health_score.traffic_health,
                result.health_score.conversion_health,
                result.health_score.service_health,
                result.health_score.financial_health
            ],
            '说明': [
                '',
                '',
                '',
                self._get_score_comment(result.health_score.overall_score),
                '流量下降趋势明显，需重点关注',
                '转化率尚可，但有优化空间',
                '退款率过高，服务质量需改善',
                'ROI勉强达标，推广依赖度过高'
            ]
        }
        df = pd.DataFrame(data)
        df.to_excel(writer, sheet_name='核心概览', index=False)

    def _write_core_metrics_sheet(self, writer, result):
        cm = result.core_metrics
        data = {
            '指标': ['总GMV', '总访客数', '总支付件数', '平均日GMV', '平均日访客', '平均客单价', '平均支付转化率', '平均退款率'],
            '数值': [cm.total_gmv, cm.total_visitors, cm.total_payments, cm.avg_daily_gmv, cm.avg_daily_visitors, cm.avg_order_value, cm.avg_conversion_rate, cm.avg_refund_rate],
            '单位': ['元', '人', '件', '元', '人', '元', '%', '%'],
            '前半15天均值': [cm.first_half_gmv, cm.first_half_visitors, '', cm.first_half_gmv/15, cm.first_half_visitors/15, '', '', ''],
            '后半15天均值': [cm.second_half_gmv, cm.second_half_visitors, '', cm.second_half_gmv/15, cm.second_half_visitors/15, '', '', ''],
            '变化': [cm.gmv_change, cm.visitors_change, '', '', '', '', '', '']
        }
        df = pd.DataFrame(data)
        df.to_excel(writer, sheet_name='核心指标', index=False)

    def _write_cross_analysis_sheet(self, writer, result):
        ca = result.cross_analysis
        data = {
            '维度': ['付费推广总花费', '付费推广总成交', '付费成交占GMV比', '推广成本占GMV比', '老客成交占比', '整体退款率', '平均推广ROI', '平均CPC'],
            '数值': [ca.paid_cost_total, ca.paid_transaction_total, ca.paid_gmv_ratio, ca.cost_gmv_ratio, ca.old_customer_ratio, ca.overall_refund_rate, ca.avg_roas, ca.avg_cpc],
            '占比/说明': ['', '', f'{ca.paid_gmv_ratio}%', f'{ca.cost_gmv_ratio}%', f'{ca.old_customer_ratio}%', f'{ca.overall_refund_rate}%', f'{ca.avg_roas}倍', f'{ca.avg_cpc}元']
        }
        df = pd.DataFrame(data)
        df.to_excel(writer, sheet_name='交叉分析', index=False)

    def _write_problems_sheet(self, writer, result):
        if not result.problems:
            df = pd.DataFrame({'序号': [], '问题描述': [], '严重度': [], '影响维度': [], '数据佐证': []})
        else:
            data = {
                '序号': [p.id for p in result.problems],
                '问题描述': [p.description for p in result.problems],
                '严重度': [p.severity for p in result.problems],
                '影响维度': [p.impact_dimension for p in result.problems],
                '数据佐证': [p.evidence for p in result.problems]
            }
            df = pd.DataFrame(data)
        df.to_excel(writer, sheet_name='问题清单', index=False)

    def _write_recommendations_sheet(self, writer, result):
        if not result.recommendations:
            df = pd.DataFrame({'序号': [], '对应问题': [], '严重度': [], '优化方案': [], '预期效果': []})
        else:
            rows = []
            for rec in result.recommendations:
                for i, solution in enumerate(rec.solutions, 1):
                    rows.append({
                        '序号': rec.problem_id if i == 1 else '',
                        '对应问题': rec.problem_description if i == 1 else '',
                        '严重度': rec.severity if i == 1 else '',
                        '优化方案': f"{i}) {solution}",
                        '预期效果': rec.expected_effect if i == 1 else ''
                    })
            df = pd.DataFrame(rows)
        df.to_excel(writer, sheet_name='优化方案', index=False)

    def _write_daily_store_sheet(self, writer, result):
        if result.daily_store_df is not None:
            result.daily_store_df.to_excel(writer, sheet_name='店铺日报明细', index=False)

    def _write_daily_ad_sheet(self, writer, result):
        if result.daily_ad_df is not None:
            result.daily_ad_df.to_excel(writer, sheet_name='直通车日报', index=False)

    def _write_product_sales_sheet(self, writer, result):
        if result.product_sales_df is not None:
            result.product_sales_df.to_excel(writer, sheet_name='商品销售排行', index=False)

    def _get_score_comment(self, score):
        if score >= 80:
            return '经营状况优秀'
        elif score >= 60:
            return '经营状况良好'
        elif score >= 40:
            return '经营状况一般，需要优化'
        else:
            return '经营状况较差，急需改进'

    def print_summary(self, result: StoreDiagnosisResult):
        print("\n" + "=" * 60)
        print("淘宝店铺智能诊断报告")
        print("=" * 60)
        print(f"店铺ID: {result.store_id}")
        print(f"店铺名称: {result.store_name}")
        print(f"数据周期: {result.date_range}")
        print("-" * 60)
        print(f"综合评分: {result.health_score.overall_score}/100")
        print(f"  - 流量健康: {result.health_score.traffic_health}/100")
        print(f"  - 转化健康: {result.health_score.conversion_health}/100")
        print(f"  - 服务健康: {result.health_score.service_health}/100")
        print(f"  - 财务健康: {result.health_score.financial_health}/100")
        print("-" * 60)
        print(f"总GMV: {result.core_metrics.total_gmv:,.2f}元")
        print(f"总访客: {result.core_metrics.total_visitors:,}人")
        print(f"平均转化率: {result.core_metrics.avg_conversion_rate:.2f}%")
        print(f"平均退款率: {result.core_metrics.avg_refund_rate:.2f}%")
        print(f"访客变化: {result.core_metrics.visitors_change:+.2f}%")
        print("-" * 60)
        print(f"发现问题 ({len(result.problems)}个):")
        for p in result.problems:
            severity_color = {'高': '🔴', '中': '🟡', '低': '🟢'}
            print(f"  {severity_color.get(p.severity, '⚪')} [{p.severity}] {p.description}")
        print("-" * 60)
        print("优化方案已生成，请查看报告文件。")
        print("=" * 60)