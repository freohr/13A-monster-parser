export class BlockWriter {
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
        traitString.push(
            BlockWriter.#noIndentNameLine(trait.name),
            BlockWriter.#noIndentDescLine(trait.description)
        );
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
        const flatAttackArray = [attacks].flat();
        const attackYAMLBlocks = [
            blockStarter,
            ...flatAttackArray.map((attack) =>
                BlockWriter.#createSingleAttackBlock(attack)
            ),
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
        const flatTraitArray = [traits].flat();
        const traitYAMLBlocks = [
            blockStarter,
            ...flatTraitArray.map((attack) =>
                BlockWriter.#createSingleTraitBlock(attack)
            ),
        ];

        return traitYAMLBlocks.join("\n");
    }

    static #pushTrait(targetArray, traitName, traitValue) {
        targetArray.push(`${traitName}: ${traitValue}`);
    }

    static #writeObjectToYaml(statObject) {
        const outputYAMLArray = [];

        Object.entries(statObject).map(([key, value]) =>
            BlockWriter.#pushTrait(outputYAMLArray, key, value)
        );

        return outputYAMLArray.join("\n");
    }

    static writeDescriptionBlock(descriptionBlock) {
        return BlockWriter.#writeObjectToYaml(descriptionBlock);
    }

    static writeDefenseBlock(defenseBlock) {
        return BlockWriter.#writeObjectToYaml(defenseBlock);
    }
}
