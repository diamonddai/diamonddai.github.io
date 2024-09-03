// processData.js

export const processData = (posts, interval) => {
  // Helper function to format the date based on interval
  const formatDate = (date, interval) => {
    const d = new Date(date);
    
    if (interval === 'day') {
      return d.toISOString().split('T')[0]; // YYYY-MM-DD
    } else if (interval === 'week') {
      // Calculate the start of the week (Monday)
      const firstDayOfWeek = new Date(d.setDate(d.getDate() - d.getDay() + 1));
      return firstDayOfWeek.toISOString().split('T')[0]; // YYYY-MM-DD (start of the week)
    } else if (interval === 'month') {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
    } else if (interval === 'year') {
      return `${d.getFullYear()}`; // YYYY
    }
  };

  // Initialize data aggregation object
  const dataByDate = posts.reduce((acc, post) => {
    const dateKey = formatDate(post.created_at, interval);
    if (!acc[dateKey]) {
      acc[dateKey] = { post: 0, repost: 0, reply: 0 }; // Initialize
    }
    acc[dateKey][getStatusType(post.status_type)] += 1;
    return acc;
  }, {});

  // Generate data suitable for chart
  const processedData = Object.keys(dataByDate)
    .sort()
    .map(dateKey => ({
      date: dateKey,
      ...dataByDate[dateKey],
    }));
  return processedData;
};

// Helper function to determine post type
export const getStatusType = (statusType) => {
  switch (statusType) {
    case 1:
      return 'post';
    case 2:
      return 'repost';
    case 3:
      return 'reply';
    default:
      return 'unknown';
  }
};
