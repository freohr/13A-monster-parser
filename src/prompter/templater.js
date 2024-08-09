import SrdHtmlParser from "../parser/srdhtmlparser.js";
import ObsidianBlockWriter from "../writer/obsidian.js";

export default class TemplaterPrompter {
    #templater = {};

    constructor(tp) {
        this.#templater = tp;
    }

    async promptSrdHtmlParser() {
        const monsterName = await this.#templater.system.prompt("Monster Name?");

        const htmlSource = await this.#templater.system.suggester(
            ["Parse HTML from the extracted SRD webpage?", "Parse HTML from the extracted SRD DocX?"],
            ["web", "docx"],
        );

        const srdText = await this.#templater.system.prompt(
            "Paste the monster's extracted HTML table from your source.",
            "",
            false,
            true,
        );

        const srdParser = ((source) => {
            switch (source) {
                case "web":
                    return SrdHtmlParser.createPureHtmlParser(srdText);
                case "docx":
                    return SrdHtmlParser.createDocxHtmlParser(srdText);
            }
        })(htmlSource);

        const statblock = srdParser.getFullMonster(monsterName);

        return ObsidianBlockWriter.writeFullMonster(statblock);
    }
};