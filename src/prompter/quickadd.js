import PdfBlockParser from "../parser/pdfparser.js";
import SrdBlockParser from "../parser/srdblockparser.js";
import ObsidianBlockWriter from "../writer/obsidian.js";

export default class QuickAddPrompter {
    #quickAddContext;

    constructor(quickAddApi) {
        this.#quickAddContext = quickAddApi;
    }

    /**
     * @param {string} fieldName 
     * @returns {string}
     */
    #getQuickAddField(fieldName) {
        return this.#quickAddContext.variables[fieldName];
    }

    /**
     * @param {string} fieldName 
     * @param {string} fieldContent
     */
    #updateQuickAddField(fieldName, fieldContent) {
        // Since we're either creating or updating a field that contains an array in the global QuickAdd object, we can just
        // put everything into an array, flatten it, then filter out the possibility that there wasn't anything in the field yet
        const updatedContent = [this.#getQuickAddField(fieldName), fieldContent]
            .flat()
            .filter((field) => field);
        this.#quickAddContext.variables[fieldName] = updatedContent;

        return updatedContent;
    }

    async suggestBlockToParse() {
        const blockTypes = {
            names: ["a Description", "Attacks", "Traits", "Triggered Attacks", "Nastier Specials", "I'm done"],
            types: ["desc", "attacks", "traits", "triggers", "nastiers", "done"],
        };
        const operationTypes = {
            names: ["Initial Parse", "Parse & Replace", "Parse & Append", "Manual Entry"],
            types: ["parse-replace", "parse-replace", "parse-append", "manual-entry"],
        };

        await this.#quickAddContext.infoDialog("What kind of info do you want to enter?");
        const blockType = await this.#quickAddContext.suggester(blockTypes.names, blockTypes.types);
        const blockName = blockTypes.names.at(blockTypes.types.indexOf(blockType));

        if (blockType === "done") {
            // Nothing more to add, we can just return
            return {
                block: blockType,
                operation: "",
            };
        }

        await this.#quickAddContext.infoDialog(`How do you want to add ${blockName} to the statblock?`);
        const operationType = await this.#quickAddContext.suggester(operationTypes.names, operationTypes.types);

        return {
            block: blockType,
            operation: operationType,
        };
    }

    async getMonsterDescription() {
        const desc = await this.#quickAddContext.quickAddApi.wideInputPrompt(
            "Monster Description? (Put the Monster's name on the first line if multi-lines)",
        );
        const descParser = new PdfBlockParser(desc);

        const monsterDescription = descParser.parseDescriptionBlock();
        this.#quickAddContext.variables = Object.assign(this.#quickAddContext.variables, monsterDescription);

        return ObsidianBlockWriter.writeDescriptionBlock(monsterDescription);
    }

    async getMonsterActions() {
        const attackText = await this.#quickAddContext.quickAddApi.wideInputPrompt(
            "Monster Attacks (including [Special Trigger])?",
        );

        const attackParser = new PdfBlockParser(attackText);
        const parsedAttacks = attackParser.parseAttackBlock();

        const updatedAttacks = this.#updateQuickAddField("actions", parsedAttacks.attacks);

        this.#updateQuickAddField("triggered_actions", parsedAttacks.triggeredAttacks);

        // We don't return the parsed triggered attacks right now, but we store them for later
        return ObsidianBlockWriter.writeStandardAttacksBlock(updatedAttacks);
    }

    async getMonsterTraits() {
        const text = await this.#quickAddContext.quickAddApi.wideInputPrompt("Monster Traits?");

        if (!text) {
            return;
        }

        const traitParser = new PdfBlockParser(text);
        const traits = traitParser.parseTraitBlock();

        const updatedTraits = this.#updateQuickAddField("traits", traits.traits);

        // We don't return the parsed triggered attacks right now, but we store them for later
        this.#updateQuickAddField("triggered_actions", traits.triggeredActions);

        return ObsidianBlockWriter.writeStandardTraitsBlock(updatedTraits);
    }

    async getMonsterTriggeredActions() {
        const text = await this.#quickAddContext.quickAddApi.wideInputPrompt("Monster Triggered Attacks?");

        let updatedTriggeredActions;

        if (text) {
            const attackParser = new PdfBlockParser(text);

            const parsedAttacks = attackParser.parseAttackBlock();
            const triggeredAttacks = [...parsedAttacks.attacks, ...parsedAttacks.triggeredAttacks];
            updatedTriggeredActions = this.#updateQuickAddField("triggerActions", triggeredAttacks);
        } else {
            updatedTriggeredActions = this.#getQuickAddField("triggerActions");
        }

        return ObsidianBlockWriter.writeTriggeredAttacksBlock(
            updatedTriggeredActions,
        );
    }

    async getMonsterNastierTraits() {
        const text = await this.#quickAddContext.quickAddApi.wideInputPrompt(
            'Monster Nastier Specials? (remove "Nastier Specials" header if possible)',
        );

        if (!text) {
            return;
        }

        const traitParser = new PdfBlockParser(text);
        const updatedTraits = this.#updateQuickAddField("nastierTraits", traitParser.parseTraitBlock());

        return ObsidianBlockWriter.writeNastierTraitsBlock(updatedTraits);
    }

    async getMonsterDefenses() {
        const defenses = await this.#quickAddContext.quickAddApi.wideInputPrompt("Monster Defenses?");

        const defenseParser = new PdfBlockParser(defenses);

        const monsterDefenses = defenseParser.parseDefenseBlock();
        this.#quickAddContext.variables = Object.assign(this.#quickAddContext.variables, monsterDefenses);

        return ObsidianBlockWriter.writeDefenseBlock(monsterDefenses);
    }

    async getSrdStatblockFromRawText() {
        const srdText = await this.#quickAddContext.quickAddApi.wideInputPrompt(
            "Manually copy the text from the online SRD (from Name to HP) and paste here",
        );

        const srdParser = new SrdBlockParser(srdText);

        const monsterDescription = srdParser.getMonsterDescription();
        this.#quickAddContext.variables = Object.assign(this.#quickAddContext.variables, monsterDescription);
        const statblock = srdParser.getFullMonster();

        return ObsidianBlockWriter.writeFullMonster(statblock);
    }

    async promptMinimalistParser() {
        return [
            await this.getMonsterDescription(),
            await this.getMonsterActions(),
            await this.getMonsterTraits(),
            await this.getMonsterNastierTraits(),
            await this.getMonsterTriggeredActions(),
            await this.getMonsterDefenses(),
        ]
            .filter((s) => s)
            .join("\n");
    }

    async promptSrdHtmlParser() {
        const htmlSource = await this.#quickAddContext.quickAddApi.suggester(
            ["Parse HTML from the extracted SRD webpage?", "Parse HTML from the extracted SRD DocX?"],
            ["web", "docx"],
        );

        const monsterName =
            this.#quickAddContext.variables.name ??
            (await this.#quickAddContext.quickAddApi.inputPrompt("Monster Name?"));
        const srdText = await this.#quickAddContext.quickAddApi.wideInputPrompt(
            "Paste the monster's extracted HTML table from your source.",
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
        this.#quickAddContext.variables = Object.assign(
            this.#quickAddContext.variables,
            statblock.fullDescription,
        );

        return ObsidianBlockWriter.writeFullMonster(statblock);
    }
};