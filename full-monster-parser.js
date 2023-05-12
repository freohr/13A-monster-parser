class helpers {
    static iKnowWhatImDoing = false;

    static stringToPascalCase(string) {
        const allWords = string.split(' ');
        const capitalizedWords = allWords.map(s =>
            s.replace(/(\w)(\w*)/g,
                (g0, g1, g2) => g1.toUpperCase() + g2.toLowerCase())
        );

        return capitalizedWords.join(' ');
    }

    static isEmpty(stuff) {
        if (stuff === undefined) return true;
        if (Array.isArray(stuff) && stuff.length === 0) return true;
        if (typeof stuff === "string" && stuff.length === 0) return true;
        return Object.entries(stuff).length === 0;
    }
}

class Trait {
    #name = "";
    #description = "";

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

class Attack extends Trait {
    #traits = [];

    constructor(name, description, traits) {
        super(name, description);
        this.#traits = traits;
    }

    get traits() {
        return this.#traits;
    }
}

class TextHandler {

    #textArray = [];
    #currentIndex = 0;

    constructor(textBlock) {
        this.#textArray = textBlock.split('\n').filter(s => s.length > 0).map(s => s.trim());
    }

    reset() {
        this.#textArray = [];
        this.#currentIndex = 0;
    };

    get atEnd() {
        return this.#currentIndex >= this.#textArray.length;
    };

    get currentLine() {
        return this.#textArray[this.#currentIndex];
    };

    get index() {
        return this.#currentIndex;
    };

    set index(i) {
        this.#currentIndex = i;
    };

    advanceIndex(i = 1) {
        this.index += i;
    }
}

class BlockParser {
    #textHandler;

    constructor(textHandler) {
        this.#textHandler = textHandler;
    }

    static get #attackStarterRegex() {return /^(?<attack_name>.+)—(?<attack_desc>.*)/;}

    static get #traitStarterRegex() {return /^(?<trait_name>.+)(?<![RC]): (?<trait_desc>.*)/;}

    static get #triggeredAttackStarterRegex() {return /^\[Special trigger] (?<attack_name>.+)—(?<attack_desc>.*)$/;}

    static get #followupRegex() {return /^([^:—]+|[^A-Z].+)$/;}

    static get #strengthLineRegex() {return /(?<strength>\S+)? ?(?<ordinal>(?<level>\d+)\s*(st|nd|rd|th)) level (?<role>\S+) \[(?<type>\S+)]/;}

    static get #initiativeRegex() {return /^Initiative: \+?(?<initiative>.+)$/;}

    static get #vulnerabilityRegex() {return /^Vulnerability: (?<vulnerability>.+)/;}

    #getDescription(descStarter) {
        const fullDesc = [descStarter];
        let desc;

        while (!this.#textHandler.atEnd && (desc = this.#textHandler.currentLine.match(BlockParser.#followupRegex)) !== null) {
            fullDesc.push(this.#textHandler.currentLine);
            this.#textHandler.advanceIndex();
        }

        return fullDesc.join(' ');
    };

    #getTraits() {
        const traits = [];
        let traitMatch;

        while (!this.#textHandler.atEnd && (traitMatch = this.#textHandler.currentLine.match(BlockParser.#traitStarterRegex)) !== null) {
            this.#textHandler.advanceIndex();
            traits.push(new Trait(traitMatch.groups.trait_name, this.#getDescription(traitMatch.groups.trait_desc)));
        }

        return traits;
    };

    #getFullAttack(attackName, attackDesc) {
        return new Attack(attackName, this.#getDescription(attackDesc), this.#getTraits());
    };

    parseAttackBlock() {
        const attacks = [], triggeredAttacks = [];

        while (!this.#textHandler.atEnd) {
            let startAttackMatch, startTriggerMatch;

            if ((startTriggerMatch = this.#textHandler.currentLine.match(BlockParser.#triggeredAttackStarterRegex))) {
                this.#textHandler.advanceIndex();
                triggeredAttacks.push(this.#getFullAttack(startTriggerMatch.groups.attack_name, startTriggerMatch.groups.attack_desc));
            } else if ((startAttackMatch = this.#textHandler.currentLine.match(BlockParser.#attackStarterRegex))) {
                this.#textHandler.advanceIndex();
                attacks.push(this.#getFullAttack(startAttackMatch.groups.attack_name, startAttackMatch.groups.attack_desc));
            }
        }

        return {
            "attacks": attacks,
            "triggeredAttacks": triggeredAttacks
        };
    };

    parseTraitBlock() {
        return this.#getTraits();
    };

    parseDescriptionBlock() {
        const monsterDescription = {
            name: "",
            flavorText: "",
            strength: "",
            level: "",
            levelOrdinal: "",
            role: "",
            type: "",
            initiative: "",
            vulnerabilities: ""
        }

        // First line is the monster name
        monsterDescription.name = helpers.stringToPascalCase(this.#textHandler.currentLine);
        this.#textHandler.advanceIndex();

        // We consider any text until the monster strength line flavor-text
        const flavorText = [];
        while (!this.#textHandler.atEnd && (this.#textHandler.currentLine.match(BlockParser.#strengthLineRegex) === null)) {
            flavorText.push(this.#textHandler.currentLine);
            this.#textHandler.advanceIndex();
        }
        monsterDescription.flavorText = flavorText.join(' ');

        // We should be at the monster strength line now
        let strengthMatch;
        if ((strengthMatch = this.#textHandler.currentLine.match(BlockParser.#strengthLineRegex))) {
            // Expected RegEx : /(?<strength>[^\s]+) (?<ordinal>(?<level>\d+)(st|nd|rd|th)) level (?<role>[^\s]+) \[(?<type>[^\s]+)]/;
            monsterDescription.strength = strengthMatch.groups.strength.toLowerCase();
            monsterDescription.level = strengthMatch.groups.level;
            monsterDescription.levelOrdinal = strengthMatch.groups.ordinal.replace(/ /g, '');
            monsterDescription.role = strengthMatch.groups.role.toLowerCase();
            monsterDescription.type = strengthMatch.groups.type.toLowerCase();
            this.#textHandler.advanceIndex();
        } else {
            throw "Bad monster description block format";
        }

        while (!this.#textHandler.atEnd) {
            // After that, there should only be Init and Vulnerabilities left, we don't need to do it in order
            let lineMatch;
            if ((lineMatch = this.#textHandler.currentLine.match(BlockParser.#initiativeRegex))) {
                monsterDescription.initiative = lineMatch.groups.initiative;
            } else if ((lineMatch = this.#textHandler.currentLine.match(BlockParser.#vulnerabilityRegex))) {
                monsterDescription.vulnerabilities = helpers.stringToPascalCase(lineMatch.groups.vulnerability);
            }
            this.#textHandler.advanceIndex();
        }

        return monsterDescription;
    };
}

class BlockWriter {

    static #addIndentation(string) {
        return `      ${string}`;
    };

    static #attackHeaderLine = `actions:`;
    static get attackHeaderLine() { return this.#attackHeaderLine; }

    static #traitsHeaderLine = `traits:`;
    static get traitsHeaderLine() { return this.#traitsHeaderLine; }
    static get attackTraitsHeaderLine() { return this.#addIndentation(this.traitsHeaderLine) };

    static #triggersHeaderLine = `triggered_actions:`;
    static get triggersHeaderLine() { return this.#triggersHeaderLine; }

    static #nastiersHeaderLine = `nastier_traits:`;
    static get nastiersHeaderLine() { return this.#nastiersHeaderLine; }

    // internal helpers
    static #noIndentNameLine = (name) => `    - name: \"${name}\"`;
    static #noIndentDescLine = (desc) => `      desc: \"${desc}\"`;
    static #attackTraitNameLine(name) { return this.#addIndentation(this.#noIndentNameLine(name)) };
    static #attackTraitDescLine(desc) { return this.#addIndentation(this.#noIndentDescLine(desc)) };

    static #createSingleTraitBlock(trait) {
        const traitString = [];
        traitString.push(BlockWriter.#noIndentNameLine(trait.name), BlockWriter.#noIndentDescLine(trait.description));
        return traitString.join('\n');
    }

    static #createSingleAttackBlock(attack) {
        const attackStrings = [];
        attackStrings.push(BlockWriter.#noIndentNameLine(attack.name), BlockWriter.#noIndentDescLine(attack.description));

        if (attack.traits && attack.traits.length > 0) {
            attackStrings.push(BlockWriter.attackTraitsHeaderLine)
            attack.traits.forEach(trait => attackStrings.push(BlockWriter.#attackTraitNameLine(trait.name), BlockWriter.#attackTraitDescLine(trait.description)))
        }

        return attackStrings.join('\n');
    };

    static writeAttacksBlock(blockStarter, attacks) {
        const flatAttackArray = [attacks].flat();
        const attackYAMLBlocks = [blockStarter, ...flatAttackArray.map(attack => BlockWriter.#createSingleAttackBlock(attack))];

        return attackYAMLBlocks.join('\n');
    };

    static writeTraitsBlock(blockStarter, traits) {
        const flatTraitArray = [traits].flat();
        const traitYAMLBlocks = [blockStarter, ...flatTraitArray.map(attack => BlockWriter.#createSingleTraitBlock(attack))];

        return traitYAMLBlocks.join('\n');
    }

    static #pushTrait (targetArray, traitName, traitValue) {
        targetArray.push(`${traitName}: ${traitValue}`);
    }

    static #writeObjectToYaml(statObject) {
        const outputYAMLArray = [];

        Object.entries(statObject).map(([key, value]) => BlockWriter.#pushTrait(outputYAMLArray, key, value));

        return outputYAMLArray.join('\n')
    }

    static writeDescriptionBlock(descriptionBlock) {
        return BlockWriter.#writeObjectToYaml(descriptionBlock);
    };

    static writeDefenseBlock(defenseBlock) {
        return BlockWriter.#writeObjectToYaml(defenseBlock);
    }
}

/*
function createMonsterPrompter(quickAddApi) {
    return {
        quickAddApi: quickAddApi,
        async suggestBlockToParse() {
            const blockTypes = {
                names: ["a Description", "Attacks", "Traits", "Triggered Attacks", "Nastier Specials", "I'm done"],
                types: ["desc", "attacks", "traits", "triggers", "nastiers", "done"]
            }
            const operationTypes = {
                names: ["Initial Parse", "Parse & Replace", "Parse & Append", "Manual Entry"],
                types: ["parse-replace", "parse-replace", "parse-append", "manual-entry"]
            }

            // First we ask the user what kind of block they want to enter
            if (!iKnowWhatImDoing) {
                await this.quickAddApi.infoDialog("What kind of info do you want to manage?");
            }
            const blockType = await this.quickAddApi.suggester(blockTypes.names, blockTypes.types);
            const blockName = blockTypes.names.at(blockTypes.types.indexOf(blockType));

            if (blockType === "done") {
                // Nothing more to add, we can just return
                return {
                    block: blockType,
                    operation: ""
                };
            }

            // Then, how they want to enter it
            if (!iKnowWhatImDoing) {
                await this.quickAddApi.infoDialog(`How do you want to add ${blockName} to the statblock?`);
            }
            const operationType = await this.quickAddApi.suggester(operationTypes.names, operationTypes.types);

            return {
                block: blockType,
                operation: operationType
            };
        },
        async getMonsterDescription() {
            const desc = await this.quickAddApi.wideInputPrompt("Monster Description?");
            const descParser = createBlockParser(createTextHandler(desc));
            const descWriter = createBlockWriter(this.quickAddApi);
            descWriter.writeDescriptionBlock(descParser.parseDescriptionBlock());
        },
        async getMonsterAttacks() {
            const attacks = await this.quickAddApi.wideInputPrompt("Monster Attacks?");
            const attackParser = createBlockParser(createTextHandler(attacks));
            const attackWriter = createBlockWriter(this.quickAddApi);

            const parsedAttacks = attackParser.parseAttackBlock();
            attackWriter.writeAttackBlock(attackWriter.attackHeaderLine, parsedAttacks.attacks);
            attackWriter.writeAttackBlock(attackWriter.triggersHeaderLine, parsedAttacks.triggeredAttacks);
        },
        async getMonsterTraits() {
            const traits = await this.quickAddApi.wideInputPrompt("Monster Traits?");

            const traitParser = createBlockParser(createTextHandler(traits));
            const traitWriter = createBlockWriter(this.quickAddApi);

            traitWriter.writeTraitsBlock(traitWriter.traitsHeaderLine, traitParser.getTraits());
        },
        async getMonsterTriggerAttacks() {
            const attacks = await this.quickAddApi.wideInputPrompt("Monster Triggered Attacks?");
            const attackParser = createBlockParser(createTextHandler(attacks));
            const attackWriter = createBlockWriter(this.quickAddApi);

            const parsedAttacks = attackParser.parseAttackBlock();

            if (!isEmpty(this.quickAddApi.variables.triggerActions)) {
                attackWriter.appendAttacksToBlock(attackWriter.triggersHeaderLine, parsedAttacks.attacks);
                attackWriter.appendAttacksToBlock(attackWriter.triggersHeaderLine, parsedAttacks.triggeredAttacks);
            } else {
                attackWriter.writeAttackBlock(attackWriter.triggersHeaderLine, parsedAttacks.attacks);
                attackWriter.appendAttacksToBlock(attackWriter.triggersHeaderLine, parsedAttacks.triggeredAttacks);
            }
        },
        async getMonsterNastierTraits() {
            const traits = await this.quickAddApi.wideInputPrompt("Monster Nastier Specials?");

            const traitParser = createBlockParser(createTextHandler(traits));
            const traitWriter = createBlockWriter(this.quickAddApi);

            traitWriter.writeTraitsBlock(traitWriter.nastiersHeaderLine, traitParser.getTraits());
        },
        async getMonsterDefenses() {
            const defenses = await this.quickAddApi.wideInputPrompt("Monster Defenses?");

            const defenseParser = createBlockParser(createTextHandler(defenses));
            const defenseWriter = createBlockWriter(this.quickAddApi);

            // ToDo: Add parser and writer for Defenses (AC, PD, MD, HP)
        },
        async promptMinimalistParser() {
            await this.getMonsterDescription();
            await this.getMonsterAttacks();
            await this.getMonsterTraits();
            await this.getMonsterNastierTraits();
            await this.getMonsterTriggerAttacks();
            // await this.getMonsterDefenses();
        }
    }
}
*/
// Basic tests below
const quickAddMock = {
    variables: {}
}

// Test on monster description
const multiLineDesc = `Fire Giant
Fire giants are some of the
most powerful mortal beings
to walk the land, and they
know it. They are not merely
warlords and conquerors but also
planners and builders. For about a
century, they have been building great
works high in the mountains. Their seers
say that a war that will destroy all is on its
way. With no hope of survival, fire giants are
not much concerned about whose side they will
fight on, so when the morning of battle comes, they
will fight on the side of those who have bribed them
the best.
Large 8th level wrecker [giant]
Initiative: +12
Vulnerability: cold, thunder, acid`;

const descriptionParser = new BlockParser(new TextHandler(multiLineDesc));
const parsedDesc = descriptionParser.parseDescriptionBlock();
console.log(BlockWriter.writeDescriptionBlock(parsedDesc));

// Test on Attacks
const multiLineAttacks = `Flaming greatsword +13 vs. AC (2 attacks)—35 damage
Natural even hit or miss: The target also takes 10 ongoing fire damage.
R: Flaming black-iron javelin +11 vs. AC—40 damage
Natural even hit or miss: The target also takes 10 ongoing fire damage.`;

const attackParser = new BlockParser(new TextHandler(multiLineAttacks))
const parsedAttacks = attackParser.parseAttackBlock();
console.log(BlockWriter.writeAttacksBlock(BlockWriter.attackHeaderLine, parsedAttacks.attacks));

// Test on Traits
const multiLineTraits = `Fiery escalator: The fire giant adds the escalation die to its attacks
against targets taking ongoing fire damage.
Resist fire 16+: When a fire attack targets this creature, the
attacker must roll a natural 16+ on the attack roll, or it only
deals half damage.`;

const traitParser = new BlockParser(new TextHandler(multiLineTraits))
const parsedTraits = traitParser.parseTraitBlock();
console.log(BlockWriter.writeTraitsBlock(BlockWriter.traitsHeaderLine, parsedTraits))

// Test on Nastier Traits
const multiLineNastierTraits = `Burning blood: When a fire giant becomes staggered, it deals 10
ongoing fire damage to each enemy engaged with it.
Strength of giants: Twice per battle, the giant can make a slam
attack as a quick action (once per round).`;

const nastierTraitParser = new BlockParser(new TextHandler(multiLineNastierTraits))
const parsedNastierTraits = nastierTraitParser.parseTraitBlock();
console.log(BlockWriter.writeTraitsBlock(BlockWriter.nastiersHeaderLine, parsedNastierTraits))

// Test on Triggered Attacks
const multiLineTriggerAttacks = `Slam +12 vs. PD (one enemy smaller than it)—10 damage,
the target pops free from the giant, and the target loses its
next move action`;

const triggeredAttackParser = new BlockParser(new TextHandler(multiLineTriggerAttacks))
const parsedTriggeredAttacks = triggeredAttackParser.parseAttackBlock();
console.log(BlockWriter.writeAttacksBlock(BlockWriter.triggersHeaderLine, parsedTriggeredAttacks.attacks));

console.log("hello");
