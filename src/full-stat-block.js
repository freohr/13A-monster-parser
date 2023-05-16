export class FullStatBlock {
    #name= "";
    #flavor_text = "";
    #size = "";
    #level = "";
    #levelOrdinal = "";
    #role = "";
    #type = "";
    #initiative = "";
    #vulnerability = "";

    /**
     * @type {Attack[]}
     */
    #attacks = [];
    /**
     * @type {Trait[]}
     */
    #traits = [];
    /**
     * @type {Attack[]}
     */
    #triggeredAttacks = [];
    /**
     * @type {Trait[]}
     */
    #nastierTraits = [];

    #ac = "";
    #pd = "";
    #md = "";
    #hp = "";

    #description = "";

    constructor(name, size, level, levelOrdinal, role, type, initiative, vulnerability) {
        this.#name = name;
        this.#size = size;
        this.#level = level;
        this.#levelOrdinal = levelOrdinal;
        this.#role = role;
        this.#type = type;
        this.#initiative = initiative;
        this.#vulnerability = vulnerability;
    }

    get name() {
        return this.#name;
    }

    get flavor_text() {
        return this.#flavor_text;
    }

    set flavor_text(value) {
        this.#flavor_text = value;
    }

    get size() {
        return this.#size;
    }

    set size(value) {
        this.#size = value;
    }

    get level() {
        return this.#level;
    }

    get levelOrdinal() {
        return this.#levelOrdinal;
    }

    get role() {
        return this.#role;
    }

    get type() {
        return this.#type;
    }

    get initiative() {
        return this.#initiative;
    }

    get vulnerability() {
        return this.#vulnerability;
    }

    set vulnerability(value) {
        this.#vulnerability = value;
    }

    get attacks() {
        return this.#attacks;
    }

    get traits() {
        return this.#traits;
    }

    get triggeredAttacks() {
        return this.#triggeredAttacks;
    }

    get nastierTraits() {
        return this.#nastierTraits;
    }

    get ac() {
        return this.#ac;
    }

    set ac(value) {
        this.#ac = value;
    }

    get pd() {
        return this.#pd;
    }

    set pd(value) {
        this.#pd = value;
    }

    get md() {
        return this.#md;
    }

    set md(value) {
        this.#md = value;
    }

    get hp() {
        return this.#hp;
    }

    set hp(value) {
        this.#hp = value;
    }

    get description() {
        return this.#description;
    }

    set description(value) {
        this.#description = value;
    }
}