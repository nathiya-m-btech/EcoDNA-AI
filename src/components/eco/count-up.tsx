import { useEffect, useRef, useState } from "react";

export function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const frame = useRef<number | undefined>(undefined);

  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(from + (target - from) * eased);
      if (p < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [target, duration]);

  return value;
}

export function CountUp({
  value,
  decimals = 0,
  suffix = "",
  duration,
  className,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const v = useCountUp(value, duration);
  return (
    <span className={className}>
      {v.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}
