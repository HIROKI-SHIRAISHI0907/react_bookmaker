// hooks/useDelayedLoading.ts
import { useEffect, useState } from "react";

export default function useDelayedLoading(isLoading: boolean, delay = 300) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setShow(false);
      return;
    }
    const id = setTimeout(() => setShow(true), delay);
    return () => {
      clearTimeout(id);
      setShow(false);
    };
  }, [isLoading, delay]);

  return show; // 遅延後に true
}
