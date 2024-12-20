import Helpers from "./helpers.js";

export class MonsterStatBlock {
    #name = "";
    #flavor_text = "";
    #size = "";
    #strength = "";
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
    #ac_base = "";
    #pd = "";
    #pd_base = "";
    #md = "";
    #md_base = "";
    #hp = "";
    #hp_base = "";

    #description = "";

    constructor({
        name = null,
        strength = null,
        size = null,
        level = null,
        levelOrdinal = null,
        role = null,
        type = null,
        initiative = null,
        vulnerability = null,
        attacks = [],
        traits = [],
        triggeredAttacks = [],
        nastierTraits = [],
        ac = null,
        pd = null,
        md = null,
        hp = null,
        ac_base = null,
        pd_base = null,
        md_base = null,
        hp_base = null,
        description = null,
    } = {}) {
        this.#name = name;
        this.#strength = strength;
        this.#size = size;
        this.#level = level;
        this.#levelOrdinal = levelOrdinal;
        this.#role = role;
        this.#type = type;
        this.#initiative = initiative;
        this.#vulnerability = vulnerability;
        this.#attacks = attacks;
        this.#traits = traits;
        this.#triggeredAttacks = triggeredAttacks;
        this.#nastierTraits = nastierTraits;
        this.#ac = ac;
        this.#pd = pd;
        this.#md = md;
        this.#hp = hp;
        this.#ac_base = ac_base;
        this.#pd_base = pd_base;
        this.#md_base = md_base;
        this.#hp_base = hp_base;
        this.#description = description;
    }

    clear() {
        this.clearDescription();
        this.attacks = null;
        this.traits = null;
        this.triggeredAttacks = null;
        this.nastierTraits = null;
        this.ac = null;
        this.pd = null;
        this.md = null;
        this.hp = null;
        this.ac_base = null;
        this.pd_base = null;
        this.md_base = null;
        this.hp_base = null;
        this.description = null;
    }

    clearDescription() {
        this.name = null;
        this.flavor_text = null;
        this.size = null;
        this.strength = null;
        this.level = null;
        this.levelOrdinal = null;
        this.role = null;
        this.type = null;
        this.initiative = null;
        this.vulnerability = null;
    }

    /**
     * @param {MonsterStatBlock} other
     */
    import(other) {
        if (!Helpers.isEmpty(other.name)) {
            this.#name = other.name;
        }
        if (!Helpers.isEmpty(other.flavor_text)) {
            this.#flavor_text = other.flavor_text;
        }
        if (!Helpers.isEmpty(other.size)) {
            this.#size = other.size;
        }
        if (!Helpers.isEmpty(other.strength)) {
            this.#strength = other.strength;
        }
        if (!Helpers.isEmpty(other.level)) {
            this.#level = other.level;
            this.#levelOrdinal = Helpers.getOrdinal(this.level);
        }
        if (!Helpers.isEmpty(other.role)) {
            this.#role = other.role;
        }
        if (!Helpers.isEmpty(other.type)) {
            this.#type = other.type;
        }
        if (!Helpers.isEmpty(other.initiative)) {
            this.#initiative = other.initiative;
        }
        if (!Helpers.isEmpty(other.vulnerability)) {
            this.#vulnerability = other.vulnerability;
        }
        if (!Helpers.isEmpty(other.attacks)) {
            this.#attacks = other.attacks;
        }
        if (!Helpers.isEmpty(other.traits)) {
            this.#traits = other.traits;
        }
        if (!Helpers.isEmpty(other.triggeredAttacks)) {
            if (Helpers.isEmpty(this.triggeredAttacks)) {
                this.#triggeredAttacks = other.triggeredAttacks;
            } else {
                for (const attack of other.triggeredAttacks) {
                    if (!this.triggeredAttacks.some((a) => attack.equals(a))) {
                        this.triggeredAttacks.push(attack);
                    }
                }
            }
        }
        if (!Helpers.isEmpty(other.nastierTraits)) {
            this.#nastierTraits = other.nastierTraits;
        }
        if (!Helpers.isEmpty(other.ac)) {
            this.#ac = other.ac;
        }
        if (!Helpers.isEmpty(other.pd)) {
            this.#pd = other.pd;
        }
        if (!Helpers.isEmpty(other.md)) {
            this.#md = other.md;
        }
        if (!Helpers.isEmpty(other.hp)) {
            this.#hp = other.hp;
        }
        if (!Helpers.isEmpty(other.ac_base)) {
            this.#ac_base = other.ac_base;
        }
        if (!Helpers.isEmpty(other.pd_base)) {
            this.#pd_base = other.pd_base;
        }
        if (!Helpers.isEmpty(other.md_base)) {
            this.#md_base = other.md_base;
        }
        if (!Helpers.isEmpty(other.hp_base)) {
            this.#hp_base = other.hp_base;
        }
        if (!Helpers.isEmpty(other.description)) {
            this.#description = other.description;
        }

        return this;
    }

    get fullDescription() {
        const desc = {
            name: this.name,
            strength: this.strength,
            level: this.level,
            levelOrdinal: this.levelOrdinal,
            role: this.role,
            type: this.type,
            initiative: this.initiative,
            vulnerability: this.vulnerability,
        };

        if (!Helpers.isEmpty(this.flavor_text)) {
            desc.flavor_text = this.flavor_text;
        }

        if (this.size) {
            desc.size = this.size;
        }

        if (this.role === "mook") {
            desc.mook = "yes";
        }

        return desc;
    }

    get name() {
        return this.#name;
    }

    set name(value) {
        this.#name = value;
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

    get strength() {
        return this.#strength;
    }

    set strength(value) {
        this.#strength = value;
    }

    get level() {
        return this.#level;
    }

    set level(value) {
        this.#level = value;
    }

    get levelOrdinal() {
        return this.#levelOrdinal;
    }

    set levelOrdinal(value) {
        this.#levelOrdinal = value;
    }

    get role() {
        return this.#role;
    }

    set role(value) {
        this.#role = value;
    }

    get type() {
        return this.#type;
    }

    set type(value) {
        this.#type = value;
    }

    get initiative() {
        return this.#initiative;
    }

    set initiative(value) {
        this.#initiative = value;
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

    /**
     * @param {Attack[]} attacks
     */
    set attacks(attacks) {
        this.#attacks = attacks;
    }

    get traits() {
        return this.#traits;
    }

    /**
     * @param {Trait[]} traits
     */
    set traits(traits) {
        this.#traits = traits;
    }

    get triggeredAttacks() {
        return this.#triggeredAttacks;
    }

    /**
     * @param {Attack[]} attacks
     */
    set triggeredAttacks(attacks) {
        this.#triggeredAttacks = attacks;
    }

    get nastierTraits() {
        return this.#nastierTraits;
    }

    /**
     * @param {Trait[]} traits
     */
    set nastierTraits(traits) {
        this.#nastierTraits = traits;
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

    get ac_base() {
        return this.#ac_base;
    }

    set ac_base(value) {
        this.#ac_base = value;
    }

    get pd_base() {
        return this.#pd_base;
    }

    set pd_base(value) {
        this.#pd_base = value;
    }

    get md_base() {
        return this.#md_base;
    }

    set md_base(value) {
        this.#md_base = value;
    }

    get hp_base() {
        return this.#hp_base;
    }

    set hp_base(value) {
        this.#hp_base = value;
    }

    get description() {
        return this.#description;
    }

    set description(value) {
        this.#description = value;
    }
}

export class Trait {
    #name = "";
    #description = "";

    /**
     *
     * @type {Parser13AMonster.Trait[]}
     */
    #traits = [];

    constructor(name, description, traits) {
        this.#name = name.trim();
        this.#description = description.trim();
        this.#traits = traits ?? [];
    }

    get name() {
        return this.#name;
    }

    get description() {
        return this.#description;
    }

    set description(text) {
        this.#description = text;
    }

    get traits() {
        return this.#traits;
    }
}

export class Attack {
    #name = "";
    #description = "";

    /**
     *
     * @type {Parser13AMonster.Trait[]}
     */
    #traits = [];

    constructor(name, description, traits) {
        this.#name = name.trim();
        this.#description = description.trim();
        this.#traits = traits ?? [];
    }

    equals(other) {
        return other instanceof Attack && other.name === this.name;
    }

    get name() {
        return this.#name;
    }

    get description() {
        return this.#description;
    }

    set description(text) {
        this.#description = text;
    }

    get traits() {
        return this.#traits;
    }
}
