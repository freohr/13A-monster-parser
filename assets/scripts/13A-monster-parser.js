class Parser13AMonster {
    static Namespace = new Parser13AMonster();
    Helpers = class Helpers {
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
    };
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
    };

    Attack = class Attack {
        #name = "";
        #description = "";
        #traits = [];

        constructor(name, description, traits) {
            this.#name = name;
            this.#description = description;
            this.#traits = traits;
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
    };

    TextHandler = class TextHandler {
        #textArray = [];
        #currentIndex = 0;

        constructor(textBlock) {
            if (typeof textBlock === "string") {
                this.#textArray = textBlock
                    .split("\n")
                    .filter((s) => s.length > 0)
                    .map((s) => s.trim());
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

    BlockParser = class BlockParser {
        #textHandler;

        constructor(textBlock) {
            this.#textHandler = new Parser13AMonster.Namespace.TextHandler(
                textBlock
            );
        }

        static get #attackStarterRegex() {
            return /^(?<attack_name>.+)—(?<attack_desc>.*)/;
        }

        static get #traitStarterRegex() {
            return /^(?<trait_name>.+)(?<![RC]): (?<trait_desc>.*)/;
        }

        static get #triggeredAttackStarterRegex() {
            return /^\[Special trigger] (?<attack_name>.+)—(?<attack_desc>.*)$/;
        }

        static get #followupRegex() {
            return /^([^:—]+|[^A-Z].+)$/;
        }

        static get #strengthLineRegex() {
            return /(?<strength>\S+)? ?(?<ordinal>(?<level>\d+)\s*(st|nd|rd|th)) level (?<role>\S+) \[(?<type>\S+)]/;
        }

        static get #initiativeRegex() {
            return /^Initiative: \+?(?<initiative>.+)$/;
        }

        static get #vulnerabilityRegex() {
            return /^Vulnerability: (?<vulnerability>.+)/;
        }

        static get #defenseRegex() {
            return /^(?<name>AC|PD|MD|HP) (?<value>\d+)$/i;
        }

        #getDescription(descStarter) {
            const fullDesc = [descStarter];
            let desc;

            while (
                !this.#textHandler.atEnd &&
                (desc = this.#textHandler.currentLine.match(
                    BlockParser.#followupRegex
                )) !== null
            ) {
                fullDesc.push(this.#textHandler.currentLine);
                this.#textHandler.advanceIndex();
            }

            return fullDesc.join(" ");
        }

        #getTraits() {
            const traits = [];
            let traitMatch;

            while (
                !this.#textHandler.atEnd &&
                (traitMatch = this.#textHandler.currentLine.match(
                    BlockParser.#traitStarterRegex
                )) !== null
            ) {
                this.#textHandler.advanceIndex();

                traits.push(
                    new Parser13AMonster.Namespace.Trait(
                        traitMatch.groups.trait_name,
                        this.#getDescription(traitMatch.groups.trait_desc)
                    )
                );
            }

            return traits;
        }

        #getFullAttack(attackName, attackDesc) {
            return new Parser13AMonster.Namespace.Attack(
                attackName,
                this.#getDescription(attackDesc),
                this.#getTraits()
            );
        }

        parseAttackBlock() {
            const attacks = [],
                triggeredAttacks = [];

            while (!this.#textHandler.atEnd) {
                let startAttackMatch, startTriggerMatch;

                if (
                    (startTriggerMatch = this.#textHandler.currentLine.match(
                        BlockParser.#triggeredAttackStarterRegex
                    ))
                ) {
                    this.#textHandler.advanceIndex();
                    triggeredAttacks.push(
                        this.#getFullAttack(
                            startTriggerMatch.groups.attack_name,
                            startTriggerMatch.groups.attack_desc
                        )
                    );
                } else if (
                    (startAttackMatch = this.#textHandler.currentLine.match(
                        BlockParser.#attackStarterRegex
                    ))
                ) {
                    this.#textHandler.advanceIndex();
                    attacks.push(
                        this.#getFullAttack(
                            startAttackMatch.groups.attack_name,
                            startAttackMatch.groups.attack_desc
                        )
                    );
                }
            }

            return {
                attacks: attacks,
                triggeredAttacks: triggeredAttacks,
            };
        }

        parseTraitBlock() {
            if (this.#textHandler.currentLine.startsWith("Nastier Specials")) {
                this.#textHandler.advanceIndex();
            }
            return this.#getTraits();
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
            monsterDescription.name =
                Parser13AMonster.Namespace.Helpers.stringToPascalCase(
                    this.#textHandler.currentLine
                );
            this.#textHandler.advanceIndex();

            // We consider any text until the monster strength line flavor-text
            const flavorText = [];
            while (
                !this.#textHandler.atEnd &&
                this.#textHandler.currentLine.match(
                    BlockParser.#strengthLineRegex
                ) === null
            ) {
                flavorText.push(this.#textHandler.currentLine);
                this.#textHandler.advanceIndex();
            }
            monsterDescription.flavor_text = flavorText.join(" ");

            // We should be at the monster strength line now
            let strengthMatch;
            if (
                (strengthMatch = this.#textHandler.currentLine.match(
                    BlockParser.#strengthLineRegex
                ))
            ) {
                monsterDescription.size =
                    strengthMatch.groups.strength.toLowerCase();
                monsterDescription.level = strengthMatch.groups.level;
                monsterDescription.levelOrdinal =
                    strengthMatch.groups.ordinal.replace(/ /g, "");
                monsterDescription.type =
                    strengthMatch.groups.type.toLowerCase();

                monsterDescription.role =
                    strengthMatch.groups.role.toLowerCase();
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
                        BlockParser.#initiativeRegex
                    ))
                ) {
                    monsterDescription.initiative = lineMatch.groups.initiative;
                } else if (
                    (lineMatch = this.#textHandler.currentLine.match(
                        BlockParser.#vulnerabilityRegex
                    ))
                ) {
                    monsterDescription.vulnerability =
                        Parser13AMonster.Namespace.Helpers.stringToPascalCase(
                            lineMatch.groups.vulnerability
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
                        BlockParser.#defenseRegex
                    ))
                ) {
                    defenses[defenseMatch.groups.name.toLowerCase()] = parseInt(
                        defenseMatch.groups.value
                    );
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
    };

    QuickAddPrompter = class QuickAddPrompter {
        #quickAddContext;

        constructor(quickAddApi) {
            this.#quickAddContext = quickAddApi;
        }

        #updateQuickAddField(fieldName, fieldContent) {
            // Since we're either creating or updating a field that contains an array in the global QuickAdd object, we can just
            // put everything into an array, flatten it, then filter out the possibility that there wasn't anything in the field yet
            const updatedContent = [
                this.#quickAddContext.variables[fieldName],
                fieldContent,
            ]
                .flat()
                .filter((field) => field !== undefined);
            this.#quickAddContext.variables[fieldName] = updatedContent;

            return updatedContent;
        }

        async suggestBlockToParse() {
            const blockTypes = {
                names: [
                    "a Description",
                    "Attacks",
                    "Traits",
                    "Triggered Attacks",
                    "Nastier Specials",
                    "I'm done",
                ],
                types: [
                    "desc",
                    "attacks",
                    "traits",
                    "triggers",
                    "nastiers",
                    "done",
                ],
            };
            const operationTypes = {
                names: [
                    "Initial Parse",
                    "Parse & Replace",
                    "Parse & Append",
                    "Manual Entry",
                ],
                types: [
                    "parse-replace",
                    "parse-replace",
                    "parse-append",
                    "manual-entry",
                ],
            };

            await this.#quickAddContext.infoDialog(
                "What kind of info do you want to enter?"
            );
            const blockType = await this.#quickAddContext.suggester(
                blockTypes.names,
                blockTypes.types
            );
            const blockName = blockTypes.names.at(
                blockTypes.types.indexOf(blockType)
            );

            if (blockType === "done") {
                // Nothing more to add, we can just return
                return {
                    block: blockType,
                    operation: "",
                };
            }

            await this.#quickAddContext.infoDialog(
                `How do you want to add ${blockName} to the statblock?`
            );
            const operationType = await this.#quickAddContext.suggester(
                operationTypes.names,
                operationTypes.types
            );

            return {
                block: blockType,
                operation: operationType,
            };
        }

        async getMonsterDescription() {
            const desc =
                await this.#quickAddContext.quickAddApi.wideInputPrompt(
                    "Monster Description? (Put the Monster's name on the first line if multi-lines)"
                );
            const descParser = new Parser13AMonster.Namespace.BlockParser(desc);

            const monsterDescription = descParser.parseDescriptionBlock();
            this.#quickAddContext.variables = Object.assign(
                this.#quickAddContext.variables,
                monsterDescription
            );

            return Parser13AMonster.Namespace.BlockWriter.writeDescriptionBlock(
                monsterDescription
            );
        }

        async getMonsterActions() {
            const attackText =
                await this.#quickAddContext.quickAddApi.wideInputPrompt(
                    "Monster Attacks (including [Special Trigger])?"
                );
            const attackParser = new Parser13AMonster.Namespace.BlockParser(
                attackText
            );

            const parsedAttacks = attackParser.parseAttackBlock();

            const updatedAttacks = {
                actions: this.#updateQuickAddField(
                    "actions",
                    parsedAttacks.attacks
                ),
                triggeredActions: this.#updateQuickAddField(
                    "triggered_actions",
                    parsedAttacks.triggeredAttacks
                ),
            };

            // We don't return the parsed triggered attacks right now, but we store them for later
            return Parser13AMonster.Namespace.BlockWriter.writeStandardAttacksBlock(
                updatedAttacks.actions
            );
        }

        async getMonsterTraits() {
            const traitText =
                await this.#quickAddContext.quickAddApi.wideInputPrompt(
                    "Monster Traits?"
                );
            const traitParser = new Parser13AMonster.Namespace.BlockParser(
                traitText
            );
            const traits = traitParser.parseTraitBlock();

            const updatedTraits = this.#updateQuickAddField("traits", traits);

            return Parser13AMonster.Namespace.BlockWriter.writeStandardTraitsBlock(
                updatedTraits
            );
        }

        async getMonsterTriggeredActions() {
            const attackText =
                await this.#quickAddContext.quickAddApi.wideInputPrompt(
                    "Monster Triggered Attacks?"
                );
            const attackParser = new Parser13AMonster.Namespace.BlockParser(
                attackText
            );

            const parsedAttacks = attackParser.parseAttackBlock();
            const triggeredAttacks = [
                ...parsedAttacks.attacks,
                ...parsedAttacks.triggeredAttacks,
            ];
            const updatedTriggeredActions = this.#updateQuickAddField(
                "triggerActions",
                triggeredAttacks
            );

            return Parser13AMonster.Namespace.BlockWriter.writeTriggeredAttacksBlock(
                updatedTriggeredActions
            );
        }

        async getMonsterNastierTraits() {
            const traitText =
                await this.#quickAddContext.quickAddApi.wideInputPrompt(
                    'Monster Nastier Specials? (remove "Nastier Specials" header if possible)'
                );
            const traitParser = new Parser13AMonster.Namespace.BlockParser(
                traitText
            );
            const updatedTraits = this.#updateQuickAddField(
                "nastierTraits",
                traitParser.parseTraitBlock()
            );

            return Parser13AMonster.Namespace.BlockWriter.writeNastierTraitsBlock(
                updatedTraits
            );
        }

        async getMonsterDefenses() {
            const defenses =
                await this.#quickAddContext.quickAddApi.wideInputPrompt(
                    "Monster Defenses?"
                );

            const defenseParser = new Parser13AMonster.Namespace.BlockParser(
                defenses
            );

            const monsterDefenses = defenseParser.parseDefenseBlock();
            this.#quickAddContext.variables = Object.assign(
                this.#quickAddContext.variables,
                monsterDefenses
            );

            return Parser13AMonster.Namespace.BlockWriter.writeDefenseBlock(
                monsterDefenses
            );
        }

        async promptMinimalistParser() {
            return [
                await this.getMonsterDescription(),
                (await this.getMonsterActions()).actions,
                await this.getMonsterTraits(),
                await this.getMonsterNastierTraits(),
                await this.getMonsterTriggeredActions(),
                await this.getMonsterDefenses(),
            ].join("\n");
        }
    };
}
