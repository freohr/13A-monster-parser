let iKnowWhatImDoing = false;

function stringToPascalCase(string) {
    const allWords = string.split(' ');
    const capitalizedWords = allWords.map(s =>
        s.replace(/(\w)(\w*)/g,
            (g0, g1, g2) => g1.toUpperCase() + g2.toLowerCase())
    );

    return capitalizedWords.join(' ');
}

function isEmpty(stuff) {
    if (stuff === undefined) return true;
    if (Array.isArray(stuff) && stuff.length === 0) return true;
    if (typeof stuff === "string" && stuff.length === 0) return true;
    return Object.entries(stuff).length === 0;
}

function createTrait(name, desc) {
    return {
        name: name,
        desc: desc
    };
}

function createAttack(name, desc, traits) {
    return {
        name: name,
        desc: desc,
        traits: traits
    };
}

function createTextHandler(textBlock) {
    return {
        textArray: textBlock.split('\n').filter(s => s.length > 0).map(s => s.trim()),
        currentIndex: 0,
        reset: function () {
            this.textArray = [];
            this.currentIndex = 0;
        },
        atEnd() {
            return this.currentIndex >= this.textArray.length;
        },
        currentLine() {
            return this.textArray[this.currentIndex];
        },
        index() {
            return this.currentIndex;
        },
        setIndex(i) {
            this.currentIndex = i;
        },
        advanceIndex(i = 1) {
            this.currentIndex += i;
        }
    }
}

function createBlockParser(textHandler) {
    return {
        // Internal text block handler
        textHandler: textHandler,

        // Regex to parse a statblock
        attackStarterRegex: /^(?<attack_name>.+)—(?<attack_desc>.*)/,
        traitStarterRegex: /^(?<trait_name>.+)(?<![RC]): (?<trait_desc>.*)/,
        triggeredAttackStarterRegex: /^\[Special trigger] (?<attack_name>.+)—(?<attack_desc>.*)$/,
        followupRegex: /^([^:—]+|[^A-Z].+)$/,
        strengthLineRegex: /(?<strength>\S+)? ?(?<ordinal>(?<level>\d+)\s*(st|nd|rd|th)) level (?<role>\S+) \[(?<type>\S+)]/,
        initiativeRegex: /^Initiative: \+?(?<initiative>.+)$/,
        vulnerabilityRegex: /^Vulnerability: (?<vulnerability>.+)/,

        // Creating internal items ready to be written to the statblock YAML
        getDesc(descStarter) {
            const fullDesc = [descStarter];
            let desc;

            while (!this.textHandler.atEnd() && (desc = this.textHandler.currentLine().match(this.followupRegex)) !== null) {
                fullDesc.push(this.textHandler.currentLine());
                this.textHandler.advanceIndex();
            }

            return fullDesc.join(' ');
        },
        getTraits() {
            const traits = [];
            let traitMatch;

            while (!this.textHandler.atEnd() && (traitMatch = this.textHandler.currentLine().match(this.traitStarterRegex)) !== null) {
                this.textHandler.advanceIndex();
                traits.push(createTrait(traitMatch.groups.trait_name, this.getDesc(traitMatch.groups.trait_desc)));
            }

            return traits;
        },
        getFullAttack(attackName, attackDesc) {
            return createAttack(attackName, this.getDesc(attackDesc), this.getTraits());
        },

        // Parsing blocks imported from 13th Age books
        parseAttackBlock() {
            const attacks = [], triggeredAttacks = [];

            while (!this.textHandler.atEnd()) {
                let startAttackMatch, startTriggerMatch;

                if ((startTriggerMatch = this.textHandler.currentLine().match(this.triggeredAttackStarterRegex))) {
                    this.textHandler.advanceIndex();
                    triggeredAttacks.push(this.getFullAttack(startTriggerMatch.groups.attack_name, startTriggerMatch.groups.attack_desc));
                } else if ((startAttackMatch = this.textHandler.currentLine().match(this.attackStarterRegex))) {
                    this.textHandler.advanceIndex();
                    attacks.push(this.getFullAttack(startAttackMatch.groups.attack_name, startAttackMatch.groups.attack_desc));
                }
            }

            return {
                "attacks": attacks,
                "triggeredAttacks": triggeredAttacks
            };
        },
        parseTraitBlock() {
            return this.getTraits();
        },
        parseDescriptionBlock() {
            const monsterDescription = {
                name: "",
                flavorText: "",
                strength: "",
                level: "",
                levelOrdinal: "",
                role: "",
                type: "",
                initiative: "",
                vulnerabilities: ""
            }

            // First line is the monster name
            monsterDescription.name = stringToPascalCase(this.textHandler.currentLine());
            this.textHandler.advanceIndex();

            // We consider any text until the monster strength line flavor-text
            const flavorText = [];
            while (!this.textHandler.atEnd() && (this.textHandler.currentLine().match(this.strengthLineRegex) === null)) {
                flavorText.push(this.textHandler.currentLine());
                this.textHandler.advanceIndex();
            }
            monsterDescription.flavorText = flavorText.join(' ');

            // We should be at the monster strength line now
            let strengthMatch;
            if ((strengthMatch = this.textHandler.currentLine().match(this.strengthLineRegex))) {
                // Expected RegEx : /(?<strength>[^\s]+) (?<ordinal>(?<level>\d+)(st|nd|rd|th)) level (?<role>[^\s]+) \[(?<type>[^\s]+)]/;
                monsterDescription.strength = strengthMatch.groups.strength.toLowerCase();
                monsterDescription.level = strengthMatch.groups.level;
                monsterDescription.levelOrdinal = strengthMatch.groups.ordinal.replace(/ /g, '');
                monsterDescription.role = strengthMatch.groups.role.toLowerCase();
                monsterDescription.type = strengthMatch.groups.type.toLowerCase();
                this.textHandler.advanceIndex();
            } else {
                throw "Bad monster description block format";
            }

            while (!this.textHandler.atEnd()) {
                // After that, there should only be Init and Vulnerabilities left, we don't need to do it in order
                let lineMatch;
                if ((lineMatch = this.textHandler.currentLine().match(this.initiativeRegex))) {
                    monsterDescription.initiative = lineMatch.groups.initiative;
                } else if ((lineMatch = this.textHandler.currentLine().match(this.vulnerabilityRegex))) {
                    monsterDescription.vulnerabilities = stringToPascalCase(lineMatch.groups.vulnerability);
                }
                this.textHandler.advanceIndex();
            }

            return monsterDescription;
        }
    }
}

function createBlockWriter(quickAddFile) {
    return {
        quickAddFile: quickAddFile,

        addIndentation: (string) => {
            return `      ${string}`;
        },
        // 13A Statblock specific formats
        attackHeaderLine: `actions:`,
        traitsHeaderLine: `traits:`,
        attackTraitsHeaderLine() { return this.addIndentation(this.traitsHeaderLine) },
        triggersHeaderLine: `triggered_actions:`,
        nastiersHeaderLine: `nastier_traits:`,

        // internal helpers
        noIndentNameLine: (name) => `    - name: \"${name}\"`,
        noIndentDescLine: (desc) => `      desc: \"${desc}\"`,
        attackTraitNameLine(name) { return this.addIndentation(this.noIndentNameLine(name)) },
        attackTraitDescLine(desc) { return this.addIndentation(this.noIndentDescLine(desc)) },

        // YAML Writer
        createAttackLine(attack) {
            const attackLine = [];
            attackLine.push(this.noIndentNameLine(attack.name), this.noIndentDescLine(attack.desc));

            if (attack.traits && Array.isArray(attack.traits) && attack.traits.length > 0) {
                attackLine.push(this.attackTraitsHeaderLine())
                attack.traits.forEach(trait => attackLine.push(this.attackTraitNameLine(trait.name), this.attackTraitDescLine(trait.desc)))
            }

            return attackLine.join('\n');
        },
        writeDescriptionBlock(descriptionBlock) {
            const descriptionYAMLArray = [];
            const pushTrait = (traitName, traitValue) => {
                this.quickAddFile.variables[traitName] = traitValue;
                descriptionYAMLArray.push(`${traitName}: ${traitValue}`);
            }

            pushTrait("name", descriptionBlock.name);
            pushTrait("flavor_text", descriptionBlock.flavorText);
            pushTrait("size", descriptionBlock.strength);
            pushTrait("role", descriptionBlock.role);
            pushTrait("level", descriptionBlock.level);
            pushTrait("levelOrdinal", descriptionBlock.levelOrdinal);
            pushTrait("type", descriptionBlock.type);
            pushTrait("initiative", descriptionBlock.initiative);
            pushTrait("vulnerability", descriptionBlock.vulnerabilities);

            this.quickAddFile.variables.monsterDescription = descriptionYAMLArray.join('\n');
        },
        writeAttackBlock(attackHeader, attacks) {
            const attackYAMLArray = [attackHeader];

            attacks.forEach(attack => attackYAMLArray.push(this.createAttackLine(attack)));

            if (attackHeader.startsWith("actions")) {
                this.quickAddFile.variables.actions = attackYAMLArray.join('\n');
            } else if (attackHeader.startsWith("trigger")) {
                this.quickAddFile.variables.triggerActions = attackYAMLArray.join('\n');
            }
        },
        appendAttacksToBlock(attackHeader, attacks) {
            const flatAttackArray = [attacks].flat();

            const targetBlock =
                attackHeader.startsWith("actions") ? "actions" :
                    attackHeader.startsWith("trigger") ? "triggerActions" :
                        undefined;

            const attackYAMLArray = [this.quickAddFile.variables[targetBlock], flatAttackArray.map(attack => this.createAttackLine(attack))].flat();

            this.quickAddFile.variables[targetBlock] = attackYAMLArray.join('\n');
        },
        writeTraitsBlock(traitHeader, traits) {
            const traitsYAML = []

            traitsYAML.push(traitHeader);
            traits.forEach(trait => {
                traitsYAML.push(this.noIndentNameLine(trait.name), this.noIndentDescLine(trait.desc));
            });

            const traitType = traitHeader.startsWith("trait") ? "traits" :
                traitHeader.startsWith("nastier") ? "nastierTraits" : "";

            this.quickAddFile.variables[traitType] = traitsYAML.join('\n');
        },
        appendTraitToBlock(traitHeader, trait) {
            const traitType = traitHeader.startsWith("trait") ? "traits" :
                traitHeader.startsWith("nastier") ? "nastierTraits" : "";

            const newTraitArray = [this.quickAddFile.variables[traitType], this.noIndentNameLine(trait.name), this.noIndentDescLine(trait.desc)];

            this.quickAddFile.variables[traitType] = newTraitArray.join('\n');
        }
    }
}



// Basic tests below
const quickAddMock = {
    variables: {}
}
const monsterWriter = createBlockWriter(quickAddMock);

// Test on monster description
const multiLineDesc = `Fire Giant
Fire giants are some of the
most powerful mortal beings
to walk the land, and they
know it. They are not merely
warlords and conquerors but also
planners and builders. For about a
century, they have been building great
works high in the mountains. Their seers
say that a war that will destroy all is on its
way. With no hope of survival, fire giants are
not much concerned about whose side they will
fight on, so when the morning of battle comes, they
will fight on the side of those who have bribed them
the best.
Large 8th level wrecker [giant]
Initiative: +12
Vulnerability: cold, thunder, acid`;

const descriptionParser = createBlockParser(createTextHandler(multiLineDesc));
const parsedDesc = descriptionParser.parseDescriptionBlock();
monsterWriter.writeDescriptionBlock(parsedDesc);

// Test on Attacks
const multiLineAttacks = `Flaming greatsword +13 vs. AC (2 attacks)—35 damage
Natural even hit or miss: The target also takes 10 ongoing fire damage.
R: Flaming black-iron javelin +11 vs. AC—40 damage
Natural even hit or miss: The target also takes 10 ongoing fire damage.`;

const attackParser = createBlockParser(createTextHandler(multiLineAttacks))
const parsedAttacks = attackParser.parseAttackBlock();
monsterWriter.writeAttackBlock(monsterWriter.attackHeaderLine, parsedAttacks.attacks);

// Test on Traits
const multiLineTraits = `Fiery escalator: The fire giant adds the escalation die to its attacks
against targets taking ongoing fire damage.
Resist fire 16+: When a fire attack targets this creature, the
attacker must roll a natural 16+ on the attack roll, or it only
deals half damage.`;

const traitParser = createBlockParser(createTextHandler(multiLineTraits))
const parsedTraits = traitParser.parseTraitBlock();
monsterWriter.writeTraitsBlock(monsterWriter.traitsHeaderLine, parsedTraits);

// Test on Nastier Traits
const multiLineNastierTraits = `Burning blood: When a fire giant becomes staggered, it deals 10
ongoing fire damage to each enemy engaged with it.
Strength of giants: Twice per battle, the giant can make a slam
attack as a quick action (once per round).`;

const nastierTraitParser = createBlockParser(createTextHandler(multiLineNastierTraits))
const parsedNastierTraits = nastierTraitParser.parseTraitBlock();
monsterWriter.writeTraitsBlock(monsterWriter.nastiersHeaderLine, parsedNastierTraits)

// Test on Triggered Attacks
const multiLineTriggerAttacks = `Slam +12 vs. PD (one enemy smaller than it)—10 damage,
the target pops free from the giant, and the target loses its
next move action`;

const triggeredAttackParser = createBlockParser(createTextHandler(multiLineTriggerAttacks))
const parsedTriggeredAttacks = triggeredAttackParser.parseAttackBlock();
monsterWriter.writeAttackBlock(monsterWriter.triggersHeaderLine, parsedTriggeredAttacks.attacks);

console.log("hello");
