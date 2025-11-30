"use client";
import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import API from "@/utils/interceptor";
import { toast } from "sonner";

export default function ActivityHeatmap() {
  const containerRef = useRef(null); // Renamed: Now refs the <div>
  const tooltipRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await API.get(
        "/job-seeker/activity/heatmap?days=365&mode=future"
      );
      const raw = res.data?.data || [];

      const data = raw.map((d) => ({
        date: new Date(d.date),
        value: d.count,
      }));

      drawHeatmap(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  function drawHeatmap(data) {
    const container = d3.select(containerRef.current);
    container.selectAll("*").remove(); // Clear any previous SVG

    // D3 appends the SVG here (client-only)
    const svg = container.append("svg"); // No ref needed now

    /* ----------  constants  ---------- */
    const cellSize = 15;
    const cellGap = 3;
    const monthGap = 12;
    const topPad = 20;
    const leftPad = 40;
    const labelGap = 15;

    /* ----------  date range  ---------- */
    if (data.length === 0) return; // Early exit for empty data (avoids NaN errors)
    const startDate = d3.min(data, (d) => d.date);
    const endDate = d3.max(data, (d) => d.date);
    const days = d3.timeDays(startDate, d3.timeDay.offset(endDate, 1));

    /* ----------  value & colour  ---------- */
    const dateMap = new Map(
      data.map((d) => [d3.timeFormat("%Y-%m-%d")(d.date), d.value])
    );
    const maxVal = d3.max(data, (d) => d.value) || 1;
    const color = d3
      .scaleLinear()
      .domain([0, maxVal])
      .range(["#e5e7eb", "#22c55e"]);

    /* ----------  week index with month-based gap offset  ---------- */
    const monthStarts = d3.timeMonths(startDate, endDate);
    const weekIndexWithGaps = [];
    let offsetAcc = 0;

    monthStarts.forEach((mon, i) => {
      const weekIdx = d3.timeWeek.count(startDate, mon);
      weekIndexWithGaps.push({ weekIndex: weekIdx, offset: offsetAcc });
      if (i < monthStarts.length - 1) offsetAcc += monthGap;
    });

    const weekOffset = (weekIndex) => {
      const found = weekIndexWithGaps.reduce((acc, d) =>
        d.weekIndex <= weekIndex ? d : acc
      );
      return found?.offset || 0;
    };

    /* ----------  svg size  ---------- */
    const totalWeeks = d3.timeWeek.count(startDate, endDate);
    const width =
      leftPad +
      totalWeeks * (cellSize + cellGap) +
      weekOffset(totalWeeks - 1) +
      20;
    const height = topPad + 7 * (cellSize + cellGap) + labelGap + 20;
    svg.attr("width", width).attr("height", height);

    /* ----------  draw day cells  ---------- */
    const g = svg
      .append("g")
      .attr("transform", `translate(${leftPad},${topPad})`);

    g.selectAll("rect")
      .data(days)
      .enter()
      .append("rect")
      .attr("width", cellSize)
      .attr("height", cellSize)
      .attr("rx", 3)
      .attr("x", (d) => {
        const wi = d3.timeWeek.count(startDate, d);
        return wi * (cellSize + cellGap) + weekOffset(wi);
      })
      .attr("y", (d) => d.getDay() * (cellSize + cellGap))
      .attr("fill", (d) => {
        const key = d3.timeFormat("%Y-%m-%d")(d);
        return color(dateMap.get(key) || 0);
      })
      .on("mouseover", (e, d) => {
        const key = d3.timeFormat("%Y-%m-%d")(d);
        const val = dateMap.get(key) || 0;
        d3.select(tooltipRef.current)
          .style("visibility", "visible")
          .text(`${val > 0 ? "Some" : "No"} activities on ${key}`);
      })
      .on("mousemove", (e) => {
        d3.select(tooltipRef.current)
          .style("top", `${e.pageY - 40}px`)
          .style("left", `${e.pageX + 10}px`);
      })
      .on("mouseout", () =>
        d3.select(tooltipRef.current).style("visibility", "hidden")
      );

    /* ----------  month labels  ---------- */
    const labelLayer = svg
      .append("g")
      .attr(
        "transform",
        `translate(${leftPad},${topPad + 7 * (cellSize + cellGap) + labelGap})`
      );

    monthStarts.forEach((mon) => {
      const firstWeek = d3.timeWeek.count(startDate, mon);
      const lastWeek =
        d3.timeWeek.count(startDate, d3.timeMonth.offset(mon, 1)) - 1;
      const midWeek = Math.floor((firstWeek + lastWeek) / 2);
      const xPos = midWeek * (cellSize + cellGap) + weekOffset(midWeek);

      labelLayer
        .append("text")
        .attr("x", xPos)
        .attr("y", 0)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("font-weight", "600")
        .attr("fill", "#444")
        .text(mon.toLocaleString("en-US", { month: "short" }));
    });
  }

  return (
    <div className="relative">
      <h2 className="text-lg font-semibold mb-2">Your Activities</h2>

      {loading ? (
        <div className="animate-pulse h-40 bg-gray-200 rounded"></div>
      ) : (
        <div className="overflow-x-auto">
          <div ref={containerRef} />{" "}
          {/* Changed: Empty div for D3 to append SVG */}
        </div>
      )}

      <div
        ref={tooltipRef}
        className="absolute bg-black text-white px-2 py-1 text-xs rounded pointer-events-none"
        style={{
          visibility: "hidden",
          position: "fixed",
          zIndex: 50,
        }}
      ></div>
    </div>
  );
}
