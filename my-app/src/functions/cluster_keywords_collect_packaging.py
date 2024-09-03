import json
from collections import defaultdict, Counter
import pandas as pd

def calculate_top_n_keywords(user_division, user_texts_keywords, n=5):
    # 创建从 user_id 到 interest_index 的映射
    user_interest_map = {user["user_id"]: user["user_interest_index"] for user in user_division}

    # 创建一个字典来保存每个兴趣索引的关键词和它们的计数
    interest_keywords_counts = defaultdict(Counter)

    # 使用 user_texts_keywords 填充字典
    for user_data in user_texts_keywords:
        user_id = user_data["user_id"]
        if user_id in user_interest_map:
            interest_index = user_interest_map[user_id]
            for keyword, count in zip(user_data["top_words"], user_data["top_words_counts"]):
                interest_keywords_counts[interest_index][keyword] += count

    # 创建一个列表来保存每个兴趣的前 n 个关键词
    top_n_keywords = []

    # 对每个兴趣索引，找到前 n 个关键词
    for interest_index in range(18):  # 假设有 18 个兴趣
        if interest_index in interest_keywords_counts:
            top_keywords = [keyword for keyword, _ in interest_keywords_counts[interest_index].most_common(n)]
        else:
            top_keywords = []
        top_n_keywords.append(top_keywords)

    # 转换为数据框
    top_n_keywords_df = pd.DataFrame(top_n_keywords, columns=[f'Top {i+1} Keyword' for i in range(n)])
    return top_n_keywords_df
