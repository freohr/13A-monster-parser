export class Parser13AMonster {
    static Namespace = new Parser13AMonster();
    Helpers = class Helpers {
        static stringToPascalCase(string) {
            const allWords = string.split(" ");
            const capitalizedWords = allWords.map((s) =>
                s.replace(/(\w)(\w*)/g, (_, g1, g2) => g1.toUpperCase() + g2.toLowerCase()),
            );

            return capitalizedWords.join(" ");
        }

        static setGlobalFlagOnRegex(regex) {
            return new RegExp(regex.source, "g");
        }

        static isEmpty(stuff) {
            if (stuff === undefined) return true;
            if (Array.isArray(stuff) && stuff.length === 0) return true;
            if (typeof stuff === "string" && stuff.length === 0) return true;
            if (stuff instanceof Set) return stuff.size === 0;
            return Object.entries(stuff).length === 0;
        }

        static getOrdinal(number) {
            if (!(number instanceof Number)) {
                number = parseInt(number);
            }

            if (number === 0 || (number >= 4 && number <= 30)) {
                return `${number}th`;
            }

            if (number % 10 === 1) {
                return `${number}st`;
            }

            if (number % 10 === 2) {
                return `${number}nd`;
            }

            if (number % 10 === 3) {
                return `${number}rd`;
            }
        }
    };
    Trait = class Trait {
        #name = "";
        #description = "";

        /**
         *
         * @type {Parser13AMonster.Trait[]}
         */
        #traits = [];

        constructor(name, description, traits) {
            this.#name = name.trim();
            this.#description = description.trim();
            this.#traits = traits ?? [];
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

        get traits() {
            return this.#traits;
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
            this.#name = name.trim();
            this.#description = description.trim();
            this.#traits = traits ?? [];
        }

        equals(other) {
            return other instanceof Attack && other.name === this.name;
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

        get traits() {
            return this.#traits;
        }
    };

    TextHandler = class TextHandler {
        #textArray = [];
        #currentIndex = 0;

        constructor(textBlock, removeWhiteSpace = true) {
            if (typeof textBlock === "string") {
                let importedText = textBlock.split("\n");

                if (removeWhiteSpace) {
                    importedText = importedText.map((s) => s.trim()).filter((s) => s.length > 0);
                }

                this.#textArray = importedText;
            }
        }

        reset() {
            this.#textArray = [];
            this.#currentIndex = 0;
        }

        get atEnd() {
            return this.#currentIndex >= this.#textArray.length;
        }

        get currentLine() {
            return this.#textArray[this.#currentIndex];
        }

        get index() {
            return this.#currentIndex;
        }

        set index(i) {
            this.#currentIndex = i;
        }

        advanceIndex(i = 1) {
            this.index += i;
        }
    };

    PdfBlockParser = class BlockParser {
        #textHandler;

        constructor(textBlock) {
            this.#textHandler = new Parser13AMonster.Namespace.TextHandler(textBlock);
        }

        #getDescription(descStarter) {
            const fullDesc = [descStarter];
            let desc;

            while (!this.#textHandler.atEnd) {
                if (this.#textHandler.currentLine.match(Parser13AMonster.Namespace.ParsingRegexes.nastierHeaderRegex)) {
                    break;
                }

                if (
                    (desc = this.#textHandler.currentLine.match(
                        Parser13AMonster.Namespace.ParsingRegexes.pdfFollowUpRegex,
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
                        Parser13AMonster.Namespace.ParsingRegexes.traitStarterRegex,
                    )) !== null
                ) {
                    this.#textHandler.advanceIndex();

                    traits.push(
                        new Parser13AMonster.Namespace.Trait(
                            match.groups.trait_name,
                            this.#getDescription(match.groups.trait_desc),
                        ),
                    );
                } else if (
                    (match = this.#textHandler.currentLine.match(
                        Parser13AMonster.Namespace.ParsingRegexes.attackStarterRegex,
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
                        Parser13AMonster.Namespace.ParsingRegexes.traitStarterRegex,
                    )) !== null
                ) {
                    this.#textHandler.advanceIndex();

                    traits.push(
                        new Parser13AMonster.Namespace.Trait(
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

        #getBasicAttack(attackName, attackDesc) {
            return new Parser13AMonster.Namespace.Attack(attackName, this.#getDescription(attackDesc), null);
        }

        #getFullAttack(attackName, attackDesc) {
            return new Parser13AMonster.Namespace.Attack(
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
                        Parser13AMonster.Namespace.ParsingRegexes.attackStarterRegex,
                    ))
                ) {
                    this.#textHandler.advanceIndex();

                    let isTriggered = false;

                    if (
                        startAttackMatch.groups.special?.match(
                            Parser13AMonster.Namespace.ParsingRegexes.triggeredAttackRegex,
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

            return {
                attacks: attacks,
                triggeredAttacks: triggeredAttacks,
            };
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

                if (thing instanceof Parser13AMonster.Namespace.Attack) {
                    lastParsedAttack = thing;
                    if (isTriggered) {
                        triggeredAttacks.push(thing);
                    } else {
                        attacks.push(thing);
                    }
                } else if (thing instanceof Parser13AMonster.Namespace.Trait) {
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

                if ((match = currentLine.match(Parser13AMonster.Namespace.ParsingRegexes.attackStarterRegex))) {
                    finalizeThing(currentThing, isTriggered);
                    currentThing = new Parser13AMonster.Namespace.Attack(
                        match.groups.attack_name,
                        match.groups.attack_desc,
                    );
                    lastParsedAttack = currentThing;
                    isTriggered = match.groups.trigger != undefined;
                } else if ((match = currentLine.match(Parser13AMonster.Namespace.ParsingRegexes.traitStarterRegex))) {
                    finalizeThing(currentThing, isTriggered);
                    currentThing = new Parser13AMonster.Namespace.Trait(
                        match.groups.trait_name,
                        match.groups.trait_desc,
                    );
                } else {
                    appendDescription(currentThing, currentLine);
                }

                this.#textHandler.advanceIndex();
            }

            finalizeThing(currentThing, isTriggered);

            return {
                attacks: attacks,
                triggeredAttacks: triggeredAttacks,
            };
        }

        parseTraitBlock() {
            if (this.#textHandler.currentLine.match(Parser13AMonster.Namespace.ParsingRegexes.nastierHeaderRegex)) {
                return this.parseNastierTraitBlock();
            }

            const parsedTraits = this.#getTraits();
            if (!this.#textHandler.atEnd && this.#textHandler.currentLine.match(Parser13AMonster.Namespace.ParsingRegexes.nastierHeaderRegex)) {
                const parsedNastierTraits = this.parseNastierTraitBlock();

                parsedTraits.triggeredAttacks = [
                    ...parsedTraits.triggeredAttacks,
                    ...parsedNastierTraits.triggeredAttacks,
                ];
                parsedTraits.nastierTraits = parsedNastierTraits.nastierTraits;
            }

            return parsedTraits;
        }

        parseNastierTraitBlock() {
            if (this.#textHandler.currentLine.match(Parser13AMonster.Namespace.ParsingRegexes.nastierHeaderRegex)) {
                this.#textHandler.advanceIndex();
            }

            const { traits, ...other } = this.#getTraits();
            return { nastierTraits: traits, ...other };
        }

        parseDescriptionBlock() {
            const monsterDescription = {
                name: "",
                flavor_text: "",
                size: "",
                level: "",
                levelOrdinal: "",
                role: "",
                type: "",
                initiative: "",
                vulnerability: "",
            };

            // First line is the monster name
            monsterDescription.name = Parser13AMonster.Namespace.Helpers.stringToPascalCase(
                this.#textHandler.currentLine,
            );
            this.#textHandler.advanceIndex();

            // We consider any text until the monster strength line flavor-text
            const flavorText = [];
            while (
                !this.#textHandler.atEnd &&
                this.#textHandler.currentLine.match(Parser13AMonster.Namespace.ParsingRegexes.strengthLineRegex) ===
                null
            ) {
                flavorText.push(this.#textHandler.currentLine);
                this.#textHandler.advanceIndex();
            }
            monsterDescription.flavor_text = flavorText.join(" ");

            // We should be at the monster strength line now
            let strengthMatch;
            if (
                (strengthMatch = this.#textHandler.currentLine.match(
                    Parser13AMonster.Namespace.ParsingRegexes.strengthLineRegex,
                ))
            ) {
                monsterDescription.size = strengthMatch.groups.strength?.toLowerCase().replace(/ /, "-");
                monsterDescription.level = strengthMatch.groups.level ?? strengthMatch.groups.levelAfter;
                monsterDescription.levelOrdinal =
                    strengthMatch.groups.ordinal?.replace(/ /, "") ??
                    Parser13AMonster.Namespace.Helpers.getOrdinal(monsterDescription.level);
                monsterDescription.type = strengthMatch.groups.type.toLowerCase();

                monsterDescription.role = strengthMatch.groups.role.toLowerCase();
                if (monsterDescription.role === "mook") {
                    monsterDescription.mook = "yes";
                }

                this.#textHandler.advanceIndex();
            } else {
                throw "Bad monster description block format";
            }

            while (!this.#textHandler.atEnd) {
                // After that, there should only be Init and Vulnerabilities left, we don't need to do it in order
                let lineMatch;
                if (
                    (lineMatch = this.#textHandler.currentLine.match(
                        Parser13AMonster.Namespace.ParsingRegexes.initiativeRegex,
                    ))
                ) {
                    monsterDescription.initiative = lineMatch.groups.initiative;
                } else if (
                    (lineMatch = this.#textHandler.currentLine.match(
                        Parser13AMonster.Namespace.ParsingRegexes.vulnerabilityRegex,
                    ))
                ) {
                    monsterDescription.vulnerability = Parser13AMonster.Namespace.Helpers.stringToPascalCase(
                        lineMatch.groups.vulnerability,
                    );
                }
                this.#textHandler.advanceIndex();
            }

            return monsterDescription;
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
                        Parser13AMonster.Namespace.ParsingRegexes.defensesRegex.allDefensesOneLine,
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
                        Parser13AMonster.Namespace.ParsingRegexes.defensesRegex.anyDefenseOneLine,
                    ))
                ) {
                    defenses[defenseMatch.groups.name.toLowerCase()] = parseInt(defenseMatch.groups.value);
                }
                this.#textHandler.advanceIndex();
            }

            return defenses;
        }
    };

    BlockWriter = class BlockWriter {
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
        static #noIndentNameLine = (name) => `    - name: \"${name}\"`;
        static #noIndentDescLine = (desc) => `      desc: \"${desc}\"`;

        static #attackTraitNameLine(name) {
            return this.#addIndentation(this.#noIndentNameLine(name));
        }

        static #attackTraitDescLine(desc) {
            return this.#addIndentation(this.#noIndentDescLine(desc));
        }

        static #createSingleTraitBlock(trait) {
            const traitStrings = [
                BlockWriter.#noIndentNameLine(trait.name),
                BlockWriter.#noIndentDescLine(trait.description),
            ];

            if (trait.traits.length > 0) {
                traitStrings.push(...BlockWriter.#createNestedTraitsBlock(trait.traits));
            }

            return traitStrings.join("\n");
        }

        static #createSingleAttackBlock(attack) {
            const attackStrings = [
                BlockWriter.#noIndentNameLine(attack.name),
                BlockWriter.#noIndentDescLine(attack.description),
            ];

            if (attack.traits.length > 0) {
                attackStrings.push(...BlockWriter.#createNestedTraitsBlock(attack.traits));
            }

            return attackStrings.join("\n");
        }

        static #createNestedTraitsBlock(nestedTraits) {
            const nestedTraitStrings = [];

            nestedTraitStrings.push(BlockWriter.attackTraitsHeaderLine);
            nestedTraits.forEach((trait) =>
                nestedTraitStrings.push(
                    BlockWriter.#attackTraitNameLine(trait.name),
                    BlockWriter.#attackTraitDescLine(trait.description),
                ),
            );

            return nestedTraitStrings;
        }

        static writeStandardAttacksBlock(attacks) {
            return this.writeAttacksBlock(this.attackHeaderLine, attacks);
        }

        static writeTriggeredAttacksBlock(attacks) {
            return this.writeAttacksBlock(this.triggersHeaderLine, attacks);
        }

        static writeAttacksBlock(blockStarter, attacks) {
            if (Parser13AMonster.Namespace.Helpers.isEmpty(attacks)) return;

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
            if (Parser13AMonster.Namespace.Helpers.isEmpty(traits)) return;

            const flatTraitArray = [traits].flat();
            const traitYAMLBlocks = [
                blockStarter,
                ...flatTraitArray.map((attack) => BlockWriter.#createSingleTraitBlock(attack)),
            ];

            return traitYAMLBlocks.join("\n");
        }

        static #pushTrait(targetArray, traitName, traitValue) {
            if (!traitValue) return;

            targetArray.push(`${traitName}: "${traitValue}"`);
        }

        static #writeObjectToYaml(statObject) {
            if (!statObject) return;

            const outputYAMLArray = [];

            Object.entries(statObject).map(([key, value]) => BlockWriter.#pushTrait(outputYAMLArray, key, value));

            return outputYAMLArray.join("\n");
        }

        static writeDescriptionBlock(descriptionBlock) {
            if (!descriptionBlock) return;

            return BlockWriter.#writeObjectToYaml(descriptionBlock);
        }

        static writeDefenseBlock(defenseBlock) {
            if (!defenseBlock) return;

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
    };

    QuickAddPrompter = class QuickAddPrompter {
        #quickAddContext;

        constructor(quickAddApi) {
            this.#quickAddContext = quickAddApi;
        }

        #getQuickAddField(fieldName) {
            return this.#quickAddContext.variables[fieldName];
        }

        #updateQuickAddField(fieldName, fieldContent) {
            // Since we're either creating or updating a field that contains an array in the global QuickAdd object, we can just
            // put everything into an array, flatten it, then filter out the possibility that there wasn't anything in the field yet
            const updatedContent = [this.#getQuickAddField(fieldName), fieldContent].flat().filter((field) => field);
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
            const descParser = new Parser13AMonster.Namespace.PdfBlockParser(desc);

            const monsterDescription = descParser.parseDescriptionBlock();
            this.#quickAddContext.variables = Object.assign(this.#quickAddContext.variables, monsterDescription);

            return Parser13AMonster.Namespace.BlockWriter.writeDescriptionBlock(monsterDescription);
        }

        async getMonsterActions() {
            const attackText = await this.#quickAddContext.quickAddApi.wideInputPrompt(
                "Monster Attacks (including [Special Trigger])?",
            );

            const attackParser = new Parser13AMonster.Namespace.PdfBlockParser(attackText);
            const parsedAttacks = attackParser.parseAttackBlock();

            const updatedAttacks = this.#updateQuickAddField("actions", parsedAttacks.attacks);

            this.#updateQuickAddField("triggered_actions", parsedAttacks.triggeredAttacks);

            // We don't return the parsed triggered attacks right now, but we store them for later
            return Parser13AMonster.Namespace.BlockWriter.writeStandardAttacksBlock(updatedAttacks);
        }

        async getMonsterTraits() {
            const text = await this.#quickAddContext.quickAddApi.wideInputPrompt("Monster Traits?");

            if (!text) {
                return;
            }

            const traitParser = new Parser13AMonster.Namespace.PdfBlockParser(text);
            const traits = traitParser.parseTraitBlock();

            const updatedTraits = this.#updateQuickAddField("traits", traits.traits);

            // We don't return the parsed triggered attacks right now, but we store them for later
            this.#updateQuickAddField("triggered_actions", traits.triggeredActions);

            return Parser13AMonster.Namespace.BlockWriter.writeStandardTraitsBlock(updatedTraits);
        }

        async getMonsterTriggeredActions() {
            const text = await this.#quickAddContext.quickAddApi.wideInputPrompt("Monster Triggered Attacks?");

            let updatedTriggeredActions;

            if (text) {
                const attackParser = new Parser13AMonster.Namespace.PdfBlockParser(text);

                const parsedAttacks = attackParser.parseAttackBlock();
                const triggeredAttacks = [...parsedAttacks.attacks, ...parsedAttacks.triggeredAttacks];
                updatedTriggeredActions = this.#updateQuickAddField("triggerActions", triggeredAttacks);
            } else {
                updatedTriggeredActions = this.#getQuickAddField("triggerActions");
            }

            return Parser13AMonster.Namespace.BlockWriter.writeTriggeredAttacksBlock(updatedTriggeredActions);
        }

        async getMonsterNastierTraits() {
            const text = await this.#quickAddContext.quickAddApi.wideInputPrompt(
                'Monster Nastier Specials? (remove "Nastier Specials" header if possible)',
            );

            if (!text) {
                return;
            }

            const traitParser = new Parser13AMonster.Namespace.PdfBlockParser(text);
            const updatedTraits = this.#updateQuickAddField("nastierTraits", traitParser.parseTraitBlock());

            return Parser13AMonster.Namespace.BlockWriter.writeNastierTraitsBlock(updatedTraits);
        }

        async getMonsterDefenses() {
            const defenses = await this.#quickAddContext.quickAddApi.wideInputPrompt("Monster Defenses?");

            const defenseParser = new Parser13AMonster.Namespace.PdfBlockParser(defenses);

            const monsterDefenses = defenseParser.parseDefenseBlock();
            this.#quickAddContext.variables = Object.assign(this.#quickAddContext.variables, monsterDefenses);

            return Parser13AMonster.Namespace.BlockWriter.writeDefenseBlock(monsterDefenses);
        }

        async getSrdStatblockFromRawText() {
            const srdText = await this.#quickAddContext.quickAddApi.wideInputPrompt(
                "Manually copy the text from the online SRD (from Name to HP) and paste here",
            );

            const srdParser = new Parser13AMonster.Namespace.SrdBlockParser(srdText);

            const monsterDescription = srdParser.getMonsterDescription();
            this.#quickAddContext.variables = Object.assign(this.#quickAddContext.variables, monsterDescription);
            const statblock = srdParser.getFullMonster();

            return Parser13AMonster.Namespace.BlockWriter.writeFullMonster(statblock);
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
                        return Parser13AMonster.Namespace.SrdHtmlParser.createPureHtmlParser(srdText);
                    case "docx":
                        return Parser13AMonster.Namespace.SrdHtmlParser.createDocxHtmlParser(srdText);
                }
            })(htmlSource);

            const statblock = srdParser.getFullMonster(monsterName);
            this.#quickAddContext.variables = Object.assign(this.#quickAddContext.variables, statblock.fullDescription);

            return Parser13AMonster.Namespace.BlockWriter.writeFullMonster(statblock);
        }
    };

    TemplaterPrompter = class TemplaterPrompter {
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
                        return Parser13AMonster.Namespace.SrdHtmlParser.createPureHtmlParser(srdText);
                    case "docx":
                        return Parser13AMonster.Namespace.SrdHtmlParser.createDocxHtmlParser(srdText);
                }
            })(htmlSource);

            const statblock = srdParser.getFullMonster(monsterName);

            return Parser13AMonster.Namespace.BlockWriter.writeFullMonster(statblock);
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

        get fullDescription() {
            const desc = {
                name: this.name,
                size: this.size,
                level: this.level,
                levelOrdinal: this.levelOrdinal,
                role: this.role,
                type: this.type,
                initiative: this.initiative,
                vulnerability: this.vulnerability,
            };

            if (!Parser13AMonster.Namespace.Helpers.isEmpty(this.flavor_text)) {
                desc.flavor_text = this.flavor_text;
            }

            if (this.role === "mook") {
                desc.mook = "yes";
            }

            return desc;
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

        /**
         * @param {Attack[]} attacks
         */
        set attacks(attacks) {
            this.#attacks = attacks;
        }

        get traits() {
            return this.#traits;
        }

        /**
         * @param {Trait[]} traits
         */
        set traits(traits) {
            this.#traits = traits;
        }

        get triggeredAttacks() {
            return this.#triggeredAttacks;
        }

        /**
         * @param {Attack[]} attacks
         */
        set triggeredAttacks(attacks) {
            this.#triggeredAttacks = attacks;
        }

        get nastierTraits() {
            return this.#nastierTraits;
        }

        /**
         * @param {Trait[]} traits
         */
        set nastierTraits(traits) {
            this.#nastierTraits = traits;
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

    ParsingRegexes = class ParsingRegexes {
        static get strengthLineRegex() {
            return /(?<strength>.+?)? ?(((?<ordinal>(?<level>\d+)\s*(st|nd|rd|th))[ -])level|level (?<levelAfter>\d+)) (?<role>\S+) \[(?<type>\S+)]/i;
        }

        static get attackStarterRegex() {
            return /^(?<full_name>(\[(?<special>.*)] ?)?(?<base_name>([CR]:)?[^:]+)) ?— ?(?<attack_desc>.*)/i;
        }

        static get triggeredAttackRegex() {
            return /^special trigger$/i;
        }

        static get attackTraitStarterRegex() {
            return /^ ?(?<trait_name>.+)(?<![RC]): ?(?<trait_desc>.*)/;
        }

        static get standardAttackTraitNames() {
            return /^(Limited Use|.*Natural (\d+(-\d+)?|odd|even)|.*Hit|.*Miss|.*target.*|.*failed save.*|.*per battle.*|Criti?c?a?l?|Quick Use)/i;
        }

        static get traitStarterRegex() {
            return /^(?! )(?<trait_name>.+?)(?<![RC]): ?(?<trait_desc>.*)/;
        }

        static get followUpRegex() {
            return /^ (?<follow_up>.*)/;
        }

        static get pdfFollowUpRegex() {
            return /^([^:—]+|[^A-Z].+(action|attack|enemy|\d|battle|effect|roll|move):)$/m;
        }

        static get nastierHeaderRegex() {
            return /^Nastier Specials?$/i;
        }

        static get initiativeRegex() {
            return /^Initiative:? \+?(?<initiative>.+)$/;
        }

        static get vulnerabilityRegex() {
            return /^(Vulnerability|Vulnerable): (?<vulnerability>.+)/;
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
                anyDefenseOneLine: /^(?<name>AC|PD|MD|HP) (?<value>\d+)( \(mook\))?$/i,
                allDefensesOneLine: /^AC +(?<ac>\d+) +PD +(?<pd>\d+) +MD +(?<md>\d+) +HP +(?<hp>\d+)( \(mook\))?/i,
                other: /^\((?<name>.+)\)+/,
                value: /^(?<value>\d+)/,
            };
        }

        static get italicElement() {
            return /<em>(?<italic_text>[^:<\[]*)<\/em>/i;
        }

        static get boldElement() {
            return /<strong>(?<strong_text>[^:<]*)(?<!ac|pd|md|hp)<\/strong>/i;
        }

        static get splitAttackRoll() {
            return /^(?<name>[^+]+?) (?<bonus>\+\d+) (?<desc>.*)/i;
        }

        static get inlineAutomaticRolls() {
            return /((\d+d\d+(\+\d+)?|(?<!d)\d+)(?=( \S+){0,2} damage)|\d+d\d+(\+\d+)?)/i;
        }

        static get inlineManualRolls() {
            return /(?<!\d)d\d+(\+\d+)?/i;
        }
    };

    SrdBlockParser = class SrdBlockParser {
        #textHandler;

        constructor(text) {
            this.#textHandler = new Parser13AMonster.Namespace.TextHandler(text, false);
        }

        #placeTextAtStartOfBlock(startOfBlockRegex) {
            this.#textHandler.index = Parser13AMonster.Namespace.ParsingRegexes.initiativeLineIndex;
            this.#textHandler.advanceIndex();
            if (this.#textHandler.currentLine.match(Parser13AMonster.Namespace.ParsingRegexes.vulnerabilityRegex)) {
                this.#textHandler.advanceIndex(2);
            } else {
                this.#textHandler.advanceIndex();
            }

            let blockMatch;
            while (!(blockMatch = this.#textHandler.currentLine.match(startOfBlockRegex))) {
                this.#textHandler.advanceIndex();
            }
        }

        getMonsterDescription() {
            this.#textHandler.index = 0;

            const monsterDescription = {
                name: this.#textHandler.currentLine,
                size: "",
                level: "",
                levelOrdinal: "",
                role: "",
                type: "",
                initiative: "",
                vulnerability: "",
            };

            this.#textHandler.advanceIndex();

            const descriptionArray = [];

            while (!this.#textHandler.currentLine.match(Parser13AMonster.Namespace.ParsingRegexes.blockSeparator)) {
                descriptionArray.push(this.#textHandler.currentLine);
                this.#textHandler.advanceIndex();
            }

            const descriptionString = descriptionArray
                .filter((s) => s.length > 0)
                .map((s) => s.trim())
                .join(" ");

            const descriptionMatch = descriptionString.match(
                Parser13AMonster.Namespace.ParsingRegexes.strengthLineRegex,
            );

            if (!descriptionMatch) {
                throw "Bad format for monster description";
            }

            if (descriptionMatch.groups.size) {
                monsterDescription.size = descriptionMatch.groups.size.toLowerCase();
            }
            monsterDescription.level = descriptionMatch.groups.level;
            monsterDescription.levelOrdinal =
                descriptionMatch.groups.ordinal + (descriptionMatch.groups.ordinal === "0" ? "th" : "");
            monsterDescription.role = descriptionMatch.groups.role.toLowerCase();
            if (monsterDescription.role === "mook") {
                monsterDescription.mook = "yes";
            }
            monsterDescription.type = descriptionMatch.groups.type.toLowerCase();

            this.#textHandler.advanceIndex(2);

            const initiativeMatch = this.#textHandler.currentLine.match(
                Parser13AMonster.Namespace.ParsingRegexes.initiativeRegex,
            );
            monsterDescription.initiative = initiativeMatch.groups.initiative;
            this.#textHandler.advanceIndex();

            let vulnerabilityMatch = this.#textHandler.currentLine.match(
                Parser13AMonster.Namespace.ParsingRegexes.vulnerabilityRegex,
            );
            if (vulnerabilityMatch) {
                monsterDescription.vulnerability = vulnerabilityMatch.groups.vulnerability;
            }

            return monsterDescription;
        }

        getMonsterAttacks() {
            // Set up the text handler to the correct line
            this.#placeTextAtStartOfBlock(Parser13AMonster.Namespace.ParsingRegexes.attackStarterRegex);

            if (this.#textHandler.atEnd) {
                return;
            }

            // Start parsing attacks
            const attacks = {
                attacks: [],
                triggeredAttacks: [],
            };
            let attackMatch;
            while (
                (attackMatch = this.#textHandler.currentLine.match(
                    Parser13AMonster.Namespace.ParsingRegexes.attackStarterRegex,
                ))
            ) {
                let isTriggered = false;

                if (attackMatch.groups.special?.match(Parser13AMonster.Namespace.ParsingRegexes.triggeredAttackRegex)) {
                    isTriggered = true;
                }

                const currentAttack = new Parser13AMonster.Namespace.Attack(
                    isTriggered ? attackMatch.groups.base_name : attackMatch.groups.full_name,
                    attackMatch.groups.attack_desc,
                );
                this.#textHandler.advanceIndex();

                let traitMatch;
                while (
                    (traitMatch = this.#textHandler.currentLine.match(
                        Parser13AMonster.Namespace.ParsingRegexes.attackTraitStarterRegex,
                    ))
                ) {
                    const currentTrait = new Parser13AMonster.Namespace.Trait(
                        traitMatch.groups.trait_name,
                        traitMatch.groups.trait_desc,
                    );
                    currentAttack.traits.push(currentTrait);
                    this.#textHandler.advanceIndex();
                }

                if (attackMatch.groups.trigger) {
                    attacks.triggeredAttacks.push(currentAttack);
                } else {
                    attacks.attacks.push(currentAttack);
                }
                this.#textHandler.advanceIndex();
            }

            return attacks;
        }

        getMonsterTraits() {
            // Set up the text handler to the correct line
            this.#placeTextAtStartOfBlock(Parser13AMonster.Namespace.ParsingRegexes.traitStarterRegex);

            if (this.#textHandler.atEnd) {
                return;
            }

            const traits = { traits: [] },
                triggeredAttacks = [],
                nastierSpecials = { traits: [] };

            let currentTraitCategory = traits;
            let lastModifiedItem;

            let currentLine;
            while (
                ((currentLine = this.#textHandler.currentLine),
                    !currentLine.match(Parser13AMonster.Namespace.ParsingRegexes.blockSeparator))
            ) {
                if (currentLine.match(Parser13AMonster.Namespace.ParsingRegexes.blockSeparator)) {
                    break;
                }

                if (Parser13AMonster.Namespace.Helpers.isEmpty(currentLine)) {
                    this.#textHandler.advanceIndex();
                    continue;
                }

                let currentMatch;
                if ((currentMatch = currentLine.match(Parser13AMonster.Namespace.ParsingRegexes.traitStarterRegex))) {
                    lastModifiedItem = new Parser13AMonster.Namespace.Trait(
                        currentMatch.groups.trait_name,
                        currentMatch.groups.trait_desc,
                    );
                    currentTraitCategory.traits.push(lastModifiedItem);
                } else if (
                    (currentMatch = currentLine.match(Parser13AMonster.Namespace.ParsingRegexes.nastierHeaderRegex))
                ) {
                    currentTraitCategory = nastierSpecials;
                } else if (
                    (currentMatch = currentLine.match(Parser13AMonster.Namespace.ParsingRegexes.attackStarterRegex))
                ) {
                    lastModifiedItem = new Parser13AMonster.Namespace.Attack(
                        currentMatch.groups.base_name,
                        currentMatch.groups.attack_desc,
                    );
                    triggeredAttacks.push(lastModifiedItem);
                } else if (
                    (currentMatch = currentLine.match(
                        Parser13AMonster.Namespace.ParsingRegexes.attackTraitStarterRegex,
                    ))
                ) {
                    if (lastModifiedItem && lastModifiedItem instanceof Parser13AMonster.Namespace.Attack) {
                        lastModifiedItem.traits.push(
                            new Parser13AMonster.Namespace.Trait(
                                currentMatch.groups.trait_name,
                                currentMatch.groups.trait_desc,
                            ),
                        );
                    }
                } else if (
                    (currentMatch = currentLine.match(Parser13AMonster.Namespace.ParsingRegexes.followUpRegex))
                ) {
                    const follow_up = currentMatch.groups.follow_up;

                    if (lastModifiedItem) {
                        lastModifiedItem.description = [lastModifiedItem.description, follow_up].join("<br/>");
                    }
                }
                this.#textHandler.advanceIndex();
            }

            return {
                traits: traits.traits,
                nastierTraits: nastierSpecials.traits,
                triggeredAttacks: triggeredAttacks,
            };
        }

        getMonsterDefenses() {
            const defenseRegexes = Parser13AMonster.Namespace.ParsingRegexes.defensesRegex;

            this.#placeTextAtStartOfBlock(defenseRegexes.ac);

            // Some creature have predefined defenses based on their traits, so we need to catch them
            let defenseNames = [],
                defenseMatch;
            do {
                defenseNames.push(this.#textHandler.currentLine);
                this.#textHandler.advanceIndex();

                defenseMatch = this.#textHandler.currentLine.match(defenseRegexes.value);
            } while (!defenseMatch);

            let defenseValues = [];
            while (!this.#textHandler.atEnd) {
                defenseValues.push(this.#textHandler.currentLine);
                this.#textHandler.advanceIndex();
            }

            defenseNames = defenseNames
                .map((s) => s.trim())
                .filter((s) => s.length !== 0)
                .map((s) => s.toLowerCase());
            defenseValues = defenseValues.map((s) => s.trim()).filter((s) => s.length !== 0);
            const zip = (a, b) => a.map((k, i) => [k, b[i]]),
                matchedDefenses = zip(defenseNames, defenseValues),
                defenses = {};

            matchedDefenses.forEach((elem, index) => {
                const name = elem[0],
                    value = elem[1];
                if (name.match(defenseRegexes.anyDefense)) {
                    defenses[name] = value;
                } else {
                    const namePrevious = matchedDefenses[index - 1][0];
                    const additionalInfoMatch = name.match(defenseRegexes.other);
                    defenses[namePrevious] += ` (${additionalInfoMatch.groups.name}: ${value})`;
                }
            });

            return defenses;
        }

        getFullMonster() {
            const description = this.getMonsterDescription();

            const monsterData = new Parser13AMonster.Namespace.FullStatBlock(
                description.name,
                description.size,
                description.level,
                description.levelOrdinal,
                description.role,
                description.type,
                description.initiative,
                description.vulnerability,
            );

            const attacks = this.getMonsterAttacks();
            monsterData.attacks.push(...attacks.attacks);
            monsterData.triggeredAttacks.push(...attacks.triggeredAttacks);

            const traits = this.getMonsterTraits();
            monsterData.traits.push(...traits.traits);
            monsterData.nastierTraits.push(...traits.nastierTraits);
            monsterData.triggeredAttacks.push(...traits.triggeredAttacks);

            const defenses = this.getMonsterDefenses();
            monsterData.ac = defenses.ac;
            monsterData.pd = defenses.pd;
            monsterData.md = defenses.md;
            monsterData.hp = defenses.hp;

            return monsterData;
        }
    };

    SrdHtmlParser = class SrdHtmlParser {
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

            const statblockTable = localWrapper.children.item(0).children.item(internalElementIndex).children.item(0);

            return new SrdHtmlParser(statblockTable);
        }

        static #cleanUpInputText(htmlText) {
            return htmlText
                .split("\n")
                .join(" ")
                .replaceAll(/>\s+</gi, "><")
                .replaceAll(
                    Parser13AMonster.Namespace.Helpers.setGlobalFlagOnRegex(
                        Parser13AMonster.Namespace.ParsingRegexes.italicElement,
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
         * @param previousElement {Parser13AMonster.Namespace.Attack|Parser13AMonster.Namespace.Trait}
         * @param followupText {string}
         * @returns {boolean} true if the operation succeeded
         */
        static #appendFollowupDescription(previousElement, followupText) {
            /**
             *
             * @param element {Parser13AMonster.Namespace.Attack|Parser13AMonster.Namespace.Trait}
             * @param text {string}
             */
            const appendDescription = (element, text) => {
                element.description = element.description.concat("<br/>", text);
            };

            if (previousElement instanceof Parser13AMonster.Namespace.Attack) {
                let modifiedElement;
                if (previousElement.traits.length > 0) {
                    modifiedElement = previousElement.traits[previousElement.traits.length - 1];
                } else {
                    modifiedElement = previousElement;
                }
                appendDescription(modifiedElement, followupText);

                return true;
            } else if (previousElement instanceof Parser13AMonster.Namespace.Trait) {
                appendDescription(previousElement, followupText);
                return true;
            }

            return false;
        }

        /**
         *
         * @param traitText {string}
         * @return {Parser13AMonster.Namespace.Trait}
         */
        static #parseTraitLine(traitText) {
            const traitMatch = traitText.match(Parser13AMonster.Namespace.ParsingRegexes.traitStarterRegex);

            const traitDesc = traitMatch.groups.trait_desc;

            return new Parser13AMonster.Namespace.Trait(
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
         * @return {Parser13AMonster.Namespace.Attack}
         */
        static #parseAttackLine(attackText, isTriggered) {
            const attackBlock = attackText.split(" ").filter((s) => !Parser13AMonster.Namespace.Helpers.isEmpty(s));
            const attackMatch = attackBlock[0].match(Parser13AMonster.Namespace.ParsingRegexes.attackStarterRegex);

            const attack = new Parser13AMonster.Namespace.Attack(
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
        getMonsterDescription(monsterName) {
            const descriptionWrapper = this.#fullStatBlock.firstElementChild;
            const descriptionString = SrdHtmlParser.#translateChildrenListToIterable(descriptionWrapper.children)
                .map((c) => c.innerText.replace(/[\s ]/, " ").trim().toLowerCase())
                .join(" ");
            const descriptionMatch = descriptionString.match(
                Parser13AMonster.Namespace.ParsingRegexes.strengthLineRegex,
            );

            if (!descriptionMatch) {
                throw "Bad format for monster description";
            }

            const monsterDescription = {
                name: monsterName ?? "",
            };

            if (descriptionMatch.groups.size) {
                monsterDescription.size = descriptionMatch.groups.size.toLowerCase();
            }
            monsterDescription.level = descriptionMatch.groups.level;
            monsterDescription.levelOrdinal =
                descriptionMatch.groups.ordinal + (descriptionMatch.groups.ordinal === "0" ? "th" : "");
            monsterDescription.role = descriptionMatch.groups.role.toLowerCase();
            monsterDescription.type = descriptionMatch.groups.type.toLowerCase();

            const initiativeAndVulnerability = this.#fullStatBlock.children[1].children[0].innerHTML.split("<br>");

            const initiativeMatch = initiativeAndVulnerability[0].match(
                Parser13AMonster.Namespace.ParsingRegexes.initiativeRegex,
            );
            monsterDescription.initiative = initiativeMatch.groups.initiative;

            const potentialVulnerabilityLine =
                initiativeAndVulnerability.length > 1
                    ? initiativeAndVulnerability[1]
                    : this.#fullStatBlock.children[1].children[1].innerText;
            let vulnerabilityMatch;
            if (
                (vulnerabilityMatch = potentialVulnerabilityLine.match(
                    Parser13AMonster.Namespace.ParsingRegexes.vulnerabilityRegex,
                ))
            ) {
                monsterDescription.vulnerability = vulnerabilityMatch.groups.vulnerability;
            }
            return monsterDescription;
        }

        get #hasSeparateVulnerability() {
            return (
                this.#fullStatBlock.children[1].children[1].innerText.match(
                    Parser13AMonster.Namespace.ParsingRegexes.vulnerabilityRegex,
                ) !== null
            );
        }

        /**
         * @param hasVulnerability {boolean}
         * @return {{traits: Parser13AMonster.Trait[], attacks: Parser13AMonster.Attack[], triggeredAttacks: Parser13AMonster.Attack[], nastierTraits: Parser13AMonster.Trait[]}}
         */
        getMonsterAttacksAndTraits(hasVulnerability) {
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
                    if ((currentLineMatch = line.match(Parser13AMonster.Namespace.ParsingRegexes.attackStarterRegex))) {
                        // check for trigger header

                        let isTriggered = false;

                        if ((special = currentLineMatch.groups.special)) {
                            if (special.match(Parser13AMonster.Namespace.ParsingRegexes.triggeredAttackRegex)) {
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

                    if ((currentLineMatch = line.match(Parser13AMonster.Namespace.ParsingRegexes.traitStarterRegex))) {
                        const newTrait = SrdHtmlParser.#parseTraitLine(line);
                        if (
                            newTrait.name.match(Parser13AMonster.Namespace.ParsingRegexes.standardAttackTraitNames) &&
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

                    if ((currentLineMatch = line.match(Parser13AMonster.Namespace.ParsingRegexes.nastierHeaderRegex))) {
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

        getMonsterDefenses() {
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
                if (name.match(Parser13AMonster.Namespace.ParsingRegexes.defensesRegex.anyDefense)) {
                    defenses[name] = value;
                } else {
                    const namePrevious = matchedDefenses[index - 1][0];
                    const additionalInfoMatch = name.match(
                        Parser13AMonster.Namespace.ParsingRegexes.defensesRegex.other,
                    );
                    defenses[namePrevious] += ` (${additionalInfoMatch.groups.name}: ${value})`;
                }
            });

            return defenses;
        }

        getFullMonster(monsterName) {
            const description = this.getMonsterDescription(monsterName);

            const monsterData = new Parser13AMonster.Namespace.FullStatBlock(
                description.name,
                description.size,
                description.level,
                description.levelOrdinal,
                description.role,
                description.type,
                description.initiative,
                description.vulnerability,
            );

            const attacksAndTraits = this.getMonsterAttacksAndTraits();
            monsterData.attacks.push(...attacksAndTraits.attacks);
            monsterData.triggeredAttacks.push(...attacksAndTraits.triggeredAttacks);
            monsterData.traits.push(...attacksAndTraits.traits);
            monsterData.nastierTraits.push(...attacksAndTraits.nastierTraits);

            const defenses = this.getMonsterDefenses();
            monsterData.ac = defenses.ac;
            monsterData.pd = defenses.pd;
            monsterData.md = defenses.md;
            monsterData.hp = defenses.hp;

            return monsterData;
        }
    };

    FoundryParser = class FoundryParser {
        createAttribute(type, label, value) {
            return {
                type: type,
                label: label,
                value: type === "Number" ? parseInt(value) : value,
            };
        }

        replaceRollableParts(text) {
            const helpers = Parser13AMonster.Namespace.Helpers;
            const regexes = Parser13AMonster.Namespace.ParsingRegexes;

            return text
                .replaceAll(helpers.setGlobalFlagOnRegex(regexes.inlineAutomaticRolls), "[[$&]]")
                .replaceAll(helpers.setGlobalFlagOnRegex(regexes.inlineManualRolls), "[[/r $&]]");
        }

        /**
         * @param {Attack} attack
         * @param {boolean} [isTriggered=false]
         */
        transformAttack(attack, isTriggered = false) {
            const actionParts = attack.name.match(Parser13AMonster.Namespace.ParsingRegexes.splitAttackRoll);
            const attackName = isTriggered ? `[Special Trigger] ${actionParts.groups.name}` : actionParts.groups.name;

            let attackData = {
                name: attackName,
                type: "action",
                img: "",
                system: {
                    name: this.createAttribute("String", "Name", attackName),
                    attack: this.createAttribute(
                        "String",
                        "Attack Roll",
                        `[[d20${actionParts.groups.bonus}]] ${this.replaceRollableParts(actionParts.groups.desc)}`,
                    ),
                    hit: this.createAttribute("String", "Hit", this.replaceRollableParts(attack.description)),
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
                    ...this.createAttribute("String", traitLabel, this.replaceRollableParts(trait.description)),
                };
            }

            return attackData;
        }

        /**
         * @param {Trait} trait
         * @param {boolean} [isNastier=false]
         */
        transformTrait(trait, isNastier = false) {
            const traitType = isNastier ? "nastierSpecial" : "trait";

            const traitData = {
                name: trait.name,
                type: traitType,
                img: "",
                system: {
                    name: this.createAttribute("String", "Name", trait.name),
                    description: this.createAttribute(
                        "String",
                        "Description",
                        this.replaceRollableParts(trait.description),
                    ),
                },
            };

            return traitData;
        }

        async createFoundryActor(actorData, actorItemData) {
            const actor = await Actor.create(actorData);
            await actor.createEmbeddedDocuments("Item", actorItemData);
            return actor;
        }

        /**
         * @param {Parser13AMonster.Namespace.FullStatBlock} monsterData
         */
        createFoundryMonsterItemsData(monsterData) {
            const actionData = monsterData.attacks
                .map((attack) => this.transformAttack(attack, false))
                .concat(monsterData.triggeredAttacks.map((attack) => this.transformAttack(attack, true)))
                .concat(monsterData.traits.map((trait) => this.transformTrait(trait, false)))
                .concat(monsterData.nastierTraits.map((trait) => this.transformTrait(trait, true)));

            return actionData;
        }

        /**
         * @param {Parser13AMonster.Namespace.FullStatBlock} monsterData
         */
        createFoundryMonsterData(monsterData) {
            const baseAttrObject = {
                base: 10,
                min: 0,
            };

            let actorData = {};

            actorData.name = monsterData.name;
            actorData.type = "npc";

            let actorAttributes = {};
            actorAttributes.ac = {
                ...this.createAttribute("Number", "Armor Class", monsterData.ac),
                ...baseAttrObject,
            };
            actorAttributes.pd = {
                ...this.createAttribute("Number", "Physical Defense", monsterData.pd),
                ...baseAttrObject,
            };
            actorAttributes.md = {
                ...this.createAttribute("Number", "Mental Defense", monsterData.md),
                ...baseAttrObject,
            };
            actorAttributes.hp = {
                ...this.createAttribute("Number", "Hit Points", monsterData.hp),
                ...baseAttrObject,
                max: parseInt(monsterData.hp),
                temp: 0,
                tempmax: 0,
                automatic: true,
            };
            actorAttributes.init = {
                ...this.createAttribute("Number", "Initiative Modifier", monsterData.initiative),
                ...baseAttrObject,
            };
            actorAttributes.level = {
                ...this.createAttribute("Number", "Level", monsterData.level),
                ...baseAttrObject,
            };

            let actorDetails = {};
            actorDetails.flavor = { value: monsterData.flavor_text };
            actorDetails.role = { value: monsterData.role.toLowerCase() };

            const getSystemSize = (sizeText) => {
                if (!sizeText) {
                    return "normal";
                }

                const multiStrengthMatch = sizeText.match(/^(Double|Triple)-strength/i);
                if (multiStrengthMatch) {
                    return multiStrengthMatch[1].toLowerCase();
                }

                return sizeText.toLowerCase();
            };

            actorDetails.size = {
                value: getSystemSize(monsterData.size),
            };
            actorDetails.type = { value: monsterData.type.toLowerCase() };
            actorDetails.vulnerability = { value: monsterData.vulnerability?.toLowerCase() };

            actorData.system = {
                attributes: actorAttributes,
                details: actorDetails,
            };

            actorData.prototypeToken = {
                name: monsterData.name,
                displayBars: 40,
                prependAdjective: true,
                displayName: 20,
            };

            return actorData;
        }

        async getFullMonster() {
            const monsterText = await this.#promptForMonsterText();

            if (!monsterText) {
                ui.notifications.warn("No monster to parse.");
                return;
            }

            const description = this.#getMonsterDescription(monsterText.descriptionText);

            let monsterData = new Parser13AMonster.Namespace.FullStatBlock(
                description.name,
                description.size,
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

        #getMonsterDescription(descText) {
            const parser = new Parser13AMonster.Namespace.PdfBlockParser(descText);

            return parser.parseDescriptionBlock();
        }

        #getMonsterAttacks(attackText) {
            const parser = new Parser13AMonster.Namespace.PdfBlockParser(attackText);

            return parser.parseAttackBlock();
        }

        #getMonsterTraits(traitText) {
            const parser = new Parser13AMonster.Namespace.PdfBlockParser(traitText);

            return parser.parseTraitBlock();
        }

        #getMonsterNastierTraits(nastierText) {
            const parser = new Parser13AMonster.Namespace.PdfBlockParser(nastierText);

            return parser.parseTraitBlock();
        }

        #getMonsterDefenses(defenseText) {
            const parser = new Parser13AMonster.Namespace.PdfBlockParser(defenseText);

            return parser.parseDefenseBlock();
        }

        async #promptForMonsterText() {
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
}
