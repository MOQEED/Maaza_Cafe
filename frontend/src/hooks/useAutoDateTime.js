import { useState, useEffect } from 'react';

export function useAutoDateTime() {
  const getNow = () => {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    return { date, time, timestamp: now };
  };

  const [current, setCurrent] = useState(getNow);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent(getNow());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const refresh = () => {
    const fresh = getNow();
    setCurrent(fresh);
    return fresh;
  };

  return {
    date: current.date,
    time: current.time,
    timestamp: current.timestamp,
    refresh,
  };
}
