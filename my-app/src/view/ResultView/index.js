/*
 * @Description: your project
 * @Author: Jerry_Liweeeee
 * @Date: 2024-07-31 16:03:10
 */
import React from "react";
import ClusterVisualization from "../../components/ClusterVisualization";
import LineChart from "../../components/LineChart";
import "antd/dist/reset.css"; // Ant Design样式导入


const ResultView = () => {
  return (
    <div style={{display:"flex",height:'100%', flexDirection: 'column'}}>
      <h2 style={{ 
        fontSize: '18px', // Larger font size
        margin: '0 0 1vh 20px' // Margin for top and bottom distance
      }}>Classification Results</h2>
      <div style={{height: '71%', paddingLeft: '20px', paddingRight: '20px'}}><ClusterVisualization /></div>
      <h2 style={{ 
        fontSize: '18px', // Larger font size
        margin: '10px 0 10px 20px' // Margin for top and bottom distance
      }}>Training Performance</h2>
      <div style={{height: '29%', paddingLeft: '20px', paddingRight: '20px', paddingBottom: '20px'}}><LineChart /></div>
    </div>
  );
};

export default ResultView;
