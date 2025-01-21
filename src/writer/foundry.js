import ParsingRegexes from "../parser/regexes.js";
import Helpers from "../helpers.js";
import MonsterStatBlock, { Trait, Attack } from "../statblock.js"

export default class FoundryWriter {
    static #createAttribute(type, label, value) {
        return {
            type: type,
            label: label,
            value: type === "Number" ? parseInt(value) : value,
        };
    }

    static #replaceRollableParts(text) {
        return text
            .replaceAll(Helpers.setGlobalFlagOnRegex(ParsingRegexes.inlineAutomaticRolls), "[[$&]]")
            .replaceAll(Helpers.setGlobalFlagOnRegex(ParsingRegexes.inlineManualRolls), "[[/r $&]]");
    }

    /**
     * @param {Attack} attack
     * @param {boolean} [isTriggered=false]
     */
    static #transformAttack(attack, isTriggered = false) {
        const actionParts = attack.name.match(ParsingRegexes.splitAttackRoll);
        const attackName = isTriggered
            ? `[Special Trigger] ${actionParts.groups.name}`
            : actionParts.groups.name;

        let attackData = {
            name: attackName,
            type: "action",
            img: "",
            system: {
                name: this.#createAttribute("String", "Name", attackName),
                attack: this.#createAttribute(
                    "String",
                    "Attack Roll",
                    `[[d20${actionParts.groups.bonus}]] ${this.#replaceRollableParts(actionParts.groups.desc)}`,
                ),
                hit: this.#createAttribute("String", "Hit", this.#replaceRollableParts(attack.description)),
            },
        };

        let traitIndex = 1;

        for (const trait of attack.traits) {
            let traitType = "",
                traitLabel = "",
                traitName = "";

            if (trait.name === "Miss") {
                traitType = "miss";
                traitLabel = "Miss";
                traitName = "Miss";
            } else {
                traitType = `hit${traitIndex}`;
                traitIndex++;
                traitLabel = "Hit";
                traitName = trait.name;
            }

            attackData.system[traitType] = {
                name: traitName,
                ...this.#createAttribute("String", traitLabel, this.#replaceRollableParts(trait.description)),
            };
        }

        return attackData;
    }

    /**
     * @param {Trait} trait
     * @param {boolean} isNastier false
     */
    static #transformTrait(trait, isNastier = false) {
        const traitType = isNastier ? "nastierSpecial" : "trait";

        const traitData = {
            name: trait.name,
            type: traitType,
            img: "",
            system: {
                name: this.#createAttribute("String", "Name", trait.name),
                description: this.#createAttribute(
                    "String",
                    "Description",
                    this.#replaceRollableParts(trait.description),
                ),
            },
        };

        return traitData;
    }

    /**
     * @param {Object} actorData 
     * @param {Object} actorItemData 
     * @returns Actor
     */
    static async #createFoundryActor(actorData, actorItemData) {
        const actor = await Actor.create(actorData);
        await actor.createEmbeddedDocuments("Item", actorItemData);
        return actor;
    }

    /**
     * @returns Actor
     */
    static async createMonsterSheet() {
        const monsterData = this.#getFullMonsterData();

        const baseData = this.createFoundryBaseActorData(monsterData);
        const itemData = this.createFoundryActorItemsData(monsterData);

        return this.#createFoundryActor(baseData, itemData);
    }

    /**
     * @param {MonsterStatBlock} monsterData
     */
    static createFoundryActorItemsData(monsterData) {
        let actionData = [];

        if (!Helpers.isEmpty(monsterData.attacks)) {
            actionData = [...actionData, ...monsterData.attacks.map((a) => this.#transformAttack(a, false))];
        }

        if (!Helpers.isEmpty(monsterData.triggeredAttacks)) {
            actionData = [
                ...actionData,
                ...monsterData.triggeredAttacks.map((a) => this.#transformAttack(a, true)),
            ];
        }

        if (!Helpers.isEmpty(monsterData.traits)) {
            actionData = [...actionData, ...monsterData.traits.map((a) => this.#transformTrait(a, false))];
        }

        if (!Helpers.isEmpty(monsterData.nastierTraits)) {
            actionData = [
                ...actionData,
                ...monsterData.nastierTraits.map((a) => this.#transformTrait(a, true)),
            ];
        }

        return actionData;
    }

    /**
     * @param {MonsterStatBlock} monsterData
     */
    static createFoundryBaseActorData(monsterData) {
        const baseAttrObject = {
            base: 10,
            min: 0,
        };

        const actorData = {};

        const monsterDescData = monsterData.fullDescription;

        actorData.name = monsterDescData?.name ?? "";
        actorData.type = "npc";

        let actorAttributes = {};

        if (monsterData.ac) {
            actorAttributes.ac = {
                ...this.#createAttribute("Number", "Armor Class", monsterData.ac),
                ...baseAttrObject,
            };
            actorAttributes.pd = {
                ...this.#createAttribute("Number", "Physical Defense", monsterData.pd),
                ...baseAttrObject,
            };
            actorAttributes.md = {
                ...this.#createAttribute("Number", "Mental Defense", monsterData.md),
                ...baseAttrObject,
            };
            actorAttributes.hp = {
                ...this.#createAttribute("Number", "Hit Points", monsterData.hp),
                ...baseAttrObject,
                max: parseInt(monsterData.hp),
                temp: 0,
                tempmax: 0,
                automatic: true,
            };
        }

        let actorDetails = {};

        let monsterIcon = null;

        if (monsterDescData?.level) {
            actorAttributes.init = {
                ...this.#createAttribute("Number", "Initiative Modifier", monsterDescData.initiative),
                ...baseAttrObject,
            };
            actorAttributes.level = {
                ...this.#createAttribute("Number", "Level", monsterDescData.level),
                ...baseAttrObject,
            };

            actorDetails.flavor = { value: monsterDescData.flavor_text };
            actorDetails.role = { value: monsterDescData.role.toLowerCase() };

            const getSystemStrength = (strengthText) => {
                if (!strengthText) {
                    return "normal";
                }

                const multiStrengthMatch = strengthText.match(/^(Double|Triple)-strength/i);
                if (multiStrengthMatch) {
                    return multiStrengthMatch[1].toLowerCase();
                }

                return strengthText.toLowerCase();
            };

            actorDetails.strength = {
                value: getSystemStrength(monsterDescData.strength),
            };
            actorDetails.type = { value: monsterDescData.type.toLowerCase() };
            monsterIcon = `systems/archmage/assets/icons/tokens/monsters/${actorDetails.type.value}.webp`
            actorDetails.vulnerability = { value: monsterDescData.vulnerability?.toLowerCase() };

            if (monsterDescData.size) {
                actorDetails.size = { value: monsterDescData.size };
            }
        }

        actorData.system = {
            attributes: actorAttributes,
            details: actorDetails,
        };

        actorData.prototypeToken = {
            name: monsterDescData?.name ?? "",
            displayBars: 40,
            prependAdjective: true,
            displayName: 20,
        };

        if (monsterIcon) {
            actorData.img = monsterIcon;
            actorData.prototypeToken.texture = {
                src: monsterIcon,
            }
        }

        return actorData;
    }

    /**
     * @returns {MonsterStatBlock}
     */
    static async #getFullMonsterData() {
        const monsterText = await this.#promptForMonsterText();

        if (!monsterText) {
            ui.notifications.warn("No monster to parse.");
            return;
        }

        const description = this.#getMonsterDescription(monsterText.descriptionText);

        let monsterData = new MonsterStatBlock(
            description.name,
            description.strength,
            description.level,
            description.levelOrdinal,
            description.role,
            description.type,
            description.initiative,
            description.vulnerability,
        );
        monsterData.flavor_text = description.flavor_text;

        const parsedAttacks = this.#getMonsterAttacks(monsterText.attackText);
        monsterData.attacks = parsedAttacks.attacks;
        monsterData.triggeredAttacks = parsedAttacks.triggeredAttacks;
        monsterData.traits = monsterText.traitText ? this.#getMonsterTraits(monsterText.traitText) : [];
        monsterData.nastierTraits = monsterText.nastierText
            ? this.#getMonsterNastierTraits(monsterText.nastierText)
            : [];

        const defenses = this.#getMonsterDefenses(monsterText.defenseText);
        monsterData.ac = defenses.ac;
        monsterData.pd = defenses.pd;
        monsterData.md = defenses.md;
        monsterData.hp = defenses.hp;

        return monsterData;
    }

    static #getMonsterDescription(descText) {
        const parser = new PdfBlockParser(descText);

        return parser.parseDescriptionBlock();
    }

    static #getMonsterAttacks(attackText) {
        const parser = new PdfBlockParser(attackText);

        return parser.parseAttackBlock();
    }

    static #getMonsterTraits(traitText) {
        const parser = new PdfBlockParser(traitText);

        return parser.parseTraitBlock();
    }

    static #getMonsterNastierTraits(nastierText) {
        const parser = new PdfBlockParser(nastierText);

        return parser.parseTraitBlock();
    }

    static #getMonsterDefenses(defenseText) {
        const parser = new PdfBlockParser(defenseText);

        return parser.parseDefenseBlock();
    }

    /**
     * @returns {Object} containing the resulting text from the prompter
     */
    static async #promptForMonsterText() {
        const inputForm = `<form>
    <div>
        <h2>Input the monster to be parsed, split into logical blocks (scroll down for nastier traits and defenses)</h2>
        <label for="descriptionField">Monster Description (Name, flavor, strength line, vulnerability)</label>
        <textarea name="descriptionField" rows="10" cols="100"></textarea>
        <label for="attackField">Monster attacks (Standard and Triggered)</label>
        <textarea name="attackField" rows="10" cols="100"></textarea>
        <label for="traitField">Monster Traits</label>
        <textarea name="traitField" rows="10" cols="100"></textarea>
        <label for="nastierField">Monster Nastier Traits</label>
        <textarea name="nastierField" rows="10" cols="100"></textarea>
        <label for="defenseField">Monster Defenses & HP</label>
        <textarea name="defenseField" rows="10" cols="100"></textarea>
    </div>
</form>`;

        const prom = new Promise((resolve, reject) => {
            new Dialog({
                title: "Monster Statblock Parser",
                content: inputForm,
                width: 300,
                height: 1000,
                resizable: true,
                scrollY: 0,
                buttons: {
                    yes: {
                        icon: "<i class='fas fa-check'></i>",
                        label: "Parse",
                        callback: (html) => {
                            const description = html.find("textarea[name='descriptionField']")?.val();
                            const attack = html.find("textarea[name='attackField']")?.val();
                            const trait = html.find("textarea[name='traitField']")?.val();
                            const nastier = html.find("textarea[name='nastierField']")?.val();
                            const defense = html.find("textarea[name='defenseField']")?.val();

                            const result = {
                                descriptionText: description,
                                attackText: attack,
                                traitText: trait,
                                nastierText: nastier,
                                defenseText: defense,
                            };

                            resolve(result);
                        },
                    },
                },
                default: "yes",
                close: (_) => {
                    reject();
                },
            }).render(true);
        });

        const value = await prom
            .then((value) => value)
            .catch((err) => {
                ui.notifications.error(err);
            });

        return value;
    }
};
