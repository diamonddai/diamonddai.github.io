'''
Description: your project
Author: Jerry_Liweeeee
Date: 2024-08-13 16:51:39
'''
import json
import os
import numpy as np
import pandas as pd

def calculate_cluster_metrics(user_features, user_labels, labels):
    """
    计算类内散度、类间距离以及每个类别的用户数量。

    参数:
    user_features (list): 用户特征向量列表。
    user_labels (list): 用户所属群体标签列表。
    labels (list): 预定义的类别标签列表。

    返回:
    tuple: 包含类内散度列表、类间距离列表和每个类别用户数量的元组。
    """

    # 计算簇的质心
    def calculate_centroid(features):
        return np.mean(features, axis=0)

    # 计算类内散度、类间距离和用户数量
    intra_distances = []
    inter_distances = []
    sizes = []

    centroids = {}

    for label in labels:
        cluster_features = user_features[user_labels == label]
        centroid = calculate_centroid(cluster_features)
        centroids[label] = centroid
        intra_distance = np.mean([np.linalg.norm(f - centroid) for f in cluster_features])
        intra_distances.append(intra_distance)
        sizes.append(len(cluster_features))

    for i, label_i in enumerate(labels):
        inter_distance_sum = 0
        count = 0
        for j, label_j in enumerate(labels):
            if i != j:
                inter_distance = np.linalg.norm(centroids[label_i] - centroids[label_j])
                inter_distance_sum += inter_distance
                count += 1
        inter_distances.append(inter_distance_sum / count)

    return intra_distances, inter_distances, sizes

# 读取文件数据(这个之后要写到view3的代码里)⭕
# 之后一些本地的数据如tweets_interests_top18.json想一下如何读取？已解决✅
# 现在的操作：predict还是调用本地的路径，先试一试能否使用覆盖的文件。
# 之后predict文件路径要改成服务器的位置；并使用fetch等来编写？
latent_file_path = os.path.join(os.path.dirname(__file__), '../../public/tweets_interests.json')
cluster_file_path = os.path.join(os.path.dirname(__file__), '../../../back-end/Server/static/predict.json')

with open(latent_file_path, 'r') as f1, open(cluster_file_path, 'r') as f2:
    user_data = json.load(f1)
    predict_data = json.load(f2)

# 提取用户的特征向量和对应的群体标签
user_features = []
user_labels = []

for user in user_data:
    user_id = user['user_id']
    if user_id in predict_data:
        user_features.append(user['user_latent_feature'])
        user_labels.append(predict_data[user_id]['user_interest'])

user_features = np.array(user_features)
user_labels = np.array(user_labels)

# 示例标签（假设与之前一样）
labels = [
    "arts and fashion", "books and literature", "business finance and entrepreneurs",
    "celebrity and pop culture", "crisis (war and disaster)", "family and parenting",
    "film tv and video", "fitness and health", "food and dining", "games",
    "law government and politics", "learning and educational", "music",
    "news and social concern", "pets", "science and technology",
    "sports", "travel and adventure"
]

# 调用函数并传入数据和标签
intra_distances, inter_distances, sizes = calculate_cluster_metrics(user_features, user_labels, labels)

# 打印结果
print("类内散度: ", intra_distances)
print("类间距离: ", inter_distances)
print("用户数量: ", sizes)

# 可选：将类间距离转换为DataFrame并展示
df_inter_distances = pd.DataFrame({
    "Cluster": labels,
    "InterDistance": inter_distances,
    "Size": sizes
})

import ace_tools as tools; tools.display_dataframe_to_user(name="Cluster Metrics", dataframe=df_inter_distances)
