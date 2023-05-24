class Helpers {
    static stringToPascalCase(string) {
        const allWords = string.split(" ");
        const capitalizedWords = allWords.map((s) =>
            s.replace(
                /(\w)(\w*)/g,
                (g0, g1, g2) => g1.toUpperCase() + g2.toLowerCase()
            )
        );

        return capitalizedWords.join(" ");
    }

    static isEmpty(stuff) {
        if (stuff === undefined) return true;
        if (Array.isArray(stuff) && stuff.length === 0) return true;
        if (typeof stuff === "string" && stuff.length === 0) return true;
        return Object.entries(stuff).length === 0;
    }
}
Trait = class Trait {
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

    set description(text) {
        this.#description = text;
    }
};

Attack = class Attack {
    #name = "";
    #description = "";

    /**
     *
     * @type {Parser13AMonster.Trait[]}
     */
    #traits = [];

    constructor(name, description, traits) {
        this.#name = name;
        this.#description = description;
        this.#traits = traits ?? [];
    }

    get name() {
        return this.#name;
    }

    get description() {
        return this.#description;
    }

    get traits() {
        return this.#traits;
    }

    set description(text) {
        this.#description = text;
    }
};

SrdRegexes = class SrdRegexes {
    static get strengthLineRegex() {
        return /(?<size>\S+)? ?(?<ordinal>(?<level>\d+)\s*(st|nd|rd|th)?) level (?<role>\S+) (?<type>\S+)/;
    }

    static get attackStarterRegex() {
        return /^(?<trigger>\[Special trigger] )?(?<attack_name>.+) — (?<attack_desc>.*)/;
    }

    static get attackTraitStarterRegex() {
        return /^ (?<trait_name>.+)(?<![RC]): (?<trait_desc>.*)/;
    }

    static get traitStarterRegex() {
        return /^(?! )(?<trait_name>.+)(?<![RC]): (?<trait_desc>.*)/;
    }

    static get followUpRegex() {
        return /^ (?<follow_up>.*)/;
    }

    static get nastierHeaderRegex() {
        return /^Nastier Specials$/;
    }

    static get initiativeRegex() {
        return /^Initiative: \+?(?<initiative>.+)$/;
    }

    static get vulnerabilityRegex() {
        return /^Vulnerability: (?<vulnerability>.+)/;
    }

    static get initiativeLineIndex() {
        return 11;
    }

    static get blockSeparator() {
        return /^\t$/;
    }

    static get defensesRegex() {
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
};

FullStatBlock = class FullStatBlock {
    #name = "";
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
};

BlockWriter = class BlockWriter {
    static #addIndentation(string) {
        return `      ${string}`;
    }

    static #attackHeaderLine = `actions:`;
    static get attackHeaderLine() {
        return this.#attackHeaderLine;
    }

    static #traitsHeaderLine = `traits:`;
    static get traitsHeaderLine() {
        return this.#traitsHeaderLine;
    }

    static get attackTraitsHeaderLine() {
        return this.#addIndentation(this.traitsHeaderLine);
    }

    static #triggersHeaderLine = `triggered_actions:`;
    static get triggersHeaderLine() {
        return this.#triggersHeaderLine;
    }

    static #nastiersHeaderLine = `nastier_traits:`;
    static get nastiersHeaderLine() {
        return this.#nastiersHeaderLine;
    }

    // internal helpers
    static #noIndentNameLine = (name) => `    - name: \"${name}\"`;
    static #noIndentDescLine = (desc) => `      desc: \"${desc}\"`;

    static #attackTraitNameLine(name) {
        return this.#addIndentation(this.#noIndentNameLine(name));
    }

    static #attackTraitDescLine(desc) {
        return this.#addIndentation(this.#noIndentDescLine(desc));
    }

    static #createSingleTraitBlock(trait) {
        const traitString = [];
        traitString.push(BlockWriter.#noIndentNameLine(trait.name), BlockWriter.#noIndentDescLine(trait.description));
        return traitString.join("\n");
    }

    static #createSingleAttackBlock(attack) {
        const attackStrings = [];
        attackStrings.push(
            BlockWriter.#noIndentNameLine(attack.name),
            BlockWriter.#noIndentDescLine(attack.description)
        );

        if (attack.traits && attack.traits.length > 0) {
            attackStrings.push(BlockWriter.attackTraitsHeaderLine);
            attack.traits.forEach((trait) =>
                attackStrings.push(
                    BlockWriter.#attackTraitNameLine(trait.name),
                    BlockWriter.#attackTraitDescLine(trait.description)
                )
            );
        }

        return attackStrings.join("\n");
    }

    static writeStandardAttacksBlock(attacks) {
        return this.writeAttacksBlock(this.attackHeaderLine, attacks);
    }

    static writeTriggeredAttacksBlock(attacks) {
        return this.writeAttacksBlock(this.triggersHeaderLine, attacks);
    }

    static writeAttacksBlock(blockStarter, attacks) {
        if (Helpers.isEmpty(attacks))
            return;

        const flatAttackArray = [attacks].flat();
        const attackYAMLBlocks = [
            blockStarter,
            ...flatAttackArray.map((attack) => BlockWriter.#createSingleAttackBlock(attack)),
        ];

        return attackYAMLBlocks.join("\n");
    }

    static writeStandardTraitsBlock(traits) {
        return this.writeTraitsBlock(this.traitsHeaderLine, traits);
    }

    static writeNastierTraitsBlock(traits) {
        return this.writeTraitsBlock(this.nastiersHeaderLine, traits);
    }

    static writeTraitsBlock(blockStarter, traits) {
        if (Helpers.isEmpty(traits))
            return;

        const flatTraitArray = [traits].flat();
        const traitYAMLBlocks = [
            blockStarter,
            ...flatTraitArray.map((attack) => BlockWriter.#createSingleTraitBlock(attack)),
        ];

        return traitYAMLBlocks.join("\n");
    }

    static #pushTrait(targetArray, traitName, traitValue) {
        if (traitValue) {
            targetArray.push(`${traitName}: ${traitValue}`);
        }
    }

    static #writeObjectToYaml(statObject) {
        const outputYAMLArray = [];

        Object.entries(statObject).map(([key, value]) => BlockWriter.#pushTrait(outputYAMLArray, key, value));

        return outputYAMLArray.join("\n");
    }

    static writeDescriptionBlock(descriptionBlock) {
        return BlockWriter.#writeObjectToYaml(descriptionBlock);
    }

    static writeDefenseBlock(defenseBlock) {
        return BlockWriter.#writeObjectToYaml(defenseBlock);
    }

    /**
     *
     * @param fullStatblock: FullStatBlock
     * @returns {string}
     */
    static writeFullMonster(fullStatblock) {
        const stringBlocks = [];

        stringBlocks.push(
            this.writeDescriptionBlock({
                name: fullStatblock.name,
                flavor_text: fullStatblock.flavor_text,
                size: fullStatblock.size,
                level: fullStatblock.level,
                levelOrdinal: fullStatblock.levelOrdinal,
                role: fullStatblock.role,
                type: fullStatblock.type,
                initiative: fullStatblock.initiative,
                vulnerability: fullStatblock.vulnerability,
            }),
            this.writeStandardAttacksBlock(fullStatblock.attacks),
            this.writeStandardTraitsBlock(fullStatblock.traits),
            this.writeNastierTraitsBlock(fullStatblock.nastierTraits),
            this.writeTriggeredAttacksBlock(fullStatblock.triggeredAttacks),
            this.writeDefenseBlock({
                ac: fullStatblock.ac,
                pd: fullStatblock.pd,
                md: fullStatblock.md,
                hp: fullStatblock.hp,
            })
        );

        return stringBlocks.filter(s => s).join("\n");
    }
}

class SrdHtmlParser {
    /**
     * @type HTMLTableRowElement
     */
    #fullStatBlock;

    constructor(htmlText) {
        const localWrapper = document.createElement("div");
        localWrapper.innerHTML = htmlText;

        this.#fullStatBlock = localWrapper.children.item(0).children.item(0).children.item(0);
    }

    /**
     *
     * @param childCollection {HTMLCollection}
     * @return {Element[]}
     */
    static #translateChildrenListToIterable(childCollection) {
        const children = [];

        for (let i = 0; i < childCollection.length; i++) {
            children.push(childCollection[i]);
        }

        return children;
    }

    getDescription() {
        const descriptionWrapper = this.#fullStatBlock.firstElementChild;
        const descriptionString = SrdHtmlParser.#translateChildrenListToIterable(descriptionWrapper.children)
            .map((c) => c.innerText.replace(/[\s ]/, " ").trim().toLowerCase())
            .join(" ");
        const descriptionMatch = descriptionString.match(SrdRegexes.strengthLineRegex);

        if (!descriptionMatch) {
            throw "Bad format for monster description";
        }

        const monsterDescription = {};

        if (descriptionMatch.groups.size) {
            monsterDescription.size = descriptionMatch.groups.size.toLowerCase();
        }
        monsterDescription.level = descriptionMatch.groups.level;
        monsterDescription.levelOrdinal = descriptionMatch.groups.ordinal + (descriptionMatch.groups.ordinal === "0" ? "th" : "");
        monsterDescription.role = descriptionMatch.groups.role.toLowerCase();
        if (monsterDescription.role === "mook") {
            monsterDescription.mook = "yes";
        }
        monsterDescription.type = descriptionMatch.groups.type.toLowerCase();

        const initiativeAndVulnerability = this.#fullStatBlock.children[1].children[0].innerHTML.split("<br>");

        const initiativeMatch = initiativeAndVulnerability[0].match(SrdRegexes.initiativeRegex);
        monsterDescription.initiative = initiativeMatch.groups.initiative;

        if (initiativeAndVulnerability.length > 1) {
            let vulnerabilityMatch = initiativeAndVulnerability[1].match(SrdRegexes.vulnerabilityRegex);
            monsterDescription.vulnerability = vulnerabilityMatch.groups.vulnerability;
        }
        return monsterDescription;
    }

    getAttacksAndTraits() {
        // we are skipping the first line, as it holds the Initiative value, and possibly the second one which holds the vulnerability
        const potentialVulnerabilities = this.#fullStatBlock.children[1].children[1].innerText,
            attacksAndTraits = SrdHtmlParser.#translateChildrenListToIterable(this.#fullStatBlock.children[1].children)
                .slice(1)
                .map((c) => c.innerText);

        const attackCategory = { attacks: [] },
            triggeredAttackCategory = { attacks: [] },
            traitCategory = { traits: [] },
            nastierTraitCategory = { traits: [] };

        let currentAttackCategory = attackCategory,
            currentTraitCategory = traitCategory;

        for (const line of attacksAndTraits) {
            let currentLineMatch;

            // if match attack
            if ((currentLineMatch = line.match(SrdRegexes.attackStarterRegex))) {
                // check for trigger header
                const isTriggered = currentLineMatch.groups.trigger !== undefined;
                const attack = SrdHtmlParser.#parseAttackLine(line);

                if (isTriggered) {
                    triggeredAttackCategory.attacks.push(attack);
                } else {
                    currentAttackCategory.attacks.push(attack);
                }
                continue;
            }

            if ((currentLineMatch = line.match(SrdRegexes.traitStarterRegex))) {
                // From now on, treat all new attack lines as triggered attacks
                currentAttackCategory = triggeredAttackCategory;

                // parse the trait
                currentTraitCategory.traits.push(SrdHtmlParser.#parseTraitLine(line));
                continue;
            }

            if ((currentLineMatch = line.match(SrdRegexes.nastierHeaderRegex))) {
                currentTraitCategory = nastierTraitCategory;
                continue;
            }
        }

        return {
            attacks: attackCategory.attacks,
            triggeredAttacks: triggeredAttackCategory.attacks,
            traits: traitCategory.traits,
            nastierTraits: nastierTraitCategory.traits,
        };
    }

    getDefenses() {
        const defenseNameWrapper = this.#fullStatBlock.children[this.#fullStatBlock.childElementCount - 2].children,
            defenseValueWrapper = this.#fullStatBlock.children[this.#fullStatBlock.childElementCount - 1].children,
            defenseNames = [],
            defenseValues = [];

        for (let i = 0; i < defenseNameWrapper.length; i++) {
            defenseNames.push(defenseNameWrapper[i].innerText.toLowerCase());
            defenseValues.push(defenseValueWrapper[i].innerText);
        }

        const zip = (a, b) => a.map((k, i) => [k, b[i]]),
            matchedDefenses = zip(defenseNames, defenseValues),
            defenses = {};

        matchedDefenses.forEach((elem, index) => {
            const name = elem[0],
                value = elem[1];
            if (name.match(SrdRegexes.defensesRegex.anyDefense)) {
                defenses[name] = value;
            } else {
                const namePrevious = matchedDefenses[index - 1][0];
                const additionalInfoMatch = name.match(SrdRegexes.defensesRegex.other);
                defenses[namePrevious] += ` (${additionalInfoMatch.groups.name}: ${value})`;
            }
        });

        return defenses;
    }

    /**
     *
     * @param traitText {string}
     * @return {Trait}
     */
    static #parseTraitLine(traitText) {
        const traitMatch = traitText.match(SrdRegexes.traitStarterRegex);

        const traitDesc = traitMatch.groups.trait_desc;

        return new Trait(
            traitMatch.groups.trait_name,
            traitDesc
                .split(" ")
                .filter((s) => s !== null && s.length > 0)
                .join("<br/>")
        );
    }

    /**
     *
     * @param attackText {string}
     * @return {Attack}
     */
    static #parseAttackLine(attackText) {
        const attackBlock = attackText.split(" ");
        const attackMatch = attackBlock[0].match(SrdRegexes.attackStarterRegex);

        const attack = new Attack(attackMatch.groups.attack_name, attackMatch.groups.attack_desc);

        // The attack block contains more than just the attack line, we treat every following line as traits for this attack

        if (attackBlock.length > 1) {
            for (const attackTraitText of attackBlock.splice(1)) {
                try {
                    attack.traits.push(this.#parseTraitLine(attackTraitText));
                } catch (e) {
                    const previousTrait = attack.traits[attack.traits.length - 1];
                    previousTrait.description = previousTrait.description.concat("<br/>", attackTraitText);
                }
            }
        }

        return attack;
    }

    getFullMonster() {
        const description = this.getDescription();

        const monsterData = new FullStatBlock(
            description.name,
            description.size,
            description.level,
            description.levelOrdinal,
            description.role,
            description.type,
            description.initiative,
            description.vulnerability
        );

        const attacksAndTraits = this.getAttacksAndTraits();
        monsterData.attacks.push(...attacksAndTraits.attacks);
        monsterData.triggeredAttacks.push(...attacksAndTraits.triggeredAttacks);
        monsterData.traits.push(...attacksAndTraits.traits);
        monsterData.nastierTraits.push(...attacksAndTraits.nastierTraits);

        const defenses = this.getDefenses();
        monsterData.ac = defenses.ac;
        monsterData.pd = defenses.pd;
        monsterData.md = defenses.md;
        monsterData.hp = defenses.hp;

        return monsterData;
    }
}
