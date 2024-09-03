import React, { useState, useEffect } from 'react';
import { Tag, Button } from 'antd';
import './SelectLabel.css';

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

const SelectLabel = ({ userId, onConfirm, onNext, existingLabel, selectedLabel, setSelectedLabel}) => {
  useEffect(() => {
    setSelectedLabel(existingLabel); // 每次用户改变时，重置为当前用户的标签
  }, [existingLabel, setSelectedLabel]);

  const handleTagClick = (label) => {
    if (label === selectedLabel) {
      // 如果标签已经被选中，再次点击时取消选中
      setSelectedLabel(null);
    } else {
      // 如果标签未被选中，则选中它
      setSelectedLabel(label);
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedLabel);
  };

  return (
    <div className="select-label-container">
      <div className="tag-container">
        {Object.keys(labelColors).map(label => (
          <Tag
            key={label}
            color={label === selectedLabel ? labelColors[label] : 'default'}
            style={
              label === selectedLabel
                ? { 
                    backgroundColor: labelColors[label], 
                    borderColor: labelColors[label], 
                    color: '#fff', 
                    display: 'flex', 
                    alignItems: 'center',
                    fontSize: '9px',
                    lineHeight: '13px',
                    margin: '0px 0px', // 控制标签之间的上下和左右间距
                    fontWeight:'bold'
                  }
                : { 
                    borderColor: labelColors[label], 
                    color: labelColors[label],
                    fontSize: '9px',
                    lineHeight: '13px',
                    margin: '0px 0px', // 控制标签之间的上下和左右间距
                    fontWeight:'bold'
                  }
            }
            onClick={() => handleTagClick(label)}
          >
            {label}
          </Tag>
        ))}
      </div>
      <div style={{ position: 'absolute', bottom: '15px', left: 15}}>
        <Button 
          type="primary" 
          onClick={handleConfirm} 
          style={{ 
            marginRight: 10, 
            borderColor: '#0095FF', // 设置 Confirm 按钮的边框颜色
            backgroundColor: '#0095FF',
            width: 58,
            height: 22, 
            fontSize: 10
          }}
        >
          Confirm
        </Button>
        <Button 
          onClick={onNext} 
          style={{
            color: '#0095FF', // 设置 Next 按钮的字体颜色
            borderColor: '#0095FF',
            width: 58,
            height: 22,
            fontSize: 10
          }}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default SelectLabel;
