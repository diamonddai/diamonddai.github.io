import React, { useEffect, useState } from 'react';
import { List, Tag, Row, Col, Image, Space } from 'antd';
import { SyncOutlined, HeartOutlined, MessageOutlined } from '@ant-design/icons';
import { addDays, addMonths, addYears } from 'date-fns';
import './TweetList.css';

const labelColors = [
  '#DB9487', '#E4B789', '#DCCE88', '#D0DB88', '#B2D688', '#98CC85', '#8DC990', '#8DCCAA',
  '#8DCEC5', '#88CED9', '#87B2D9', '#8695CB', '#8F86BF', '#A687BD', '#BA89BB',
  '#CA89B9', '#D785B0', '#D98595'
];

const TweetList = ({ userId, filters, interval, dateRange }) => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  // 只在初始化时获取数据
  useEffect(() => {
    const fetchTweets = async () => {
      try {
        const response = await fetch('/organized_by_user_id_with_info_extract.json');
        const tweetData = await response.json();
        setData(tweetData);
      } catch (error) {
        console.error('Failed to fetch tweets:', error);
      }
    };

    fetchTweets();
  }, []); // 空依赖数组，确保只在组件初始化时执行一次

  // 在 userId 变化时过滤数据
  useEffect(() => {
    const filterTweets = () => {
      if (!data || !userId) return;

      const userTweets = data[userId] || [];
      const filtered = userTweets.filter((item) => {
        const tweetDate = new Date(item.created_at);
        let [startDate, endDate] = dateRange;

        if (interval === 'day') {
          endDate = addDays(endDate, 1);
        }
        if (interval === 'month') {
          endDate = addMonths(endDate, 1);
        }
        if (interval === 'year') {
          endDate = addYears(endDate, 1);
        }

        if (startDate != null && endDate != null) {
          if (tweetDate < startDate || tweetDate > endDate) {
            return false; // 排除不在选定日期范围内的推文
          }
        }

        if (item.status_type === 1 && filters.includes('post')) {
          return true;
        }
        if (item.status_type === 2 && filters.includes('repost')) {
          return true;
        }
        if (item.status_type === 3 && filters.includes('reply')) {
          return true;
        }
        return false;
      });

      setFilteredData(filtered);
    };

    filterTweets();
  }, [data, userId, filters, dateRange, interval]); // 监听 userId、filters 和 dateRange 的变化

  return (
    <div className="tweet-list-container">
      <div className="tweet-list-inner-container"> 
      <List
        dataSource={filteredData}
        renderItem={(item) => {
          const hasVideo = item.a_video_medias.length > 0 && item.a_video_medias[0].media_video_url !== "";
          const hasImages = item.a_photo_medias.length > 0 && item.a_photo_medias[0].media_photo_url !== "";

          return (
            <List.Item key={item.tweet_id}>
              <div style={{width: '100%'}}>
                  {/* <Tag color={labelColors[item.label_id]}  style={{fontSize: '10px'}}>{item.label}</Tag> */}
                  <Row>
                    <Col span={1} style={{ fontWeight: 'bold', fontSize: '7px'}}>Content</Col>
                    <Col span={23} style={{paddingTop:1, paddingLeft: 30, fontSize: '7px', lineHeight:'1.2', marginBottom: 5, color: '#5C5C5C' }}> {item.text}</Col>
                  </Row>
                {hasVideo && (
                  <Row>
                    <Col span={1} style={{ fontWeight: 'bold', fontSize: '7px' }}>Video</Col>
                    <Col span={23} style={{ paddingTop:1, paddingLeft: 30, paddingTop: 2 }}>
                      <video controls style={{ maxWidth: '100%', marginBottom: 0 }}>
                        <source src={item.a_video_medias[0].media_video_url} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </Col>
                  </Row>
                )}
                {!hasVideo && hasImages && (
                  <Row>
                    <Col span={1} style={{ fontWeight: 'bold', fontSize: '7px' }}>Image</Col>
                    <Col span={23} style={{ paddingTop:1,paddingLeft: 30, paddingTop: 2 }}>
                      <Image.PreviewGroup>
                        <Row gutter={[16, 16]}>
                          {item.a_photo_medias.map((photo, index) => (
                            <Col key={index} span={item.a_photo_medias.length === 1 ? 24 : 8}>
                              <Image
                                src={photo.media_photo_url}
                                alt="Photo"
                                style={{ maxWidth: '100%'}}
                              />
                            </Col>
                          ))}
                        </Row>
                      </Image.PreviewGroup>
                    </Col>
                  </Row>
                )}
                <Row>
                  <Col span={1}></Col>
                  <Col span={23}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '7px', marginTop: 5, marginLeft: 30, marginRight: 40 }}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        <SyncOutlined style={{ marginRight: '6px', color: '#0095FF' }} />
                        <span style={{ marginRight: '1px', fontWeight: 'bold' }}>{item.retweet_count}</span>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        <MessageOutlined style={{ marginRight: '6px', color: '#0095FF' }} />
                        <span style={{ marginRight: '1px', fontWeight: 'bold' }}>{item.reply_count}</span>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        <HeartOutlined style={{ marginRight: '6px', color: '#0095FF' }} />
                        <span style={{ marginRight: '1px', fontWeight: 'bold' }}>{item.favorite_count}</span>
                      </span>
                    </div>
                  </Col>
                </Row>
                <div style={{ display: 'flex', justifyContent: 'flex-start', fontSize: '7px', paddingTop: '5px', paddingLeft: '37px', color: '#5C5C5C' }}>
                  <span>{new Date(item.created_at).toLocaleString()}</span>
                </div>
              </div>
            </List.Item>
          );
        }}
      />
      </div>
    </div>
  );
};

export default TweetList;
