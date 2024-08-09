import ParsingRegexes from "./regexes.js"
import TextHandler from "./texthandler.js"
import { Trait, Attack, MonsterStatBlock } from "../statblock.js"
import Helpers from "../helpers.js"

export default class PdfBlockParser {
    #textHandler;

    /**
     * @param {string} textBlock 
     */
    constructor(textBlock) {
        this.#textHandler = new TextHandler(textBlock);
    }

    /**
     * @param {string} descStarter 
     * @returns {string}
     */
    #getDescription(descStarter) {
        const fullDesc = [descStarter];
        let desc;

        while (!this.#textHandler.atEnd) {
            if (
                this.#textHandler.currentLine.match(
                    ParsingRegexes.nastierHeaderRegex,
                ) ||
                this.#textHandler.currentLine.match(
                    ParsingRegexes.resistStarterRegex,
                )
            ) {
                break;
            }

            if (
                (desc = this.#textHandler.currentLine.match(
                    ParsingRegexes.pdfFollowUpRegex,
                )) !== null
            ) {
                fullDesc.push(this.#textHandler.currentLine);
                this.#textHandler.advanceIndex();
            } else {
                break;
            }
        }

        return fullDesc.join(" ");
    }

    #getTraits() {
        const traits = [],
            triggeredAttacks = [];
        let match;

        while (!this.#textHandler.atEnd) {
            if (
                (match = this.#textHandler.currentLine.match(
                    ParsingRegexes.resistStarterRegex,
                )) !== null
            ) {
                traits.push(
                    new Trait(
                        this.#textHandler.currentLine.replaceAll(/\./g, ""),
                        `When a ${match.groups.element.toLowerCase()} attack targets this creature, the attacker must roll a natural ${match.groups.value}+ on the attack roll or it only deals half damage.`,
                    ),
                );

                this.#textHandler.advanceIndex();
            } else if (
                (match = this.#textHandler.currentLine.match(
                    ParsingRegexes.traitStarterRegex,
                )) !== null
            ) {
                this.#textHandler.advanceIndex();

                traits.push(
                    new Trait(
                        match.groups.trait_name,
                        this.#getDescription(match.groups.trait_desc),
                    ),
                );
            } else if (
                (match = this.#textHandler.currentLine.match(
                    ParsingRegexes.attackStarterRegex,
                )) !== null
            ) {
                this.#textHandler.advanceIndex();
                const newAttack = this.#getBasicAttack(match.groups.base_name, match.groups.attack_desc);

                triggeredAttacks.push(newAttack);
            } else {
                break;
            }
        }

        return { traits: traits, triggeredAttacks: triggeredAttacks };
    }

    #getAttackTraits() {
        const traits = [];

        let match;

        while (!this.#textHandler.atEnd) {
            if (
                (match = this.#textHandler.currentLine.match(
                    ParsingRegexes.traitStarterRegex,
                )) !== null
            ) {
                this.#textHandler.advanceIndex();

                traits.push(
                    new Trait(
                        match.groups.trait_name,
                        this.#getDescription(match.groups.trait_desc),
                    ),
                );
            } else {
                break;
            }
        }

        return traits;
    }

    /**
     * @param {string} attackName 
     * @param {string} attackDesc 
     * @returns {Attack}
     */
    #getBasicAttack(attackName, attackDesc) {
        return new Attack(attackName, this.#getDescription(attackDesc), null);
    }

    /**
     * @param {string} attackName 
     * @param {string} attackDesc 
     * @returns {Attack}
     */
    #getFullAttack(attackName, attackDesc) {
        return new Attack(
            attackName,
            this.#getDescription(attackDesc),
            this.#getAttackTraits(),
        );
    }

    parseAttackBlock() {
        const attacks = [],
            triggeredAttacks = [];

        while (!this.#textHandler.atEnd) {
            let startAttackMatch;

            if (
                (startAttackMatch = this.#textHandler.currentLine.match(
                    ParsingRegexes.attackStarterRegex,
                ))
            ) {
                this.#textHandler.advanceIndex();

                let isTriggered = false;

                if (
                    startAttackMatch.groups.special?.match(
                        ParsingRegexes.triggeredAttackRegex,
                    )
                ) {
                    isTriggered = true;
                }

                const newAttack = this.#getFullAttack(
                    isTriggered ? startAttackMatch.groups.base_name : startAttackMatch.groups.full_name,
                    startAttackMatch.groups.attack_desc,
                );

                if (isTriggered) {
                    triggeredAttacks.push(newAttack);
                } else {
                    attacks.push(newAttack);
                }
            } else {
                break;
            }
        }

        return new MonsterStatBlock({
            attacks: attacks,
            triggeredAttacks: triggeredAttacks,
        });
    }

    parseAttackLines() {
        const attacks = [],
            triggeredAttacks = [];

        let lastParsedAttack = undefined,
            isTriggered = false,
            currentThing = undefined;

        const finalizeThing = (thing, isTriggered) => {
            if (!thing) {
                return;
            }

            if (thing instanceof Attack) {
                lastParsedAttack = thing;
                if (isTriggered) {
                    triggeredAttacks.push(thing);
                } else {
                    attacks.push(thing);
                }
            } else if (thing instanceof Trait) {
                lastParsedAttack.traits.push(thing);
            }

            currentThing = undefined;
        };

        const appendDescription = (thing, desc) => {
            const descLines = [thing.description, desc];

            thing.description = descLines.map((s) => s.trim()).join(" ");
        };

        while (!this.#textHandler.atEnd) {
            const currentLine = this.#textHandler.currentLine;

            let match;

            if ((match = currentLine.match(ParsingRegexes.attackStarterRegex))) {
                finalizeThing(currentThing, isTriggered);
                currentThing = new Attack(
                    match.groups.attack_name,
                    match.groups.attack_desc,
                );
                lastParsedAttack = currentThing;
                isTriggered = match.groups.trigger != undefined;
            } else if (
                (match = currentLine.match(ParsingRegexes.traitStarterRegex))
            ) {
                finalizeThing(currentThing, isTriggered);
                currentThing = new Trait(
                    match.groups.trait_name,
                    match.groups.trait_desc,
                );
            } else {
                appendDescription(currentThing, currentLine);
            }

            this.#textHandler.advanceIndex();
        }

        finalizeThing(currentThing, isTriggered);

        return new MonsterStatBlock({
            attacks: attacks,
            triggeredAttacks: triggeredAttacks,
        });
    }

    parseTraitBlock() {
        if (
            this.#textHandler.currentLine.match(ParsingRegexes.nastierHeaderRegex)
        ) {
            return this.parseNastierTraitBlock();
        }

        const parsedTraits = this.#getTraits();
        if (
            !this.#textHandler.atEnd &&
            this.#textHandler.currentLine.match(ParsingRegexes.nastierHeaderRegex)
        ) {
            const parsedNastierTraits = this.parseNastierTraitBlock();

            parsedTraits.triggeredAttacks = [
                ...parsedTraits.triggeredAttacks,
                ...parsedNastierTraits.triggeredAttacks,
            ];
            parsedTraits.nastierTraits = parsedNastierTraits.nastierTraits;
        }

        return new MonsterStatBlock(parsedTraits);
    }

    parseNastierTraitBlock() {
        if (
            this.#textHandler.currentLine.match(ParsingRegexes.nastierHeaderRegex)
        ) {
            this.#textHandler.advanceIndex();
        }

        const { traits, ...other } = this.#getTraits();
        return new MonsterStatBlock({ nastierTraits: traits, ...other });
    }

    parseDescriptionBlock() {
        const monsterDescription = {
            name: "",
            flavor_text: "",
            strength: "",
            level: "",
            levelOrdinal: "",
            role: "",
            type: "",
            initiative: "",
            vulnerability: "",
        };

        // First line is the monster name
        monsterDescription.name = Helpers.stringToPascalCase(
            this.#textHandler.currentLine,
        );
        this.#textHandler.advanceIndex();

        // We consider any text until the monster strength line flavor-text
        const flavorText = [];
        while (
            !this.#textHandler.atEnd &&
            !this.#textHandler.currentLine.match(
                ParsingRegexes.strengthLine1eRegex,
            ) &&
            !this.#textHandler.currentLine.match(
                ParsingRegexes.strengthLine2eRegex,
            )
        ) {
            flavorText.push(this.#textHandler.currentLine);
            this.#textHandler.advanceIndex();
        }
        monsterDescription.flavor_text = flavorText.join(" ");

        // We should be at the monster strength line now
        let strengthMatch;
        if (
            (strengthMatch = this.#textHandler.currentLine.match(
                ParsingRegexes.strengthLine1eRegex,
            ))
        ) {
            monsterDescription.strength = strengthMatch.groups.strength?.toLowerCase().replace(/ /, "-");
            monsterDescription.level = strengthMatch.groups.level ?? strengthMatch.groups.levelAfter;
            monsterDescription.levelOrdinal =
                strengthMatch.groups.ordinal?.replace(/ /, "") ??
                Helpers.getOrdinal(monsterDescription.level);
            monsterDescription.type = strengthMatch.groups.type.toLowerCase();

            monsterDescription.role = strengthMatch.groups.role.toLowerCase();
            if (monsterDescription.role === "mook") {
                monsterDescription.mook = "yes";
            }

            this.#textHandler.advanceIndex();
        } else if (
            (strengthMatch = this.#textHandler.currentLine.match(
                ParsingRegexes.strengthLine2eRegex,
            ))
        ) {
            monsterDescription.strength = strengthMatch.groups.strength?.toLowerCase().replace(/ /, "-");
            monsterDescription.level = strengthMatch.groups.level;
            monsterDescription.levelOrdinal =
                strengthMatch.groups.ordinal?.replace(/ /, "") ??
                Helpers.getOrdinal(monsterDescription.level);
            monsterDescription.type = strengthMatch.groups.type.toLowerCase();
            monsterDescription.role = strengthMatch.groups.role.toLowerCase();
            if (strengthMatch.groups.mook) {
                monsterDescription.mook = "yes";
            }
            if (strengthMatch.groups.size) {
                monsterDescription.size = strengthMatch.groups.size.toLowerCase();
            }
        } else {
            throw "Bad monster description block format";
        }

        while (!this.#textHandler.atEnd) {
            // After that, there should only be Init and Vulnerabilities left, we don't need to do it in order
            let lineMatch;
            if (
                (lineMatch = this.#textHandler.currentLine.match(
                    ParsingRegexes.initiativeRegex,
                ))
            ) {
                monsterDescription.initiative = lineMatch.groups.initiative;
            } else if (
                (lineMatch = this.#textHandler.currentLine.match(
                    ParsingRegexes.vulnerabilityRegex,
                ))
            ) {
                monsterDescription.vulnerability = Helpers.stringToPascalCase(
                    lineMatch.groups.vulnerability,
                );
            }
            this.#textHandler.advanceIndex();
        }

        return new MonsterStatBlock(monsterDescription);
    }

    parseDefenseBlock() {
        const defenses = {
            ac: 0,
            pd: 0,
            md: 0,
            hp: 0,
        };

        let defenseMatch;

        while (!this.#textHandler.atEnd) {
            if (
                (defenseMatch = this.#textHandler.currentLine.match(
                    ParsingRegexes.defensesRegex.allDefensesOneLine,
                ))
            ) {
                defenses["ac"] = defenseMatch.groups["ac"];
                defenses["pd"] = defenseMatch.groups["pd"];
                defenses["md"] = defenseMatch.groups["md"];
                defenses["hp"] = defenseMatch.groups["hp"];
                break;
            }

            if (
                (defenseMatch = this.#textHandler.currentLine.match(
                    ParsingRegexes.defensesRegex.anyDefenseOneLine,
                ))
            ) {
                const defenseName = defenseMatch.groups.name.toLowerCase();

                defenses[defenseName] = defenseMatch.groups.value;
                if (defenseMatch.groups.base) {
                    defenses[`${defenseName}_base`] = defenseMatch.groups.base;
                }
            }
            this.#textHandler.advanceIndex();
        }

        return new MonsterStatBlock(defenses);
    }
};