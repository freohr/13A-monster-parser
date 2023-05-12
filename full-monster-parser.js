import {BlockParser} from "./4-block-parser.js";
import {BlockWriter} from "./5-block-writer.js";
import {TextHandler} from "./3-text-handler.js";

/*
function createMonsterPrompter(quickAddApi) {
    return {
        quickAddApi: quickAddApi,
        async suggestBlockToParse() {
            const blockTypes = {
                names: ["a Description", "Attacks", "Traits", "Triggered Attacks", "Nastier Specials", "I'm done"],
                types: ["desc", "attacks", "traits", "triggers", "nastiers", "done"]
            }
            const operationTypes = {
                names: ["Initial Parse", "Parse & Replace", "Parse & Append", "Manual Entry"],
                types: ["parse-replace", "parse-replace", "parse-append", "manual-entry"]
            }

            // First we ask the user what kind of block they want to enter
            if (!iKnowWhatImDoing) {
                await this.quickAddApi.infoDialog("What kind of info do you want to manage?");
            }
            const blockType = await this.quickAddApi.suggester(blockTypes.names, blockTypes.types);
            const blockName = blockTypes.names.at(blockTypes.types.indexOf(blockType));

            if (blockType === "done") {
                // Nothing more to add, we can just return
                return {
                    block: blockType,
                    operation: ""
                };
            }

            // Then, how they want to enter it
            if (!iKnowWhatImDoing) {
                await this.quickAddApi.infoDialog(`How do you want to add ${blockName} to the statblock?`);
            }
            const operationType = await this.quickAddApi.suggester(operationTypes.names, operationTypes.types);

            return {
                block: blockType,
                operation: operationType
            };
        },
        async getMonsterDescription() {
            const desc = await this.quickAddApi.wideInputPrompt("Monster Description?");
            const descParser = createBlockParser(createTextHandler(desc));
            const descWriter = createBlockWriter(this.quickAddApi);
            descWriter.writeDescriptionBlock(descParser.parseDescriptionBlock());
        },
        async getMonsterAttacks() {
            const attacks = await this.quickAddApi.wideInputPrompt("Monster Attacks?");
            const attackParser = createBlockParser(createTextHandler(attacks));
            const attackWriter = createBlockWriter(this.quickAddApi);

            const parsedAttacks = attackParser.parseAttackBlock();
            attackWriter.writeAttackBlock(attackWriter.attackHeaderLine, parsedAttacks.attacks);
            attackWriter.writeAttackBlock(attackWriter.triggersHeaderLine, parsedAttacks.triggeredAttacks);
        },
        async getMonsterTraits() {
            const traits = await this.quickAddApi.wideInputPrompt("Monster Traits?");

            const traitParser = createBlockParser(createTextHandler(traits));
            const traitWriter = createBlockWriter(this.quickAddApi);

            traitWriter.writeTraitsBlock(traitWriter.traitsHeaderLine, traitParser.getTraits());
        },
        async getMonsterTriggerAttacks() {
            const attacks = await this.quickAddApi.wideInputPrompt("Monster Triggered Attacks?");
            const attackParser = createBlockParser(createTextHandler(attacks));
            const attackWriter = createBlockWriter(this.quickAddApi);

            const parsedAttacks = attackParser.parseAttackBlock();

            if (!isEmpty(this.quickAddApi.variables.triggerActions)) {
                attackWriter.appendAttacksToBlock(attackWriter.triggersHeaderLine, parsedAttacks.attacks);
                attackWriter.appendAttacksToBlock(attackWriter.triggersHeaderLine, parsedAttacks.triggeredAttacks);
            } else {
                attackWriter.writeAttackBlock(attackWriter.triggersHeaderLine, parsedAttacks.attacks);
                attackWriter.appendAttacksToBlock(attackWriter.triggersHeaderLine, parsedAttacks.triggeredAttacks);
            }
        },
        async getMonsterNastierTraits() {
            const traits = await this.quickAddApi.wideInputPrompt("Monster Nastier Specials?");

            const traitParser = createBlockParser(createTextHandler(traits));
            const traitWriter = createBlockWriter(this.quickAddApi);

            traitWriter.writeTraitsBlock(traitWriter.nastiersHeaderLine, traitParser.getTraits());
        },
        async getMonsterDefenses() {
            const defenses = await this.quickAddApi.wideInputPrompt("Monster Defenses?");

            const defenseParser = createBlockParser(createTextHandler(defenses));
            const defenseWriter = createBlockWriter(this.quickAddApi);

            // ToDo: Add parser and writer for Defenses (AC, PD, MD, HP)
        },
        async promptMinimalistParser() {
            await this.getMonsterDescription();
            await this.getMonsterAttacks();
            await this.getMonsterTraits();
            await this.getMonsterNastierTraits();
            await this.getMonsterTriggerAttacks();
            // await this.getMonsterDefenses();
        }
    }
}
*/
// Basic tests below
const quickAddMock = {
    variables: {}
}

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

const descriptionParser = new BlockParser(new TextHandler(multiLineDesc));
const parsedDesc = descriptionParser.parseDescriptionBlock();
console.log(BlockWriter.writeDescriptionBlock(parsedDesc));

// Test on Attacks
const multiLineAttacks = `Flaming greatsword +13 vs. AC (2 attacks)—35 damage
Natural even hit or miss: The target also takes 10 ongoing fire damage.
R: Flaming black-iron javelin +11 vs. AC—40 damage
Natural even hit or miss: The target also takes 10 ongoing fire damage.`;

const attackParser = new BlockParser(new TextHandler(multiLineAttacks))
const parsedAttacks = attackParser.parseAttackBlock();
console.log(BlockWriter.writeAttacksBlock(BlockWriter.attackHeaderLine, parsedAttacks.attacks));

// Test on Traits
const multiLineTraits = `Fiery escalator: The fire giant adds the escalation die to its attacks
against targets taking ongoing fire damage.
Resist fire 16+: When a fire attack targets this creature, the
attacker must roll a natural 16+ on the attack roll, or it only
deals half damage.`;

const traitParser = new BlockParser(new TextHandler(multiLineTraits))
const parsedTraits = traitParser.parseTraitBlock();
console.log(BlockWriter.writeTraitsBlock(BlockWriter.traitsHeaderLine, parsedTraits))

// Test on Nastier Traits
const multiLineNastierTraits = `Burning blood: When a fire giant becomes staggered, it deals 10
ongoing fire damage to each enemy engaged with it.
Strength of giants: Twice per battle, the giant can make a slam
attack as a quick action (once per round).`;

const nastierTraitParser = new BlockParser(new TextHandler(multiLineNastierTraits))
const parsedNastierTraits = nastierTraitParser.parseTraitBlock();
console.log(BlockWriter.writeTraitsBlock(BlockWriter.nastiersHeaderLine, parsedNastierTraits))

// Test on Triggered Attacks
const multiLineTriggerAttacks = `Slam +12 vs. PD (one enemy smaller than it)—10 damage,
the target pops free from the giant, and the target loses its
next move action`;

const triggeredAttackParser = new BlockParser(new TextHandler(multiLineTriggerAttacks))
const parsedTriggeredAttacks = triggeredAttackParser.parseAttackBlock();
console.log(BlockWriter.writeAttacksBlock(BlockWriter.triggersHeaderLine, parsedTriggeredAttacks.attacks));

// Test on Defenses
const multilineDefenses = `AC 25
PD 21\t\t
 HP 285
MD 17`;

const defenseParser = new BlockParser(new TextHandler(multilineDefenses))
const parsedDefenses = defenseParser.parseDefenseBlock();
console.log(BlockWriter.writeDefenseBlock(parsedDefenses));

console.log("hello");
