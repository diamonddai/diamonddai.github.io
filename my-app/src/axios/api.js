import axios from 'axios';

// 以下是举例

// 设置基础URL
const axiosInstance = axios.create({
  baseURL: 'http://你的后端服务器地址',
  timeout: 10000,
});

// 获取Spark数据的函数
export const getSparkData = async () => {
  try {
    const response = await axiosInstance.get('/spark/data');
    return response.data;
  } catch (error) {
    console.error('Error fetching Spark data:', error);
    throw error;
  }
};

// 控制神经网络的函数
export const controlNeuralNetwork = async (controlParams) => {
  try {
    const response = await axiosInstance.post('/neural-network/control', controlParams);
    return response.data;
  } catch (error) {
    console.error('Error controlling neural network:', error);
    throw error;
  }
};
