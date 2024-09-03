import React from 'react';
import { Checkbox } from 'antd';
import './CheckboxGroup.css'; // 引入自定义样式

const checkboxOptions = [
  { label: 'Post', value: 'post', color: '#027D8E' },
  { label: 'Repost', value: 'repost', color: '#63ABFD' },
  { label: 'Reply', value: 'reply', color: '#E697FF' },
];

const CheckboxGroup = ({ onChange }) => {
  const handleChange = (checkedValues) => {
    if (onChange) {
      onChange(checkedValues);
    }
  };

  // 设置默认选中的值
  const defaultCheckedValues = checkboxOptions.map(option => option.value);

  return (
    <Checkbox.Group onChange={handleChange} defaultValue={defaultCheckedValues}>
      <div className="checkbox-group">
        {checkboxOptions.map((option) => (
          <div key={option.value} className="checkbox-item">
            <Checkbox
              value={option.value}
              style={{ color: option.color }}
              className={`custom-checkbox-${option.value}`}
            >
              <span style={{ color: option.color }}>{option.label}</span>
            </Checkbox>
          </div>
        ))}
      </div>
    </Checkbox.Group>
  );
};

export default CheckboxGroup;
