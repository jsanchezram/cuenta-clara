// @ts-check
/**
 * Store mínimo con 3 reglas: un solo lugar, inmutable y pintar desde el estado.
 */

/**
 * @template {object} S
 * @param {S} initial
 */
export function createStore(initial) {
  let state = Object.freeze({ ...initial });
  /** @type {Set<(state: Readonly<S>) => void>} */
  const subscribers = new Set();
  return {
    /** @returns {Readonly<S>} */
    get: () => state,
    /** @param {Partial<S>} partial */
    update(partial) {
      state = Object.freeze({ ...state, ...partial });
      subscribers.forEach((fn) => fn(state));
    },
    /**
     * @param {(state: Readonly<S>) => void} fn
     * @returns {() => void} función para desuscribirse
     */
    subscribe(fn) {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
  };
}
