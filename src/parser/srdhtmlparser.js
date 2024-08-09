import ParsingRegexes from "./regexes.js";
import { Trait, Attack, MonsterStatBlock } from "../statblock.js"
import Helpers from "../helpers.js";

export default class SrdHtmlParser {
    /**
     * @type HTMLTableRowElement
     */
    #fullStatBlock;

    constructor(statBlockTable) {
        this.#fullStatBlock = statBlockTable;
    }

    static createPureHtmlParser(htmlText) {
        return this.#getInternalTable(htmlText, 0);
    }

    static createDocxHtmlParser(htmlText) {
        return this.#getInternalTable(htmlText, 1);
    }

    static #getInternalTable(htmlText, internalElementIndex) {
        const localWrapper = document.createElement("div");
        localWrapper.innerHTML = SrdHtmlParser.#cleanUpInputText(htmlText);

        const statblockTable = localWrapper.children
            .item(0)
            .children.item(internalElementIndex)
            .children.item(0);

        return new SrdHtmlParser(statblockTable);
    }

    static #cleanUpInputText(htmlText) {
        return htmlText
            .split("\n")
            .join(" ")
            .replaceAll(/>\s+</gi, "><")
            .replaceAll(
                Helpers.setGlobalFlagOnRegex(
                    ParsingRegexes.italicElement,
                ),
                "_$<italic_text>_",
            );
        // .replaceAll(boldRegex, "__$<strong_text>__");
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

    /**
     *
     * @param previousElement {Parser13AMonster.Parser.Attack|Parser13AMonster.Parser.Trait}
     * @param followupText {string}
     * @returns {boolean} true if the operation succeeded
     */
    static #appendFollowupDescription(previousElement, followupText) {
        /**
         *
         * @param element {Parser13AMonster.Parser.Attack|Parser13AMonster.Parser.Trait}
         * @param text {string}
         */
        const appendDescription = (element, text) => {
            element.description = element.description.concat("<br/>", text);
        };

        if (previousElement instanceof Attack) {
            let modifiedElement;
            if (previousElement.traits.length > 0) {
                modifiedElement = previousElement.traits[previousElement.traits.length - 1];
            } else {
                modifiedElement = previousElement;
            }
            appendDescription(modifiedElement, followupText);

            return true;
        } else if (previousElement instanceof Trait) {
            appendDescription(previousElement, followupText);
            return true;
        }

        return false;
    }

    /**
     *
     * @param traitText {string}
     * @return {Parser13AMonster.Parser.Trait}
     */
    static #parseTraitLine(traitText) {
        const traitMatch = traitText.match(ParsingRegexes.traitStarterRegex);

        const traitDesc = traitMatch.groups.trait_desc;

        return new Trait(
            traitMatch.groups.trait_name,
            traitDesc
                .split(" ")
                .filter((s) => s !== null && s.length > 0)
                .join("<br/>"),
        );
    }

    /**
     *
     * @param attackText {string}
     * @return {Parser13AMonster.Parser.Attack}
     */
    static #parseAttackLine(attackText, isTriggered) {
        const attackBlock = attackText.split(" ").filter((s) => !Helpers.isEmpty(s));
        const attackMatch = attackBlock[0].match(
            ParsingRegexes.attackStarterRegex,
        );

        const attack = new Attack(
            isTriggered ? attackMatch.groups.base_name : attackMatch.groups.full_name,
            attackMatch.groups.attack_desc,
        );

        // The attack block contains more than just the attack line, we treat every following line as traits for this attack
        if (attackBlock.length > 1) {
            for (const traitText of attackBlock.splice(1)) {
                try {
                    const newTrait = this.#parseTraitLine(traitText);
                    attack.traits.push(newTrait);
                } catch (e) {
                    if (attack.traits.length > 0) {
                        const previousTrait = attack.traits[attack.traits.length - 1];
                        SrdHtmlParser.#appendFollowupDescription(previousTrait, traitText);
                    } else {
                        SrdHtmlParser.#appendFollowupDescription(attack, traitText);
                    }
                }
            }
        }

        return attack;
    }

    /**
     *
     * @param monsterName {string}
     * @return {Object}
     */
    #getMonsterDescription(monsterName) {
        const descriptionWrapper = this.#fullStatBlock.firstElementChild;
        const descriptionString = SrdHtmlParser.#translateChildrenListToIterable(descriptionWrapper.children)
            .map((c) => c.innerText.replace(/[\s ]/, " ").trim().toLowerCase())
            .join(" ");
        const descriptionMatch = descriptionString.match(
            ParsingRegexes.htmlStrengthLineRegex,
        );

        if (!descriptionMatch) {
            throw "Bad format for monster description";
        }

        const monsterDescription = {
            name: monsterName ?? "",
        };

        if (descriptionMatch.groups.strength) {
            monsterDescription.strength = descriptionMatch.groups.strength.toLowerCase();
        }
        monsterDescription.level = descriptionMatch.groups.level;
        monsterDescription.levelOrdinal =
            descriptionMatch.groups.ordinal + (descriptionMatch.groups.ordinal === "0" ? "th" : "");
        monsterDescription.role = descriptionMatch.groups.role.toLowerCase();
        monsterDescription.type = descriptionMatch.groups.type.toLowerCase();

        const initiativeAndVulnerability = this.#fullStatBlock.children[1].children[0].innerHTML.split("<br>");

        const initiativeMatch = initiativeAndVulnerability[0].match(
            ParsingRegexes.initiativeRegex,
        );
        monsterDescription.initiative = initiativeMatch.groups.initiative;

        const potentialVulnerabilityLine =
            initiativeAndVulnerability.length > 1
                ? initiativeAndVulnerability[1]
                : this.#fullStatBlock.children[1].children[1].innerText;
        let vulnerabilityMatch;
        if (
            (vulnerabilityMatch = potentialVulnerabilityLine.match(
                ParsingRegexes.vulnerabilityRegex,
            ))
        ) {
            monsterDescription.vulnerability = vulnerabilityMatch.groups.vulnerability;
        }
        return monsterDescription;
    }

    get #hasSeparateVulnerability() {
        return (
            this.#fullStatBlock.children[1].children[1].innerText.match(
                ParsingRegexes.vulnerabilityRegex,
            ) !== null
        );
    }

    /**
     * @return {{traits: Parser13AMonster.Trait[], attacks: Parser13AMonster.Attack[], triggeredAttacks: Parser13AMonster.Attack[], nastierTraits: Parser13AMonster.Trait[]}}
     */
    #getMonsterAttacksAndTraits() {
        // we are skipping the first line, as it holds the Initiative value, and possibly the second one which holds the vulnerability
        const attacksAndTraits = SrdHtmlParser.#translateChildrenListToIterable(
            this.#fullStatBlock.children[1].children,
        )
            .slice(this.#hasSeparateVulnerability ? 2 : 1)
            .map((c) => c.innerText);

        const attackCategory = { attacks: [] },
            triggeredAttackCategory = { attacks: [] },
            traitCategory = { traits: [] },
            nastierTraitCategory = { traits: [] };

        let currentAttackCategory = attackCategory,
            currentTraitCategory = traitCategory,
            lastModifiedItem;

        for (const line of attacksAndTraits) {
            try {
                let currentLineMatch;
                if (
                    (currentLineMatch = line.match(
                        ParsingRegexes.attackStarterRegex,
                    ))
                ) {
                    // check for trigger header

                    let isTriggered = false;

                    let special;
                    if ((special = currentLineMatch.groups.special)) {
                        if (special.match(ParsingRegexes.triggeredAttackRegex)) {
                            isTriggered = true;
                        }
                    }

                    const attack = SrdHtmlParser.#parseAttackLine(line, isTriggered);

                    if (isTriggered) {
                        triggeredAttackCategory.attacks.push(attack);
                    } else {
                        currentAttackCategory.attacks.push(attack);
                    }
                    lastModifiedItem = attack;
                    continue;
                }

                if (
                    (currentLineMatch = line.match(
                        ParsingRegexes.traitStarterRegex,
                    ))
                ) {
                    const newTrait = SrdHtmlParser.#parseTraitLine(line);
                    if (
                        newTrait.name.match(
                            ParsingRegexes.standardAttackTraitNames,
                        ) &&
                        lastModifiedItem
                    ) {
                        lastModifiedItem.traits.push(newTrait);
                    } else {
                        // From now on, treat all new attack lines as triggered attacks
                        currentAttackCategory = triggeredAttackCategory;

                        currentTraitCategory.traits.push(newTrait);
                        lastModifiedItem = newTrait;
                    }

                    continue;
                }

                if (
                    (currentLineMatch = line.match(
                        ParsingRegexes.nastierHeaderRegex,
                    ))
                ) {
                    currentTraitCategory = nastierTraitCategory;
                    continue;
                }

                if (lastModifiedItem && SrdHtmlParser.#appendFollowupDescription(lastModifiedItem, line)) {
                    continue;
                }

                throw new Error(`Unable to determine type of current line: ${line}`, {
                    cause: {
                        code: "unknownLine",
                    },
                });
            } catch (e) {
                console.debug(e);
                if (e.cause !== "unknownLine") {
                    if (lastModifiedItem && SrdHtmlParser.#appendFollowupDescription(lastModifiedItem, line)) {
                        continue;
                    }
                }
                throw e;
            }
        }

        return {
            attacks: attackCategory.attacks,
            triggeredAttacks: triggeredAttackCategory.attacks,
            traits: traitCategory.traits,
            nastierTraits: nastierTraitCategory.traits,
        };
    }

    #getMonsterDefenses() {
        const defenseNameWrapper =
            this.#fullStatBlock.children[this.#fullStatBlock.childElementCount - 2].children,
            defenseValueWrapper =
                this.#fullStatBlock.children[this.#fullStatBlock.childElementCount - 1].children,
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
            if (name.match(ParsingRegexes.defensesRegex.anyDefense)) {
                defenses[name] = value;
            } else {
                const namePrevious = matchedDefenses[index - 1][0];
                const additionalInfoMatch = name.match(
                    ParsingRegexes.defensesRegex.other,
                );
                defenses[namePrevious] += ` (${additionalInfoMatch.groups.name}: ${value})`;
            }
        });

        return defenses;
    }

    getFullMonster(monsterName) {
        const description = this.#getMonsterDescription(monsterName);

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

        const attacksAndTraits = this.#getMonsterAttacksAndTraits();
        monsterData.attacks.push(...attacksAndTraits.attacks);
        monsterData.triggeredAttacks.push(...attacksAndTraits.triggeredAttacks);
        monsterData.traits.push(...attacksAndTraits.traits);
        monsterData.nastierTraits.push(...attacksAndTraits.nastierTraits);

        const defenses = this.#getMonsterDefenses();
        monsterData.ac = defenses.ac;
        monsterData.pd = defenses.pd;
        monsterData.md = defenses.md;
        monsterData.hp = defenses.hp;

        return monsterData;
    }
};