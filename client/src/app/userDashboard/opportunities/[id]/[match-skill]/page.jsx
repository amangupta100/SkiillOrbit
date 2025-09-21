"use client"
import API from '@/utils/interceptor'
import { useParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

const AverageScoreDoughnut = ({ userScore, benchmarkScore }) => {
  const percentage = Math.min((userScore / benchmarkScore) * 100, 100);

  const data = {
    labels: ["Your Score", "Remaining to Benchmark"],
    datasets: [
      {
        data: [percentage, 100 - percentage],
        backgroundColor: ["#10b981", "#e5e7eb"],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    cutout: "70%",
    plugins: {
      legend: {
        display: true,
        position: "bottom",
      },
    },
  };

  return (
    <div className="w-[260px] h-[260px] mx-auto">
      <Doughnut data={data} options={options} />
      <div className="text-center mt-2 text-sm">
        <p>
          <span className="font-semibold">Your Avg Score:</span> {userScore}
        </p>
        <p>
          <span className="font-semibold">Benchmark:</span> {benchmarkScore}
        </p>
      </div>
    </div>
  );
};

const Page = () => {
  const { id } = useParams();
  const [reqSkill, setReqSkill] = useState([]);
  const [matchedSkill, setMatchedSkill] = useState([]);
  const [verfSkill, setVerfSkill] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const req = await API.get(`/job-seeker/opportunity/matchSkills/${id}`);
      setReqSkill(req.data.requiredSkills);
      setMatchedSkill(req.data.matchedSkills);
      setVerfSkill(req.data.verifiedSkills);
      console.log(req.data);
    };
    fetchData();
  }, [id]);

  if (!id) return <div className=''>Please apply to an opportunity to get skill matched</div>;

  return (
    <div>
      {verfSkill && verfSkill.length === 0 ? (
        <div className="text-center w-full min-h-[calc(100vh-11rem)] flex justify-center items-center flex-col py-8 space-y-2">
          <h2 className="text-lg font-semibold">No Verified Skills Found</h2>
          <p className="text-zinc-500">
            You need to test these skills to stand out from others.
          </p>
          <a
            href="/userDashboard/test"
            className="inline-block mt-3 px-4 py-2 bg-[#2A956B] text-white rounded hover:bg-[#2A956B]/90 transition"
          >
            Go to Skill Tests
          </a>
        </div>
      ) : (
        <AverageScoreDoughnut 
          userScore={75} // Replace with actual user score from your data
          benchmarkScore={100} // Replace with actual benchmark score from your data
        />
      )}
    </div>
  );
};

export default Page;