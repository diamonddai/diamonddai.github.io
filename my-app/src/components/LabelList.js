import React from 'react';
import { Tag } from 'antd';
import './LabelList.css'; // 导入 CSS 文件

const LabelList = ({ currentUserId, onTagClick, labels, userIds }) => {
  // 从 labels 对象中获取所有用户 ID

  return (
    <div className="label-list-container">
      {userIds.map((userId) => (
        <Tag
          key={userId}
          color={labels[userId]?.label === null || labels[userId]?.label === undefined ? 'default' : 'green'} // 根据标签状态选择颜色
          onClick={() => onTagClick(userId)}
          style={{
            cursor: 'pointer',
            fontWeight: currentUserId === userId ? 'bold' : 'normal', // 选中用户标签加粗字体
            borderRadius: '20px',
            fontSize: '6.5px',
            lineHeight: '10px',
            color: labels[userId]?.label === null || labels[userId]?.label === undefined ? '#5C5C5C' : '#6FC200'
          }}
        >
          {userId}
        </Tag>
      ))}
    </div>
  );
};

export default LabelList;
