import pandas as pd
import os
from typing import Optional, Tuple


class DataImporter:
    def __init__(self, data_dir: str = None):
        self.data_dir = data_dir or 'data'

    def import_daily_store_data(self, filename: str) -> Optional[pd.DataFrame]:
        file_path = self._resolve_path(filename)
        if not file_path:
            return None

        df = self._read_file(file_path)
        if df is None:
            return None

        required_columns = [
            '日期', '访客数', '加购人数', '收藏次数', '支付金额',
            '老买家支付金额', '支付件数', '支付转化率', '退款金额',
            '客单价', '加购率', '退款率', '老客占比'
        ]

        if not all(col in df.columns for col in required_columns):
            print(f"店铺经营数据文件缺少必要列，需要: {required_columns}")
            return None

        df['日期'] = pd.to_datetime(df['日期']).dt.strftime('%Y-%m-%d')
        return df

    def import_daily_ad_data(self, filename: str) -> Optional[pd.DataFrame]:
        file_path = self._resolve_path(filename)
        if not file_path:
            return None

        df = self._read_file(file_path)
        if df is None:
            return None

        required_columns = [
            '日期', '展现量', '点击量', '花费', '点击率',
            '平均点击花费', '总成交金额', '点击转化率', '投入产出比',
            '总购物车数', '加购率'
        ]

        if not all(col in df.columns for col in required_columns):
            print(f"直通车数据文件缺少必要列，需要: {required_columns}")
            return None

        df['日期'] = pd.to_datetime(df['日期']).dt.strftime('%Y-%m-%d')
        return df

    def import_product_sales_data(self, filename: str) -> Optional[pd.DataFrame]:
        file_path = self._resolve_path(filename)
        if not file_path:
            return None

        df = self._read_file(file_path)
        if df is None:
            return None

        required_columns = [
            '商品名称', '访客数', '浏览量', '转化率(%)', '支付买家数',
            '支付件数', '支付金额', '跳出率(%)', '停留时长(秒)',
            '搜索访客数', '访客价值'
        ]

        if not all(col in df.columns for col in required_columns):
            print(f"商品销售数据文件缺少必要列，需要: {required_columns}")
            return None

        return df

    def import_all_data(self, store_filename: str, ad_filename: str, product_filename: str) -> Tuple[Optional[pd.DataFrame], Optional[pd.DataFrame], Optional[pd.DataFrame]]:
        store_df = self.import_daily_store_data(store_filename)
        ad_df = self.import_daily_ad_data(ad_filename)
        product_df = self.import_product_sales_data(product_filename)
        return store_df, ad_df, product_df

    def _resolve_path(self, filename: str) -> Optional[str]:
        if os.path.exists(filename):
            return filename

        full_path = os.path.join(self.data_dir, filename)
        if os.path.exists(full_path):
            return full_path

        for ext in ['.csv', '.xlsx', '.xls']:
            alt_path = filename + ext
            if os.path.exists(alt_path):
                return alt_path
            alt_path = full_path + ext
            if os.path.exists(alt_path):
                return alt_path

        return None

    def _detect_file_format(self, file_path: str) -> str:
        with open(file_path, 'rb') as f:
            header = f.read(8)
        if header[:2] == b'PK':
            return 'xlsx'
        elif header[:4] == b'\xd0\xcf\x11\xe0':
            return 'xls'
        elif header[:5] in (b'<?xml', b'<html', b'<!DOC'):
            return 'html'
        else:
            try:
                with open(file_path, 'r', encoding='utf-8-sig') as f:
                    first_line = f.readline()
                    if ',' in first_line or '\t' in first_line:
                        return 'csv'
            except:
                pass
        return None

    def _read_file(self, file_path: str) -> Optional[pd.DataFrame]:
        try:
            real_format = self._detect_file_format(file_path)
            ext = os.path.splitext(file_path)[1].lower()

            if ext == '.csv' or real_format == 'csv':
                try:
                    return pd.read_csv(file_path, encoding='utf-8-sig')
                except UnicodeDecodeError:
                    return pd.read_csv(file_path, encoding='gbk')
            elif real_format == 'xlsx':
                return pd.read_excel(file_path, engine='openpyxl')
            elif real_format == 'xls':
                return pd.read_excel(file_path, engine='xlrd')
            elif real_format == 'html':
                dfs = pd.read_html(file_path)
                if dfs:
                    return dfs[0]
                print(f"HTML文件中未找到表格数据: {file_path}")
                return None
            else:
                if ext in ('.xlsx', '.xls'):
                    for engine in ['openpyxl', 'xlrd']:
                        try:
                            return pd.read_excel(file_path, engine=engine)
                        except:
                            continue
                    print(f"文件无法识别为有效的Excel格式: {file_path}")
                    return None
                else:
                    print(f"不支持的文件格式: {file_path}")
                    return None
        except ImportError as e:
            if 'xlrd' in str(e).lower():
                print(f"读取 .xls 文件需要 xlrd 库，请执行: pip install xlrd==2.0.1")
            elif 'openpyxl' in str(e).lower():
                print(f"读取 .xlsx 文件需要 openpyxl 库，请执行: pip install openpyxl")
            else:
                print(f"缺少依赖库: {e}")
            return None
        except Exception as e:
            print(f"读取文件失败 {file_path}: {e}")
            return None