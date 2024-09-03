
import React, { useState, useRef,useEffect } from 'react';
import './gnn.css';
import axios from 'axios';
import { Row, Col, Card, Pagination, Button, InputNumber, Select, Input,message} from 'antd';
import { PlusOutlined, MinusOutlined , PlayCircleFilled, VerticalLeftOutlined, ReloadOutlined,StepForwardOutlined} from '@ant-design/icons';

import figureImage from '../../images/space_filling_curve4.svg';
import { useDispatch } from 'react-redux';
import { fetchNewNodesSuccess } from '../../action/actions';

const GNNView = () => {

  const [initialized, setInitialized] = useState(false);
  const [trainingResults, setTrainingResults] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [activeNodes, setActiveNodes] = useState(null);
  const [selectedEpochNo, setSelectedEpochNo] = useState('50');
  const [selectedLearningRate, setSelectedLearningRate] = useState('0.01');
  const [currentIteration, setCurrentIteration] = useState(0);
  const dispatch = useDispatch();
  const [selectedLayer1Dimensions,setSelectedLayer1Dimensions] = useState('16');
  const [selectedLayer2Dimensions,setSelectedLayer2Dimensions] = useState('16');
  const [currentImage, setCurrentImage] = useState(figureImage);
  const [isDefaultImage, setIsDefaultImage] = useState(true);
  const [isTraining, setIsTraining] = useState(false);
  useEffect(() => {
    // 在组件加载时获取当前迭代次数
    getCurrentIteration();
  }, []);
  const getCurrentIteration = async () => {
    try {
      const response = await axios.get('http://106.15.36.115:8008/getcurrentiteration');
      setCurrentIteration(response.data.current_iteration);
    } catch (error) {
      console.error('Error getting current iteration:', error);
    }
  };
  
  const initializeModel = async () => {
    try {
      const response = await axios.get('http://106.15.36.115:8008/initialize');
      setInitialized(true);
      setCurrentIteration(0); // 重置迭代次数
      message.success(response.data.message);
    } catch (error) {
      console.error('Error initializing model:', error);
      message.error('Failed to initialize model');
    }
  };

  // const trainModel = async () => {
  //   try {
  //     const response = await axios.post('http://106.15.36.115:8008/train');
  //     setTrainingResults(response.data);
  //     message.success('Model training completed');
  //   } catch (error) {
  //     console.error('Error training model:', error);
  //     message.error('Failed to train model');
  //   }
  // };

  const trainModel = async () => {
    try {
      const response = await axios.post('http://106.15.36.115:8008/train', {
        epochNo: selectedEpochNo,
        learningRate: selectedLearningRate,
        layer1dimensions: selectedLayer1Dimensions,
        layer2dimensions: selectedLayer2Dimensions
      },{
        timeout:90*1000
      });
      setTrainingResults(response.data);
      setCurrentIteration(response.data.current_iteration);
      message.success('Model training completed');
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        message.warning('Training request timed out. The training might still be running on the server.');
      } else {
        console.error('Error training model:', error);
        message.error('Failed to train model');
      }
    } finally {
      setIsTraining(false);
    }
  };

  //  const trainModel = async () => {
  //   axios({
  //     method:"post",
  //     url:'http://106.15.36.115:8008/train',
  //     responseType:"json",
  //     // headers:{},
  //     timeout:120*1000,
  //     data:{
  //       "iteration":selectedIteration,
  //       "epochNo":selectedEpochNo,
  //       "learningRate":selectedLearningRate,
  //       "layer1dimensions":selectedLayer1Dimensions,
  //       "layer2dimensions":selectedLayer2Dimensions
  //       // "jsonString":{"1731502817154879488":2,"1024224313":1,"1512864171347619842":3,"1076440219627311104":1,"3303170203":1,"2494765578":1,"17483878":1,"1495607031729836032":1,"1315900032365793281":1,"1480675985582432262":1}
  //     },//备选方案 requestBody
  //     // params:{ "epochNo":10 }
  //   }).then(function(rspData){
  //     console.log(rspData);

  //   }).catch(function(errorMsg){
  //     console.log(errorMsg);
  //   });
  // };

  // trainModel();

 

  const getNewNodes = async () => {
    try {
      const response = await axios.post('http://106.15.36.115:8008/activelearning');
      const { nodes_to_label, current_iteration } = response.data;
      dispatch(fetchNewNodesSuccess(nodes_to_label, current_iteration));
      message.success('New nodes retrieved for labeling');
    } catch (error) {
      console.error('Error getting new nodes:', error);
      message.error('Failed to get new nodes');
    }
  };

  // const iterationNo = [
  //   { value: '1', label: <span>1</span> },
  //   { value: '2', label: <span>2</span> },
  //   { value: '3', label: <span>3</span> },
  //   // 其他选项
  // ];
  const epochNo = [
    { value: '50', label: <span>50</span> },
    { value: '100', label: <span>100</span> },
    { value: '200', label: <span>200</span> },
    // 其他选项
  ];
  const learningRate = [
    { value: '0.01', label: <span>0.01</span> },
    { value: '0.02', label: <span>0.02</span> },
    { value: '0.03', label: <span>0.03</span> },
    // 其他选项
  ];

  const layer1dimensions = [
    { value: '8', label: <span>8</span> },
    { value: '16', label: <span>16</span> },
    { value: '32', label: <span>32</span> },
    // 其他选项
  ];
  const layer2dimensions = [
    { value: '8', label: <span>8</span> },
    { value: '16', label: <span>16</span> },
    { value: '32', label: <span>32</span> },
    // 其他选项
  ];

  // const [currentImage, setCurrentImage] = useState(figureImage);
  // const [isDefaultImage, setIsDefaultImage] = useState(true);
  const updateImage = () => {
    console.log("更新图片");
    
    axios.get('http://106.15.36.115:8008/visualize', {
      responseType: 'json'
    }).then(response => {
      if (response.data && response.data.image) {
        setCurrentImage(response.data.image);
        setIsDefaultImage(false);
      } else {
        console.error("Unexpected response format:", response.data);
      }
    }).catch(error => {
      console.error("Error fetching image:", error);
    });
  };

  // const [imageUrl, setImageUrl] = useState(null);
  // const updateImage = () => {
  //   console.log("更新图片");
    
  //   axios.get('http://106.15.36.115:8008/visualize', {
  //     headers: {
  //       "Origin": "http://localhost:3000/",
  //       "Referer": "http://localhost:3000/"
  //     }
  //   }).then(response => {
  //     const imgBase64 = "data:image/png;base64," + response.data.image;
  //     const setImgVisualizationSrc = document.getElementById("imgVisualization");
  //     setImgVisualizationSrc.src=imgBase64;
  //     // setImageUrl(imgBase64);
  //     // setInterval(() => {
        
  //     // }, 2000);
  //   }).catch(error => {
  //     console.log("Error fetching image:");
  //   });
  // };

  const iconButtonStyle = {
    border: 'none',
    background: 'none',
    boxShadow: 'none',
    padding: '5px',
    alignItems: 'center',
    color: 'rgba(0, 0, 0, 0.65)',
  };
  


  return (
    
    <div style={{display:"flex",height:'100%', flexDirection: 'column'}}>
      <div style={{ textAlign: 'left' }}>
      <h2 style={{ 
        fontSize: '18px', // Larger font size
        margin: '0 0 1vh 8px' // Margin for top and bottom distance
      }}>Model Options</h2>
      </div>

      <Row style={{marginLeft: '8px', paddingBottom:'10px'}}>
          {/* Hyperparameter 列 */}
          <Col span={7.1} style={{ height:'208px',width:'337px',borderradius:'3px',backgroundColor: 'white'}}>
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ marginLeft: '25px',marginTop:'10px', fontSize: '14px' }}>Hyperparameter</h3>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <h4 style={{ marginLeft: '25px', marginTop:'5px',color:"#5c5c5c", fontSize: '13.3px' }}>
                      Current Iteration
                    </h4>
                    {/* <Select defaultValue="1" style={{ width: '135px', height:'19px',marginLeft: '81px'}} options={iterationNo} onChange={(value) => setSelectedIteration(value)}></Select> */}
                    <Input value={currentIteration} style={{ width: '135px', height:'19px', marginLeft: '32px',fontFamily:'PingFang SC', fontSize: '12px' }} disabled /> 
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                <h4 style={{ marginLeft: '25px', marginTop:'5px', color:"#5c5c5c", fontSize: '13.3px' }}>
                      Epoch Number
                    </h4>
                    <Select defaultValue="50" className="custom-select" style={{ width: '135px', height:'19px',marginLeft: '43px',fontFamily:'PingFang SC'}} options={epochNo} onChange={(value) => setSelectedEpochNo(value)}></Select>
                    
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                <h4 style={{ marginLeft: '25px',marginTop:'5px', color:"#5c5c5c", fontSize: '13.3px'}}>
                      Learning Rate
                    </h4>
                    <Select defaultValue="0.01" className="custom-select" style={{ width: '135px', height:'19px',marginLeft: '50px',fontFamily:'PingFang SC'}} options={learningRate} onChange={(value) => setSelectedLearningRate(value)}></Select>
                </div>
                  
                </div>
                <div style={{ textAlign: 'left' }}>


                </div>
                <div>
                  <h3  style={{ marginLeft: '25px',marginTop:'10px', fontSize: '14px' }}>
                 Layer
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <h4 style={{ marginLeft: '25px',marginTop:'5px', color:"#5c5c5c", fontSize: '13.3px'}}>
                      Layer1
                    </h4>
                    <Select defaultValue="16" className="custom-select" style={{ width: '65px', height:'19px',marginLeft: '96px',fontFamily:'PingFang SC'}} options={layer1dimensions} onChange={(value) => setSelectedLayer1Dimensions(value)}></Select>
                    <text style={{ marginLeft: '5px', fontSize: '12px',fontFamily:'PingFang SC',color:'#000000',textDecorationThickness:'thick' }}>dimensions</text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <h4 style={{ marginLeft: '25px',marginTop:'5px', color:"#5c5c5c", fontSize: '13.3px'}}>
                      Layer2
                    </h4>
                    <Select defaultValue="16" className="custom-select" style={{ width: '65px', height:'19px',marginLeft: '95px',fontFamily:'PingFang SC'}} options={layer2dimensions} onChange={(value) => setSelectedLayer2Dimensions(value)}></Select>
                  <text style={{ marginLeft: '5px', fontSize: '12px',fontFamily:'PingFang SC',color:'#000000'}}>dimensions</text>
                  </div>
                </div>
          </Col>
{/* 
        {/* Layers 列 */}
          {/* <Col span={5.2} style={{ backgroundColor: 'white', padding: '10px' ,height:'212px'}}>
              <div style={{ textAlign: 'left', display: 'flex', alignItems: 'center' }}>
                <Button icon={<MinusOutlined />} onClick={removeLayer} shape="circle" size="small" margin="10px"
                        style={{ backgroundColor: '#0095FF',  color: 'white'}} />
                <h3 style={{ marginLeft: 5, marginTop: 8, marginRight: 5, fontSize: '14px' }}>{layerCount} Layers</h3>
                <Button icon={<PlusOutlined />} onClick={addLayer} shape="circle" size="small" margin="10px"
                        style={{ backgroundColor: '#0095FF', color: 'white' }} />
              </div>
              <div style={{padding: '10px', paddingTop: '0px'}}>
              {layers.map((layer, index) => (
              <div key={index} style={{marginTop:'10px'}} >
                <h4 style={{color:'#5c5c5c'}}>Layer {index + 1}
                <InputNumber
                  value={layer}
                  onChange={(value) => handleLayerChange(index, value)}
                  style={{ width: '50px',marginLeft: '5px', marginRight: '5px'}}
                />
                <span style={{color:'#5c5c5c'}}>dimensions</span></h4>
              </div>
            ))}
              </div>

          </Col> */} 
                {/* 可视化列 */}
          <Col span={9}>
          <div style={{background:'white',height:'208px',width:'391px',marginLeft:'15px'}}>
          {/* <div id='imgVisualization'
            src={currentImage}
            onClick={updateImage}
            alt="Visualization" 
            style={{width:'391px', height:'208px'}}
           /> */}
<div style={{background:'white',height:'208px',width:'391px'}}>
  {isDefaultImage ? (
    <img 
      src={currentImage} 
      onClick={updateImage}
      alt="Default Visualization" 
      style={{width:'391px', height:'208px'}}
    />
  ) : (
    <div 
      onClick={updateImage}
      style={{width:'391px', height:'208px', overflow: 'hidden'}}
      dangerouslySetInnerHTML={{__html: currentImage}}
    />
  )}
</div>
           
        </div>
          </Col>
          
          <Col span={5.5}>
             {/* ICON列 */}
            <div style={{marginLeft:'85px',marginTop:'90px', gap: '35px',display:'flex',alignItems:'center',justifyItems:'center'}}>
                  <svg onClick={initializeModel} className='icon' width="1" height="1" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1.7239 9.71827C2.5698 12.3723 4.99247 14.2886 7.84915 14.2886C11.4093 14.2886 14.2954 11.3123 14.2954 7.64087C14.2954 3.96944 11.4093 0.993164 7.84915 0.993164C5.46312 0.993164 3.37987 2.33001 2.26528 4.31702M1.7239 3.66757L2.61183 4.52482M4.22313 5.14798H1V1.82413L4.22313 5.14798Z" stroke="#333333" stroke-width="1.89934" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  {/* <svg onClick={trainModel} disabled={!modelInitialized} className='icon-play' width="53" height="52" viewBox="0 0 53 52" fill="none" xmlns="http://www.w3.org/2000/svg"> */}
                  <svg onClick={trainModel} className='icon-play' width="30" height="30" viewBox="0 0 53 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <ellipse cx="26.405" cy="25.6411" rx="26.116" ry="25.6411" fill="#0095FF"/>
                  <path d="M35.4244 23.5209C36.6906 24.252 36.6907 26.0796 35.4244 26.8107L23.3161 33.8014C22.0499 34.5325 20.4671 33.6187 20.4671 32.1566L20.4671 18.1751C20.4671 16.713 22.0499 15.7991 23.3161 16.5302L35.4244 23.5209Z" fill="white"/>
                  </svg>
                  <svg onClick={getNewNodes} className='icon'  width="16" height="15" viewBox="0 0 16 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* <svg onClick={getPredictions} disabled={!trainingData} className='icon'  width="16" height="15" viewBox="0 0 16 15" fill="none" xmlns="http://www.w3.org/2000/svg"></svg> */}
                  <path d="M14.811 1.52755V12.7049M2.87941 1.11529L10.5374 6.70397C10.8494 6.93165 10.8494 7.3008 10.5374 7.52848L2.87941 13.1172C2.37614 13.4844 1.51562 13.2243 1.51563 12.7049L1.51563 1.52755C1.51563 1.00813 2.37614 0.74801 2.87941 1.11529Z" stroke="#333333" stroke-width="1.89934" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
            </div>
          </Col>

       
      </Row>
      
    
    </div>
  );
};

export default GNNView;
