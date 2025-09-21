// components/ProgressSidebar.tsx
"use client";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';
import { useProgressSidebarStore } from '@/store/test/useProgressSidebar';
import { useEffect, useState } from 'react';

const COLORS = ['#4ade80', '#e2e8f0'];
const HOVER_COLORS = ['#22c55e', '#cbd5e1'];

export default function ProgressSidebar() {
  const { isSidebarVisible, toggleSidebar } = useProgressSidebarStore();
  const [progressData, setProgressData] = useState({
    attempted: 0,
    total: 0,
    attemptedPercentage: 0,
    unattemptedPercentage: 0
  });

  useEffect(() => {
    const calculateProgress = () => {
      const savedQuestions = JSON.parse(sessionStorage.getItem('questions') || '[]');
      const savedAnswers = JSON.parse(sessionStorage.getItem('answers') || '[]');

      const totalQuestions = savedQuestions.length;
      const attemptedQuestions = savedAnswers.filter(answer => 
        answer?.code && answer.code.trim() !== ''
      ).length;
      const unattemptedQuestions = totalQuestions - attemptedQuestions;

      const attemptedPercentage = totalQuestions > 0 
        ? Math.round((attemptedQuestions / totalQuestions) * 100)
        : 0;
      
      const unattemptedPercentage = 100 - attemptedPercentage;

      setProgressData({
        attempted: attemptedQuestions,
        total: totalQuestions,
        attemptedPercentage,
        unattemptedPercentage
      });
    };

    calculateProgress();
    const handleStorageChange = () => calculateProgress();
    window.addEventListener('storage', handleStorageChange);

    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const chartData = [
    { name: 'Completed', value: progressData.attempted },
    { name: 'Uncompleted', value: progressData.total - progressData.attempted }
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = data.name === 'Completed' 
        ? progressData.attemptedPercentage 
        : progressData.unattemptedPercentage;
      
      return (
        <Card className="p-4 bg-background shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p>{data.value} question{data.value !== 1 ? 's' : ''}</p>
          <p>{percentage}%</p>
        </Card>
      );
    }
    return null;
  };

  if (!isSidebarVisible) return null;

  return (
    <div className="fixed inset-0 bg-gray-700/60 backdrop-blur-sm z-50">
      <Card className="absolute left-0 top-0 h-full w-1/3 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">Test Progress</h2>
          <X 
            onClick={toggleSidebar} 
            className="w-8 h-8 cursor-pointer text-muted-foreground hover:text-foreground"
          />
        </div>
        
        <div className="h-64 w-full mb-8">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index]} 
                    stroke={HOVER_COLORS[index]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                formatter={(value) => (
                  <span className="text-sm text-muted-foreground">
                    {value}: {value === 'Completed' ? progressData.attempted : progressData.total - progressData.attempted}
                  </span>
                )}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span className="text-muted-foreground">Completed:</span>
            </div>
            <div className="text-right">
              <span className="font-medium">{progressData.attempted}</span>
              <span className="ml-2 text-green-500">({progressData.attemptedPercentage}%)</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-gray-300 mr-2"></div>
              <span className="text-muted-foreground">Uncompleted:</span>
            </div>
            <div className="text-right">
              <span className="font-medium">{progressData.total - progressData.attempted}</span>
              <span className="ml-2 text-muted-foreground">({progressData.unattemptedPercentage}%)</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-muted-foreground font-medium">Total Questions:</span>
            <span className="font-bold">{progressData.total}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}