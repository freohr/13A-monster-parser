import MonsterStatBlock, { Trait, Attack } from "../statblock.js"
import Helpers from "../helpers.js";

export default class LaTeXBlockWriter {
    /**
     * Write the full statblock without the standard LaTeX document boilerplate
* @param {MonsterStatBlock} monsterData
* @returns {string}
*/
    static writeMonsterCard(monsterData) {
        if (!monsterData) return;

        const monsterBlock = [
            "\\monsterCard{",
            this.#writeDescription(monsterData),
            this.#writeAttackBlock(monsterData.attacks),
            this.#writeTraitBlock(monsterData.traits),
            this.#writeTriggeredAttackBlock(monsterData.triggeredAttacks),
            this.#writeNastierTraitBlock(monsterData.nastierTraits),
            this.#writeDefenses(monsterData),
            "}",
        ];

        return monsterBlock.filter((s) => s).join("\n");
    }

    /**
     * Write the full statblock including the surrounding boilerplate needed for the LaTeX document
* @param {MonsterStatBlock} monsterData
* @returns {string}
*/
    static #writeFullDocument(monsterData) {
        return ```\\documentclass{13a-monster-card}
\\begin{document}
${this.writeMonsterCard(monsterData)}
\\end{document}
```;
    }

    /**
     * @param {MonsterStatBlock} monsterData
     * @returns {string}
     */
    static #writeDescription(monsterData) {
        if (!monsterData?.level) return;

        const typeLine = [
            `\\monsterName{${monsterData.name}}`,
            `\\monsterType{${monsterData.level}}{${monsterData.role}}{${monsterData.type}}[${monsterData.size ?? ""}][${monsterData.strength ?? ""}][${monsterData.mook ?? ""}]`,
            `\\initiative{${monsterData.initiative}}`,
        ];

        if (monsterData.vulnerability) {
            typeLine.push(`\\vulnerabilities{${monsterData.vulnerability}}`);
        }

        return typeLine.join("\n");
    }

    /**
     * @param {MonsterStatBlock} monsterData
     * @returns {string}
     */
    static #writeDefenses(monsterData) {
        if (!monsterData?.ac) return;

        const defenses = [
            "\\monsterDefenses",
            `{${monsterData.ac}}`,
            monsterData.ac_base ? "[" + monsterData.ac_base + "]" : "",
            `{${monsterData.pd}}`,
            monsterData.pd_base ? "[" + monsterData.pd_base + "]" : "",
            `{${monsterData.md}}`,
            monsterData.md_base ? "[" + monsterData.md_base + "]" : "",
            `{${monsterData.hp}}`,
            monsterData.hp_base ? "[" + monsterData.hp_base + "]" : "",
        ];

        return defenses.filter((s) => s).join("");
    }

    /**
     * @param {Trait} trait
     * @returns {string}
     */
    static #writeTrait(trait) {
        return `\\trait{${trait.name}}{${trait.description}}`;
    }

    static #writeTraitBlock(traits) {
        if (Helpers.isEmpty(traits)) return;

        const block = ["\\traits{"];

        for (const trait of traits) {
            block.push(this.#writeTrait(trait));
        }

        block.push("}");

        return block.join("\n");
    }


    /**
     * @param {Trait[]} traits
     * @returns {string}
     */
    static #writeNastierTraitBlock(traits) {
        if (Helpers.isEmpty(traits)) return;

        const block = ["\\nastierTraits{"];

        for (const trait of traits) {
            block.push(this.#writeTrait(trait));
        }

        block.push("}");

        return block.join("\n");
    }

    /**
     * @param {Attack} attack
     * @returns {string}
     */
    static #writeAttack(attack) {
        const attackString = [`\\action{${attack.name}}{${attack.description}}`];

        if (!Helpers.isEmpty(attack.traits)) {
            attackString[0] += "[";
            for (let trait of attack.traits) {
                attackString.push(this.#writeTrait(trait));
            }
            attackString.push("]");
        }

        return attackString.join("\n");
    }

    /**
     * @param {Attack[]} attacks
     * @returns {string}
     */
    static #writeAttackBlock(attacks) {
        if (Helpers.isEmpty(attacks)) return;

        const block = ["\\actions{"];

        for (const attack of attacks) {
            block.push(this.#writeAttack(attack));
        }

        block.push("}");

        return block.join("\n");
    }

    /**
     * @param {Attack[]} attacks
     * @returns {string}
     */
    static #writeTriggeredAttackBlock(attacks) {
        if (Helpers.isEmpty(attacks)) return;

        const block = ["\\triggeredActions{"];

        for (const attack of attacks) {
            block.push(this.#writeAttack(attack));
        }

        block.push("}");

        return block.join("\n");
    }
};
