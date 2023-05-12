import { Trait } from "./1-trait.js";
import { Attack } from "./2-attack.js";
import { helpers } from "./0-helpers.js";
import { TextHandler } from "./3-text-handler.js";

export class BlockParser {
  #textHandler;

  // Static Factory to enable creating Objects with CustomJS plugin
  static create(textHandler) {
    return new BlockParser(textHandler);
  }

  constructor(textBlock) {
    this.#textHandler = new TextHandler(textBlock);
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
        new Trait(
          traitMatch.groups.trait_name,
          this.#getDescription(traitMatch.groups.trait_desc)
        )
      );
    }

    return traits;
  }

  #getFullAttack(attackName, attackDesc) {
    return new Attack(
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
    monsterDescription.name = helpers.stringToPascalCase(
      this.#textHandler.currentLine
    );
    this.#textHandler.advanceIndex();

    // We consider any text until the monster strength line flavor-text
    const flavorText = [];
    while (
      !this.#textHandler.atEnd &&
      this.#textHandler.currentLine.match(BlockParser.#strengthLineRegex) ===
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
        BlockParser.#strengthLineRegex
      ))
    ) {
      monsterDescription.size = strengthMatch.groups.strength.toLowerCase();
      monsterDescription.level = strengthMatch.groups.level;
      monsterDescription.levelOrdinal = strengthMatch.groups.ordinal.replace(
        / /g,
        ""
      );
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
          BlockParser.#initiativeRegex
        ))
      ) {
        monsterDescription.initiative = lineMatch.groups.initiative;
      } else if (
        (lineMatch = this.#textHandler.currentLine.match(
          BlockParser.#vulnerabilityRegex
        ))
      ) {
        monsterDescription.vulnerability = helpers.stringToPascalCase(
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
}
