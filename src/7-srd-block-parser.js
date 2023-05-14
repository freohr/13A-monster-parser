import { TextHandler } from "./3-text-handler.js";
import { Attack } from "./2-attack.js";
import { Trait } from "./1-trait.js";

export class SrdBlockParser {
  #textHandler;

  constructor(text) {
    this.#textHandler = new TextHandler(text, false);
  }

  static get #levelRegex() {
    return /(?<ordinal>(?<level>\d+)\s*(st|nd|rd|th))/;
  }

  static get #strengthLineRegex() {
    return /(?<size>\S+)? ?(?<ordinal>(?<level>\d+)\s*(st|nd|rd|th)) level (?<role>\S+) (?<type>\S+)/;
  }

  static get #attackStarterRegex() {
    return /^(?<attack_name>.+) — (?<attack_desc>.*)/;
  }

  static get #attackTraitStarterRegex() {
    return /^ (?<trait_name>.+)(?<![RC]): (?<trait_desc>.*)/;
  }

  static get #traitStarterRegex() {
    return /^(?! )(?<trait_name>.+)(?<![RC]): (?<trait_desc>.*)/;
  }

  static get #nastierHeaderRegex() {
    return /^Nastier Specials$/;
  }

  static get #triggeredAttackStarterRegex() {
    return /^\[Special trigger] (?<attack_name>.+)—(?<attack_desc>.*)$/;
  }

  static get #initiativeRegex() {
    return /^Initiative: \+?(?<initiative>.+)$/;
  }

  static get #vulnerabilityRegex() {
    return /^Vulnerability: (?<vulnerability>.+)/;
  }

  static get #initiativeLineIndex() {
    return 11;
  }

  #placeTextAtStartOfBlock(startOfBlockRegex) {
    this.#textHandler.index = SrdBlockParser.#initiativeLineIndex;
    this.#textHandler.advanceIndex();
    if (
      this.#textHandler.currentLine.match(SrdBlockParser.#vulnerabilityRegex)
    ) {
      this.#textHandler.advanceIndex(2);
    } else {
      this.#textHandler.advanceIndex();
    }

    let blockMatch;
    while (
      !(blockMatch = this.#textHandler.currentLine.match(startOfBlockRegex))
    ) {
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

    while (!this.#textHandler.currentLine.match(/^\t/)) {
      descriptionArray.push(this.#textHandler.currentLine);
      this.#textHandler.advanceIndex();
    }

    const descriptionString = descriptionArray
      .filter((s) => s.length > 0)
      .map((s) => s.trim())
      .join(" ");

    const descriptionMatch = descriptionString.match(
      SrdBlockParser.#strengthLineRegex
    );

    if (!descriptionMatch) {
      throw "Bad format for monster description";
    }

    monsterDescription.size = descriptionMatch.groups.size.toLowerCase();
    monsterDescription.level = descriptionMatch.groups.level;
    monsterDescription.levelOrdinal = descriptionMatch.groups.ordinal;
    monsterDescription.role = descriptionMatch.groups.role.toLowerCase();
    monsterDescription.type = descriptionMatch.groups.type.toLowerCase();

    this.#textHandler.advanceIndex(2);

    const initiativeMatch = this.#textHandler.currentLine.match(
      SrdBlockParser.#initiativeRegex
    );
    monsterDescription.initiative = initiativeMatch.groups.initiative;
    this.#textHandler.advanceIndex();

    let vulnerabilityMatch = this.#textHandler.currentLine.match(
      SrdBlockParser.#vulnerabilityRegex
    );
    if (vulnerabilityMatch) {
      monsterDescription.vulnerability =
        vulnerabilityMatch.groups.vulnerability;
    }

    return monsterDescription;
  }

  getMonsterAttacks() {
    // Set up the text handler to the correct line
    this.#placeTextAtStartOfBlock(SrdBlockParser.#attackStarterRegex);

    if (this.#textHandler.atEnd) {
      return;
    }

    // Start parsing attacks
    const attacks = [];
    let attackMatch;
    while (
      (attackMatch = this.#textHandler.currentLine.match(
        SrdBlockParser.#attackStarterRegex
      ))
    ) {
      const currentAttack = new Attack(
        attackMatch.groups.attack_name,
        attackMatch.groups.attack_desc
      );
      this.#textHandler.advanceIndex();

      let traitMatch;
      while (
        (traitMatch = this.#textHandler.currentLine.match(
          SrdBlockParser.#attackTraitStarterRegex
        ))
      ) {
        const currentTrait = new Trait(
          traitMatch.groups.trait_name,
          traitMatch.groups.trait_desc
        );
        currentAttack.traits.push(currentTrait);
        this.#textHandler.advanceIndex();
      }

      attacks.push(currentAttack);
      this.#textHandler.advanceIndex();
    }

    return attacks;
  }

  getMonsterTraits() {
    // Set up the text handler to the correct line
    this.#placeTextAtStartOfBlock(SrdBlockParser.#traitStarterRegex);

    if (this.#textHandler.atEnd) {
      return;
    }

    const traits = [];
    let traitMatch;
    while (
      (traitMatch = this.#textHandler.currentLine.match(
        SrdBlockParser.#traitStarterRegex
      ))
    ) {
      const currentTrait = new Trait(
        traitMatch.groups.trait_name,
        traitMatch.groups.trait_desc
      );
      traits.push(currentTrait);
      this.#textHandler.advanceIndex(2);
    }

    return traits;
  }

  getMonsterNastierSpecials() {
    // Set up the text handler to the correct line
    this.#placeTextAtStartOfBlock(SrdBlockParser.#nastierHeaderRegex);

    if (this.#textHandler.atEnd) {
      return;
    }

    // We're at the header, just to the first trait
    this.#textHandler.advanceIndex(2);

    const traits = [];
    let traitMatch;
    while (
      (traitMatch = this.#textHandler.currentLine.match(
        SrdBlockParser.#traitStarterRegex
      ))
    ) {
      const currentTrait = new Trait(
        traitMatch.groups.trait_name,
        traitMatch.groups.trait_desc
      );
      traits.push(currentTrait);
      this.#textHandler.advanceIndex(2);
    }

    return traits;
  }
}
