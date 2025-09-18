"use client";

import { User } from "@/types/user";
import { createContext, PropsWithChildren, useContext } from "react";
import { v4 } from "uuid";
import { useCookieState } from "../hooks/useCookieState";

type SessionContextValue = {
  user: User;
  setUser: (user: User) => void;
  updateUser: (input: Partial<Omit<User, "id">>) => void;
  createUser: (user: Omit<User, "id">) => User;
};

const SessionContext = createContext<SessionContextValue>({} as SessionContextValue);

function SessionProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useCookieState<User | null>('LOCAL_USER', null);

  function updateUser(input: Partial<Omit<User, "id">>) {
    setUser(u => (u ? { ...u, ...input } : null));
  }

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