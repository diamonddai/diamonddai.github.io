import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const ClusterVisualization = () => {
  const svgRef = useRef();

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
  const word_clouds = [
    ["innovation", "technology", "future", "AI", "growth"],
    ["market", "strategy", "development", "business", "analysis"],
    ["data", "insights", "intelligence", "cloud", "big data"],
    ["optimization", "efficiency", "performance", "scalability", "solutions"],
    ["customer", "experience", "service", "feedback", "loyalty"],
    ["networking", "connectivity", "communication", "IoT", "5G"],
    ["security", "privacy", "protection", "cybersecurity", "encryption"],
    ["research", "innovation", "discovery", "trends", "advancements"],
    ["management", "leadership", "team", "organization", "culture"],
    ["investment", "funding", "capital", "venture", "returns"],
    ["sales", "marketing", "advertising", "promotion", "growth"],
    ["education", "learning", "development", "training", "skills"],
    ["healthcare", "medicine", "treatment", "wellness", "prevention"],
    ["sustainability", "environment", "green", "renewable", "ecology"],
    ["entertainment", "media", "content", "digital", "engagement"],
    ["manufacturing", "production", "quality", "automation", "efficiency"],
    ["transportation", "mobility", "logistics", "shipping", "infrastructure"],
    ["finance", "economy", "investment", "banking", "wealth"],
  ];

  const sizes = [
    12345, 5432, 18234, 9876, 15000, 13456, 22000, 14567, 21000, 19999, 16789,
    24567, 18000, 11111, 23456, 17500, 20123, 16000,
  ];

  const intraDistances = [
    12, 20, 7, 25, 15, 9, 18, 22, 6, 19, 8, 21, 17, 11, 14, 23, 10, 5, 16,
  ];

  const interDistances = [
    234, 789, 456, 901, 678, 543, 812, 367, 750, 485, 299, 658, 710, 420, 555,
    632, 800, 470, 390,
  ];

  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  useEffect(() => {
    drawClusters();
  }, []);

  const drawClusters = () => {
    const data = labels.map((label, index) => ({
      name: label,
      size: sizes[index],
      intraDistance: intraDistances[index],
      interDistance: interDistances[index],
      color: colors(index),
    }));

    const svg = d3
      .select(svgRef.current)
      .attr("width", 1000)
      .attr("height", 800);

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
          .radius((d) => d.size / 300 + d.interDistance / 10 + 10)
      ) // 调整尺寸
      .on("tick", ticked);

    function ticked() {
      const circles = g
        .selectAll(".center-circle")
        .data(data)
        .join("circle")
        .attr("class", "center-circle")
        .attr("r", (d) => d.size / 300) // 调整尺寸
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
          const r1 = d.size / 300; // 调整尺寸
          const r2 = r1 + d.interDistance / 10;
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

      // 重新覆盖绘制中心圆
      const overlayCircles = g
        .selectAll(".overlay-center-circle")
        .data(data)
        .join("circle")
        .attr("class", "overlay-center-circle")
        .attr("r", (d) => d.size / 300) // 调整尺寸
        .attr("fill", "white")
        .attr("stroke", (d) => d.color)
        .attr("stroke-width", 2)
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y);

      // 绘制文本
      const texts = g
        .selectAll("text")
        .data(data)
        .join("text")
        .attr("text-anchor", "middle")
        .attr("dy", (d) => `-${d.size / 600}px`) // 调整初始位置
        .attr("x", (d) => d.x)
        .attr("y", (d) => d.y)
        .selectAll("tspan")
        .data((d) => {
          const words = d.name.split(" ");
          return words.map((word, i) => ({
            text: word,
            color: d.color,
            x: d.x,
            y: d.y,
            dy: `${i * 1.1}em`,
          }));
        })
        .join("tspan")
        .attr("x", (d) => d.x)
        .attr("dy", (d, i) => (i === 0 ? 0 : "1.1em"))
        .text((d) => d.text)
        .style("font-size", "10px") // 调整字体大小
        .style("fill", (d) => d.color); // 设置字体颜色与锯齿尖颜色一致
    }
  };

  return <svg ref={svgRef}></svg>;
};

export default ClusterVisualization;
