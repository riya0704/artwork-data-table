/**
 * Utility types for the application
 */

// Make all properties optional
export type Partial<T> = {
    [P in keyof T]?: T[P];
};

// Make all properties required
export type Required<T> = {
    [P in keyof T]-?: T[P];
};

// Pick specific properties from a type
export type Pick<T, K extends keyof T> = {
    [P in K]: T[P];
};

// Omit specific properties from a type
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

// Create a type with some properties optional
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Create a type with some properties required
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

// Extract the type of array elements
export type ArrayElement<T> = T extends (infer U)[] ? U : never;

// Create a type that excludes null and undefined
export type NonNullable<T> = T extends null | undefined ? never : T;

// Create a type for async function return values
export type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (
    ...args: any
) => Promise<infer R>
    ? R
    : any;

// Create a type for function parameters
export type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never;

// Create a type for function return values
export type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any;

// Create a deep readonly type
export type DeepReadonly<T> = {
    readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// Create a type for event handlers
export type EventHandler<T = Event> = (event: T) => void;

// Create a type for async event handlers
export type AsyncEventHandler<T = Event> = (event: T) => Promise<void>;

// Create a type for callback functions
export type Callback<T = void> = () => T;

// Create a type for async callback functions
export type AsyncCallback<T = void> = () => Promise<T>;