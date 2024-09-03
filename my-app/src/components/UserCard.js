import React, { useEffect, useState } from 'react';
import { Card, Avatar, Popover, ConfigProvider } from 'antd';
import './UserCard.css'; // 引入CSS文件

const { Meta } = Card;

const UserCard = ({ userId, users }) => {
  const [currentUser, setCurrentUser] = useState(null);
  // console.log(userId, users)
  useEffect(() => {
    // 根据currentUserId从users数组中找到对应的用户
    const user = users.find(u => u.user_id === userId);
    setCurrentUser(user);
  }, [userId, users]);

  if (!currentUser) {
    return null; // 如果没有找到用户，则不显示卡片
  }

  const {
    user_id,
    user_screen_name = 'N/A',
    name = 'N/A',
    description = 'No description available',
    location = 'Unknown',
    followers_count = 'N/A',
    friends_count = 'N/A',
    user_avatar,
  } = currentUser;

  return (
    <div className="user-card-container">
    <ConfigProvider
      theme={{
        token: {
          paddingLG: 5,
        },
      }}
    >
      <Popover content={<div style={{ maxWidth: 200, fontSize: '10px' }}>{description}</div>} placement="right" title={<div style={{fontSize: '12px' }}>{name}</div>}>
        <Card className="user-card-scrollable">
        <div className="user-card-inner">
          <Meta
            avatar={
              <Avatar
                src={user_avatar}
                className="user-card-avatar"
              />
            }
            description={
              <div className="user-card-description">
                {name && (
                  <p className="user-card-detail">
                    <span style={{ fontWeight: 'bold', fontSize: '7px', color: 'black' }}>{name}</span>
                  </p>
                )}
                {user_screen_name && (<span style={{fontSize: '7px', color: '#5C5C5C' }}>@{user_screen_name}</span>)}
                {user_id && (
                  <p className="user-card-detail">
                    <span className="user-card-label">ID</span> 
                    <span className="user-card-content">{user_id}</span>
                  </p>
                )}
                {followers_count && (
                  <p className="user-card-detail">
                    <span className="user-card-label">Followers</span> 
                    <span className="user-card-content">{followers_count}</span>
                  </p>
                )}
                {friends_count && (
                  <p className="user-card-detail">
                    <span className="user-card-label">Following</span> 
                    <span className="user-card-content">{friends_count}</span>
                  </p>
                )}
                {location ? (
                  <p className="user-card-detail">
                    <span className="user-card-label">Location</span> 
                    <span className="user-card-content">{location}</span>
                  </p>
                ) : (
                  <p className="user-card-detail">
                    <span className="user-card-label">Location</span> 
                    <span className="user-card-content">Unknown</span>
                  </p>
                )

              
                }
              </div>
            }
          />
          </div>
        </Card>
      </Popover>
    </ConfigProvider>
    </div>
  );
};

export default UserCard;
