import { identity } from './identity'
import { throws } from './throws'
import { Nullable } from './types/nullable'

/**
 * The Option Monad.
 *
 * Encases a possibly optional value and permits performing
 * operations on it in a consistent and type-agnostic manner.
 */
export interface Option<T> {
  /**
   * Performs the mapping operation `f` if the inner value is a `Some`.
   *
   * @param f
   * A function that maps inner value `T` to `U` if `T` is a `Some`.
   */
  map<U>(f: (t: T) => U): Option<U>

  /**
   * Performs the mapping operation `f` and flattens the result if the
   * inner value is a `Some`.
   *
   * @param f
   * A function that maps inner value `T` to `Option<U>` if `T` is a
   * `Some`.
   */
  chain<U>(f: (t: T) => Option<U>): Option<U>

  /**
   * Executes the variant arm that matches the current Option.
   *
   * This function can be used to leave the current monadic context.
   *
   * @param patterns
   * An object containing `None` and `Some` variants.
   */
  match<R>(patterns: IOptionMatchPatterns<T, R>): R

  /**
   * Executes the given function for each inner value contained in the Option.
   *
   * @param f
   * The function to apply on the inner value.
   */
  forEach(f: (t: T) => void): this

  /**
   * Unwraps the inner value if `Some(T)`, throws an error if `None`.
   *
   * Prefer `match` or methods that remain within the `monadic` context over
   * this method.
   */
  unwrap(): T

  /**
   * Unwraps the inner value if `Some(T)`, returns the specified default if 
   * `None`.
   * 
   * Prefer `match` or methods that remain within the `monadic` context over
   * this method.

   * @param t 
   * The default value to return if the Option is `None`.
   */
  unwrapOr(t: T): T

  /**
   * Unwraps the inner value if `Some(T)`, returns the result of the specified
   * fallback function if `None`.
   *
   * @param f
   * The default function to execute and from which to return if the Option
   * is `None`.
   */
  unwrapOrDo(f: () => T): T

  /**
   * Indicates whether the Option is a `None`.
   */
  isNone(): boolean

  /**
   * Indicates whether the Option is a `Some`.
   */
  isSome(): boolean
}

/**
 * Variant arms for pattern matching on an `Option<T>`.
 */
export interface IOptionMatchPatterns<TValue, TResult> {
  /**
   * Executed if the `Option` is a "None".
   */
  None: () => TResult

  /**
   * Executed if the `Option` has a `Some(T)`.
   */
  Some: (t: TValue) => TResult
}

/**
 * Creates an `Option<T>` holding the specified value. A `null` `value`
 * creates an Option in the `none` state, but the `some<T>()` and `none()`
 * return functions should be preferred for option creation.
 *
 * @param value
 * The value to lift into the option.
 *
 * @returns
 * The option.
 */
export function createOption<T>(value: Nullable<T>): Option<T> {
  const isSome = value !== null

  return {
    map<U>(f: (t: T) => U): Option<U> {
      return this.match({
        Some: (t) => some(f(t)),
        None: none,
      })
    },

    chain<U>(f: (t: T) => Option<U>): Option<U> {
      return this.match({
        Some: (t) => f(t),
        None: none,
      })
    },

    match<R>(patterns: IOptionMatchPatterns<T, R>): R {
      return isSome ? patterns.Some(value) : patterns.None()
    },

    forEach(f: (t: T) => void): Option<T> {
      return this.match({
        Some: (t) => {
          f(t)
          return this
        },
        None: () => this,
      })
    },

    unwrap() {
      return this.match({
        Some: identity,
        None: throws(() => new Error('Cannot unwrap an Option of "None"')),
      })
    },

    unwrapOr(u: T) {
      return this.match({
        Some: identity,
        None: () => u,
      })
    },

    unwrapOrDo(f: () => T) {
      return this.match({
        Some: identity,
        None: f,
      })
    },

    isNone() {
      return !isSome
    },

    isSome() {
      return isSome
    },
  }
}

/**
 * Creates an `Option` in the "some" state containing `value`.
 *
 * This is one of the two "Return" operations for `Option<T>`.
 *
 * @returns
 */
export function some<T>(value: T): Option<T> {
  return createOption(value)
}

/**
 * Creates an `Option` in the "none" state.
 *
 * This is one of the two "Return" operations for `Option<T>`.
 * @returns
 */
export function none(): Option<never> {
  return createOption(null as never)
}