import React, { useEffect, useRef, useState } from "react"; // 引入React库中的useEffect、useRef和useState钩子
import * as d3 from "d3"; // 引入d3库
import ResizeObserver from "resize-observer-polyfill"; // 引入ResizeObserver polyfill
import "./LineChart.css"; // 引入样式文件

const LineChart = () => {
  const svgRef = useRef(); // 创建一个ref对象，用于引用SVG DOM元素
  const wrapperRef = useRef(); // 创建一个ref对象，用于引用容器DOM元素
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 }); // 使用useState钩子创建状态，保存容器的宽度和高度

  // 定义训练数据数组，每个元素包含epoch、auc和loss三个属性
  const trainingData = [
    { epoch: 0, auc: 0.5, loss: 0.8 },
    { epoch: 200, auc: 0.65, loss: 0.6 },
    { epoch: 400, auc: 0.78, loss: 0.5 },
    { epoch: 600, auc: 0.82, loss: 0.4 },
    { epoch: 800, auc: 0.86, loss: 0.35 },
    { epoch: 1000, auc: 0.9, loss: 0.3 },
  ];

  // 使用useEffect钩子，在组件首次渲染后执行，创建ResizeObserver监听容器尺寸变化
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return; // 如果没有entries，返回
      const { width, height } = entries[0].contentRect; // 获取容器的宽度和高度
      setDimensions({ width, height }); // 更新状态
    });
    resizeObserver.observe(wrapperRef.current); // 开始观察容器

    return () => resizeObserver.unobserve(wrapperRef.current); // 在组件卸载时停止观察
  }, []);

  // 使用useEffect钩子，当dimensions变化时重新绘制图表
  useEffect(() => {
    if (dimensions.width && dimensions.height) {
      // 确保宽度和高度存在
      drawLineChart(); // 调用绘制图表的函数
    }
  }, [dimensions]);

  const drawLineChart = () => {
    const svg = d3
      .select(svgRef.current) // 选择SVG元素
      .attr("width", dimensions.width) // 设置SVG的宽度
      .attr("height", dimensions.height); // 设置SVG的高度

    svg.selectAll("*").remove(); // 清除SVG中的所有元素

    const margin = { top: 30, right: 50, bottom: 50, left: 50 }, // 设置边距
      width = dimensions.width - margin.left - margin.right, // 计算内容区宽度
      height = dimensions.height - margin.top - margin.bottom; // 计算内容区高度

    const g = svg
      .append("g") // 在SVG中添加一个g元素用于包含所有其他元素
      .attr("transform", `translate(${margin.left},${margin.top})`); // 设置g元素的偏移

    const x = d3.scaleLinear().rangeRound([0, width]).domain([0, 1000]); // 定义x轴的比例尺
    const y = d3.scaleLinear().rangeRound([height, 0]).domain([0, 1]); // 定义y轴的比例尺

    const lineAuc = d3
      .line() // 创建一个新的线生成器
      .x((d) => x(d.epoch)) // 设置线的x坐标
      .y((d) => y(d.auc)); // 设置线的y坐标

    const lineLoss = d3
      .line() // 创建一个新的线生成器
      .x((d) => x(d.epoch)) // 设置线的x坐标
      .y((d) => y(d.loss)); // 设置线的y坐标

    // 添加横向网格线
    const yAxisTicks = y.ticks(5).concat(0); // 获取y轴的刻度值，确保包括0
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

    // 绘制x轴
    g.append("g")
      .attr("transform", `translate(0,${height + 10})`)
      .call(d3.axisBottom(x).ticks(5).tickSize(0))
      .call((g) => g.select(".domain").remove())
      .selectAll("text")
      .attr("fill", "#888")
      .attr("font-size", "13px");

    // 添加x轴标签
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

    // 绘制y轴
    g.append("g")
      .call(d3.axisLeft(y).tickValues(yAxisTicks).tickSize(0))
      .call((g) => g.select(".domain").remove())
      .selectAll("text")
      .attr("fill", "#888")
      .attr("font-size", "13px");

    // 绘制loss线
    g.append("path")
      .datum(trainingData)
      .attr("fill", "none")
      .attr("stroke", "#5E8BC1")
      .attr("stroke-width", 1.5)
      .attr("d", lineLoss);

    // 绘制auc线
    g.append("path")
      .datum(trainingData)
      .attr("fill", "none")
      .attr("stroke", "#FF8A00")
      .attr("stroke-width", 1.5)
      .attr("d", lineAuc);

    // 添加图例
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

  // 返回一个包含SVG的div元素，并将其与wrapperRef关联
  return (
    <div ref={wrapperRef} style={{ width: "100%", height: "100%" }}>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default LineChart; // 导出LineChart组件
