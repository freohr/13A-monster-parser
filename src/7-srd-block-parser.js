import { TextHandler } from "./3-text-handler.js";
import { Attack } from "./2-attack.js";
import { Trait } from "./1-trait.js";
import { Helpers } from "./0-helpers.js";
import { FullStatBlock } from "./full-stat-block.js";

export class SrdBlockParser {
    #textHandler;

    constructor(text) {
        this.#textHandler = new TextHandler(text, false);
    }
    static get #strengthLineRegex() {
        return /(?<size>\S+)? ?(?<ordinal>(?<level>\d+)\s*(st|nd|rd|th)) level (?<role>\S+) (?<type>\S+)/;
    }

    static get #attackStarterRegex() {
        return /^(?<trigger>\[Special trigger] )?(?<attack_name>.+) — (?<attack_desc>.*)/;
    }

    static get #attackTraitStarterRegex() {
        return /^ (?<trait_name>.+)(?<![RC]): (?<trait_desc>.*)/;
    }

    static get #traitStarterRegex() {
        return /^(?! )(?<trait_name>.+)(?<![RC]): (?<trait_desc>.*)/;
    }

    static get #nastierHeaderRegex() {
        return /^Nastier Specials$/;
    }

    static get #initiativeRegex() {
        return /^Initiative: \+?(?<initiative>.+)$/;
    }

    static get #vulnerabilityRegex() {
        return /^Vulnerability: (?<vulnerability>.+)/;
    }

    static get #initiativeLineIndex() {
        return 11;
    }

    static get #blockSeparator() {
        return /^\t$/;
    }

    static get #defensesRegex() {
        return {
            ac: /^AC/i,
            pd: /^PD/i,
            md: /^MD/i,
            hp: /^HP/i,
            anyDefense: /^(AC|PD|MD|HP)/i,
            other: /^\((?<name>.+)\)+/,
            value: /^(?<value>\d+)/,
        };
    }

    #placeTextAtStartOfBlock(startOfBlockRegex) {
        this.#textHandler.index = SrdBlockParser.#initiativeLineIndex;
        this.#textHandler.advanceIndex();
        if (this.#textHandler.currentLine.match(SrdBlockParser.#vulnerabilityRegex)) {
            this.#textHandler.advanceIndex(2);
        } else {
            this.#textHandler.advanceIndex();
        }

        let blockMatch;
        while (!(blockMatch = this.#textHandler.currentLine.match(startOfBlockRegex))) {
            this.#textHandler.advanceIndex();
        }
    }

    getMonsterDescription() {
        this.#textHandler.index = 0;

        const monsterDescription = {
            name: this.#textHandler.currentLine,
            size: "",
            level: "",
            levelOrdinal: "",
            role: "",
            type: "",
            initiative: "",
            vulnerability: "",
        };

        this.#textHandler.advanceIndex();

        const descriptionArray = [];

        while (!this.#textHandler.currentLine.match(SrdBlockParser.#blockSeparator)) {
            descriptionArray.push(this.#textHandler.currentLine);
            this.#textHandler.advanceIndex();
        }

        const descriptionString = descriptionArray
            .filter((s) => s.length > 0)
            .map((s) => s.trim())
            .join(" ");

        const descriptionMatch = descriptionString.match(SrdBlockParser.#strengthLineRegex);

        if (!descriptionMatch) {
            throw "Bad format for monster description";
        }

        if (descriptionMatch.groups.size) {
            monsterDescription.size = descriptionMatch.groups.size.toLowerCase();
        }
        monsterDescription.level = descriptionMatch.groups.level;
        monsterDescription.levelOrdinal = descriptionMatch.groups.ordinal;
        monsterDescription.role = descriptionMatch.groups.role.toLowerCase();
        monsterDescription.type = descriptionMatch.groups.type.toLowerCase();

        this.#textHandler.advanceIndex(2);

        const initiativeMatch = this.#textHandler.currentLine.match(SrdBlockParser.#initiativeRegex);
        monsterDescription.initiative = initiativeMatch.groups.initiative;
        this.#textHandler.advanceIndex();

        let vulnerabilityMatch = this.#textHandler.currentLine.match(SrdBlockParser.#vulnerabilityRegex);
        if (vulnerabilityMatch) {
            monsterDescription.vulnerability = vulnerabilityMatch.groups.vulnerability;
        }

        return monsterDescription;
    }

    getMonsterAttacks() {
        // Set up the text handler to the correct line
        this.#placeTextAtStartOfBlock(SrdBlockParser.#attackStarterRegex);

        if (this.#textHandler.atEnd) {
            return;
        }

        // Start parsing attacks
        const attacks = {
            attacks: [],
            triggeredAttacks: [],
        };
        let attackMatch;
        while ((attackMatch = this.#textHandler.currentLine.match(SrdBlockParser.#attackStarterRegex))) {
            const currentAttack = new Attack(attackMatch.groups.attack_name, attackMatch.groups.attack_desc);
            this.#textHandler.advanceIndex();

            let traitMatch;
            while ((traitMatch = this.#textHandler.currentLine.match(SrdBlockParser.#attackTraitStarterRegex))) {
                const currentTrait = new Trait(traitMatch.groups.trait_name, traitMatch.groups.trait_desc);
                currentAttack.traits.push(currentTrait);
                this.#textHandler.advanceIndex();
            }

            if (attackMatch.groups.trigger) {
                attacks.triggeredAttacks.push(currentAttack);
            } else {
                attacks.attacks.push(currentAttack);
            }
            this.#textHandler.advanceIndex();
        }

        return attacks;
    }

    getMonsterTraits() {
        // Set up the text handler to the correct line
        this.#placeTextAtStartOfBlock(SrdBlockParser.#traitStarterRegex);

        if (this.#textHandler.atEnd) {
            return;
        }

        const traits = { traits: [] },
            triggeredAttacks = [],
            nastierSpecials = { traits: [] };

        let currentTraitCategory = traits;

        while (!this.#textHandler.currentLine.match(SrdBlockParser.#blockSeparator)) {
            const currentLine = this.#textHandler.currentLine;

            if (Helpers.isEmpty(currentLine)) {
                this.#textHandler.advanceIndex();
                continue;
            }

            let currentMatch;
            if ((currentMatch = currentLine.match(SrdBlockParser.#traitStarterRegex))) {
                currentTraitCategory.traits.push(
                    new Trait(currentMatch.groups.trait_name, currentMatch.groups.trait_desc)
                );
            } else if ((currentMatch = currentLine.match(SrdBlockParser.#nastierHeaderRegex))) {
                currentTraitCategory = nastierSpecials;
            } else if ((currentMatch = currentLine.match(SrdBlockParser.#attackStarterRegex))) {
                const attack = new Attack(currentMatch.groups.attack_name, currentMatch.groups.attack_desc);
                this.#textHandler.advanceIndex();
                while ((currentMatch = currentLine.match(SrdBlockParser.#attackTraitStarterRegex))) {
                    attack.traits.push(new Trait(currentMatch.groups.trait_name, currentMatch.groups.trait_desc));
                    this.#textHandler.advanceIndex();
                }
                triggeredAttacks.push(attack);
            } else if (!Helpers.isEmpty(currentLine)) {
                const currentTraitDesc =
                    currentTraitCategory.traits[currentTraitCategory.traits.length - 1].description;
                [currentTraitDesc, currentLine].join(" ");
                currentTraitCategory.traits[currentTraitCategory.traits.length - 1].description = [
                    currentTraitDesc,
                    currentLine,
                ].join(" ");
            }

            if (this.#textHandler.currentLine.match(SrdBlockParser.#blockSeparator)) {
                break;
            }
            this.#textHandler.advanceIndex();
        }

        return {
            traits: traits.traits,
            nastierTraits: nastierSpecials.traits,
            triggeredAttacks: triggeredAttacks,
        };
    }

    getMonsterDefenses() {
        const defenseRegexes = SrdBlockParser.#defensesRegex;

        this.#placeTextAtStartOfBlock(defenseRegexes.ac);

        // Some creature have predefined defenses based on their traits, so we need to catch them
        let defenseNames = [],
            defenseMatch;
        do {
            defenseNames.push(this.#textHandler.currentLine);
            this.#textHandler.advanceIndex();

            defenseMatch = this.#textHandler.currentLine.match(defenseRegexes.value);
        } while (!defenseMatch);

        let defenseValues = [];
        while (!this.#textHandler.atEnd) {
            defenseValues.push(this.#textHandler.currentLine);
            this.#textHandler.advanceIndex();
        }

        defenseNames = defenseNames
            .map((s) => s.trim())
            .filter((s) => s.length !== 0)
            .map((s) => s.toLowerCase());
        defenseValues = defenseValues.map((s) => s.trim()).filter((s) => s.length !== 0);
        const zip = (a, b) => a.map((k, i) => [k, b[i]]),
            matchedDefenses = zip(defenseNames, defenseValues),
            defenses = {};

        matchedDefenses.forEach((elem, index) => {
            const name = elem[0],
                value = elem[1];
            if (name.match(defenseRegexes.anyDefense)) {
                defenses[name] = value;
            } else {
                const namePrevious = matchedDefenses[index - 1][0];
                const additionalInfoMatch = name.match(defenseRegexes.other);
                defenses[namePrevious] += ` (${additionalInfoMatch.groups.name}: ${value})`;
            }
        });

        return defenses;
    }

    getFullMonster() {
        const description = this.getMonsterDescription();

        const monsterData = new FullStatBlock(
            description.name,
            description.size,
            description.level,
            description.levelOrdinal,
            description.role,
            description.initiative,
            description.vulnerability
        );

        const attacks = this.getMonsterAttacks();
        monsterData.attacks.push(...(attacks.attacks));
        monsterData.triggeredAttacks.push(...(attacks.triggeredAttacks));

        const traits = this.getMonsterTraits();
        monsterData.traits.push(...(traits.traits));
        monsterData.nastierTraits.push(...(traits.nastierTraits));
        monsterData.triggeredAttacks.push(...(traits.triggeredAttacks));

        const defenses = this.getMonsterDefenses();
        monsterData.ac = defenses.ac;
        monsterData.pd = defenses.pd;
        monsterData.md = defenses.md;
        monsterData.hp = defenses.hp;

        return monsterData;
    }
}
