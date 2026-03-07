'use client';

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: string;
  className?: string;
  compact?: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(targetDate: string): TimeLeft {
  const difference = new Date(targetDate).getTime() - new Date().getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

export default function CountdownTimer({ targetDate, className = '', compact = false }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft(targetDate));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!mounted) {
    return <div className={`text-gray-500 ${className}`}>Chargement...</div>;
  }

  const isExpired = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;
  const isUrgent = timeLeft.days < 3;

  if (isExpired) {
    return <div className={`text-error font-semibold ${className}`}>Expiré</div>;
  }

  if (compact) {
    return (
      <span className={`font-[family-name:var(--font-sora)] font-semibold ${isUrgent ? 'text-error animate-pulse' : 'text-gray-700'} ${className}`}>
        {timeLeft.days}j {timeLeft.hours}h {timeLeft.minutes}min
      </span>
    );
  }

  return (
    <div className={`flex gap-3 ${className}`}>
      {[
        { value: timeLeft.days, label: 'jours' },
        { value: timeLeft.hours, label: 'heures' },
        { value: timeLeft.minutes, label: 'min' },
        { value: timeLeft.seconds, label: 'sec' },
      ].map((item) => (
        <div
          key={item.label}
          className={`flex flex-col items-center px-3 py-2 rounded-xl ${
            isUrgent ? 'bg-red-50 animate-pulse' : 'bg-blue-light'
          }`}
        >
          <span className={`font-[family-name:var(--font-sora)] text-2xl font-bold ${isUrgent ? 'text-error' : 'text-blue-primary'}`}>
            {String(item.value).padStart(2, '0')}
          </span>
          <span className="text-xs text-gray-500">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
