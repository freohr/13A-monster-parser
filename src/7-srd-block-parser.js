import { TextHandler } from "./3-text-handler.js";

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
    return /^(?<trait_name>.+)(?<![RC]): (?<trait_desc>.*)/;
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
}
