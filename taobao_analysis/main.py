import os
import sys
from models.core import StoreDiagnosisResult
from importers.data_importer import DataImporter
from analyzers.metrics_analyzer import MetricsAnalyzer
from analyzers.health_analyzer import HealthAnalyzer
from diagnostics.problem_diagnoser import ProblemDiagnoser
from recommendations.optimizer import Optimizer
from report.report_generator import ReportGenerator


def run_analysis(store_file: str, ad_file: str, product_file: str,
                 store_id: str = "", store_name: str = "") -> StoreDiagnosisResult:
    importer = DataImporter()
    metrics_analyzer = MetricsAnalyzer()
    health_analyzer = HealthAnalyzer()
    problem_diagnoser = ProblemDiagnoser()
    optimizer = Optimizer()
    report_generator = ReportGenerator()

    store_df, ad_df, product_df = importer.import_all_data(store_file, ad_file, product_file)

    if store_df is None:
        print(f"错误：无法读取店铺数据文件 {store_file}")
        return StoreDiagnosisResult()

    core_metrics = metrics_analyzer.calculate_core_metrics(store_df)
    cross_analysis = metrics_analyzer.calculate_cross_analysis(store_df, ad_df)
    traffic_concentration = metrics_analyzer.analyze_traffic_concentration(product_df)
    ad_trend = metrics_analyzer.analyze_ad_spend_trend(ad_df)

    health_score = health_analyzer.analyze_health(core_metrics, cross_analysis, traffic_concentration, ad_trend)
    problems = problem_diagnoser.diagnose_all(core_metrics, cross_analysis, traffic_concentration, ad_trend)
    recommendations = optimizer.generate_recommendations(problems)

    if not store_df.empty:
        date_range = f"{store_df['日期'].min()} 至 {store_df['日期'].max()}"
    else:
        date_range = ""

    result = StoreDiagnosisResult(
        store_id=store_id,
        store_name=store_name,
        date_range=date_range,
        core_metrics=core_metrics,
        cross_analysis=cross_analysis,
        health_score=health_score,
        problems=problems,
        recommendations=recommendations,
        daily_store_df=store_df,
        daily_ad_df=ad_df,
        product_sales_df=product_df
    )

    report_path = report_generator.generate_excel_report(result)
    report_generator.print_summary(result)
    print(f"\n报告已保存至: {report_path}")

    return result


def run():
    if len(sys.argv) < 4:
        print("用法: python main.py <店铺数据文件> <直通车数据文件> <商品销售数据文件> [店铺ID] [店铺名称]")
        print("\n示例:")
        print("  python main.py data/店铺经营.csv data/直通车.csv data/商品销售.csv")
        print("  python main.py data/店铺经营.xlsx data/直通车.xlsx data/商品销售.xlsx 2211823526168 '儿童地板袜'")
        sys.exit(1)

    store_file = sys.argv[1]
    ad_file = sys.argv[2]
    product_file = sys.argv[3]
    store_id = sys.argv[4] if len(sys.argv) > 4 else ""
    store_name = sys.argv[5] if len(sys.argv) > 5 else ""

    run_analysis(store_file, ad_file, product_file, store_id, store_name)


if __name__ == "__main__":
    run()