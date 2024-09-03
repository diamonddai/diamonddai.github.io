import React, { useEffect, useState } from 'react';
import { Tooltip } from 'antd';
import './CategoryBarChart.css';

// 定义标签颜色
const labelColors = {
  "arts and fashion": "#DB9487",
  "books and literature": "#E4B789",
  "business finance and entrepreneurs": "#DCCE88",
  "celebrity and pop culture": "#D0DB88",
  "crisis (war and disaster)": "#B2D688",
  "family and parenting": "#98CC85",
  "film tv and video": "#8DC990",
  "fitness and health": "#8DCCAA",
  "food and dining": "#8DCEC5",
  "games": "#88CED9",
  "law government and politics": "#87B2D9",
  "learning and educational": "#8695CB",
  "music": "#8F86BF",
  "news and social concern": "#A687BD",
  "pets": "#BA89BB",
  "science and technology": "#CA89B9",
  "sports": "#D785B0",
  "travel and adventure": "#D98595"
};

const CategoryBarChart = ({ labels }) => {
  const [sortedCategoryCounts, setSortedCategoryCounts] = useState([]);

  useEffect(() => {
    // Calculate the category counts
    const counts = {};
    Object.values(labels).forEach(label => {
      if (label?.label) {
        const category = label.label;
        counts[category] = (counts[category] || 0) + 1;
      }
    });

    // Sort categories by count in descending order
    const sortedCounts = Object.entries(counts).sort(([, a], [, b]) => b - a);
    setSortedCategoryCounts(sortedCounts);
  }, [labels]);

  const total = sortedCategoryCounts.reduce((sum, [, count]) => sum + count, 0);

  return (
    <div className="category-bar-chart">
      {sortedCategoryCounts.map(([category, count]) => (
        <Tooltip
          key={category}
          title={`${category}: ${count}`}
          placement="top"
          overlayInnerStyle={{
            fontSize: '10px',
            color: '#fff',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '4px',
            opacity: 0.8,
          }}
        >
          <div
            className="category-bar-segment"
            style={{
              width: `${(count / total) * 100}%`,
              backgroundColor: labelColors[category],
            }}
          />
        </Tooltip>
      ))}
    </div>
  );
};

export default CategoryBarChart;
