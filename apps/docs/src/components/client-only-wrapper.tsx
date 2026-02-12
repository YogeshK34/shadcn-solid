/* eslint-disable */
// @ts-ignore
// @refresh skip
import type { Component, ComponentProps, JSX, Setter } from "solid-js"
import {
  createMemo,
  createSignal,
  onMount,
  sharedConfig,
  splitProps,
  untrack,
} from "solid-js"
import { isServer } from "solid-js/web"

/**
 *
 * Read more: https://docs.solidjs.com/solid-start/reference/client/client-only
 */
// not using Suspense
export default function clientOnlyWrapper<T extends Component<any>>(
  fn: () => Promise<{
    default: T
  }>,
  options: { lazy?: boolean } = {},
) {
  if (isServer)
    return (props: ComponentProps<T> & { fallback?: JSX.Element }) =>
      props.fallback

  const [comp, setComp] = createSignal<T>()
  const loadStarted = !options.lazy
  loadStarted && load(fn, setComp)
  return (props: ComponentProps<T>) => {
    let Comp: T | undefined
    const [, rest] = splitProps(props, ["fallback"])
    options.lazy && load(fn, setComp)
    // If component is already loaded, render it immediately
    if ((Comp = comp()) && !sharedConfig.context) return Comp(rest)
    // If we started loading eagerly (not lazy), render as soon as component loads
    if (loadStarted) {
      return createMemo(() => {
        const C = comp()
        return untrack(() => (C ? C(rest) : props.fallback))
      })
    }
    // For lazy loading, wait for mount
    const [mounted, setMounted] = createSignal(!sharedConfig.context)
    onMount(() => setMounted(true))
    return createMemo(
      () => {
        const C = comp()
        const m = mounted()
        return untrack(() => (C && m ? C(rest) : props.fallback))
      },
    )
  }
}

function load<T>(
  fn: () => Promise<{
    default: T
  }>,
  setComp: Setter<T>,
) {
  fn().then((m) => setComp(() => m.default))
}
