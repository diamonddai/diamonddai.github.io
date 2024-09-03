import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as d3Force from "d3-force";
import * as d3PCA from "ml-pca"; // 需要安装 ml-pca 库
import axios from "axios";
import "antd/dist/reset.css"; // Ant Design样式导入
import "./ClusterVisualization.css";

const ClusterVisualization = () => {
  const svgRef = useRef();
  const [data, setData] = useState(null);

  // 使用全局状态，读取本地文件
  //   const [centroidFeatureVectors, setCentroidFeatureVectors] = useState(null);

  // 第一个 useEffect 用于加载 JSON 文件中的数据 (前端简答展示版)
  //   useEffect(() => {
  //     async function fetchCentroidData() {
  //       try {
  //         const response = await fetch("/centroid_feature_vectors.json");
  //         const data = await response.json();
  //         console.log("Loaded centroid feature vectors:", data); // 调试信息
  //         setCentroidFeatureVectors(data); // 将加载的数据存储到状态中
  //       } catch (error) {
  //         console.error("Error fetching the centroid feature vectors:", error);
  //       }
  //     }

  //     fetchCentroidData();
  //   }, []);

  const labels = [
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
    "travel and adventure",
  ];

  const labelsColors = [
    "#DB9487",
    "#E4B789",
    "#DCCE88",
    "#D0DB88",
    "#B2D688",
    "#98CC85",
    "#8DC990",
    "#8DCCAA",
    "#8DCEC5",
    "#88CED9",
    "#87B2D9",
    "#8695CB",
    "#8F86BF",
    "#A687BD",
    "#BA89BB",
    "#CA89B9",
    "#D785B0",
    "#D98595",
  ];

  const SIZE_SCALE_FACTOR = 8; //change cluster size

  const scaleIntraDistance = (intraDistances) => {
    const maxIntra = Math.max(...intraDistances);
    const minIntra = Math.min(...intraDistances);

    return intraDistances.map((value) => {
      const scaledValue = ((value - minIntra) / (maxIntra - minIntra)) * 20;
      return isNaN(scaledValue) ? 10 : scaledValue; // 如果计算结果为NaN，设置默认值10
    });
  };

  // 将interDistance映射到20到100之间
  const scaleInterDistance = (interDistances) => {
    const maxInter = Math.max(...interDistances);
    const minInter = Math.min(...interDistances);

    return interDistances.map((value) => {
      const scaledValue =
        ((value - minInter) / (maxInter - minInter)) * 80 + 20;
      return isNaN(scaledValue) ? 50 : scaledValue; // 如果计算结果为NaN，设置默认值50
    });
  };
  // 自动计算 SIZE_SCALE_FACTOR 使得 size 在 60 到 70 之间
  const calculateSizeScaleFactor = (sizes) => {
    const maxSize = Math.max(...sizes);
    const minSize = Math.min(...sizes);

    // 设定目标范围为 10 到 120 之间
    const targetMax = 20;
    const targetMin = 10;

    // 根据最大最小值计算出合适的 SCALE_FACTOR
    const scaleFactor = (maxSize - minSize) / (targetMax - targetMin);
    return isNaN(scaleFactor) ? 1 : scaleFactor; // 防止NaN值，默认返回1
  };

  // 🟡🟡新增函数：降维特征向量
  const reduceDimensions = (featureVectors) => {
    if (!featureVectors) {
      console.log("Feature vectors are null or undefined.");
      return [];
    }
    const pca = new d3PCA.PCA(featureVectors);
    const reducedData = pca.predict(featureVectors, { nComponents: 2 });
    console.log("Reduced data after PCA:", reducedData); // 调试信息
    return reducedData;
  };

  useEffect(() => {
    axios({
      method: "post",
      url: "http://106.15.36.115:8008/calculateMetricsInitial", //http://106.15.36.115:8008/calculateMetricsInitial
      responseType: "json",
      timeout: 120 * 1000,
      data: {}, //备选方案 requestBody
    })
      .then(function (rspData) {
        if (
          rspData.data &&
          rspData.data.centroid_feature_vectors && // 假设返回了特征向量；服务器获取数据版
          rspData.data.intra_distances &&
          rspData.data.inter_distances &&
          rspData.data.sizes &&
          rspData.data.word_clouds &&
          rspData.data.returnedLabels
        ) {
          const {
            centroid_feature_vectors, // 假设返回了特征向量；服务器获取数据版
            intra_distances,
            inter_distances,
            sizes,
            word_clouds,
            returnedLabels
          } = rspData.data;

          // 确保 centroidFeatureVectors 已经加载完毕；本地读取文件
          //   if (!centroidFeatureVectors) {
          //     console.error("Centroid feature vectors are not loaded yet.");
          //     return;
          //   }
          // 1. 降维特征向量
          const reducedData = reduceDimensions(centroid_feature_vectors); // centroidFeatureVectors centroid_feature_vectors

          const scaledIntraDistances = scaleIntraDistance(intra_distances);
          const scaledInterDistances = scaleInterDistance(inter_distances);
          const SIZE_SCALE_FACTOR = calculateSizeScaleFactor(sizes);
          // 2. 使用 reducedData 提供的坐标，并结合其他数据生成可视化数据
          const chartData = returnedLabels
            .map((label, index) => {
              const reducedPoint = reducedData.data[index]; // 注意：.data 是因为 reducedData 是 PCA 结果的一个对象

              if (!reducedPoint || reducedPoint.length < 2) {
                console.log(`Reduced data point at index ${index} is undefined or malformed.`);
                return null;
              }

              return {
                name: labels[label],
                size: parseInt(sizes[index] / SIZE_SCALE_FACTOR),
                intraDistance: parseInt(scaledIntraDistances[index]),
                interDistance: parseInt(scaledInterDistances[index]),
                wordCloud: word_clouds[index],
                color: labelsColors[label],
                x: reducedPoint[0] * 500, // 调整比例以适应视图大小
                y: reducedPoint[1] * 500,
              };
            })
            .filter((d) => d !== null); // 过滤掉任何无效的数据点

          console.log(chartData);
          setData(chartData);
        } else {
          console.log("API response format is incorrect or missing data:",rspData.data);
        }
      })
      .catch(function (errorMsg) {
        console.log("Error in API request:", errorMsg);
      });
  }, []); // centroidFeatureVectors

  useEffect(() => {
    if (svgRef.current && data) {
      console.log("Data to be visualized:", data); // 调试信息
      drawClusters();
    } else {
      console.log("SVG or data is missing:", svgRef.current, data); // 调试信息
    }
  }, [data]);

  const drawClusters = () => {
    if (!svgRef.current) {
      console.log("SVG element not found!");
      return;
    }

    const svg = d3
      .select(svgRef.current)
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", "0 0 650 500");

    svg.selectAll("*").remove();

    const g = svg.append("g").attr("transform", "translate(50,50)");
    const zoom = d3
      .zoom()
      .scaleExtent([0.5, 10])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    const simulation = d3
      .forceSimulation(data)
      .force("charge", d3Force.forceManyBody().strength(-30))
      .force("center", d3Force.forceCenter(310, 250))
      .force(
        "collision",
        d3Force.forceCollide().radius((d) => d.size + d.interDistance + 10)
      )
      .on("tick", ticked);

    function ticked() {
      data.forEach((d) => {
        if (isNaN(d.x)) d.x = 310; // 赋予默认值，防止 NaN
        if (isNaN(d.y)) d.y = 250; // 赋予默认值，防止 NaN
      });

      const circles = g
        .selectAll(".center-circle")
        .data(data)
        .join("circle")
        .attr("class", "center-circle")
        .attr("r", (d) => d.size)
        .attr("fill", "white")
        .attr("stroke", (d) => d.color)
        .attr("stroke-width", 2)
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y);

      const spikes = g
        .selectAll(".spike-path")
        .data(data)
        .join("path")
        .attr("class", "spike-path")
        .attr("d", (d) => {
          if (isNaN(d.x) || isNaN(d.y)) return ""; // 避免 NaN 路径生成
          const r1 = d.size;
          const r2 = r1 + d.interDistance;
          const spikeCount = d.intraDistance;
          let path = "";
          for (let i = 0; i < spikeCount; i++) {
            const angle = ((2 * Math.PI) / spikeCount) * i;
            const angleNext = ((2 * Math.PI) / spikeCount) * (i + 1);
            const x1 = d.x + r1 * Math.cos(angle);
            const y1 = d.y + r1 * Math.sin(angle);
            const x2 = d.x + r2 * Math.cos(angle + Math.PI / spikeCount);
            const y2 = d.y + r2 * Math.sin(angle + Math.PI / spikeCount);
            const x3 = d.x + r1 * Math.cos(angleNext);
            const y3 = d.y + r1 * Math.sin(angleNext);
            path += `M${x1},${y1}L${x2},${y2}L${x3},${y3}Z`;
          }
          return path;
        })
        .attr("fill", (d) => d.color)
        .attr("stroke", "none");

      const overlayCircles = g
        .selectAll(".overlay-center-circle")
        .data(data)
        .join("circle")
        .attr("class", "overlay-center-circle")
        .attr("r", (d) => d.size)
        .attr("fill", "white")
        .attr("stroke", (d) => d.color)
        .attr("stroke-width", 2)
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y);

      const labels = g
        .selectAll(".label-text")
        .data(data)
        .join("text")
        .attr("class", "label-text")
        .attr("text-anchor", "middle")
        .attr("x", (d) => d.x)
        .attr("y", (d) => d.y)
        .each(function (d) {
          const words = d.name.split(" ");
          const totalHeight = words.length * 1.1;
          d3.select(this)
            .selectAll("tspan")
            .data(words)
            .join("tspan")
            .attr("x", d.x)
            .attr("dy", (word, i) => {
              const dy = i === 0 ? -totalHeight / 2 : 1.1;
              return dy + "em";
            })
            .text((word) => word)
            .style("font-family", "Arial") // 添加字体类型
            .style("font-size", "20px")
            .style("fill", d.color)
            .style("font-weight", "bold");
        });

      const wordTexts = g
        .selectAll(".word-text")
        .data(data)
        .join("text")
        .attr("class", "word-text")
        .attr("text-anchor", "middle")
        .attr("x", (d) => d.x)
        .attr("y", (d) => d.y)
        .selectAll("tspan")
        .data((d) => {
          const words = d.wordCloud;
          const radius = d.size * 0.6;
          return words.map((word, i) => ({
            text: word,
            color: d.color,
            fontSize: i === 0 ? "23px" : i === 1 || i === 2 ? "21px" : "16px",
            x: d.x + radius * Math.cos((2 * Math.PI * i) / words.length),
            y: d.y + radius * Math.sin((2 * Math.PI * i) / words.length),
            dy: 0,
          }));
        })
        .join("tspan")
        .attr("x", (d) => d.x)
        .attr("y", (d) => d.y)
        .text((d) => d.text)
        .style("font-family", "Arial") // 添加字体类型
        .style("font-size", (d) => d.fontSize)
        .style("fill", (d) => d.color)
        .style("font-weight", "normal");
    }
  };

  return (
    <div className="cluster-visualization-container">
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default ClusterVisualization;
