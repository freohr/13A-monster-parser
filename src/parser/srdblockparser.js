import ParsingRegexes from "./regexes.js"
import TextHandler from "./texthandler.js";
import MonsterStatBlock, { Trait, Attack } from "../statblock.js"
import Helpers from "../helpers.js";

export default class SrdBlockParser {
    #textHandler;

    constructor(text) {
        this.#textHandler = new TextHandler(text, false);
    }

    #placeTextAtStartOfBlock(startOfBlockRegex) {
        this.#textHandler.index = ParsingRegexes.initiativeLineIndex;
        this.#textHandler.advanceIndex();
        if (
            this.#textHandler.currentLine.match(ParsingRegexes.vulnerabilityRegex)
        ) {
            this.#textHandler.advanceIndex(2);
        } else {
            this.#textHandler.advanceIndex();
        }

        while (!(this.#textHandler.currentLine.match(startOfBlockRegex))) {
            this.#textHandler.advanceIndex();
        }
    }

    getMonsterDescription() {
        this.#textHandler.index = 0;

        const monsterDescription = {
            name: this.#textHandler.currentLine,
            strength: "",
            level: "",
            levelOrdinal: "",
            role: "",
            type: "",
            initiative: "",
            vulnerability: "",
        };

        this.#textHandler.advanceIndex();

        const descriptionArray = [];

        while (
            !this.#textHandler.currentLine.match(ParsingRegexes.blockSeparator)
        ) {
            descriptionArray.push(this.#textHandler.currentLine);
            this.#textHandler.advanceIndex();
        }

        const descriptionString = descriptionArray
            .filter((s) => s.length > 0)
            .map((s) => s.trim())
            .join(" ");

        const descriptionMatch = descriptionString.match(
            ParsingRegexes.strengthLine1eRegex,
        );

        if (!descriptionMatch) {
            throw "Bad format for monster description";
        }

        if (descriptionMatch.groups.strength) {
            monsterDescription.strength = descriptionMatch.groups.strength.toLowerCase();
        }
        monsterDescription.level = descriptionMatch.groups.level;
        monsterDescription.levelOrdinal =
            descriptionMatch.groups.ordinal + (descriptionMatch.groups.ordinal === "0" ? "th" : "");
        monsterDescription.role = descriptionMatch.groups.role.toLowerCase();
        if (monsterDescription.role === "mook") {
            monsterDescription.mook = "yes";
        }
        monsterDescription.type = descriptionMatch.groups.type.toLowerCase();

        this.#textHandler.advanceIndex(2);

        const initiativeMatch = this.#textHandler.currentLine.match(
            ParsingRegexes.initiativeRegex,
        );
        monsterDescription.initiative = initiativeMatch.groups.initiative;
        this.#textHandler.advanceIndex();

        let vulnerabilityMatch = this.#textHandler.currentLine.match(
            ParsingRegexes.vulnerabilityRegex,
        );
        if (vulnerabilityMatch) {
            monsterDescription.vulnerability = vulnerabilityMatch.groups.vulnerability;
        }

        return new MonsterStatBlock(monsterDescription);
    }

    getMonsterAttacks() {
        // Set up the text handler to the correct line
        this.#placeTextAtStartOfBlock(ParsingRegexes.attackStarterRegex);

        if (this.#textHandler.atEnd) {
            return;
        }

        // Start parsing attacks
        const attacks = {
            attacks: [],
            triggeredAttacks: [],
        };
        let attackMatch;
        while (
            (attackMatch = this.#textHandler.currentLine.match(
                ParsingRegexes.attackStarterRegex,
            ))
        ) {
            let isTriggered = false;

            if (
                attackMatch.groups.special?.match(
                    ParsingRegexes.triggeredAttackRegex,
                )
            ) {
                isTriggered = true;
            }

            const currentAttack = new Attack(
                isTriggered ? attackMatch.groups.base_name : attackMatch.groups.full_name,
                attackMatch.groups.attack_desc,
            );
            this.#textHandler.advanceIndex();

            let traitMatch;
            while (
                (traitMatch = this.#textHandler.currentLine.match(
                    ParsingRegexes.attackTraitStarterRegex,
                ))
            ) {
                const currentTrait = new Trait(
                    traitMatch.groups.trait_name,
                    traitMatch.groups.trait_desc,
                );
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

        return new MonsterStatBlock(attacks);
    }

    getMonsterTraits() {
        // Set up the text handler to the correct line
        this.#placeTextAtStartOfBlock(ParsingRegexes.traitStarterRegex);

        if (this.#textHandler.atEnd) {
            return;
        }

        const traits = { traits: [] },
            triggeredAttacks = [],
            nastierSpecials = { traits: [] };

        let currentTraitCategory = traits;
        let lastModifiedItem;

        let currentLine;
        while (
            ((currentLine = this.#textHandler.currentLine),
                !currentLine.match(ParsingRegexes.blockSeparator))
        ) {
            if (currentLine.match(ParsingRegexes.blockSeparator)) {
                break;
            }

            if (Helpers.isEmpty(currentLine)) {
                this.#textHandler.advanceIndex();
                continue;
            }

            let currentMatch;
            if (
                (currentMatch = currentLine.match(
                    ParsingRegexes.traitStarterRegex,
                ))
            ) {
                lastModifiedItem = new Trait(
                    currentMatch.groups.trait_name,
                    currentMatch.groups.trait_desc,
                );
                currentTraitCategory.traits.push(lastModifiedItem);
            } else if (
                (currentMatch = currentLine.match(
                    ParsingRegexes.nastierHeaderRegex,
                ))
            ) {
                currentTraitCategory = nastierSpecials;
            } else if (
                (currentMatch = currentLine.match(
                    ParsingRegexes.attackStarterRegex,
                ))
            ) {
                lastModifiedItem = new Attack(
                    currentMatch.groups.base_name,
                    currentMatch.groups.attack_desc,
                );
                triggeredAttacks.push(lastModifiedItem);
            } else if (
                (currentMatch = currentLine.match(
                    ParsingRegexes.attackTraitStarterRegex,
                ))
            ) {
                if (lastModifiedItem && lastModifiedItem instanceof Attack) {
                    lastModifiedItem.traits.push(
                        new Trait(
                            currentMatch.groups.trait_name,
                            currentMatch.groups.trait_desc,
                        ),
                    );
                }
            } else if (
                (currentMatch = currentLine.match(ParsingRegexes.followUpRegex))
            ) {
                const follow_up = currentMatch.groups.follow_up;

                if (lastModifiedItem) {
                    lastModifiedItem.description = [lastModifiedItem.description, follow_up].join("<br/>");
                }
            }
            this.#textHandler.advanceIndex();
        }

        return new MonsterStatBlock({
            traits: traits.traits,
            nastierTraits: nastierSpecials.traits,
            triggeredAttacks: triggeredAttacks,
        });
    }

    getMonsterDefenses() {
        const defenseRegexes = ParsingRegexes.defensesRegex;

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

        return new MonsterStatBlock(defenses);
    }

    getFullMonster() {
        const description = this.getMonsterDescription();

        const monsterData = new MonsterStatBlock({
            name: description.name,
            strength: description.strength,
            level: description.level,
            levelOrdinal: description.levelOrdinal,
            role: description.role,
            type: description.type,
            initiative: description.initiative,
            vulnerability: description.vulnerability,
        });

        const attacks = this.getMonsterAttacks();
        monsterData.attacks.push(...attacks.attacks);
        monsterData.triggeredAttacks.push(...attacks.triggeredAttacks);

        const traits = this.getMonsterTraits();
        monsterData.traits.push(...traits.traits);
        monsterData.nastierTraits.push(...traits.nastierTraits);
        monsterData.triggeredAttacks.push(...traits.triggeredAttacks);

        const defenses = this.getMonsterDefenses();
        monsterData.ac = defenses.ac;
        monsterData.pd = defenses.pd;
        monsterData.md = defenses.md;
        monsterData.hp = defenses.hp;

        return monsterData;
    }
};
