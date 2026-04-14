'use client';

import { create } from 'zustand';

export type User = {
  id: string;
  email: string | null;
  displayName: string;
  role: string;
};

type Session = {
  user: User | null;
  setUser: (u: User | null) => void;
};

export const useSession = create<Session>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
