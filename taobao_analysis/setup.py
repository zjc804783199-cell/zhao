from setuptools import setup, find_packages

setup(
    name='taobao_analysis',
    version='1.0.0',
    packages=find_packages(),
    install_requires=[
        'pandas>=2.0.0',
        'numpy>=1.24.0',
        'openpyxl>=3.1.0',
        'xlrd>=2.0.1',
        'matplotlib>=3.7.0',
        'seaborn>=0.12.0',
        'flask>=2.0.0',
    ],
    entry_points={
        'console_scripts': [
            'taobao-analysis=main:run',
        ],
    },
    author='',
    description='淘宝店铺数据分析系统',
    python_requires='>=3.8',
)