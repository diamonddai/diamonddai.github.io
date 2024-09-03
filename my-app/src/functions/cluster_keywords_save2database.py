'''
Description: your project
Author: Jerry_Liweeeee
Date: 2024-08-07 15:18:17
'''
import mysql.connector
from cluster_keywords_collect_packaging_database import calculate_top_n_keywords
from cluster_keywords_collect_packaging_database import get_user_division_from_db
from cluster_keywords_collect_packaging_database import get_user_texts_keywords

def store_results_to_db(df, db_config):
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    
    # 创建表格（如果不存在）
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS top_keywords (
        interest_index INT,
        keyword1 VARCHAR(255),
        keyword2 VARCHAR(255),
        keyword3 VARCHAR(255),
        keyword4 VARCHAR(255),
        keyword5 VARCHAR(255)
    )
    """)

    # 清空表格
    cursor.execute("DELETE FROM top_keywords")

    # 插入数据
    for index, row in df.iterrows():
        cursor.execute("""
        INSERT INTO top_keywords (interest_index, keyword1, keyword2, keyword3, keyword4, keyword5)
        VALUES (%s, %s, %s, %s, %s, %s)
        """, (index, row[0], row[1], row[2], row[3], row[4]))

    conn.commit()
    cursor.close()
    conn.close()
# 数据库配置
db_config = {
    'user': 'yourusername',
    'password': 'yourpassword',
    'host': '127.0.0.1',
    'database': 'yourdatabase'
}

# 获取数据
user_division = get_user_division_from_db(db_config)
user_texts_keywords = get_user_texts_keywords('/path/to/your/user_texts_keywords.json')

# 计算前n个关键词
top_n_keywords_df = calculate_top_n_keywords(user_division, user_texts_keywords, n=5)

# 打印结果
print(top_n_keywords_df)

# 将结果存储到数据库
store_results_to_db(top_n_keywords_df, db_config)
