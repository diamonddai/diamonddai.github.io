"""
该代码用于计算每个类别下的类内散度和类间距离。
类内散度是簇内所有点到簇中心（质心）的平均距离。
类间距离是每个簇与其他簇之间的距离的平均值。

数据文件应包含用户ID、用户特征向量和用户所属群体标签（user_id、user_latent_feature和user_interest）。
输出结果包括每个类别的类内散度（intra_distances）和每个类别与其他类别之间的类间距离（inter_distances）。
"""

import json
import numpy as np
import pandas as pd
import mysql.connector

def get_user_division_from_db(db_config):
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("SELECT user_id, user_latent_feature, user_interest FROM user_division")
    user_division = cursor.fetchall()
    
    cursor.close()
    conn.close()
    return user_division

def calculate_cluster_distances(data, labels):
    """
    计算类内散度和类间距离。

    参数:
    data (list): 包含用户ID、用户特征向量和用户所属群体标签的字典列表。
    labels (list): 预定义的类别标签列表。

    返回:
    tuple: 包含类内散度列表和类间距离列表的元组。
    """
    
    # 提取用户特征向量和对应的标签
    user_features = []
    user_labels = []

    for entry in data:
        user_features.append(entry['user_latent_feature'])
        user_labels.append(entry['user_interest'])

    user_features = np.array(user_features)
    user_labels = np.array(user_labels)

    # 计算簇的质心
    def calculate_centroid(features):
        return np.mean(features, axis=0)

    # 计算类内散度和类间距离
    intra_distances = []
    inter_distances = []

    centroids = {}

    for label in labels:
        cluster_features = user_features[user_labels == label]
        centroid = calculate_centroid(cluster_features)
        centroids[label] = centroid
        intra_distance = np.mean([np.linalg.norm(f - centroid) for f in cluster_features])
        intra_distances.append(intra_distance)

    for i, label_i in enumerate(labels):
        inter_distance_sum = 0
        count = 0
        for j, label_j in enumerate(labels):
            if i != j:
                inter_distance = np.linalg.norm(centroids[label_i] - centroids[label_j])
                inter_distance_sum += inter_distance
                count += 1
        inter_distances.append(inter_distance_sum / count)

    return intra_distances, inter_distances

# 数据库配置
db_config = {
    'user': 'yourusername',
    'password': 'yourpassword',
    'host': '127.0.0.1',
    'database': 'yourdatabase'
}

# 获取数据
user_division = get_user_division_from_db(db_config)

# 示例标签
labels = [
    "arts and fashion", "books and literature", "business finance and entrepreneurs",
    "celebrity and pop culture", "crisis (war and disaster)", "family and parenting",
    "film tv and video", "fitness and health", "food and dining", "games",
    "law government and politics", "learning and educational", "music",
    "news and social concern", "pets", "science and technology",
    "sports", "travel and adventure"
]

# 计算类内和类间距离
intra_distances, inter_distances = calculate_cluster_distances(user_division, labels)

# 打印结果
print("类内散度: ", intra_distances)
print("类间距离: ", inter_distances)

# 可选：将类间距离转换为DataFrame并展示
df_inter_distances = pd.DataFrame({
    "Cluster": labels,
    "InterDistance": inter_distances
})

import ace_tools as tools; tools.display_dataframe_to_user(name="Cluster Distances", dataframe=df_inter_distances)
