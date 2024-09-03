
// src/redux/actions.js
export const FETCH_NEW_NODES_SUCCESS = 'FETCH_NEW_NODES_SUCCESS';

export const fetchNewNodesSuccess = (nodes_to_label, current_iteration) => ({
  type: FETCH_NEW_NODES_SUCCESS,
  payload: { nodes_to_label, current_iteration },
});