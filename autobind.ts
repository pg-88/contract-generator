export function autobind<T extends { new (...args: any[]): any }>(constructor: T): T {
    return class extends constructor {
        constructor(...args: any[]) {
            super(...args);
            Object.getOwnPropertyNames(constructor.prototype).forEach(key => {
                const descriptor = Object.getOwnPropertyDescriptor(constructor.prototype, key);
                if (descriptor && typeof descriptor.value === 'function' && key !== 'constructor') {
                    this[key] = this[key].bind(this);
                }
            });
        }
    };
}
