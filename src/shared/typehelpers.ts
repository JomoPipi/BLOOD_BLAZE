
type OmitByValue<V,T> = { [key in keyof T as T[key] extends V ? never : key] : T[key] }
type PickByValue<V,T> = { [key in keyof T as T[key] extends V ? key : never] : T[key] }
type ReadonlyRecord<K extends string | number | symbol, V> = { readonly [key in K] : V }