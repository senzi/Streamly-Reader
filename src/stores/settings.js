import { defineStore } from 'pinia'

const STORAGE_KEY = 'streamly-settings'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    speed: 50,
    fontKey: 'system',
  }),
  actions: {
    hydrate() {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      try {
        const data = JSON.parse(raw)
        if (typeof data.speed === 'number') {
          this.speed = clamp(data.speed, 1, 100)
        }
        if (typeof data.fontKey === 'string') {
          this.fontKey = data.fontKey
        }
      } catch {
        // Ignore corrupt storage.
      }
    },
    persist() {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          speed: this.speed,
          fontKey: this.fontKey,
        })
      )
    },
  },
})
