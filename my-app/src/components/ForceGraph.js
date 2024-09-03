import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import axios from 'axios';
import { Slider, ConfigProvider, Popover } from 'antd'; // 引入 Slider 组件
import './ForceGraph.css';
import { addDays, addMonths, addYears } from 'date-fns';

const labelMapping = [
  "arts and fashion",
  "books and literature",
  "business finance and entrepreneurs",
  "celebrity and pop culture",
  "crisis (war and disaster)",
  "family and parenting",
  "film tv and video",
  "fitness and health",
  "food and dining",
  "games",
  "law government and politics",
  "learning and educational",
  "music",
  "news and social concern",
  "pets",
  "science and technology",
  "sports",
  "travel and adventure"
];

const ForceGraph = ({ nodeId, labels, filters, dateRange, interval, selectedLabel }) => {
  const svgRef = useRef();
  const width = 400;
  const height = 200;

  const [graphData, setGraphData] = useState(null);
  const [tweetsData, setTweetsData] = useState(null);
  const [interestData, setInterestData] = useState(null);
  const [filterRange, setFilterRange] = useState([0, 1]); // 用于存储筛选条的值
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [neighborhoodResponse, tweetsResponse, interestsResponse] = await Promise.all([
          axios.get('/node_relations_53.json'),
          axios.get('/organized_by_user_id_with_info_extract.json'),
          axios.get('/tweets_interests_top18_extract.json')
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
    if (!graphData || !tweetsData || !interestData) return;

    const svgElement = d3.select(svgRef.current);
    svgElement.selectAll('*').remove();

    const svg = svgElement
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const zoomBehavior = d3.zoom().on('zoom', (event) => {
      svg.attr('transform', event.transform);
    });

    svgElement.call(zoomBehavior);

    const forceSimulation = d3.forceSimulation()
      .force('link', d3.forceLink().id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-800))
      .force('center', d3.forceCenter(0, 0));

    const { nodes, links, themeScores } = processData(graphData, nodeId, tweetsData, interestData, filterRange, filters, interval, dateRange);

    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('padding', '6px 12px')
      .style('background-color', '#fff')
      .style('border', '1px solid #ccc')
      .style('border-radius', '4px')
      .style('box-shadow', '0 2px 8px rgba(0, 0, 0, 0.1)')
      .style('font-size', '14px')
      .style('pointer-events', 'none')
      .style('opacity', 0);

    const link = svg.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke-width', 1)
      .attr('stroke', '#999');

    const node = svg.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .attr('class', 'node');

    node.append('circle')
      .attr('r', d => d.id === nodeId ? 0 : 5)
      .attr('fill', d => d.id === nodeId ? 'transparent' : getLabelColor(d.id, labels))
      .on('mouseover', function(event, d) {
        tooltip.transition().duration(200).style('opacity', .9);
        tooltip.html(`<strong>ID:</strong> ${d.id}`)
          .style('left', (event.pageX + 5) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function() {
        tooltip.transition().duration(500).style('opacity', 0);
      });

    node.filter(d => d.id === nodeId).each(function(d) {
      const { center, firstRing, secondRing } = themeScores;

      drawPolarAreaChart(d3.select(this), center, tooltip);

      drawRingChart(d3.select(this), firstRing, 70, 60, tooltip);

      drawRingChart(d3.select(this), secondRing, 80, 70, tooltip);
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
  }, [graphData, tweetsData, interestData, nodeId, filterRange, filters, dateRange, labels, selectedLabel]);

return (
  <div>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: 265 }}>
      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <Popover content={<div style={{ maxWidth: 300, fontSize: '10px' }}>Displays the cumulative relevance score of posts from users and their neighbors across different topics, with 0 being the least relevant and 1 being the most relevant.</div>} placement="top" arrow={false}>
          <h3 style={{ marginLeft: 10, marginTop: 0, marginBottom: 18, marginRight:40, fontSize: '14px' }}>
            Relevance
          </h3>
        </Popover>
      <ConfigProvider
        theme={{
          components: {
            Slider: {
              handleSize: 5, // Adjust the size of the slider handle (circle)
              handleSizeHover: 8,
              railSize: 5,
              trackBg: '#0095FF',
            },
          },
        }}
      >

          <Slider
            range
            defaultValue={filterRange}
            marks={{
              0: {
                style: {
                  fontSize: '9px', // Reduce font size
                  transform: 'translateX(-320%) translateY(-100%)', // Adjust position to the left end
                },
                label: '0',
              },
              1: {
                style: {
                  fontSize: '9px', // Reduce font size
                  transform: 'translateX(320%) translateY(-100%)', // Adjust position to the right end
                },
                label: '1',
              },
            }}
            min={0}
            max={1}
            step={0.01}
            onChange={(value) => setFilterRange(value)}
            style={{ width: 220, fontSize: '4px' }}
          />
      </ConfigProvider>
      </div>
      <svg ref={svgRef}></svg>
    </div>
    <Popover content={<div style={{ maxWidth: 300, fontSize: '10px' }}>Shows the proportion and specific number of users with assigned labels within each category.</div>} placement="top" arrow={false}>
      <div style={{ marginLeft: 0, marginTop: 15, fontSize: '10px', marginBottom: 0}}>Labeled Ratio</div>
    </Popover>
  </div>
);

  
  
};





const processData = (data, nodeId, tweetsData, interestData, filterRange, filters, interval, dateRange) => {
  const links = data.map(d => ({ source: d.central_user, target: d.adjacent_user }));
  const allNodes = new Set(data.map(d => d.central_user).concat(data.map(d => d.adjacent_user)));

  const firstDegreeNodes = new Set(data.filter(d => d.central_user === nodeId).map(d => d.adjacent_user));
  const secondDegreeLinks = data.filter(d => firstDegreeNodes.has(d.central_user));
  const secondDegreeNodes = new Set(secondDegreeLinks.map(d => d.adjacent_user));
  const twoDegreeNodes = new Set([...firstDegreeNodes, ...secondDegreeNodes, nodeId]);

  const filteredLinks = links.filter(d => twoDegreeNodes.has(d.source) && twoDegreeNodes.has(d.target));
  const filteredNodes = Array.from(twoDegreeNodes).map(id => ({ id }));

  // console.log(nodeId, firstDegreeNodes, secondDegreeNodes)
  const themeScores = calculateThemeScores(nodeId, firstDegreeNodes, secondDegreeNodes, tweetsData, interestData, filters, interval, dateRange);
  // 按照filterRange过滤themeScores
  const filteredThemeScores = {
    center: themeScores.center.map(score => (score >= filterRange[0] && score <= filterRange[1]) ? score : 0),
    firstRing: themeScores.firstRing.map(score => (score >= filterRange[0] && score <= filterRange[1]) ? score : 0),
    secondRing: themeScores.secondRing.map(score => (score >= filterRange[0] && score <= filterRange[1]) ? score : 0),
  };

  return { nodes: filteredNodes, links: filteredLinks, themeScores: filteredThemeScores };
};

const calculateThemeScores = (nodeId, firstDegreeNodes, secondDegreeNodes, tweetsData, interestData, filters, interval, dateRange) => {
  const themeCount = 18;
  const centerScores = new Array(themeCount).fill(0);
  const firstRingScores = new Array(themeCount).fill(0);
  const secondRingScores = new Array(themeCount).fill(0);

  // Filter tweets for userPosts, firstDegreePosts, and secondDegreePosts
  const filterTweets = (posts) => {
    return posts.filter((post) => {
      const tweetDate = new Date(post.created_at);
      let [startDate, endDate] = dateRange;

      if (interval === 'day') {
        endDate = addDays(endDate, 1);
      }
      if (interval === 'month') {
        endDate = addMonths(endDate, 1);
      }
      if (interval === 'year') {
        endDate = addYears(endDate, 1);
      }

      if (startDate != null && endDate != null) {
        if (tweetDate < startDate || tweetDate > endDate) {
          return false;
        }
      }

      if (post.status_type === 1 && filters.includes('post')) {
        return true;
      }
      if (post.status_type === 2 && filters.includes('repost')) {
        return true;
      }
      if (post.status_type === 3 && filters.includes('reply')) {
        return true;
      }
      return false;
    });
  };

  const userPosts = filterTweets(tweetsData[nodeId] || []);
  const firstDegreePosts = filterTweets([...firstDegreeNodes].flatMap(userId => tweetsData[userId] || []));
  const secondDegreePosts = filterTweets([...secondDegreeNodes].flatMap(userId => tweetsData[userId] || []));
  // console.log(userPosts, firstDegreePosts, secondDegreePosts);

  const calculateScores = (posts, scoresArray) => {
    let postCount = 0; // 初始化计数器
  
    posts.forEach((post) => {
      const interest = interestData.find(
        (item) => item.post_created_ts === post.created_ts.toString()
      );
      if (interest) {
        const scores = interest.post_interests_score;
        const maxScore = Math.max(...scores);
        const minScore = Math.min(...scores);
  
        // 归一化分数（避免除以零的情况）
        const normalizedScores = scores.map((score) =>
          maxScore !== minScore ? (score - minScore) / (maxScore - minScore) : 0
        );
        
        normalizedScores.forEach((score, index) => {
          scoresArray[index] += score;
        });
  
        postCount++; // 增加帖子计数
      }
    });
  
    // 计算每个类别的平均值
    if (postCount > 0) {
      for (let i = 0; i < scoresArray.length; i++) {
        scoresArray[i] /= postCount;
      }
    }
  
    // console.log(scoresArray);
  };

  calculateScores(userPosts, centerScores);
  calculateScores(firstDegreePosts, firstRingScores);
  calculateScores(secondDegreePosts, secondRingScores);

  return {
    center: centerScores,
    firstRing: firstRingScores,
    secondRing: secondRingScores,
  };
}

const drawPolarAreaChart = (container, scores, tooltip) => {
  const radius = 60;

  // 顺时针循环使用18种颜色
  const colorCycle = [
    '#DB9487', '#E4B789', '#DCCE88', '#D0DB88', '#B2D688', '#98CC85', '#8DC990', '#8DCCAA', '#8DCEC5', 
    '#88CED9', '#87B2D9', '#8695CB', '#8F86BF', '#A687BD', '#BA89BB', '#CA89B9', '#D785B0', '#D98595'
  ];

  const angleScale = d3.scaleLinear()
    .domain([0, scores.length])
    .range([0, 2 * Math.PI]);

  const radiusScale = d3.scaleLinear()
    .domain([0, 1])
    .range([0, radius]);

  const arcGenerator = d3.arc()
    .innerRadius(0)
    .outerRadius(d => radiusScale(d.score))
    .startAngle((d, i) => angleScale(i))
    .endAngle((d, i) => angleScale(i + 1))
    .padAngle(0.02)  // 添加间隙
    .padRadius(30);

  const arcs = scores.map((score, i) => ({
    index: i,
    score
  }));

  container.append('g')
    .attr('class', 'polar-area-chart')
    .selectAll('path')
    .data(arcs)
    .enter()
    .append('path')
    .attr('d', arcGenerator)
    .attr('fill', (d, i) => colorCycle[i % colorCycle.length]) // 使用循环颜色
    .on('mouseover', function(event, d) {
      tooltip.transition().duration(200).style('opacity', .9);
      tooltip.html(`${labelMapping[d.index]}:</strong> ${d.score.toFixed(2)}`)
        .style('left', (event.pageX + 5) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', function() {
      tooltip.transition().duration(500).style('opacity', 0);
    });
};

const drawRingChart = (container, scores, outerRadius, innerRadius, tooltip) => {
  // 顺时针循环使用18种颜色
  const colorCycle = [
    '#DB9487', '#E4B789', '#DCCE88', '#D0DB88', '#B2D688', '#98CC85', '#8DC990', '#8DCCAA', '#8DCEC5', 
    '#88CED9', '#87B2D9', '#8695CB', '#8F86BF', '#A687BD', '#BA89BB', '#CA89B9', '#D785B0', '#D98595'
  ];

  const angleScale = d3.scaleLinear()
    .domain([0, scores.length])
    .range([0, 2 * Math.PI]);

  const radiusScale = d3.scaleLinear()
    .domain([0, 1])
    .range([innerRadius, outerRadius]);

  const arcGenerator = d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(d => radiusScale(d.score))
    .startAngle((d, i) => angleScale(i))
    .endAngle((d, i) => angleScale(i + 1))
    .padAngle(0.02)  // 添加间隙
    .padRadius(30);

  const arcs = scores.map((score, i) => ({
    index: i,
    score
  }));

  container.append('g')
    .attr('class', 'ring-chart')
    .selectAll('path')
    .data(arcs)
    .enter()
    .append('path')
    .attr('d', arcGenerator)
    .attr('fill', (d, i) => colorCycle[i % colorCycle.length]) // 使用循环颜色
    .on('mouseover', function (event, d) {
      tooltip.transition().duration(200).style('opacity', .9);
      tooltip.html(`${labelMapping[d.index]}:</strong> ${d.score.toFixed(2)}`)
        .style('left', (event.pageX + 5) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', function () {
      tooltip.transition().duration(500).style('opacity', 0);
    });
};



const getLabelColor = (userId, labels) => {
  const label = labels[userId] ? labels[userId].label : null;
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
};


export default ForceGraph;
