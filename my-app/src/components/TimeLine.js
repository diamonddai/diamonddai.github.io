import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const LineChart = ({ data, interval, selectedFilters, onDateRangeChange }) => {
  const svgRef = useRef();
  const containerRef = useRef();

  useEffect(() => {
    const width = 230;  // 固定宽度
    const height = 65; // 固定高度

    const margin = { top: 30, right: 14, bottom: 20, left: 40 };

    // 清除现有的SVG
    d3.select(svgRef.current).selectAll("*").remove();

    // 创建新的SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // 根据 interval 解析日期
    const parseDate =
      interval === "day"
        ? d3.timeParse("%Y-%m-%d")
        : interval === "month"
        ? d3.timeParse("%Y-%m")
        : d3.timeParse("%Y");

    data.forEach((d) => {
      d.date = parseDate(d.date);
    });

    // 设置比例尺
    const x = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d.date))
      .range([0, width]);

    const y = d3
      .scaleLinear()
      .domain([0, Math.ceil(d3.max(data, (d) => Math.max(d.post, d.repost, d.reply)) / 5) * 5])
      .nice()
      .range([height, 0]);

    // X 轴
    const xAxis = svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(interval === "month" ? d3.timeMonth.every(1) : 5) // 根据间隔调整刻度
          .tickFormat(interval === "month" ? d3.timeFormat("%b") : undefined) // 显示月份简写
      )
      .call((g) =>
        g
          .selectAll(".tick line") // 为x轴添加虚线网格
          .attr("stroke", "#F1F1F1")
          .attr("stroke-dasharray", "2,2")
          .attr("y2", -height) // 向上延伸到顶部
      )
      .call((g) =>
        g
          .selectAll(".domain") // 为x轴本身设置虚线
          .attr("stroke", "#F1F1F1")
          .attr("stroke-dasharray", "2,2")
      );

    xAxis
      .selectAll("text")
      .style("font-size", "8px")
      .style("transform", "translateY(2px)");

    // Y 轴
    const yAxis = svg
      .append("g")
      .call(d3.axisLeft(y).ticks(4))
      .call((g) =>
        g
          .selectAll(".tick line") // 为y轴添加虚线网格
          .attr("stroke", "#F1F1F1")
          .attr("stroke-dasharray", "2,2")
          .attr("x2", width) // 向右延伸到最右侧
      )
      .call((g) =>
        g
          .selectAll(".domain") // 为y轴本身设置虚线
          .attr("stroke", "#F1F1F1")
          .attr("stroke-dasharray", "2,2")
      );

    yAxis.selectAll("text").style("font-size", "8px");

    // 定义线生成器
    const line = d3
      .line()
      .curve(d3.curveMonotoneX) // 使用穿过点的曲线连接
      .x((d) => x(d.date))
      .y((d) => y(d.value));

    // 不同类型的颜色
    const colors = {
      post: "#027D8E", // 使用Checkbox定义的颜色
      repost: "#63ABFD",
      reply: "#E697FF",
    };

    // 绘制线条
    ["post", "repost", "reply"].forEach((type) => {
      if (!selectedFilters.includes(type)) return; // 根据选中的线条决定是否绘制

      const lineData = data.map((d) => ({ date: d.date, value: d[type] }));

      svg
        .append("path")
        .data([lineData])
        .attr("class", `line ${type}`)
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke", colors[type])
        .attr("stroke-width", 1);

      // 为每个数据点添加空心圆点
      svg
        .selectAll(`.dot.${type}`)
        .data(lineData)
        .enter()
        .append("circle")
        .attr("class", `dot ${type}`)
        .attr("cx", (d) => x(d.date))
        .attr("cy", (d) => y(d.value))
        .attr("r", 3)
        .attr("fill", "white") // 空心
        .attr("stroke", colors[type]) // 描边颜色与线条相同
        .attr("stroke-width", 1.5)
        .on("mouseover", (event, d) => {
          d3.select(event.currentTarget)
            .transition()
            .duration(100)
            .attr("r", 5);
          svg
            .append("text")
            .attr("class", "tooltip")
            .attr("x", x(d.date) - 30)
            .attr("y", y(d.value) - 10)
            .text(`${type}: ${d.value}`)
            .style("font-size", "8px");
        })
        .on("mouseout", (event) => {
          d3.select(event.currentTarget)
            .transition()
            .duration(100)
            .attr("r", 3);
          svg.select(".tooltip").remove();
        });
    });

    // 添加刷子
    const brush = d3
      .brushX()
      .extent([
        [0, 0],
        [width, height],
      ])
      .on("end", (event) => {
        const selection = event.selection;
        if (selection) {
          const [x0, x1] = selection;
          const dateRange = [x.invert(x0), x.invert(x1)];
          onDateRangeChange(dateRange); // 将选择的时间范围传递出去
        } else {
          onDateRangeChange([null, null]); // 设置为 [null, null] 表示没有选中范围
        }
      });

    svg.append("g").attr("class", "brush").call(brush);
  }, [data, interval, selectedFilters]);

  return (
      <svg ref={svgRef} />
  );
};

export default LineChart;
