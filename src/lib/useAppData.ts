import { useEffect, useState } from "react";
import { getPayments, getSettings, getStudents } from "./store";

export function useAppData() {
  const [tick, setTick] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onChange = () => setTick((t) => t + 1);
    window.addEventListener("ifms-change", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("ifms-change", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  return {
    mounted,
    tick,
    students: mounted ? getStudents() : [],
    payments: mounted ? getPayments() : [],
    settings: getSettings(),
    refresh: () => setTick((t) => t + 1),
  };
}
