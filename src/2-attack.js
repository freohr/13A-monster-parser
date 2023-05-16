import { Trait } from "./1-trait.js";

export class Attack extends Trait {
    #traits = [];

    // Static Factory to enable creating Objects with CustomJS plugin
    static create(name, description, traits) {
        return new Attack(name, description, traits);
    }

    constructor(name, description, traits) {
        super(name, description);
        this.#traits = traits ?? [];
    }

    get traits() {
        return this.#traits;
    }
}
