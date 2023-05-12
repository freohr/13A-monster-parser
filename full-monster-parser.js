import { BlockParser } from "./4-block-parser.js";
import { BlockWriter } from "./5-block-writer.js";
import { TextHandler } from "./3-text-handler.js";

// Basic tests below
const quickAddMock = {
  variables: {},
};

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

const descriptionParser = new BlockParser(multiLineDesc);
const parsedDesc = descriptionParser.parseDescriptionBlock();
console.log(BlockWriter.writeDescriptionBlock(parsedDesc));

// Test on Attacks
const multiLineAttacks = `Flaming greatsword +13 vs. AC (2 attacks)—35 damage
Natural even hit or miss: The target also takes 10 ongoing fire damage.
Flaming greatsword +13 vs. AC (2 attacks)—35 damage
Natural even hit or miss: The target also takes 10 ongoing fire damage.
R: Flaming black-iron javelin +11 vs. AC—40 damage
Natural even hit or miss: The target also takes 10 ongoing fire damage.`;

const attackParser = new BlockParser(multiLineAttacks);
const parsedAttacks = attackParser.parseAttackBlock();
console.log(
  BlockWriter.writeAttacksBlock(
    BlockWriter.attackHeaderLine,
    parsedAttacks.attacks
  )
);

// Test on Traits
const multiLineTraits = `Fiery escalator: The fire giant adds the escalation die to its attacks
against targets taking ongoing fire damage.
Resist fire 16+: When a fire attack targets this creature, the
attacker must roll a natural 16+ on the attack roll, or it only
deals half damage.`;

const traitParser = new BlockParser(multiLineTraits);
const parsedTraits = traitParser.parseTraitBlock();
console.log(
  BlockWriter.writeTraitsBlock(BlockWriter.traitsHeaderLine, parsedTraits)
);

// Test on Nastier Traits
const multiLineNastierTraits = `Burning blood: When a fire giant becomes staggered, it deals 10
ongoing fire damage to each enemy engaged with it.
Strength of giants: Twice per battle, the giant can make a slam
attack as a quick action (once per round).`;

const nastierTraitParser = new BlockParser(multiLineNastierTraits);
const parsedNastierTraits = nastierTraitParser.parseTraitBlock();
console.log(
  BlockWriter.writeTraitsBlock(
    BlockWriter.nastiersHeaderLine,
    parsedNastierTraits
  )
);

// Test on Triggered Attacks
const multiLineTriggerAttacks = `Slam +12 vs. PD (one enemy smaller than it)—10 damage,
the target pops free from the giant, and the target loses its
next move action`;

const triggeredAttackParser = new BlockParser(multiLineTriggerAttacks);
const parsedTriggeredAttacks = triggeredAttackParser.parseAttackBlock();
console.log(
  BlockWriter.writeAttacksBlock(
    BlockWriter.triggersHeaderLine,
    parsedTriggeredAttacks.attacks
  )
);

// Test on Defenses
const multilineDefenses = `AC 25
PD 21\t\t
 HP 285
MD 17`;

const defenseParser = new BlockParser(multilineDefenses);
const parsedDefenses = defenseParser.parseDefenseBlock();
console.log(BlockWriter.writeDefenseBlock(parsedDefenses));

console.log("hello");
