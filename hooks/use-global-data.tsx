/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";

type MenuType = {
  id: number;
  title: string;
  url: string;
  icon: string;
  entity: string | null;
  config: any;
  parent_id: number | null;
  order_no: number;
  is_active: boolean;
  parent: MenuType[];
};

type ActiveMenuType = {
  menu: MenuType;
  type: "edit" | "create";
};

export type CourseType = {
  id: number;
  name: string;
  content: string;
  is_active: boolean;
};

type Store = {
  sidebarOpen: boolean;
  setSidebarOpen: (prop?: boolean) => void;
  menu: MenuType[];
  setMenu: (prop?: MenuType[]) => void;
  process: boolean;
  setProcess: (prop: boolean) => void;
  skelton: boolean;
  setSkelton: (prop: boolean) => void;
  name: string;
  tagLine: string;
  logo: string;
  menuPopupOpen: boolean;
  setMenuPopupOpen: (prop?: boolean) => void;
  activeMenu: ActiveMenuType | undefined;
  setActiveMenu: (prop?: ActiveMenuType | undefined) => void;
  reloadList: boolean;
  setReloadList: (prop: boolean) => void;
  course: CourseType | undefined;
  setCourse: (prop: CourseType | undefined) => void;
};

export const useGlobalData = create<Store>()((set) => ({
  name: "SKILLOM",
  tagLine: "Learning Platform",
  logo: "",
  sidebarOpen: false,
  setSidebarOpen: (prop) =>
    set((state) => ({
      sidebarOpen: prop === undefined ? !state.sidebarOpen : prop,
    })),
  menu: [],
  setMenu: (prop) =>
    set(() => ({
      menu: prop,
    })),
  process: false,
  setProcess: (prop) =>
    set(() => ({
      process: prop,
    })),
  skelton: true,
  setSkelton: (prop) =>
    set(() => ({
      skelton: prop,
    })),
  menuPopupOpen: false,
  setMenuPopupOpen: (prop) =>
    set((state) => ({
      menuPopupOpen: prop === undefined ? !state.menuPopupOpen : prop,
      activeMenu:
        prop === undefined || prop === false ? undefined : state.activeMenu,
    })),
  activeMenu: undefined,
  setActiveMenu: (prop) =>
    set(() => ({
      activeMenu: prop,
      menuPopupOpen: prop ? true : false,
    })),
  reloadList: false,
  setReloadList: (prop) =>
    set(() => ({
      reloadList: prop,
    })),
  course: undefined,
  setCourse: (prop) =>
    set(() => ({
      course: prop,
    })),
}));
