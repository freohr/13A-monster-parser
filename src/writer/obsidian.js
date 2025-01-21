import MonsterStatBlock, { Trait, Attack } from "../statblock.js"
import Helpers from "../helpers.js";

export default class ObsidianBlockWriter {

    /**
     * @param {string} string
     * @returns string
     */
    static #addIndentation(string) {
        return `      ${string}`;
    }

    static get attackHeaderLine() {
        return `actions:`;
    }

    static get traitsHeaderLine() {
        return `traits:`;
    }

    static get attackTraitsHeaderLine() {
        return this.#addIndentation(this.traitsHeaderLine);
    }

    static get triggersHeaderLine() {
        return `triggered_actions:`;
    }

    static get nastiersHeaderLine() {
        return `nastier_traits:`;
    }

    // internal helpers

    /**
     * @param {string} name
     * @returns {string}
     */
    static #noIndentNameLine(name) { return `    - name: \"${name}\"`; }

    /**
     * @param {string} desc
     * @returns {string}
     */
    static #noIndentDescLine(desc) { return `      desc: \"${desc}\"`; }

    /**
     * @param {string} name
     * @returns {string}
     */
    static #attackTraitNameLine(name) {
        return this.#addIndentation(this.#noIndentNameLine(name));
    }

    /**
     * @param {string} desc
     * @returns {string}
     */
    static #attackTraitDescLine(desc) {
        return this.#addIndentation(this.#noIndentDescLine(desc));
    }

    /**
     * @param {Trait} trait 
     * @returns {string}
     */
    static #createSingleTraitBlock(trait) {
        const traitstrings = [
            ObsidianBlockWriter.#noIndentNameLine(trait.name),
            ObsidianBlockWriter.#noIndentDescLine(trait.description),
        ];

        if (trait.traits.length > 0) {
            traitstrings.push(...ObsidianBlockWriter.#createNestedTraitsBlock(trait.traits));
        }

        return traitstrings.join("\n");
    }

    /**
     * @param {Attack} attack 
     * @returns {string}
     */
    static #createSingleAttackBlock(attack) {
        const attackstrings = [
            ObsidianBlockWriter.#noIndentNameLine(attack.name),
            ObsidianBlockWriter.#noIndentDescLine(attack.description),
        ];

        if (attack.traits.length > 0) {
            attackstrings.push(...ObsidianBlockWriter.#createNestedTraitsBlock(attack.traits));
        }

        return attackstrings.join("\n");
    }

    /**
     * @param {Trait[]} nestedTraits 
     * @returns {string[]}
     */
    static #createNestedTraitsBlock(nestedTraits) {
        const nestedTraitstrings = [];

        nestedTraitstrings.push(ObsidianBlockWriter.attackTraitsHeaderLine);
        nestedTraits.forEach((trait) =>
            nestedTraitstrings.push(
                ObsidianBlockWriter.#attackTraitNameLine(trait.name),
                ObsidianBlockWriter.#attackTraitDescLine(trait.description),
            ),
        );

        return nestedTraitstrings;
    }

    /**
     * @param {Attack[]} attacks 
     * @returns {string}
     */
    static writeStandardAttacksBlock(attacks) {
        return this.writeAttacksBlock(this.attackHeaderLine, attacks);
    }

    /**
     * @param {Attack[]} attacks 
     * @returns {string}
     */
    static writeTriggeredAttacksBlock(attacks) {
        return this.writeAttacksBlock(this.triggersHeaderLine, attacks);
    }

    /**
     * @param {string} blockStarter 
     * @param {Attack[]} attacks 
     * @returns {string}
     */
    static writeAttacksBlock(blockStarter, attacks) {
        if (Helpers.isEmpty(attacks)) return;

        const flatAttackArray = [attacks].flat();
        const attackYAMLBlocks = [
            blockStarter,
            ...flatAttackArray.map((attack) => ObsidianBlockWriter.#createSingleAttackBlock(attack)),
        ];

        return attackYAMLBlocks.join("\n");
    }

    /**
     * @param {Trait[]} traits 
     * @returns {string}
     */
    static writeStandardTraitsBlock(traits) {
        return this.writeTraitsBlock(this.traitsHeaderLine, traits);
    }

    /**
     * @param {Trait[]} traits 
     * @returns {string}
     */
    static writeNastierTraitsBlock(traits) {
        return this.writeTraitsBlock(this.nastiersHeaderLine, traits);
    }

    /**
     * @param {string} blockStarter
     * @param {Trait[]} traits 
     * @returns {string}
     */
    static writeTraitsBlock(blockStarter, traits) {
        if (Helpers.isEmpty(traits)) return;

        const flatTraitArray = [traits].flat();
        const traitYAMLBlocks = [
            blockStarter,
            ...flatTraitArray.map((attack) => ObsidianBlockWriter.#createSingleTraitBlock(attack)),
        ];

        return traitYAMLBlocks.join("\n");
    }

    /**
     * @param {string[]} targetArray 
     * @param {string} traitName 
     * @param {string} traitValue 
     * @returns {string[]}
     */
    static #pushTrait(targetArray, traitName, traitValue) {
        if (!traitValue) return;

        targetArray.push(`${traitName}: "${traitValue}"`);
    }

    /**
     * @param {Object} statObject 
     * @returns {string}
     */
    static #writeObjectToYaml(statObject) {
        if (!statObject) return;

        const outputYAMLArray = [];

        Object.entries(statObject).map(([key, value]) => ObsidianBlockWriter.#pushTrait(outputYAMLArray, key, value));

        return outputYAMLArray.join("\n");
    }

    /**
     * @param {Object} descriptionBlock 
     * @returns {string}
     */
    static writeDescriptionBlock(descriptionBlock) {
        if (!descriptionBlock) return;

        return ObsidianBlockWriter.#writeObjectToYaml(descriptionBlock);
    }

    /**
     * @param {Object} defenseBlock 
     * @returns {string}
     */
    static writeDefenseBlock(defenseBlock) {
        if (!defenseBlock) return;

        return ObsidianBlockWriter.#writeObjectToYaml(defenseBlock);
    }

    /**
     * Write the full statblock without the needed FantasyStatblock headers
     * @param {MonsterStatBlock} fullStatblock
     * @returns {string}
     */
    static writeFullMonster(fullStatblock) {
        const stringBlocks = [];

        stringBlocks.push(
            this.writeDescriptionBlock(fullStatblock.fullDescription),
            this.writeStandardAttacksBlock(fullStatblock.attacks),
            this.writeStandardTraitsBlock(fullStatblock.traits),
            this.writeNastierTraitsBlock(fullStatblock.nastierTraits),
            this.writeTriggeredAttacksBlock(fullStatblock.triggeredAttacks),
            this.writeDefenseBlock({
                ac: fullStatblock.ac,
                pd: fullStatblock.pd,
                md: fullStatblock.md,
                hp: fullStatblock.hp,
            }),
        );

        return stringBlocks.filter((s) => s).join("\n");
    }

    /**
     * Write the full statblock including the surrounding header needed for the FantasyStatblock module
     * @param {MonsterStatBlock} fullStatblock
     * @returns {string}
     */
    static writeFullStatblock(fullStatblock) {
        const output = [
            "```statblock",
            "layout: Basic 13th Age Monster Layout",
            "columns: 1",
            ObsidianBlockWriter.writeFullMonster(fullStatblock),
            "```",
        ];

        return output.join("\n");
    }

    /**
     * Write the full statblock including the surrounding header needed for the FantasyStatblock module
     * @param {MonsterStatBlock} fullStatblock
     * @returns {string}
     */
    static writeFullNote(fullStatblock) {
        const output = [
            "---",
            `title: ${fullStatblock.name}`,
            `level: ${fullStatblock.fullDescription.level}`,
            `role: ${fullStatblock.fullDescription.role}`,
            `type: ${fullStatblock.fullDescription.type}`,
            `strength: ${fullStatblock.fullDescription.strength ?? "normal"}`,
            `tags: [\"13A/Bestiary/${fullStatblock.fullDescription.type}\", \"13A/Monsters/Role/${fullStatblock.fullDescription.role}\", \"13A/Monsters/Strength/${fullStatblock.fullDescription.strength ?? "normal"}\"]`,
            "aliases:",
            `  - ${fullStatblock.fullDescription.name}`,
            `source: ${fullStatblock.source} `,
            "---",
            "",
            ObsidianBlockWriter.writeFullStatblock(fullStatblock),
        ];

        return output.join("\n");
    }
};
