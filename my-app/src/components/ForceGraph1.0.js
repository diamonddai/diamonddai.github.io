import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import axios from 'axios';
import './ForceGraph.css';

const ForceGraph = ({ nodeId }) => {
  const svgRef = useRef();
  const width = 500; // Updated canvas width for better visibility
  const height = 500; // Updated canvas height for better visibility

  const [graphData, setGraphData] = useState(null);
  const [tweetsData, setTweetsData] = useState(null);
  const [interestData, setInterestData] = useState(null);

  useEffect(() => {
    // Fetch the required data
    const fetchData = async () => {
      try {
        const [neighborhoodResponse, tweetsResponse, interestsResponse] = await Promise.all([
          axios.get('/final_user_neighborhood_cleaned.json'),
          axios.get('/organized_by_user_id_with_info.json'),
          axios.get('/tweets_interests_top18.json')
        ]);
        setGraphData(neighborhoodResponse.data);
        setTweetsData(tweetsResponse.data);
        setInterestData(interestsResponse.data);

      } catch (error) {
        console.error('Error fetching the data', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!graphData || !tweetsData || !interestData) return; // Ensure all data is loaded

    const svgElement = d3.select(svgRef.current);
    svgElement.selectAll('*').remove(); // Clear previous render

    const svg = svgElement
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`); // Center the graph

    const zoomBehavior = d3.zoom().on('zoom', (event) => {
      svg.attr('transform', event.transform);
    });

    svgElement.call(zoomBehavior);

    const forceSimulation = d3.forceSimulation()
      .force('link', d3.forceLink().id(d => d.id).distance(250)) // Increased distance for clarity
      .force('charge', d3.forceManyBody().strength(-400)) // Stronger repulsion for better spacing
      .force('center', d3.forceCenter(0, 0)); // Center the graph

    const { nodes, links, themeScores } = processData(graphData, nodeId, tweetsData, interestData);
    // Add a tooltip element to the body of the document
    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('padding', '6px 12px')
      .style('background-color', '#fff')
      .style('border', '1px solid #ccc')
      .style('border-radius', '4px')
      .style('box-shadow', '0 2px 8px rgba(0, 0, 0, 0.1)')
      .style('font-size', '14px')
      .style('pointer-events', 'none') // Ensure tooltip doesn't interfere with mouse events
      .style('opacity', 0); // Initially hidden

    const link = svg.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke-width', 1.5)
      .attr('stroke', '#999');

    const node = svg.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .attr('class', 'node');

    node.append('circle')
      .attr('r', d => d.id === nodeId ? 50 : 10) // Larger central node
      .attr('fill', d => {
        if (d.id === nodeId) {
          return 'transparent'; // Use transparent for central node
        } else {
          const labelColor = getLabelColor(d.id); // Determine color based on label
          return labelColor; // Default to steelblue if no label found
        }
      })
      .on('mouseover', function(event, d) {
        // Show the tooltip
        tooltip.transition()
          .duration(200)
          .style('opacity', .9);
        
        tooltip.html(`<strong>ID:</strong> ${d.id}`)
          .style('left', (event.pageX + 5) + 'px') // Position the tooltip
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function() {
        // Hide the tooltip
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      });

    // Draw central node pie and ring charts
    node.filter(d => d.id === nodeId).each(function(d) {
      const { center, firstRing, secondRing } = themeScores;

      // Draw central node pie chart
      drawPieChart(d3.select(this), center, tooltip);

      // Draw first ring chart
      drawRingChart(d3.select(this), firstRing, 75, 65, tooltip); // Adjusted sizes for better visualization

      // Draw second ring chart
      drawRingChart(d3.select(this), secondRing, 88, 78, tooltip); // Adjusted sizes for better visualization
    });

    node.call(d3.drag()
      .on('start', dragStarted)
      .on('drag', dragged)
      .on('end', dragEnded));

    forceSimulation
      .nodes(nodes)
      .on('tick', ticked);

    forceSimulation.force('link')
      .links(links);

    function ticked() {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('transform', d => `translate(${d.x}, ${d.y})`);
    }

    function dragStarted(event, d) {
      if (!event.active) forceSimulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragEnded(event, d) {
      if (!event.active) forceSimulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  }, [graphData, tweetsData, interestData, nodeId]); // Add all dependencies

  return <svg ref={svgRef} width="100%" height="100%"></svg>;
};

const processData = (data, nodeId, tweetsData, interestData) => {
  const links = data.map(d => ({ source: d.central_user, target: d.adjacent_user }));
  const allNodes = new Set(data.map(d => d.central_user).concat(data.map(d => d.adjacent_user)));

  const firstDegreeNodes = new Set(data.filter(d => d.central_user === nodeId).map(d => d.adjacent_user));
  const secondDegreeLinks = data.filter(d => firstDegreeNodes.has(d.central_user));
  const secondDegreeNodes = new Set(secondDegreeLinks.map(d => d.adjacent_user));
  const twoDegreeNodes = new Set([...firstDegreeNodes, ...secondDegreeNodes, nodeId]);

  const filteredLinks = links.filter(d => twoDegreeNodes.has(d.source) && twoDegreeNodes.has(d.target));
  const filteredNodes = Array.from(twoDegreeNodes).map(id => ({ id }));

  // Calculate theme scores
  const themeScores = calculateThemeScores(nodeId, firstDegreeNodes, secondDegreeNodes, tweetsData, interestData);
  return { nodes: filteredNodes, links: filteredLinks, themeScores };
};

const calculateThemeScores = (nodeId, firstDegreeNodes, secondDegreeNodes, tweetsData, interestData) => {
  const themeCount = 18; // Assuming there are 18 themes
  const centerScores = new Array(themeCount).fill(0);
  const firstRingScores = new Array(themeCount).fill(0);
  const secondRingScores = new Array(themeCount).fill(0);

  // Convert tweetData from object to array of tweets for each user
  const userPosts = tweetsData[nodeId] || [];
  const firstDegreePosts = [...firstDegreeNodes].flatMap(userId => tweetsData[userId] || []);
  const secondDegreePosts = [...secondDegreeNodes].flatMap(userId => tweetsData[userId] || []);
  console.log(userPosts, firstDegreePosts, secondDegreePosts)

  const calculateScores = (posts, scoresArray) => {
    posts.forEach((post) => {
      const interest = interestData.find(
        (item) => item.post_created_ts === post.created_ts.toString()
      );
  
      if (interest) {
        // 获取兴趣分数数组
        const scores = interest.post_interests_score;
  
        // 找到最高分和最低分，用于归一化
        const maxScore = Math.max(...scores);
        const minScore = Math.min(...scores);
  
        // 归一化分数（避免除以零的情况）
        const normalizedScores = scores.map(score => 
          maxScore !== minScore 
            ? (score - minScore) / (maxScore - minScore)
            : 0
        );
  
        // 获取前五个兴趣的索引，根据归一化分数进行排序
        const topIndexes = normalizedScores
          .map((score, index) => ({ score, index }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)
          .map(item => item.index);
  
        // 只累加前五个最高分数
        topIndexes.forEach((index) => {
          scoresArray[index] += normalizedScores[index];
        });
      }
    });
  
    console.log(scoresArray);
  };
  

  

  // const calculateScores = (posts, scoresArray) => {
  //   posts.forEach((post) => {
  //     const interest = interestData.find(
  //       (item) => item.post_created_ts === post.created_ts.toString()
  //     );
  //     if (interest) {
  //       // 提取所有兴趣的分数
  //       const interestScores = interest.post_interests_score;
  //       // 计算最大值和最小值用于标准化
  //       const maxScore = Math.max(...interestScores);
  //       const minScore = Math.min(...interestScores);
  
  //       // 标准化每一个兴趣分数并累加
  //       interestScores.forEach((score, index) => {
  //         // 标准化公式
  //         const normalizedScore = (score - minScore) / (maxScore - minScore);
  
  //         // 累加标准化后的分数
  //         scoresArray[index] += normalizedScore;
  //       });
  //     }
  //   });
  //   console.log(scoresArray)
  // };
  
  // const calculateScores = (posts, scoresArray) => {
  //   posts.forEach((post) => {
  //     const interest = interestData.find(
  //       (item) => item.post_created_ts === post.created_ts.toString()
  //     );
  
  //     if (interest) {
  //       // 提取所有兴趣的分数
  //       const interestScores = interest.post_interests_score;
  
  //       // 计算最大值和最小值用于标准化
  //       const maxScore = Math.max(...interestScores);
  //       const minScore = Math.min(...interestScores);
  
  //       // 定义阈值与权重
  //       const threshold = 0; // 差异阈值
  //       const weightFactor = 1; // 权重因子
  
  //       // 标准化并增强分数差异
  //       interestScores.forEach((score, index) => {
  //         // 标准化公式
  //         let normalizedScore = (score - minScore) / (maxScore - minScore);
  
  //         // 通过非线性方式增强分数差异
  //         normalizedScore = Math.pow(normalizedScore, 2); // 指数变换
  
  //         // 根据阈值增加差异
  //         if (normalizedScore < threshold) {
  //           normalizedScore *= weightFactor; // 增强较小得分的权重
  //         }
  
  //         // 累加增强后的标准化分数
  //         scoresArray[index] += normalizedScore;
  //       });
  //     }
  //   });
  // };
  

  // Calculate scores for the central node
  calculateScores(userPosts, centerScores);

  // Calculate scores for first-degree neighbors
  calculateScores(firstDegreePosts, firstRingScores);

  // Calculate scores for second-degree neighbors
  calculateScores(secondDegreePosts, secondRingScores);

  // Normalize scores
  const normalizeScores = (scores) => {
    const total = scores.reduce((sum, val) => sum + val, 0);
    return scores.map(score => total > 0 ? score / total : 0); // Avoid division by zero
  };

  return {
    center: normalizeScores(centerScores),
    firstRing: normalizeScores(firstRingScores),
    secondRing: normalizeScores(secondRingScores)
  };
};

// Define the color palette for the pie chart and rings
const colorPalette = [
  '#DB9487', '#E4B789', '#DCCE88', '#D0DB88', '#B2D688', '#98CC85',
  '#8DC990', '#8DCCAA', '#8DCEC5', '#88CED9', '#87B2D9', '#8695CB',
  '#8F86BF', '#A687BD', '#BA89BB', '#CA89B9', '#D785B0', '#D98595'
];

// Define category labels
const categoryLabels = [
  'Arts and Fashion', 'Books and Literature', 'Business, Finance, and Entrepreneurs', 
  'Celebrity and Pop Culture', 'Crisis (War and Disaster)', 'Family and Parenting', 
  'Film, TV, and Video', 'Fitness and Health', 'Food and Dining', 'Games', 
  'Law, Government, and Politics', 'Learning and Educational', 'Music', 
  'News and Social Concern', 'Pets', 'Science and Technology', 'Sports', 
  'Travel and Adventure'
];


const drawPieChart = (container, scores, tooltip) => {
  const radius = 50;
  const color = d3.scaleOrdinal(colorPalette);

  const pie = d3.pie().value(d => d.score);
  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(radius);

  const pieData = pie(scores.map((score, index) => ({ score, index })));

  const g = container.append('g')
    .attr('transform', 'translate(0, 0)');

  g.selectAll('path')
    .data(pieData)
    .enter().append('path')
    .attr('d', arc)
    .attr('fill', (d) => color(d.data.index))  // 使用原始索引来选择颜色
    .attr('stroke', 'none')
    .on('mouseover', function(event, d) {
      tooltip.transition().duration(200).style('opacity', 0.9);
      tooltip.html(`<strong>${categoryLabels[d.data.index]}</strong>: ${(d.data.score * 100).toFixed(2)}%`)
        .style('left', event.pageX + 5 + 'px')
        .style('top', event.pageY - 28 + 'px');
    })
    .on('mouseout', function() {
      tooltip.transition().duration(500).style('opacity', 0);
    });
};
// Draw ring chart
const drawRingChart = (container, scores, outerRadius, innerRadius, tooltip) => {
  const color = d3.scaleOrdinal(colorPalette);

  const pie = d3.pie().value(d => d.score);
  const arc = d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius);

    const pieData = pie(scores.map((score, index) => ({ score, index })));

  const g = container.append('g')
    .attr('transform', 'translate(0, 0)');

  g.selectAll('path')
    .data(pieData)
    .enter().append('path')
    .attr('d', arc)
    .attr('fill', (d) => color(d.data.index))
    .attr('stroke', 'none')
    .on('mouseover', function(event, d) {
      tooltip.transition().duration(200).style('opacity', 0.9);
      tooltip.html(`<strong>${categoryLabels[d.data.index]}</strong>: ${(d.data.score * 100).toFixed(2)}%`)
        .style('left', event.pageX + 5 + 'px')
        .style('top', event.pageY - 28 + 'px');
    })
    .on('mouseout', function() {
      tooltip.transition().duration(500).style('opacity', 0);
    });
};

// 获取标签颜色
const getLabelColor = (userId) => {
  const storedData = localStorage.getItem('userLabels');
  if (storedData) {
    const userLabels = JSON.parse(storedData);
    const label = userLabels[userId] ? userLabels[userId].label : null;
    console.log(userLabels['1222894323152195586'])
    console.log(userId, label)
    switch (label) {
      case 'arts and fashion':
        return '#DB9487'; // Color for arts and fashion
      case 'books and literature':
        return '#E4B789'; // Color for books and literature
      case 'business finance and entrepreneurs':
        return '#DCCE88'; // Color for business finance and entrepreneurs
      case 'celebrity and pop culture':
        return '#D0DB88'; // Color for celebrity and pop culture
      case 'crisis (war and disaster)':
        return '#B2D688'; // Color for crisis (war and disaster)
      case 'family and parenting':
        return '#98CC85'; // Color for family and parenting
      case 'film tv and video':
        return '#8DC990'; // Color for film tv and video
      case 'fitness and health':
        return '#8DCCAA'; // Color for fitness and health
      case 'food and dining':
        return '#8DCEC5'; // Color for food and dining
      case 'games':
        return '#88CED9'; // Color for games
      case 'law government and politics':
        return '#87B2D9'; // Color for law government and politics
      case 'learning and educational':
        return '#8695CB'; // Color for learning and educational
      case 'music':
        return '#8F86BF'; // Color for music
      case 'news and social concern':
        return '#A687BD'; // Color for news and social concern
      case 'pets':
        return '#BA89BB'; // Color for pets
      case 'science and technology':
        return '#CA89B9'; // Color for science and technology
      case 'sports':
        return '#D785B0'; // Color for sports
      case 'travel and adventure':
        return '#D98595'; // Color for travel and adventure
      default:
        return 'grey'; // Default color for untagged nodes
    }
  }
  return 'grey'; // Default color if no data found
};

export default ForceGraph;
