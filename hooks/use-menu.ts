/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";

type MenuRefMap = Record<string, HTMLDivElement | null>;

interface MenuState {
  menuRefList: MenuRefMap;
  activeMenu: any;

  setMenuRef: (id: string, el: HTMLDivElement | null) => void;
  removeMenuRef: (id: string) => void;
  setActiveMenu: (id: any) => void;
}

export const useMenu = create<MenuState>((set) => ({
  menuRefList: {},
  activeMenu: null,

  setMenuRef: (id, el) =>
    set((state) => ({
      menuRefList: {
        ...state.menuRefList,
        [id]: el,
      },
    })),

  removeMenuRef: (id) =>
    set((state) => {
      const next = { ...state.menuRefList };
      delete next[id];
      return { menuRefList: next };
    }),

  setActiveMenu: (id) => set({ activeMenu: id }),
}));

export const scrollMenu = (id: string) => {
  const ref = useMenu.getState().menuRefList[id];
  if (!ref) return;

  window.scrollTo({
    top: ref.getBoundingClientRect().top + window.scrollY - 70,
    behavior: "smooth",
  });
};
