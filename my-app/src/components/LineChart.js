import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import "./LineChart.css";
import axios from 'axios';
import { parseJSON } from "date-fns";

const LineChart = () => {
  const svgRef = useRef();
  const wrapperRef = useRef();
  const [filteredData, setFilteredData] = useState([]);
  const [maxEpoch, setMaxEpoch] = useState(0); // 新增 state 用于存储 maxEpoch

  const dimensions = { width: 440, height: 240 };

  // // 服务器读取数据版
  useEffect(() => {

    axios({
          method:"get",
          url:'http://106.15.36.115:8008/jsonFile/training_records_iteration',
          responseType:"json",
          // headers:{},
          timeout:120*1000,
          // data:{},//备选方案 requestBody
          // params:{ "epochNo":10 }
      }).then(function(rspData){
          // console.log(rspData);
          if(rspData === undefined||rspData.data.state === undefined){
            console.log("reqeust errer!");
            return;
          }

          if(rspData.status!=200){
            console.log(rspData.data.message);
            return;
          }
          
          const getDataObj = rspData.data.data;

        const allEpochs=[];

        getDataObj.forEach((dataObj, index) => {
          allEpochs.push(dataObj.epoch);

        });
        
         // 计算选定的 11 个点（包括 1 和最大的 epoch）
         const maxEpochValue = Math.max(...allEpochs);
         setMaxEpoch(maxEpochValue); // 保存最大 epoch 值
        //  const selectedEpochs = [1]; // 起始点
        //  const interval = Math.floor((maxEpochValue - 1) / 10);
 
        //  for (let i = 1; i <= 10; i++) {
        //    selectedEpochs.push(Math.min(1 + i * interval, maxEpochValue));
        //  }
         
        //  // 根据 selectedEpochs 筛选数据
        // const filtered = getDataObj.filter((record) =>
        //   selectedEpochs.includes(record.epoch)
        // );
        
        setFilteredData(getDataObj);
    
      }).catch(function(errorMsg){
          console.log(errorMsg);

      });
  }, []);

  //本地文件读取数据版
  // useEffect(() => {
  //   const fetchData = async () => {
  //     const response = await fetch(
  //       process.env.PUBLIC_URL + "/training_records_iteration.json"
  //     );
  //     const rawData = await response.json();

  //     // 获取所有的 epoch 值
  //     const allEpochs = rawData.map((record) => record.epoch);

  //     // 计算选定的 11 个点（包括 1 和最大的 epoch）
  //     const maxEpochValue = Math.max(...allEpochs);
  //     setMaxEpoch(maxEpochValue); // 保存最大 epoch 值
  //     const selectedEpochs = [1]; // 起始点
  //     const interval = Math.floor(maxEpochValue / 10);

  //     for (let i = 1; i <= 10; i++) {
  //       selectedEpochs.push(Math.min(1 + i * interval, maxEpochValue));
  //     }

  //     // 根据 selectedEpochs 筛选数据
  //     const filtered = rawData.filter((record) =>
  //       selectedEpochs.includes(record.epoch)
  //     );

  //     setFilteredData(filtered);
  //   };

  //   fetchData();
  // }, []);

  useEffect(() => {
    if (filteredData.length > 0) {
      drawLineChart();
    }
  }, [filteredData, maxEpoch]); // 这里增加 maxEpoch 的依赖

  const drawLineChart = () => {
    const svg = d3
      .select(svgRef.current)
      .attr("width", dimensions.width)
      .attr("height", dimensions.height);

    svg.selectAll("*").remove();

    const margin = { top: 28, right: 80, bottom: 68, left: 32 }, // 调整左右边距
      width = dimensions.width - margin.left - margin.right,
      height = dimensions.height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

      const x = d3.scaleLinear().rangeRound([0, width]).domain([0, maxEpoch]);
      const yLeft = d3.scaleLinear().rangeRound([height, 0]).domain([0, 1]);
      const yLeftTicks = [0.0, 0.2, 0.4, 0.6, 0.8, 1.0];
    
      const maxLoss = d3.max(filteredData, (d) => d.loss);
      
      const yRight = d3
      .scaleLinear()
      .rangeRound([height, 0])
      .domain([0, maxLoss]);
    // const yRightTicks = d3.range(0, maxLoss + maxLoss / 5, maxLoss / 5);
    const count = 6
    const yRightTicks = Array.from(
      { length: count },
      (v, i) => i * (maxLoss / (count - 1))
    );

    const lineAuc = d3
      .line()
      .x((d) => x(d.epoch))
      .y((d) => yLeft(d.accuracy));

    const lineLoss = d3
      .line()
      .x((d) => x(d.epoch))
      .y((d) => yRight(d.loss));

    g.selectAll(".horizontal-grid")
      .data(yLeftTicks)
      .enter()
      .append("line")
      .attr("class", "horizontal-grid")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", (d) => yLeft(d))
      .attr("y2", (d) => yLeft(d))
      .attr("stroke", "#E6E2E2")
      .attr("stroke-width", 1);

    g.append("g")
      .attr("transform", `translate(0,${height + 10})`)
      .call(d3.axisBottom(x).ticks(10).tickSize(0))
      .call((g) => g.select(".domain").remove())
      .selectAll("text")
      .attr("fill", "#888")
      .attr("font-size", "10px");

    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("x", width / 2 + margin.left)
      .attr("y", height + margin.top + 40)
      .text("Epoch")
      .attr("font-family", "PingFang SC")
      .attr("font-size", "14")
      .attr("font-weight", "600")
      .attr("fill", "#5C5C5C");

    g.append("g")
      .call(
        d3.axisLeft(yLeft).tickValues(yLeftTicks).tickSize(0).tickPadding(6)
      ) // 调整左Y轴刻度与边界的距离
      .call((g) => g.select(".domain").remove())
      .selectAll("text")
      .attr("fill", "#888")
      .attr("font-size", "10px");

    g.append("g")
      .attr("transform", `translate(${width}, 0)`)
      .call(
        d3
          .axisRight(yRight)
          .tickValues(yRightTicks)
          .tickFormat(d3.format(".1f"))
          .tickSize(0)
          .tickPadding(6) // 调整右Y轴刻度与边界的距离
      )
      .call((g) => g.select(".domain").remove())
      .selectAll("text")
      .attr("fill", "#888")
      .attr("font-size", "10px");

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
      .attr("transform", `translate(${width + margin.left - 118}, 9)`);

    ["Accuracy", "Loss"].forEach((text, index) => {
      legend
        .append("rect")
        .attr("x", index * 87)
        .attr("y", 0)
        .attr("width", 22)
        .attr("height", 2)
        .attr("fill", text === "Loss" ? "#5E8BC1" : "#FF8A00");

      legend
        .append("text")
        .attr("x", index * 87 + 26)
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
    <div
      ref={wrapperRef}
      style={{ width: "400px", height: "220px", overflow: "hidden" }}
    >
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default LineChart;
