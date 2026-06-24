export function isClassExtending(childClass: Function, parentClass: Function) {
  let proto = childClass;

  while (proto) {
    if (proto === parentClass) return true;
    proto = Object.getPrototypeOf(proto);
  }

  return false;
}
export function mergeDefined<T>(obj: T, partial: Partial<T>): T {
  for (const key of Object.keys(partial)) {
    const value = partial[key];
    if (value !== undefined) {
      obj[key] = value;
    }
  }
  return obj;
}

export function escapeLike(input: string): string {
  return input.replace(/[%_\\]/g, (match) => '\\' + match);
}

export type FixedProps<T, K extends keyof T, V extends Pick<T, K>> = Omit<
  T,
  K
> &
  V;

export type RequireOnly<T, K extends keyof T> =
  Pick<T, K> & Partial<Omit<T, K>>;
