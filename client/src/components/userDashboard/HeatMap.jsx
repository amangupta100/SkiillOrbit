"use client";
import { useEffect, useRef } from "react";
import CalHeatmap from "cal-heatmap";
import Tooltip from "cal-heatmap/plugins/Tooltip";
import Legend from "cal-heatmap/plugins/Legend";
import API from "@/utils/interceptor";
import { format, addYears } from "date-fns";
import "cal-heatmap/cal-heatmap.css";
import { toast } from "sonner";

export default function ActivityHeatmap() {
  const calRef = useRef(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await API.get(
          "/job-seeker/activity/heatmap?days=365&mode=future"
        );
        const data = res.data?.data || [];

        // Transform to CalHeatmap format: array of {date: Date, value: number}
        const parsed = data.map((d) => ({
          date: new Date(d.date), // Keep as Date object
          value: d.count,
        }));

        renderHeatmap(parsed);
      } catch (err) {
        toast.error(err.message);
      }
    }

    function renderHeatmap(data) {
      if (calRef.current) {
        calRef.current.destroy(); // cleanup before re-init
      }

      const specificStartDate = new Date("2025-09-20"); // fixed start
      specificStartDate.setHours(0, 0, 0, 0);
      const endDate = addYears(specificStartDate, 1);

      const cal = new CalHeatmap();
      cal.paint(
        {
          itemSelector: "#cal-heatmap",
          range: 12, // 12 months
          date: { start: specificStartDate, end: endDate },
          data: { source: data, x: "date", y: "value" },
          domain: {
            type: "month",
            gutter: 10,
            label: { text: "MMM", textAlign: "start" },
          },
          subDomain: {
            type: "day",
            radius: 2,
            width: 15,
            height: 15,
            gutter: 4,
            padding: 0,
          },
          scale: {
            color: {
              type: "linear",
              domain: [0, 1],
              range: ["#d1d5db", "#22c55e"], // grey → green
            },
          },
        },
        [
          [
            Tooltip,
            {
              text: function (date, value) {
                return (
                  (value ? value : "No") +
                  " activities on " +
                  format(date, "dd MMM, yyyy")
                );
              },
            },
          ],
          [
            Legend,
            {
              itemSelector: "#legend",
              width: 200,
              shape: "rect",
              gutter: 4,
              label: "Activity count",
            },
          ],
        ]
      );

      calRef.current = cal;
    }

    fetchData();

    // Cleanup on unmount
    return () => {
      if (calRef.current) {
        calRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="heatmap-container overflow-x-scroll">
      <h2 className="text-lg font-semibold mb-2">Your Activities</h2>

      {/* horizontal scroll section */}
      <div className="pb-2">
        <div className="inline-block">
          <div id="cal-heatmap" className="mb-4"></div>
        </div>
      </div>

      {/* keep legend fixed under heading (doesn’t scroll away) */}
      {/* <div id="legend" className="mt-2"></div> */}

      <style jsx>{`
        .heatmap-container {
          font-family: Arial, sans-serif;
        }
        #cal-heatmap {
          margin-top: 10px;
          font-size: 14px;
        }
        .ch-subdomain-bg {
          rx: 3;
        }
      `}</style>
    </div>
  );
}
