"use client";

import { User } from "@/types/user";
import { createContext, PropsWithChildren, useCallback, useContext } from "react";
import { v4 } from "uuid";
import { useCookieState } from "../hooks/useCookieState";
import { throttle } from "lodash";

type SessionContextValue = {
  user: User;
  setUser: (user: User) => void;
  updateUser: (input: Partial<Omit<User, "id">>) => void;
  createUser: (user: Omit<User, "id">) => User;
};

const SessionContext = createContext<SessionContextValue>({} as SessionContextValue);

function SessionProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useCookieState<User | null>('LOCAL_USER', null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateUser = useCallback(
    throttle((input: Partial<Omit<User, "id">>) => {
      setUser(u => (u ? { ...u, ...input } : null));
    }, 500), []
  )

  function createUser(user: Omit<User, "id">) {
    const newUser = { id: v4(), ...user };
    setUser(newUser);

    return newUser;
  }

  return (
    // in most cases this will be called, user exists
    <SessionContext.Provider value={{ user: user!, setUser, updateUser, createUser }}>
      {children}
    </SessionContext.Provider>
  );
}

function useSession() {
  return useContext(SessionContext);
}

export { SessionProvider, useSession };