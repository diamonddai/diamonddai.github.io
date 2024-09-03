import { FETCH_NEW_NODES_SUCCESS } from '../action/actions';
import { combineReducers } from 'redux';

const initialActiveNodesState = {
  nodes_to_label: {},
  current_iteration: 0,
};

const activeNodesReducer = (state = initialActiveNodesState, action) => {
  switch (action.type) {
    case FETCH_NEW_NODES_SUCCESS:
      console.log(action.payload.nodes_to_label, action.payload.current_iteration)
      return {
        ...state,
        nodes_to_label: action.payload.nodes_to_label,
        current_iteration: action.payload.current_iteration,
      };
    default:
      return state;
  }
};

const initialLabelState = {
  labeledRatio: 0,
  labeledAndNeighborsRatio: 0
};

const labelReducer = (state = initialLabelState, action) => {
  switch (action.type) {
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

const rootReducer = combineReducers({
  activeNodesState: activeNodesReducer,
  label: labelReducer
});

export default rootReducer;