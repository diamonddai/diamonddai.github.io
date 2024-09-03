// src/reducer/labelreducer.js
const initialState = {
    // ... 其他初始状态
    labeledRatio: 0,
    labeledAndNeighborsRatio: 0
  };
  
  const labelReducer = (state = initialState, action) => {
    switch (action.type) {
      // ... 其他 case
      case 'UPDATE_LABEL_RATIOS':
        return {
          ...state,
          labeledRatio: action.payload.labeledRatio,
          labeledAndNeighborsRatio: action.payload.labeledAndNeighborsRatio
        };
      default:
        return state;
    }
  };
  
  export default labelReducer;