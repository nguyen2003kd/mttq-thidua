// Core
import { decrypt, encrypt } from './crypto'
import { PersistStorage, StorageValue } from 'zustand/middleware'

// App
import envConfig from '@/configs/env-config'

const canUseLocalStorage = () => typeof window !== 'undefined' && typeof localStorage !== 'undefined'

export async function getItem(name: string) {
  if (!canUseLocalStorage()) return null

  try {
    const cipherText = localStorage.getItem(name)
    if (!cipherText) return null

    const originalText = await decrypt(
      cipherText,
      envConfig.SECRET_KEY,
      envConfig.BUFFER_KEY
    )

    if (!originalText) return null

    return JSON.parse(originalText)
  } catch (error) {
    console.warn(
      `Failed to read storage item "${name}", removing corrupted entry:`,
      error
    )

    if (canUseLocalStorage()) {
      localStorage.removeItem(name)
    }

    return null
  }
}

export async function setItem<S>(name: string, value: StorageValue<S>) {
  if (!canUseLocalStorage()) return

  const cipherText = await encrypt(JSON.stringify(value), envConfig.SECRET_KEY, envConfig.BUFFER_KEY)
  // setCookie(name, cipherText)
  localStorage.setItem(name, cipherText)
}

export async function removeItem(name: string) {
  if (!canUseLocalStorage()) return

  // removeCookie(name)
  localStorage.removeItem(name)
}

// Utils
export const createStorage = <S>(): PersistStorage<S> => {
  return {
    getItem,
    setItem,
    removeItem
  }
}
