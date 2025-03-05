"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.autobind = autobind;
function autobind(constructor) {
    return class extends constructor {
        constructor(...args) {
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
