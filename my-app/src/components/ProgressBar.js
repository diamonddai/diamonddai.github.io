import React from 'react';
import { ConfigProvider, Progress, Tooltip } from 'antd';

const ProgressBar = ({ labeledRatio, labeledAndNeighborsRatio }) => {
  const labeledPercent = (labeledRatio * 100).toFixed(2);
  const classifiedPercent = (labeledAndNeighborsRatio * 100).toFixed(2);

  return (
    <ConfigProvider
      theme={{
        components: {
          Progress: {
            remainingColor: '#CDE7FF',
            lineBorderRadius: '4px',
          },
        },
      }}
    >
<Tooltip title={`Labeled ${labeledPercent}% / Classified ${classifiedPercent}%`}>
        <div style={{ width: '100%', position: 'relative' }}>
          <Progress
            percent={parseFloat(classifiedPercent)}
            size={['100%', '24px']}
            success={{
              percent: parseFloat(labeledPercent),
              strokeColor: '#0B60C6',
            }}
            strokeColor={'#0095FF'}
            showInfo={false}
          />
          <div style={{
            position: 'absolute',
            top: 0,
            right: '10px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{
              color: '#333333',
              fontSize: '12px'
            }}>
              Labeled {labeledPercent}%
            </span>
            <span style={{
              color: '#333333',
              fontSize: '12px'
            }}>
              Classified {classifiedPercent}%
            </span>
          </div>
        </div>
      </Tooltip>
    </ConfigProvider>
  );
};

export default ProgressBar;
