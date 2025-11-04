"use client";
import { useEffect, useRef, useState } from "react";
import CalHeatmap from "cal-heatmap";
import Tooltip from "cal-heatmap/plugins/Tooltip";
import Legend from "cal-heatmap/plugins/Legend";
import API from "@/utils/interceptor";
import { format, addYears } from "date-fns";
import "cal-heatmap/cal-heatmap.css";
import { toast } from "sonner";

export default function ActivityHeatmap() {
  const calRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await API.get(
          "/job-seeker/activity/heatmap?days=365&mode=future"
        );
        const data = res.data?.data || [];

        const parsed = data.map((d) => ({
          date: new Date(d.date),
          value: d.count,
        }));

        renderHeatmap(parsed);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    }

    function renderHeatmap(data) {
      if (calRef.current) {
        calRef.current.destroy();
      }

      const specificStartDate = new Date("2025-09-20");
      specificStartDate.setHours(0, 0, 0, 0);
      const endDate = addYears(specificStartDate, 1);

      const cal = new CalHeatmap();
      cal.paint(
        {
          itemSelector: "#cal-heatmap",
          range: 12,
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
              range: ["#d1d5db", "#22c55e"],
            },
          },
        },
        [
          [
            Tooltip,
            {
              text: (date, value) =>
                (value ? "Some" : "No") +
                " activities on " +
                format(date, "dd MMM, yyyy"),
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

    return () => {
      if (calRef.current) calRef.current.destroy();
    };
  }, []);

  // Skeleton Loader (grid shimmer)
  const SkeletonGrid = () => (
    <div className="animate-pulse flex flex-wrap gap-2 mt-2">
      {[...Array(180)].map((_, i) => (
        <div
          key={i}
          className="w-4 h-4 bg-gray-300 rounded-sm"
          style={{
            opacity: Math.random() * 0.5 + 0.3, // random shade
          }}
        ></div>
      ))}
    </div>
  );

  return (
    <div className="heatmap-container overflow-x-scroll">
      <h2 className="text-lg font-semibold mb-2">Your Activities</h2>

      <div className="pb-2">
        <div className="inline-block min-w-[800px]">
          {loading ? (
            <SkeletonGrid />
          ) : (
            <div id="cal-heatmap" className="mb-4"></div>
          )}
        </div>
      </div>

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
