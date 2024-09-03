import React, { useEffect, useState} from 'react';
import { Row, Col, Card, Pagination, Select, Space, ConfigProvider, Popover } from 'antd';
import './LabelView.css';
import UserCard from '../../components/UserCard';
import TweetList from '../../components/TweetList';
import ForceGraph from '../../components/ForceGraph';
import LabelList from '../../components/LabelList';
import SelectLabel from '../../components/SelectLabel'; // 导入 SelectLabel 组件
import CheckboxGroup from '../../components/CheckboxGroup';
import CategoryBarChart from '../../components/CategoryBarChart';
import TimeLine from '../../components/TimeLine';
import { processData, getStatusType } from '../../components/processData';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { updateLabelRatios } from '../../action/labelActions';


const { Option } = Select;

const labelMapping = [
  "arts and fashion",
  "books and literature",
  "business finance and entrepreneurs",
  "celebrity and pop culture",
  "crisis (war and disaster)",
  "family and parenting",
  "film tv and video",
  "fitness and health",
  "food and dining",
  "games",
  "law government and politics",
  "learning and educational",
  "music",
  "news and social concern",
  "pets",
  "science and technology",
  "sports",
  "travel and adventure"
];

// 根据数字获取标签
const decodeLabel = (labelNumber) => {
  return labelNumber !== -1 ? labelMapping[labelNumber] : null;
};

// 根据标签获取对应的数字
const encodeLabel = (label) => {
  return label ? labelMapping.indexOf(label) : -1;
};


const LabelView = () => {
  const dispatch = useDispatch();
  const [currentPage, setCurrentPage] = useState(0);
  const [users, setUsers] = useState([]); // 用户的第一个帖子合集
  const [userIds, setUserIds] = useState([]); // 用户id的按顺序合集
  const [selectedFilters, setSelectedFilters] = useState(['post', 'repost', 'reply']);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [labels, setLabels] = useState({}); // 使用 state 存储标签结果
  const [jsonData, setJsonData] = useState({}); // 使用 state 存储 tweets.json 数据
  const [interval, setInterval] = useState('day'); // 添加 interval 状态
  const [chartData, setChartData] = useState([]); // 新增状态存储折线图数据
  const [dateRange, setDateRange] = useState([null, null]);
  const [selectedLabel, setSelectedLabel] = useState(null);
  const pageSize = 1; // 每页显示一个用户，可以根据需要调整

  const activeNodes = useSelector((state) => state.activeNodesState.nodes_to_label);
  const currentIteration = useSelector((state) => state.activeNodesState.current_iteration);


  useEffect(() => {
    // 加载服务器上的 initial_labels.json 文件
    axios.get('http://106.15.36.115:8008/initiallabels')
      .then(response => {
        if (response === undefined || response == null) {
          console.log('Error loading initial_labels.json:');
          return;
        }
  
        if (response.data.state == 304) {
          console.log('The "initial_labels" file not found.');
          return;
        }
  
        const labelsData = response.data;
        //const decodedLabels = {};
        let newLabelsArray = [];
        let newUserIds = [];
  
        // 解码 initial_labels.json 文件的标签
        for (let [userId, labelNumber] of Object.entries(labelsData)) {
          //decodedLabels[userId] = { label: decodeLabel(labelNumber), source: 'initial' };
          newLabelsArray.push([userId, { label: decodeLabel(labelNumber), source: 'initial'}]);
          newUserIds.push(userId);
        }
  
        // setLabels(Object.fromEntries(newLabelsArray));
        // setUserIds(newUserIds);

        console.log(newLabelsArray.length, newUserIds.length, Object.fromEntries(newLabelsArray).length)
  
        // 先获取当前迭代次数
        axios.get('http://106.15.36.115:8008/getcurrentiteration')
          .then(response_iter => {
            const iteration_num = response_iter.data.current_iteration;
  
            const additionalPromises = [];
            for (let i = 1; i <= iteration_num; i++) {
              additionalPromises.push(
                axios.get(`http://106.15.36.115:8008/additionalnodes/${i}`)
                  .then(response => {
                    const additionalLabels = response.data;
                    console.log(i, additionalLabels);
                    for (let [userId, labelNumber] of Object.entries(additionalLabels)) {
                      newLabelsArray.push([userId,  { label: decodeLabel(labelNumber), source: i }]);
                      newUserIds.push(userId);
                    }
                  })
                  .catch(error => console.error(`Error loading additional_nodes_${i}.json:`, error))
              );
            }
  
            Promise.all(additionalPromises).then(() => {
              setLabels(Object.fromEntries(newLabelsArray));

  
              const selectedUserIds = newUserIds;
              console.log(selectedUserIds)
              setCurrentUserId(selectedUserIds.length > 0 ? selectedUserIds[0] : null);
  
              // 加载 tweets.json 文件
              fetch('/organized_by_user_id_with_info_extract.json')
                .then(response => response.json())
                .then(data => {
                  setJsonData(data);
  
                  // 根据用户 ID 筛选 jsonData 中的用户数据，只取每个用户的第一个帖子
                  const loadedUsers = Object.values(data)
                    .map(userPosts => userPosts[0])
                    .filter(user => selectedUserIds.includes(user.user_id));
  
                  // 按照 labelsData 中的 userId 顺序排序 loadedUsers
                  loadedUsers.sort((a, b) => selectedUserIds.indexOf(a.user_id) - selectedUserIds.indexOf(b.user_id));
  
                  setUsers(loadedUsers);
                })
                .catch(error => console.error('Error loading tweets.json:', error));
            });
            
            setUserIds(newUserIds);
          })
          .catch(error => console.error('Error getting current iteration:', error));
  
      })
      .catch(error => console.error('Error loading initial_labels.json:', error));
  }, []);
  

  useEffect(() => {
    // 如果 activeNodes 发生变化
    if (Object.keys(activeNodes).length > 0) {
      // 将 labels 转换为一个包含键值对的数组
      let newLabelsArray = Object.entries(labels);
      let newUserIds = [...userIds]; // 创建 userIds 的副本
      
      // 遍历 activeNodes，将新节点添加到 newLabelsArray 和 newUserIds 中
      for (let [userId, labelNumber] of Object.entries(activeNodes)) {
          // 将新节点按顺序添加到 newLabelsArray
          newLabelsArray.push([userId, { label: decodeLabel(labelNumber), source: currentIteration}]);
          // 仅在 userIds 中不存在时才追加
          if (!newUserIds.includes(userId)) {
            newUserIds.push(userId);
          }
      }

  
      // 更新 userIds，确保顺序不变
      setUserIds(newUserIds);
  
      // 将 newLabelsArray 转换回对象
      const newLabels = Object.fromEntries(newLabelsArray);

  
      // 更新 labels 状态
      setLabels(newLabels);
  
      // 更新 users 状态
      const newUsers = [...users];
      for (let userId of Object.keys(activeNodes)) {
        if (!newUsers.some(user => user.user_id === userId)) {
          const newUserPosts = jsonData[userId];
          if (newUserPosts && newUserPosts.length > 0) {
            // 仅添加第一个帖子
            newUsers.push(newUserPosts[0]);
          }
        }
      }
      setUsers(newUsers);
    }
  }, [activeNodes, jsonData]);

  useEffect(() => {
    // 确保 currentUserId 和 jsonData[currentUserId] 有效
    if (currentUserId && jsonData[currentUserId]) {
      // 筛选符合选定过滤条件的数据
      const filteredData = jsonData[currentUserId].filter(post => selectedFilters.includes(getStatusType(post.status_type)));
      const processedData = processData(filteredData, interval);
      setChartData(processedData);
    }
  }, [interval, currentUserId, selectedFilters, jsonData]);

  const handlePageChange = (page) => {
    const totalPages = Math.ceil(users.length / pageSize);
    
    // 如果到了最后一页，再按下一页时回到第一页
    if (page >= totalPages) {
        page = 0;
    }
    
    setCurrentPage(page);
    const newCurrentUsers = users.slice(page * pageSize, (page + 1) * pageSize);
    setCurrentUserId(newCurrentUsers.length > 0 ? newCurrentUsers[0].user_id : null);
};
  const handleFilterChange = (filters) => {
    setSelectedFilters(filters);
  };

  const handleIntervalChange = (interval) => {
    setInterval(interval);
  };

  const handleLabelConfirm = (label) => {
    const updatedLabels = { ...labels, [currentUserId]: { ...labels[currentUserId], label: label } };
    console.log("Updated Labels:", updatedLabels);
    setLabels(updatedLabels);
  
    const encodedLabels = {};
    for (let [userId, labelValue] of Object.entries(updatedLabels)) {
      console.log(labelValue, labelValue.label)
        encodedLabels[userId] = {
            label: encodeLabel(labelValue.label), // 将标签转换为数字
            source: labelValue.source // 保留 source 信息
        };
    }
    

    axios.post('http://106.15.36.115:8008/updatelabels', encodedLabels)
      .then(response => {
        console.log('Labels updated successfully:', response.data);
        return axios.get('http://106.15.36.115:8008/getratios');
      })
      .then(response => {
        if (response.data) {
          dispatch(updateLabelRatios(
            response.data.labeled_ratio,
            response.data.labeled_and_neighbors_ratio
          ));
        }
      })
      .catch(error => {
        console.error('Error updating labels:', error);
      });
};


  const handleTagClick = (userId) => {
    setCurrentUserId(userId);

    const userIndex = userIds.indexOf(userId)
    if (userIndex !== -1) {
      setCurrentPage(userIndex);
    }
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
  };


  return (
    <div style={{ display: 'flex', height: '60vh', flexDirection: 'column' }}>
      <div style={{ textAlign: 'left'}}>
      <h2 style={{ 
        fontSize: '18px', // Larger font size
        margin: '0 0 1vh 10px' // Margin for top and bottom distance
      }}>Labeling</h2>
      </div>
      <Row>
        <Col span={6} style={{ paddingLeft: '10px', display: 'flex', flexDirection: 'column', height: '464px', paddingBottom: '5px'}}>
        {currentUserId && <UserCard userId={currentUserId} users={users} />}
          {currentUserId && <TweetList userId={currentUserId} filters={selectedFilters} interval={interval} dateRange={dateRange}/>}
        </Col>
        <Col span={18} style={{ paddingLeft: '5px', display: 'flex', flexDirection: 'column'}}>
          <Row
            style={{
              backgroundColor: 'white',
              height: '127px',
              marginBottom: '17px',
              marginLeft:'15px',
              marginRight:'10px'
            }}
          >
            <Col span={3}>
              <div style={{ textAlign: 'left' }}>
                <Popover content={<div style={{ maxWidth: 300, fontSize: '10px' }}>Allows you to select the type of user activity, including posts, reposts, and replies, and to filter the desired time period at the selected interval.</div>} placement="top" arrow={false}>
                  <h3 style={{ marginLeft: '20px', marginTop: 10, marginBottom: 0, fontSize: '14px' }}>Filter</h3>
                </Popover>
                <CheckboxGroup onChange={handleFilterChange} />
              </div>
            </Col>

            <Col span={11}> 
              <div style={{ position: 'absolute', right: 0, top: '1vh', zIndex: 1 }}>
                <ConfigProvider
                  theme={{
                    components: {
                      Select: {
                        /* 这里是你的组件 token */
                        multipleItemHeightSM: 10,
                        optionFontSize: 12,
                        optionHeight: 10,
                        optionLineHeight: 1,
                      },
                    },
                  }}
                >
                <Select
                  defaultValue={interval}
                  className="compact-select"
                  onChange={handleIntervalChange}
                  size='small'
                >
                  <Option value="day">Day</Option>
                  <Option value="month">Month</Option>
                  <Option value="year">Year</Option>
                </Select>
                </ConfigProvider>
              </div>
              <div style={{ position: 'absolute', right: -10, paddingTop: 8}}>
                {chartData && chartData.length > 0 ? (
                  <TimeLine data={chartData} interval={interval} selectedFilters={selectedFilters} onDateRangeChange={handleDateRangeChange}/>
                ) : (
                  <p>No data available for this user and filter.</p>
                )}
              </div>
            </Col>
            
            <Col span={10}>
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ marginLeft: 20, marginTop: 10, fontSize: '14px', marginBottom: 5 }}>ID List</h3>
              </div>
              <LabelList currentUserId={currentUserId} onTagClick={handleTagClick} labels={labels} userIds = {userIds}/>
            </Col>
          </Row>
          <Row
            style={{
              backgroundColor: 'white',
              marginLeft:'15px',
              marginRight:'10px',
              height: '295px'
            }}
          >
            <Col span={14}>
              <Row
                style={{
                  backgroundColor: 'white',
                  height: '250px',
                  marginBottom: '2vh',
                  marginLeft:'0.5vw',
                  marginRight:'0.5vw'
                }}
              >
                <ForceGraph
                  nodeId={currentUserId}
                  labels={labels}
                  filters={selectedFilters} 
                  dateRange={dateRange}
                  interval={interval}
                  selectedLabel={selectedLabel}
                />
              </Row>
            </Col>
            <Col span={10}>
              <h3 style={{ marginLeft: 20, marginTop: 10, marginBottom:10, fontSize: '14px'  }}>Select Label</h3>
              {currentUserId && (
                <SelectLabel
                  userId={currentUserId}
                  existingLabel={labels[currentUserId]?.label}
                  userPosts={jsonData[currentUserId] || []} // 传递当前用户的帖子数据
                  onConfirm={handleLabelConfirm}
                  onNext={() => handlePageChange(currentPage + 1)}
                  selectedLabel={selectedLabel} // 传递 selectedLabel 状态
                  setSelectedLabel={setSelectedLabel} // 传递状态更新函数
                />
              )}
            </Col>
          </Row>
          <Row style={{
              marginLeft:'15px',
              marginRight:'10px',
            }}>
            <CategoryBarChart labels={labels} />
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default LabelView;