import '@testing-library/jest-dom'

// jsdom 29 + vitest 4 では localStorage が正しく初期化されない場合があるため
// シンプルなインメモリ実装を提供する
const createLocalStorageMock = () => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string): string | null => store[key] ?? null,
    setItem: (key: string, value: string): void => { store[key] = String(value) },
    removeItem: (key: string): void => { delete store[key] },
    clear: (): void => { store = {} },
    get length() { return Object.keys(store).length },
    key: (index: number): string | null => Object.keys(store)[index] ?? null,
  }
}

Object.defineProperty(window, 'localStorage', {
  value: createLocalStorageMock(),
  writable: true,
})
