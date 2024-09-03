/*
 * @Description: your project
 * @Author: Jerry_Liweeeee
 * @Date: 2024-07-31 16:03:10
 */
import React,{ useState, useEffect } from "react";
import { Layout, Row, Col } from "antd";
import LabelView from "./view/LabelView";
import GNNView from "./view/GNNView";
import ResultView from "./view/ResultView";
import ProgressBar from "./components/ProgressBar";
import axios from 'axios';
import ClusterVisualization from "./components/ClusterVisualization";
import LineChart from "./components/LineChart";
import "./App.css";
import { useSelector, useDispatch } from 'react-redux';
import { updateLabelRatios } from './action/labelActions';

const { Header, Content } = Layout;




const App = () => {

  var myAppUrl = "http://106.15.36.115:8008/";

  const dispatch = useDispatch();
  const { labeledRatio, labeledAndNeighborsRatio } = useSelector(state => state.label);
  // const activeNodes = useSelector(state => state.activeNodesState.activeNodes);
  useEffect(() => {
    axios.get(myAppUrl+'/getratios')
      .then(response => {
        if (response.data) {
          dispatch(updateLabelRatios(
            response.data.labeled_ratio,
            response.data.labeled_and_neighbors_ratio
          ));
        }
      })
      .catch(error => {
        console.error("Error fetching ratios:", error);
      });
  }, [dispatch]);

  return (
    <Layout
    style={{
      width: "1400px", // 固定宽度
      height: "900px", // 固定高度
      backgroundColor: "#FFFFFF",
      margin: "auto", // 居中显示
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)", // 可选：增加阴影
      borderRadius: "8px", // 可选：增加圆角
    }}
  >
      <Header
        style={{
          backgroundColor: "white",
          color: "black",
          textAlign: "left",
          padding: "10px 32px",
          height: "50px",
          lineHeight: "30px",
          boxShadow: "0 3px 4px rgba(0, 0, 0, 0.1)",
          zIndex: 1,
          fontSize: "20px", // Adjust the font size here
          fontWeight: "bold",
        }}
      >
        Classification Platform
      </Header>

      <Content style={{ padding: "3px" }}>
        <Row gutter={[16, 16]} style={{ height: "100%", padding: '10px'}}>
          <Col
            span={16}
            style={{ height: "100%", display: "flex", flexDirection: "column", paddingRight: '10px'}}
          >
            <div
              style={{
                height: "508px",
                padding: "10px",
                borderRadius: "8px",
                boxShadow: "0 6px 8px rgba(0, 0, 0, 0.1)",
                backgroundColor: "#f8f8f8",
              }}
            >
              <LabelView />
            </div>
            <div
              style={{
                height: "30px",
                marginTop: "7px",
              }}
            >
              <ProgressBar 
                labeledRatio={labeledRatio} 
                labeledAndNeighborsRatio={labeledAndNeighborsRatio}
              />
            </div>
            <div
              style={{
                height: "270px",
                padding: "10px",
                borderRadius: "8px",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                backgroundColor: "#f8f8f8",
              }}
            >
              <GNNView />
            </div>
          </Col>
          <Col span={8} style={{paddingLeft: '10px' }}>
            <div
              style={{
                height: "815px",
                paddingTop: "10px",
                borderRadius: "8px",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                backgroundColor: "#f8f8f8",
              }}
            >
              <ResultView />
            </div>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default App;
