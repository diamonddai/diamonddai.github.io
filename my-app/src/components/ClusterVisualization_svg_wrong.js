import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import * as d3 from "d3";
import axios from "axios";
import "antd/dist/reset.css"; // Ant Design样式导入
import "./ClusterVisualization.css";

const ClusterVisualization = () => {
  const svgRef = useRef();
  const [data, setData] = useState(null);

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

  // Size 相关的缩放常量
  const SIZE_SCALE_FACTOR = 10;

  // 用于处理 intraDistance 的缩放函数
  const scaleIntraDistance = (intraDistances) => {
    const maxIntra = Math.max(...intraDistances);
    const minIntra = Math.min(...intraDistances);

    // 线性缩放到 0-20 范围
    return intraDistances.map(
      (value) => ((value - minIntra) / (maxIntra - minIntra)) * 20
    );
  };

  // 用于处理 interDistance 的缩放函数
  const scaleInterDistance = (interDistances) => {
    const maxInter = Math.max(...interDistances);
    const minInter = Math.min(...interDistances);

    // 线性缩放到 0-100 范围
    return interDistances.map(
      (value) => ((value - minInter) / (maxInter - minInter)) * 100
    );
  };
  // useEffect(() => {
  //   console.log("Component Rendered - svgRef:", svgRef.current);
  // }, []);

  // useLayoutEffect(() => {
  //   console.log("Component Layout - svgRef:", svgRef.current);
  // }, []);

  useEffect(() => {
    if (svgRef.current) {
      console.log("SVG element successfully rendered:", svgRef.current);
    } else {
      console.log("SVG element not rendered yet");
    }
  }, [svgRef.current]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Starting data fetch...");

        const response = await axios.post(
          "http://localhost:5000/calculate_metrics_initial",
          {}
        );

        console.log("API response received:", response);

        if (
          response.data &&
          response.data.intra_distances &&
          response.data.inter_distances &&
          response.data.sizes &&
          response.data.word_clouds
        ) {
          const { intra_distances, inter_distances, sizes, word_clouds } =
            response.data;

          console.log("Data from API:", {
            intra_distances,
            inter_distances,
            sizes,
            word_clouds,
          });

          // 应用缩放函数
          const scaledIntraDistances = scaleIntraDistance(intra_distances);
          const scaledInterDistances = scaleInterDistance(inter_distances);

          const chartData = labels.map((label, index) => ({
            name: label,
            size: sizes[index] / SIZE_SCALE_FACTOR,
            intraDistance: scaledIntraDistances[index],
            interDistance: scaledInterDistances[index],
            wordCloud: word_clouds[index],
            color: labelsColors[index],
          }));

          console.log("ChartData constructed:", chartData);

          setData(chartData);
        } else {
          console.error(
            "API response format is incorrect or missing data:",
            response.data
          );
        }
      } catch (error) {
        console.error("Error fetching data from backend:", error);
      }
    };

    fetchData();
  }, []);

  // useEffect(() => {
  //   if (data) {
  //     drawClusters();
  //   }
  // }, [data]);

  const drawClusters = () => {
    // 检查传递的数据
    console.log("Data passed to drawClusters:", data);

    if (!svgRef.current) {
      console.error("SVG element not found!");
      return;
    }

    // 检查 SVG 的尺寸
    console.log(
      "SVG Size:",
      svgRef.current.clientWidth,
      svgRef.current.clientHeight
    );
    const svg = d3
      .select(svgRef.current)
      .attr("width", "100%")
      .attr("height", "100%");
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
      .force("charge", d3.forceManyBody().strength(10))
      .force("center", d3.forceCenter(500, 400))
      .force(
        "collision",
        d3
          .forceCollide()
          .radius((d) => d.size + d.interDistance / SIZE_SCALE_FACTOR + 10)
      )
      .on("tick", ticked);

    function ticked() {
      // console.log(
      //   "Node positions:",
      //   data.map((d) => ({ x: d.x, y: d.y }))
      // );
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
      console.log("Circles rendered:", circles.size());

      const spikes = g
        .selectAll(".spike-path")
        .data(data)
        .join("path")
        .attr("class", "spike-path")
        .attr("d", (d) => {
          const r1 = d.size;
          const r2 = r1 + d.interDistance / SIZE_SCALE_FACTOR;
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
            .style("font-size", "24px")
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
            fontSize: i === 0 ? "25px" : i === 1 || i === 2 ? "24px" : "20px",
            x: d.x + radius * Math.cos((2 * Math.PI * i) / words.length),
            y: d.y + radius * Math.sin((2 * Math.PI * i) / words.length),
            dy: 0,
          }));
        })
        .join("tspan")
        .attr("x", (d) => d.x)
        .attr("y", (d) => d.y)
        .text((d) => d.text)
        .style("font-size", (d) => d.fontSize)
        .style("fill", (d) => d.color)
        .style("font-weight", "normal");
    }

    return (
      <div className="cluster-visualization-container">
        <svg ref={svgRef}></svg>
      </div>
    );
  };
};

export default ClusterVisualization;
