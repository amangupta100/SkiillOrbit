"use client";

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export function Timer({ initialMinutes = 60 }) {
  const [hasMounted, setHasMounted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(initialMinutes * 60);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted || secondsLeft <= 0) return;

    const intervalId = setInterval(() => {
      setSecondsLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [secondsLeft, hasMounted]);

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  if (!hasMounted) {
    return null; // Avoid hydration mismatch
  }

  return (
    <div className="flex items-center gap-2 text-sm font-medium font-code text-muted-foreground">
      <Clock className="h-4 w-4" />
      <span className="tabular-nums">
        {String(hours).padStart(2, '0')}:
        {String(minutes).padStart(2, '0')}:
        {String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
}
