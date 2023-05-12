class QuickAddPrompter {
  #quickAddApi;

  static create(quickAddApi) {
    return QuickAddPrompter(quickAddApi);
  }

  constructor(quickAddApi) {
    this.#quickAddApi = quickAddApi;
  }

  #updateQuickAddField(fieldName, fieldContent) {
    // Since we're either creating or updating a field that contains an array in the global QuickAdd object, we can just
    // put everything into an array, flatten it, then filter out the possibility that there wasn't anything in the field yet
    const updatedContent = [
      this.#quickAddApi.variables[fieldName],
      fieldContent,
    ]
      .flat()
      .filter((field) => field !== undefined);
    this.#quickAddApi.variables[fieldName] = updatedContent;

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
      types: ["desc", "attacks", "traits", "triggers", "nastiers", "done"],
    };
    const operationTypes = {
      names: [
        "Initial Parse",
        "Parse & Replace",
        "Parse & Append",
        "Manual Entry",
      ],
      types: ["parse-replace", "parse-replace", "parse-append", "manual-entry"],
    };

    await this.#quickAddApi.infoDialog(
      "What kind of info do you want to enter?"
    );
    const blockType = await this.#quickAddApi.suggester(
      blockTypes.names,
      blockTypes.types
    );
    const blockName = blockTypes.names.at(blockTypes.types.indexOf(blockType));

    if (blockType === "done") {
      // Nothing more to add, we can just return
      return {
        block: blockType,
        operation: "",
      };
    }

    await this.#quickAddApi.infoDialog(
      `How do you want to add ${blockName} to the statblock?`
    );
    const operationType = await this.#quickAddApi.suggester(
      operationTypes.names,
      operationTypes.types
    );

    return {
      block: blockType,
      operation: operationType,
    };
  }

  async getMonsterDescription() {
    const desc = await this.#quickAddApi.wideInputPrompt(
      "Monster Description?"
    );
    const descParser = new BlockParser(desc);

    const monsterDescription = descParser.parseDescriptionBlock();
    this.#quickAddApi.variables = Object.assign(
      this.#quickAddApi.variables,
      monsterDescription
    );

    return BlockWriter.writeDescriptionBlock(monsterDescription);
  }

  async getMonsterActions() {
    const attackText = await this.#quickAddApi.wideInputPrompt(
      "Monster Attacks (including [Special Trigger])?"
    );
    const attackParser = new BlockParser(attackText);

    const parsedAttacks = attackParser.parseAttackBlock();

    const updatedAttacks = {
      actions: this.#updateQuickAddField("actions", parsedAttacks.attacks),
      triggeredActions: this.#updateQuickAddField(
        "triggered_actions",
        parsedAttacks.triggeredAttacks
      ),
    };

    return {
      actions: BlockWriter.writeStandardAttacksBlock(updatedAttacks.actions),
      triggeredActions: BlockWriter.writeTriggeredAttacksBlock(
        updatedAttacks.triggeredActions
      ),
    };
  }

  async getMonsterTraits() {
    const traitText = await this.#quickAddApi.wideInputPrompt(
      "Monster Traits?"
    );
    const traitParser = new BlockParser(traitText);
    const traits = traitParser.parseTraitBlock();

    const updatedTraits = this.#updateQuickAddField("traits", traits);

    return BlockWriter.writeStandardTraitsBlock(updatedTraits);
  }

  async getMonsterTriggeredActions() {
    const attackText = await this.#quickAddApi.wideInputPrompt(
      "Monster Triggered Attacks?"
    );
    const attackParser = new BlockParser(attackText);

    const parsedAttacks = attackParser.parseAttackBlock();
    const triggeredAttacks = [
      ...parsedAttacks.attacks,
      ...parsedAttacks.triggeredAttacks,
    ];
    const updatedTriggeredActions = this.#updateQuickAddField(
      "triggerActions",
      triggeredAttacks
    );

    return BlockWriter.writeTriggeredAttacksBlock(updatedTriggeredActions);
  }

  async getMonsterNastierTraits() {
    const traitText = await this.#quickAddApi.wideInputPrompt(
      "Monster Nastier Specials?"
    );
    const traitParser = new BlockParser(traitText);
    const updatedTraits = this.#updateQuickAddField(
      "nastierTraits",
      traitParser.parseTraitBlock()
    );

    return BlockWriter.writeNastierTraitsBlock(updatedTraits);
  }

  async getMonsterDefenses() {
    const defenses = await this.#quickAddApi.wideInputPrompt(
      "Monster Defenses?"
    );

    const defenseParser = new BlockParser(new TextHandler(defenses));

    const monsterDefenses = defenseParser.parseDefenseBlock();
    this.#quickAddApi.variables = Object.assign(
      this.#quickAddApi.variables,
      monsterDefenses
    );

    return BlockWriter.writeDefenseBlock(monsterDefenses);
  }

  async promptMinimalistParser() {
    return [
      await this.getMonsterDescription(),
      await this.getMonsterActions(),
      await this.getMonsterTraits(),
      await this.getMonsterNastierTraits(),
      await this.getMonsterTriggeredActions(),
      await this.getMonsterDefenses(),
    ].join("\n");
  }
}
