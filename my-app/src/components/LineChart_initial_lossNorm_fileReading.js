import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import ResizeObserver from "resize-observer-polyfill";
import "./LineChart.css";

const LineChart = () => {
  const svgRef = useRef();
  const wrapperRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(
        process.env.PUBLIC_URL + "/training_records_iteration_1.json"
      );
      const rawData = await response.json();

      const selectedEpochs = [1, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200];
      const filtered = rawData.filter((record) =>
        selectedEpochs.includes(record.epoch)
      );

      // 找到 Loss 的最小值和最大值
      const minLoss = Math.min(...filtered.map((d) => d.loss));
      const maxLoss = Math.max(...filtered.map((d) => d.loss));

      // 对 Loss 进行指数缩放归一化处理，并将结果调整到 [0.1, 0.9] 范围
      const normalizedData = filtered.map((d) => ({
        ...d,
        loss:
          ((Math.exp(d.loss) - Math.exp(minLoss)) /
            (Math.exp(maxLoss) - Math.exp(minLoss))) *
            0.8 +
          0.1,
      }));

      setFilteredData(normalizedData);
    };

    fetchData();
  }, []);

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    resizeObserver.observe(wrapperRef.current);

    return () => resizeObserver.unobserve(wrapperRef.current);
  }, []);

  useEffect(() => {
    if (dimensions.width && dimensions.height && filteredData.length > 0) {
      drawLineChart();
    }
  }, [dimensions, filteredData]);

  const drawLineChart = () => {
    const svg = d3
      .select(svgRef.current)
      .attr("width", dimensions.width)
      .attr("height", dimensions.height);

    svg.selectAll("*").remove();

    const margin = { top: 30, right: 50, bottom: 50, left: 50 },
      width = dimensions.width - margin.left - margin.right,
      height = dimensions.height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().rangeRound([0, width]).domain([0, 200]);
    const y = d3.scaleLinear().rangeRound([height, 0]).domain([0, 1]);

    const lineAuc = d3
      .line()
      .x((d) => x(d.epoch))
      .y((d) => y(d.accuracy));

    const lineLoss = d3
      .line()
      .x((d) => x(d.epoch))
      .y((d) => y(d.loss));

    const yAxisTicks = y.ticks(5).concat(0);
    g.selectAll(".horizontal-grid")
      .data(yAxisTicks)
      .enter()
      .append("line")
      .attr("class", "horizontal-grid")
      .attr("x1", 2.5)
      .attr("x2", width)
      .attr("y1", (d) => y(d))
      .attr("y2", (d) => y(d))
      .attr("stroke", "#E6E2E2")
      .attr("stroke-width", 1);

    g.append("g")
      .attr("transform", `translate(0,${height + 10})`)
      .call(d3.axisBottom(x).ticks(5).tickSize(0))
      .call((g) => g.select(".domain").remove())
      .selectAll("text")
      .attr("fill", "#888")
      .attr("font-size", "13px");

    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("x", width / 2 + margin.left)
      .attr("y", height + margin.top + 40)
      .text("Epoch")
      .attr("font-family", "PingFang SC")
      .attr("font-size", "15")
      .attr("font-weight", "600")
      .attr("fill", "#5C5C5C");

    g.append("g")
      .call(d3.axisLeft(y).tickValues(yAxisTicks).tickSize(0))
      .call((g) => g.select(".domain").remove())
      .selectAll("text")
      .attr("fill", "#888")
      .attr("font-size", "13px");

    g.append("path")
      .datum(filteredData)
      .attr("fill", "none")
      .attr("stroke", "#5E8BC1")
      .attr("stroke-width", 1.5)
      .attr("d", lineLoss);

    g.append("path")
      .datum(filteredData)
      .attr("fill", "none")
      .attr("stroke", "#FF8A00")
      .attr("stroke-width", 1.5)
      .attr("d", lineAuc);

    const legend = svg
      .append("g")
      .attr("transform", `translate(${width + margin.left - 120}, 15)`);

    ["Loss", "Accuracy"].forEach((text, index) => {
      legend
        .append("rect")
        .attr("x", index * 60)
        .attr("y", 0)
        .attr("width", 22)
        .attr("height", 2)
        .attr("fill", text === "Loss" ? "#5E8BC1" : "#FF8A00");

      legend
        .append("text")
        .attr("x", index * 60 + 26)
        .attr("y", 1)
        .attr("dy", "0.35em")
        .text(text)
        .attr("font-family", "PingFang SC")
        .attr("font-size", "12")
        .attr("font-weight", "600")
        .attr("fill", "#5C5C5C");
    });
  };

  return (
    <div ref={wrapperRef} style={{ width: "100%", height: "100%" }}>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default LineChart;
