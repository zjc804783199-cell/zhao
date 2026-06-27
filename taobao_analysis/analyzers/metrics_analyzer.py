import pandas as pd
import numpy as np
from models.core import CoreMetrics, CrossAnalysis


def _clean_df(df: pd.DataFrame) -> pd.DataFrame:
    """清洗DataFrame列名"""
    if df is None:
        return None
    df = df.copy()
    df.columns = df.columns.astype(str)
    df.columns = df.columns.str.replace('\ufeff', '', regex=False)
    df.columns = df.columns.str.strip()
    return df


class MetricsAnalyzer:
    def calculate_core_metrics(self, store_df: pd.DataFrame) -> CoreMetrics:
        if store_df is None or store_df.empty:
            return CoreMetrics()

        store_df = _clean_df(store_df)

        total_gmv = store_df['支付金额'].sum()
        total_visitors = store_df['访客数'].sum()
        total_payments = store_df['支付件数'].sum()
        avg_daily_gmv = total_gmv / len(store_df)
        avg_daily_visitors = total_visitors / len(store_df)
        avg_order_value = store_df['客单价'].mean()
        avg_conversion_rate = store_df['支付转化率'].mean()
        avg_refund_rate = store_df['退款率'].mean()

        mid_idx = len(store_df) // 2
        first_half = store_df.iloc[:mid_idx]
        second_half = store_df.iloc[mid_idx:]

        first_half_gmv = first_half['支付金额'].sum()
        second_half_gmv = second_half['支付金额'].sum()
        first_half_visitors = first_half['访客数'].sum()
        second_half_visitors = second_half['访客数'].sum()

        gmv_change = ((second_half_gmv - first_half_gmv) / first_half_gmv * 100) if first_half_gmv > 0 else 0
        visitors_change = ((second_half_visitors - first_half_visitors) / first_half_visitors * 100) if first_half_visitors > 0 else 0

        return CoreMetrics(
            total_gmv=round(total_gmv, 2),
            total_visitors=int(total_visitors),
            total_payments=int(total_payments),
            avg_daily_gmv=round(avg_daily_gmv, 2),
            avg_daily_visitors=round(avg_daily_visitors, 2),
            avg_order_value=round(avg_order_value, 2),
            avg_conversion_rate=round(avg_conversion_rate, 2),
            avg_refund_rate=round(avg_refund_rate, 2),
            first_half_gmv=round(first_half_gmv, 2),
            second_half_gmv=round(second_half_gmv, 2),
            first_half_visitors=round(first_half_visitors, 2),
            second_half_visitors=round(second_half_visitors, 2),
            gmv_change=round(gmv_change, 2),
            visitors_change=round(visitors_change, 2)
        )

    def calculate_cross_analysis(self, store_df: pd.DataFrame, ad_df: pd.DataFrame) -> CrossAnalysis:
        result = CrossAnalysis()

        if ad_df is not None and not ad_df.empty:
            ad_df = _clean_df(ad_df)
            result.paid_cost_total = round(ad_df['花费'].sum(), 2)
            result.paid_transaction_total = round(ad_df['总成交金额'].sum(), 2)
            result.avg_roas = round(ad_df['投入产出比'].mean(), 2)
            result.avg_cpc = round(ad_df['平均点击花费'].mean(), 2)

        if store_df is not None and not store_df.empty:
            store_df = _clean_df(store_df)
            total_gmv = store_df['支付金额'].sum()
            if total_gmv > 0 and result.paid_transaction_total > 0:
                result.paid_gmv_ratio = round(result.paid_transaction_total / total_gmv * 100, 2)
                result.cost_gmv_ratio = round(result.paid_cost_total / total_gmv * 100, 2)
            result.old_customer_ratio = round(store_df['老客占比'].mean(), 2)
            result.overall_refund_rate = round(store_df['退款率'].mean(), 2)

        return result

    def analyze_traffic_concentration(self, product_df: pd.DataFrame) -> dict:
        if product_df is None or product_df.empty:
            return {'top5_ratio': 0, 'top10_ratio': 0, 'total_products': 0}

        product_df = _clean_df(product_df)

        sorted_products = product_df.sort_values('访客数', ascending=False)
        total_visitors = sorted_products['访客数'].sum()
        top5_visitors = sorted_products.head(5)['访客数'].sum()
        top10_visitors = sorted_products.head(10)['访客数'].sum()

        return {
            'top5_ratio': round(top5_visitors / total_visitors * 100, 2) if total_visitors > 0 else 0,
            'top10_ratio': round(top10_visitors / total_visitors * 100, 2) if total_visitors > 0 else 0,
            'total_products': len(product_df),
            'zero_sale_count': len(product_df[product_df['支付金额'] == 0]),
            'zero_sale_ratio': round(len(product_df[product_df['支付金额'] == 0]) / len(product_df) * 100, 2)
        }

    def analyze_ad_spend_trend(self, ad_df: pd.DataFrame) -> dict:
        if ad_df is None or ad_df.empty:
            return {'trend': 'stable', 'change': 0}

        ad_df = _clean_df(ad_df)

        mid_idx = len(ad_df) // 2
        first_half_cost = ad_df.iloc[:mid_idx]['花费'].mean()
        second_half_cost = ad_df.iloc[mid_idx:]['花费'].mean()

        change = ((second_half_cost - first_half_cost) / first_half_cost * 100) if first_half_cost > 0 else 0

        if change < -15:
            trend = 'decreasing'
        elif change > 15:
            trend = 'increasing'
        else:
            trend = 'stable'

        return {'trend': trend, 'change': round(change, 2), 'first_half_avg': round(first_half_cost, 2), 'second_half_avg': round(second_half_cost, 2)}