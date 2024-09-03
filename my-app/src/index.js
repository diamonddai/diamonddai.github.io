// src/index.js

import React from 'react';
import ReactDOM from 'react-dom';
import 'antd/dist/reset.css';
import { Provider } from 'react-redux';
import store from './store';
import App from './App';
import './styles/global.css'



ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);




