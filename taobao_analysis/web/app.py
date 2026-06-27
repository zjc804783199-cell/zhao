import sys
import os
import json
import tempfile
import uuid
import pandas as pd
from flask import Flask, render_template, request, redirect, url_for, session, send_file, abort

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from importers.data_importer import DataImporter
from analyzers.metrics_analyzer import MetricsAnalyzer
from analyzers.health_analyzer import HealthAnalyzer
from diagnostics.problem_diagnoser import ProblemDiagnoser
from recommendations.optimizer import Optimizer
from report.report_generator import ReportGenerator

app = Flask(__name__, template_folder='templates', static_folder='static')
app.secret_key = 'taobao_analysis_secret_key'
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'temp')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@app.route('/')
def index():
    return render_template('upload.html')


@app.route('/analyze', methods=['POST'])
def analyze():
    store_file = request.files.get('store_file')
    ad_file = request.files.get('ad_file')
    product_file = request.files.get('product_file')
    store_id = request.form.get('store_id', '')
    store_name = request.form.get('store_name', '')

    if not store_file or not ad_file or not product_file:
        return render_template('upload.html', error='请上传所有三个数据文件')

    try:
        store_df = _read_uploaded_file(store_file)
        ad_df = _read_uploaded_file(ad_file)
        product_df = _read_uploaded_file(product_file)
    except Exception as e:
        return render_template('upload.html', error=f'文件读取失败: {str(e)}')

    if store_df is None:
        return render_template('upload.html', error='店铺数据文件格式不正确')

    result = _run_analysis(store_df, ad_df, product_df, store_id, store_name)

    result_id = str(uuid.uuid4())
    result_file = os.path.join(UPLOAD_FOLDER, f'{result_id}.json')
    with open(result_file, 'w', encoding='utf-8') as f:
        json.dump(_result_to_dict(result), f, ensure_ascii=False)

    session['result_id'] = result_id

    return redirect(url_for('report'))


@app.route('/report')
def report():
    result_id = session.get('result_id')
    if not result_id:
        return redirect(url_for('index'))
    
    result_file = os.path.join(UPLOAD_FOLDER, f'{result_id}.json')
    if not os.path.exists(result_file):
        return redirect(url_for('index'))
    
    with open(result_file, 'r', encoding='utf-8') as f:
        result_dict = json.load(f)
    
    return render_template('report.html', result=result_dict)


@app.route('/download')
def download():
    result_id = session.get('result_id')
    if not result_id:
        return redirect(url_for('index'))
    
    result_file = os.path.join(UPLOAD_FOLDER, f'{result_id}.json')
    if not os.path.exists(result_file):
        return redirect(url_for('index'))
    
    with open(result_file, 'r', encoding='utf-8') as f:
        result_dict = json.load(f)

    result = _dict_to_result(result_dict)

    with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as tmp:
        tmp_path = tmp.name

    generator = ReportGenerator()
    filepath = generator.generate_excel_report(result, output_dir=os.path.dirname(tmp_path))

    return send_file(filepath, as_attachment=True, download_name='店铺诊断报告.xlsx')


def _read_uploaded_file(file_storage):
    filename = file_storage.filename
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(filename)[1]) as tmp:
        file_storage.save(tmp.name)
        tmp_path = tmp.name

    try:
        if filename.endswith('.csv'):
            df = pd.read_csv(tmp_path, encoding='utf-8-sig')
        elif filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(tmp_path)
        else:
            os.unlink(tmp_path)
            raise ValueError('不支持的文件格式')

        os.unlink(tmp_path)
        return df
    except Exception as e:
        os.unlink(tmp_path)
        raise e


def _run_analysis(store_df, ad_df, product_df, store_id, store_name):
    metrics_analyzer = MetricsAnalyzer()
    health_analyzer = HealthAnalyzer()
    problem_diagnoser = ProblemDiagnoser()
    optimizer = Optimizer()

    store_df['日期'] = pd.to_datetime(store_df['日期']).dt.strftime('%Y-%m-%d')

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

    from models.core import StoreDiagnosisResult
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

    return result


def _result_to_dict(result):
    import numpy as np

    def convert_numpy(obj):
        if isinstance(obj, (np.integer,)):
            return int(obj)
        elif isinstance(obj, (np.floating,)):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        return obj

    def dataclass_to_dict(obj):
        if obj is None:
            return None
        if hasattr(obj, '__dataclass_fields__'):
            result = {}
            for f in obj.__dataclass_fields__.keys():
                result[f] = dataclass_to_dict(getattr(obj, f))
            return result
        if isinstance(obj, list):
            return [dataclass_to_dict(item) for item in obj]
        return convert_numpy(obj)

    def df_to_records(df):
        if df is None:
            return []
        records = df.to_dict('records')
        converted = []
        for record in records:
            new_record = {}
            for k, v in record.items():
                if isinstance(v, (np.integer,)):
                    new_record[k] = int(v)
                elif isinstance(v, (np.floating,)):
                    new_record[k] = float(v)
                else:
                    new_record[k] = v
            converted.append(new_record)
        return converted

    result_dict = {
        'store_id': result.store_id,
        'store_name': result.store_name,
        'date_range': result.date_range,
        'core_metrics': dataclass_to_dict(result.core_metrics),
        'cross_analysis': dataclass_to_dict(result.cross_analysis),
        'health_score': dataclass_to_dict(result.health_score),
        'problems': [dataclass_to_dict(p) for p in result.problems],
        'recommendations': [dataclass_to_dict(r) for r in result.recommendations],
        'daily_store': df_to_records(result.daily_store_df),
        'daily_ad': df_to_records(result.daily_ad_df),
        'product_sales': df_to_records(result.product_sales_df)
    }
    return result_dict


def _dict_to_result(result_dict):
    from models.core import StoreDiagnosisResult, CoreMetrics, CrossAnalysis, HealthScore, DiagnosedProblem, OptimizationRecommendation
    import pandas as pd

    result = StoreDiagnosisResult(
        store_id=result_dict['store_id'],
        store_name=result_dict['store_name'],
        date_range=result_dict['date_range'],
        core_metrics=CoreMetrics(**result_dict['core_metrics']),
        cross_analysis=CrossAnalysis(**result_dict['cross_analysis']),
        health_score=HealthScore(**result_dict['health_score']),
        problems=[DiagnosedProblem(**p) for p in result_dict['problems']],
        recommendations=[OptimizationRecommendation(**r) for r in result_dict['recommendations']],
        daily_store_df=pd.DataFrame(result_dict['daily_store']) if result_dict['daily_store'] else None,
        daily_ad_df=pd.DataFrame(result_dict['daily_ad']) if result_dict['daily_ad'] else None,
        product_sales_df=pd.DataFrame(result_dict['product_sales']) if result_dict['product_sales'] else None
    )
    return result


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)