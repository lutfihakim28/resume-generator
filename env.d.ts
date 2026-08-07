/// <reference types="vite/client" />

// Ambient shim so .vue imports resolve for type-checking (including plain tsc).
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}
