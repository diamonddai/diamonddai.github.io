// src/store/index.js
import { createStore, applyMiddleware } from 'redux';

import rootReducer from '../reducer/reducer';

const store = createStore(rootReducer);

export default store;