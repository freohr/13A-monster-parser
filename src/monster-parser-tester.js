import { BlockParser } from "./4-block-parser.js";
import { BlockWriter } from "./5-block-writer.js";
import { TextHandler } from "./3-text-handler.js";
import { SrdBlockParser } from "./7-srd-block-parser.js";

// Basic tests below
/*
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

*/

// Test on SRD output

/* --- Hoardsong Dragon --- */
// Vulnerability in Desc
// - Attacks with traits
// - Traits
// - Nastier Specials
// - A trait with a triggered Attack
const dragonSrdText = `Hoardsong Dragon (Red)

Large

9th level

Spoiler

Dragon
\t

Initiative: +13
Vulnerability: cold

Fangs and claws +14 vs. AC (3 attacks) — 30 damage
 Natural 16+: The target takes 15 extra damage from a precise strike.

C: Hoardsong +14 vs. MD (one nearby enemy in the dragon’s lair) — 10 psychic damage, and the target is confused (save ends)
 Limited use: 2/battle, as a quick action (once per round).

C: Precise breath +14 vs. PD (1d4 + 1 nearby enemies, or one enemy) — 20 fire damage, and 10 ongoing fire damage; OR 80 fire damage, and 20 ongoing fire damage if used against a single enemy
 Natural 18+: If the breath targeted multiple enemies, the target takes 20 ongoing fire damage instead of 10. If the breath targeted a single enemy, the target takes 40 ongoing fire damage instead of 20.

Intermittent breath: A hoardsong dragon can use precise breath 1d4 times per battle, but never two turns in a row.

Known to an ounce: The dragon knows where every treasure in its hoard is located, allowing it to detect any movement or shifting of the coins and valuables. While in its lair with its hoard, the hoardsong dragon is immune to invisibility and ignores illusions, and creatures attempting to hide from it take a –5 penalty to their checks.

Resist fire 16+: When a fire attack targets this creature, the attacker must roll a natural 16+ on the attack roll or it only deals half damage.

Nastier Specials

Hoard minions: The dragon’s connection to its hoard is so strong that it has some control over the souls of those it previously killed who owned the treasures. Once per round as a quick action, the hoardsong dragon can summon 1d4 hoard spirits that take form by surrounding themselves in coins, wear empty suits of armor, etc., and defend the dragon’s hoard. Roll initiative for the minions once and use that count for all additional minions.

The call of the hoard: The connection of a hoardsong dragon to its hoard imparts the dragon’s magic upon the hoard. Before battle, if the PCs are able to see the hoard while the dragon speaks to them, each PC that can hear the dragon must roll a Wisdom check. On a result of 24 or less, that PC is charmed as per the charm person spell and considers the dragon a friend. On a result of 25–29, the PC is lulled by the dragon’s words and the sight of the hoard; if combat occurs, the PC will be stunned during their first round. The dragon will make a suggestion to charmed PCs to leave and bring it more treasure for its hoard (while it prepares surprises for their return). Charmed PCs won’t attack the dragon, but can make a normal save each round in battle to break the charm effect (or every day outside of combat).
\t

AC

(In Lair)

PD

MD

HP
\t

25

26

24

18

360`;
const dragonSrdParser = new SrdBlockParser(dragonSrdText);

console.log("\n/* --- Hoardsong Dragon --- */")
console.log(dragonSrdParser.getFullMonster());

/* --- Fire Giant --- */
// - Attacks with traits
// - Traits
// - Nastier Specials
// - A trait with a triggered Attack
const fireGiantSrdText = `Fire Giant

Large

8th level

Wrecker

Giant
\t

Initiative: +12
Vulnerability: cold

Flaming greatsword +13 vs. AC (2 attacks) — 35 damage
 Natural even hit or miss: The target also takes 10 ongoing fire damage.

R: Flaming black-iron javelin +11 vs. AC — 40 damage
 Natural even hit or miss: The target also takes 10 ongoing fire damage.

Fiery escalator: The fire giant adds the escalation die to its attacks against targets taking ongoing fire damage.

Resist fire 16+: When a fire attack targets this creature, the attacker must roll a natural 16+ on the attack roll or it only deals half damage.

Nastier Specials

Burning blood: When a fire giant becomes staggered, it deals 10 ongoing fire damage to each enemy engaged with it.

Strength of giants: Twice per battle, the giant can make a slam attack as a quick action (once per round).

Slam +12 vs. PD (one enemy smaller than it) — 10 damage, the target pops free from the giant, and the target loses its next move action
\t

AC

PD

MD

HP
\t

25

21

17

285`;
const fireGiantSrdParser = new SrdBlockParser(fireGiantSrdText);

console.log("\n/* --- Fire Giant --- */")
console.log(fireGiantSrdParser.getFullMonster());

/* --- Greater Hoardsong Dragon --- */
// - Attacks with traits
// - Traits
// - Nastier Specials
// - A specificied defense
const greatDragonSrdText = `Greathoard Elder (Red)

Huge

11th level

Wrecker

Dragon
\t

Initiative: +14

Fangs, claws, and wings +16 vs. AC (2 attacks) — 90 damage
 Natural 14+: The target takes 12 extra damage from a wing buffet.
 Natural 16+: The target takes 20 extra damage from a claw strike.
 Natural 19+: The dragon can make a treasury master attack as a free action.

C: Treasury master +16 vs. MD (the nearby non-confused enemy with the most true magic items) — 30 psychic damage, and the target is confused (save ends)
 Limited use: 2/battle, as a quick action (once per round).

C: Precise breath +16 vs. PD (1d4 + 1 nearby enemies, or one enemy) — 50 fire damage, and 15 ongoing fire damage; OR 170 fire damage, and 30 ongoing fire damage if used against a single enemy
 Natural 18+: If the breath targeted multiple enemies, the target takes 25 ongoing fire damage instead of 15. If the breath targeted a single enemy, the target takes 60 ongoing fire damage instead of 30.

Call of the hoard: When an enemy is engaged with the greathoard elder in its lair at the start of its turn, it must roll a normal save; on a failure, it hurls one random non-armor true magic item into the dragon’s hoard (adjust stats accordingly). The item is unavailable until the end of the battle. If the dragon flees or is defeated, lost magic items can be retrieved.

Greathoard rage: When an enemy scores a critical hit against the greathoard elder while it’s in its lair, the elder can reroll one of its missed attacks each round (cumulative) as its hoard sings a song of carnage to it.

Intermittent breath: A greathoard elder can use precise breath 1d4 + 1 times per battle, but never two turns in a row.

Resist fire 16+: When a fire attack targets this creature, the attacker must roll a natural 16+ on the attack roll or it only deals half damage.

Nastier Specials

Iconic comparisons: The dragon is enamored/envious of the icons with the greatest hoards. For each PC who has at least one positive or conflicted relationship point with one or more of those icons, the greathoard elder gains an extra use of treasury master this battle.
\t

AC

(In Lair)

PD

MD

HP
\t

27

28

26

20

870`;
const greatDragonSrdParser = new SrdBlockParser(greatDragonSrdText);

console.log("\n/* --- Greater Hoardsong Dragon --- */")
console.log(greatDragonSrdParser.getFullMonster());

// End
console.log("hello");
