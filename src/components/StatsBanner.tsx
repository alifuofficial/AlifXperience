"use client";

import { useEffect, useState, useRef } from "react";

const stats = [
  { label: "K+ Subscribers", target: 250, color: "text-accent-600" },
  { label: "K+ Articles Published", target: 12, color: "text-indigo-600" },
  { label: "Expert Contributors", target: 85, color: "text-blue-600" },
  { label: "Countries Reached", target: 48, color: "text-sky-600" },
];

export default function StatsBanner() {
  return (
    <div className="bg-white rounded-3xl p-12 lg:p-20 border border-brand-200/50 relative overflow-hidden group">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
      <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
        {stats.map((stat, i) => (
          <div key={i} className="space-y-2">
            <Counter target={stat.target} className={`text-3xl lg:text-5xl font-bold ${stat.color} tracking-tighter`} />
            <p className="text-[9px] font-bold text-brand-400 uppercase tracking-[0.2em]">{stat.label}</p>
          </div>
        ))}
      </div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
    </div>
  );
}

function Counter({ target, className }: { target: number; className: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTime: number | null = null;
    const duration = 2000;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [hasStarted, target]);

  return <div ref={ref} className={className}>{count}</div>;
}
