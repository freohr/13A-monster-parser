export class Trait {
  #name = "";
  #description = "";

  // Static Factory to enable creating Objects with CustomJS plugin
  static create(name, description) {
    return new Trait(name, description);
  }

  constructor(name, description) {
    this.#name = name;
    this.#description = description;
  }

  get name() {
    return this.#name;
  }

  get description() {
    return this.#description;
  }
}
