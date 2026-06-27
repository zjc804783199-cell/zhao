from dataclasses import dataclass, field
from typing import List, Optional
import pandas as pd


@dataclass
class DailyStoreData:
    date: str
    visitors: int
    add_cart_users: int
    favorites: int
    payment_amount: float
    old_customer_payment: float
    payment_items: int
    conversion_rate: float
    refund_amount: float
    avg_order_value: float
    add_cart_rate: float
    refund_rate: float
    old_customer_ratio: float


@dataclass
class DailyAdData:
    date: str
    impressions: int
    clicks: int
    cost: float
    ctr: float
    avg_click_cost: float
    total_transaction: float
    conversion_rate: float
    roas: float
    total_cart_count: int
    add_cart_rate: float


@dataclass
class ProductSalesData:
    product_name: str
    visitors: int
    page_views: int
    conversion_rate: float
    paying_customers: int
    payment_items: int
    payment_amount: float
    bounce_rate: float
    avg_stay_time: float
    search_visitors: int
    visitor_value: float


@dataclass
class CoreMetrics:
    total_gmv: float = 0
    total_visitors: int = 0
    total_payments: int = 0
    avg_daily_gmv: float = 0
    avg_daily_visitors: float = 0
    avg_order_value: float = 0
    avg_conversion_rate: float = 0
    avg_refund_rate: float = 0
    first_half_gmv: float = 0
    second_half_gmv: float = 0
    first_half_visitors: float = 0
    second_half_visitors: float = 0
    gmv_change: float = 0
    visitors_change: float = 0


@dataclass
class CrossAnalysis:
    paid_cost_total: float = 0
    paid_transaction_total: float = 0
    paid_gmv_ratio: float = 0
    cost_gmv_ratio: float = 0
    old_customer_ratio: float = 0
    overall_refund_rate: float = 0
    avg_roas: float = 0
    avg_cpc: float = 0


@dataclass
class HealthScore:
    traffic_health: int = 0
    conversion_health: int = 0
    service_health: int = 0
    financial_health: int = 0
    overall_score: int = 0


@dataclass
class DiagnosedProblem:
    id: int
    description: str
    severity: str
    impact_dimension: str
    evidence: str


@dataclass
class OptimizationRecommendation:
    problem_id: int
    problem_description: str
    severity: str
    solutions: List[str] = field(default_factory=list)
    expected_effect: str = ""


@dataclass
class StoreDiagnosisResult:
    store_id: str = ""
    store_name: str = ""
    date_range: str = ""
    core_metrics: CoreMetrics = field(default_factory=CoreMetrics)
    cross_analysis: CrossAnalysis = field(default_factory=CrossAnalysis)
    health_score: HealthScore = field(default_factory=HealthScore)
    problems: List[DiagnosedProblem] = field(default_factory=list)
    recommendations: List[OptimizationRecommendation] = field(default_factory=list)
    daily_store_df: Optional[pd.DataFrame] = None
    daily_ad_df: Optional[pd.DataFrame] = None
    product_sales_df: Optional[pd.DataFrame] = None