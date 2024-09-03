export const updateLabelRatios = (labeledRatio, labeledAndNeighborsRatio) => ({
    type: 'UPDATE_LABEL_RATIOS',
    payload: { labeledRatio, labeledAndNeighborsRatio }
  });