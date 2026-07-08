import type { StateStorage } from 'zustand/middleware'

export const electronStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await window.electron.store.get(name)
    return typeof value === 'string' ? value : null
  },
  setItem: (name: string, value: string): void => {
    window.electron.store.set(name, value)
  },
  removeItem: (name: string): void => {
    window.electron.store.delete(name)
  },
}