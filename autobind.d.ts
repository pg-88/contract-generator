export declare function autobind<T extends {
    new (...args: any[]): any;
}>(constructor: T): T;
