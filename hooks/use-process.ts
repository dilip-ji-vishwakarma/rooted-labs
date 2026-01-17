import { create } from "zustand";

interface ProcessState {
  process: boolean;
  setProcess: (prop: boolean) => void;
}

export const useProcess = create<ProcessState>((set) => ({
  process: false,
  setProcess: (value) => set(() => ({ process: value })),
}));
