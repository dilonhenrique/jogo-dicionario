import { deleteCookie, getCookie, setCookie } from "cookies-next/client";
import { useState } from "react";

export function useCookieState<T>(key: string, defaultValue: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const cookie = getCookie(key);
      return cookie ? JSON.parse(cookie as string) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setCookieState = (value: T | ((prev: T) => T)) => {
    setState(prevState => {
      const newValue = typeof value === 'function' ? (value as (prev: T) => T)(prevState) : value;

      if (newValue === null || newValue === undefined) {
        deleteCookie(key);
      } else {
        setCookie(key, JSON.stringify(newValue), {
          maxAge: 30 * 24 * 60 * 60, // 30 dias
          path: '/',
          sameSite: 'lax'
        });
      }

      return newValue;
    });
  };

  return [state, setCookieState] as const;
}