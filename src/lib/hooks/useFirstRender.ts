import { useEffect, useRef } from "react";

export default function useFirstRender(onFirstRender?: () => void) {
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (onFirstRender) onFirstRender();
    }
  }, [onFirstRender]);

  return isFirstRender.current;
}
