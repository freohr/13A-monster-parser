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

    set description(text) {
        this.#description = text;
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
        this.#name = name;
        this.#description = description;
        this.#traits = traits ?? [];
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

    set description(text) {
        this.#description = text;
    }
};

SrdRegexes = class SrdRegexes {
    static get strengthLineRegex() {
        return /(?<size>\S+)? ?(?<ordinal>(?<level>\d+)\s*(st|nd|rd|th)) level (?<role>\S+) (?<type>\S+)/;
    }

    static get attackStarterRegex() {
        return /^(?<trigger>\[Special trigger] )?(?<attack_name>.+) — (?<attack_desc>.*)/;
    }

    static get attackTraitStarterRegex() {
        return /^ (?<trait_name>.+)(?<![RC]): (?<trait_desc>.*)/;
    }

    static get traitStarterRegex() {
        return /^(?! )(?<trait_name>.+)(?<![RC]): (?<trait_desc>.*)/;
    }

    static get followUpRegex() {
        return /^ (?<follow_up>.*)/;
    }

    static get nastierHeaderRegex() {
        return /^Nastier Specials$/;
    }

    static get initiativeRegex() {
        return /^Initiative: \+?(?<initiative>.+)$/;
    }

    static get vulnerabilityRegex() {
        return /^Vulnerability: (?<vulnerability>.+)/;
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
            other: /^\((?<name>.+)\)+/,
            value: /^(?<value>\d+)/,
        };
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

    get traits() {
        return this.#traits;
    }

    get triggeredAttacks() {
        return this.#triggeredAttacks;
    }

    get nastierTraits() {
        return this.#nastierTraits;
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

class SrdHtmlParser {
    /**
     * @type HTMLTableRowElement
     */
    #fullStatBlock;

    constructor(htmlText) {
        const localWrapper = document.createElement("div");
        localWrapper.innerHTML = htmlText;

        this.#fullStatBlock = localWrapper.children.item(0).children.item(0).children.item(0);
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

    getDescription() {
        const descriptionWrapper = this.#fullStatBlock.firstElementChild;
        const descriptionString = SrdHtmlParser.#translateChildrenListToIterable(descriptionWrapper.children)
            .map((c) => c.innerText.replace(/[\s ]/, " ").trim().toLowerCase())
            .join(" ");
        const descriptionMatch = descriptionString.match(SrdRegexes.strengthLineRegex);

        if (!descriptionMatch) {
            throw "Bad format for monster description";
        }

        const monsterDescription = {};

        if (descriptionMatch.groups.size) {
            monsterDescription.size = descriptionMatch.groups.size.toLowerCase();
        }
        monsterDescription.level = descriptionMatch.groups.level;
        monsterDescription.levelOrdinal = descriptionMatch.groups.ordinal;
        monsterDescription.role = descriptionMatch.groups.role.toLowerCase();
        if (monsterDescription.role === "mook") {
            monsterDescription.mook = "yes";
        }
        monsterDescription.type = descriptionMatch.groups.type.toLowerCase();

        const initiativeAndVulnerability = this.#fullStatBlock.children[1].children[0].innerHTML.split("<br>");

        const initiativeMatch = initiativeAndVulnerability[0].match(SrdRegexes.initiativeRegex);
        monsterDescription.initiative = initiativeMatch.groups.initiative;

        if (initiativeAndVulnerability.length > 1) {
            let vulnerabilityMatch = initiativeAndVulnerability[1].match(SrdRegexes.vulnerabilityRegex);
            monsterDescription.vulnerability = vulnerabilityMatch.groups.vulnerability;
        }
        return monsterDescription;
    }

    getAttacksAndTraits() {
        // we are skipping the first line, as it holds the Initiative value, and possibly the second one which holds the vulnerability
        const potentialVulnerabilities = this.#fullStatBlock.children[1].children[1].innerText,
            attacksAndTraits = SrdHtmlParser.#translateChildrenListToIterable(this.#fullStatBlock.children[1].children)
                .slice(1)
                .map((c) => c.innerText);

        const attackCategory = { attacks: [] },
            triggeredAttackCategory = { attacks: [] },
            traitCategory = { traits: [] },
            nastierTraitCategory = { traits: [] };

        let currentAttackCategory = attackCategory,
            currentTraitCategory = traitCategory;

        for (const line of attacksAndTraits) {
            let currentLineMatch;

            // if match attack
            if ((currentLineMatch = line.match(SrdRegexes.attackStarterRegex))) {
                // check for trigger header
                const isTriggered = currentLineMatch.groups.trigger !== undefined;
                const attack = SrdHtmlParser.#parseAttackLine(line);

                if (isTriggered) {
                    triggeredAttackCategory.attacks.push(attack);
                } else {
                    currentAttackCategory.attacks.push(attack);
                }
                continue;
            }

            if ((currentLineMatch = line.match(SrdRegexes.traitStarterRegex))) {
                // From now on, treat all new attack lines as triggered attacks
                currentAttackCategory = triggeredAttackCategory;

                // parse the trait
                currentTraitCategory.traits.push(SrdHtmlParser.#parseTraitLine(line));
                continue;
            }

            if ((currentLineMatch = line.match(SrdRegexes.nastierHeaderRegex))) {
                currentTraitCategory = nastierTraitCategory;
                continue;
            }
        }

        return {
            attacks: attackCategory.attacks,
            triggeredAttacks: triggeredAttackCategory.attacks,
            traits: traitCategory.traits,
            nastierTraits: nastierTraitCategory.traits,
        };
    }

    getDefenses() {
        const defenseNameWrapper = this.#fullStatBlock.children[this.#fullStatBlock.childElementCount - 2].children,
            defenseValueWrapper = this.#fullStatBlock.children[this.#fullStatBlock.childElementCount - 1].children,
            defenseNames = [],
            defenseValues = [];

        for (let i = 0; i < defenseNameWrapper.length; i++) {
            defenseNames.push(defenseNameWrapper[i].firstElementChild.innerText.toLowerCase());
            defenseValues.push(defenseValueWrapper[i].firstElementChild.innerText);
        }

        const zip = (a, b) => a.map((k, i) => [k, b[i]]),
            matchedDefenses = zip(defenseNames, defenseValues),
            defenses = {};

        matchedDefenses.forEach((elem, index) => {
            const name = elem[0],
                value = elem[1];
            if (name.match(SrdRegexes.defensesRegex.anyDefense)) {
                defenses[name] = value;
            } else {
                const namePrevious = matchedDefenses[index - 1][0];
                const additionalInfoMatch = name.match(SrdRegexes.defensesRegex.other);
                defenses[namePrevious] += ` (${additionalInfoMatch.groups.name}: ${value})`;
            }
        });

        return defenses;
    }

    /**
     *
     * @param traitText {string}
     * @return {Trait}
     */
    static #parseTraitLine(traitText) {
        const traitMatch = traitText.match(SrdRegexes.traitStarterRegex);

        const traitDesc = traitMatch.groups.trait_desc;

        return new Trait(
            traitMatch.groups.trait_name,
            traitDesc
                .split(" ")
                .filter((s) => s !== null && s.length > 0)
                .join("<br/>")
        );
    }

    /**
     *
     * @param attackText {string}
     * @return {Attack}
     */
    static #parseAttackLine(attackText) {
        const attackBlock = attackText.split(" ");
        const attackMatch = attackBlock[0].match(SrdRegexes.attackStarterRegex);

        const attack = new Attack(attackMatch.groups.attack_name, attackMatch.groups.attack_desc);

        // The attack block contains more than just the attack line, we treat every following line as traits for this attack
        if (attackBlock.length > 1) {
            attack.traits.push(...attackBlock.splice(1).map((t) => this.#parseTraitLine(t)));
        }

        return attack;
    }

    getFullMonster() {
        const description = this.getDescription();

        const monsterData = new FullStatBlock(
            description.name,
            description.size,
            description.level,
            description.levelOrdinal,
            description.role,
            description.type,
            description.initiative,
            description.vulnerability
        );

        const attacksAndTraits = this.getAttacksAndTraits();
        monsterData.attacks.push(...attacksAndTraits.attacks);
        monsterData.triggeredAttacks.push(...attacksAndTraits.triggeredAttacks);
        monsterData.traits.push(...attacksAndTraits.traits);
        monsterData.nastierTraits.push(...attacksAndTraits.nastierTraits);

        const defenses = this.getDefenses();
        monsterData.ac = defenses.ac;
        monsterData.pd = defenses.pd;
        monsterData.md = defenses.md;
        monsterData.hp = defenses.hp;

        return monsterData;
    }
}

// SRD HTML Parser
/*
const pitFiendHtmlText = `<table><tbody><tr><td><p><b>Huge</b></p><p><b>14<sup>th</sup>&nbsp;level</b></p><p><b>Wrecker</b></p><p><b>Devil</b></p></td><td><p>Initiative: +19</p><p><b>Fiendish weapon +19 vs. AC (2 attacks)</b> — 140 damage, and until the end of the battle the target takes a –2 penalty to attacks, defenses, and level-based d20 rolls. Hit points, feats, weapon damage, and other level-based benefits don’t change. (The penalty isn’t cumulative.)<br> <i>Natural 11+:</i> The pit fiend can make an <i>entangling tail</i> attack against a different target as a free action.<br> <i>Both attacks hit:</i> The pit fiend can use <i>fiendish vigor</i> as a free action.</p><p><b>Entangling tail +19 vs. PD</b> — 40 damage, and the target is hampered until the end of its next turn or until the pit fiend makes another <i>entangling tail</i> attack.</p><p><b>R: Burst of hellfire +19 vs. PD (up to 3 nearby or far away enemies in a group)</b> — 120 fire damage<br> <i>Miss:</i> Half damage.</p><p><b>C: Black utterance of denial +19 vs. MD (each enemy engaged with the pit fiend)</b> — The target is hampered until the end of its next turn<br> <i>Limited use:</i> 1/battle, as a quick action.</p><p><i>Devil’s due (Menace):</i> When you choose to add the escalation die to an attack against a pit fiend, the escalation die does not increase at the start of the next round. Special circumstances and PC powers can still increase it.</p><p><i>Fiendish vigor:</i> As a standard action, the pit fiend can heal 300 hp and roll a save against each ongoing effect on it. It can use <i>fiendish vigor</i> up to five times per battle.</p><p><i>Flight:</i> Amidst wind and flames, a pit fiend can fly with surprising agility.</p><p><i>Resist fire 13+:</i> When a fire attack targets this creature, the attacker must roll a natural 13+ on the attack roll or it only deals half damage.</p><p><span>Nastier Specials</span></p><p><i>Cloak of fire:</i> When a creature is engaged with the pit fiend at the start of its turn, that creature takes 20 fire damage.</p></td><td><p><b>AC</b></p><p><b>PD</b></p><p><b>MD</b></p><p><b>HP</b></p></td><td><p><b>29</b></p><p><b>27</b></p><p><b>27</b></p><p><b>1600</b></p></td></tr></tbody></table>`;
const pitFiendParser = new SrdHtmlParser(pitFiendHtmlText);
console.log("--- Pit Fiend");
console.log(pitFiendParser.getFullMonster());

const fangDevilText = `<table><tbody><tr><td><p><b>Huge</b></p><p><b>7<sup>th</sup>&nbsp;level</b></p><p><b>Spoiler</b></p><p><b>Devil</b></p></td><td><p>Initiative: +13</p><p><b>Mighty tentacles +12 vs. PD (2 attacks; can target nearby enemies)</b> — 20 damage<br> <i>Natural even hit:</i> The target pops free from each enemy and moves next to the Devil, which engages and grabs it. (The Devil can grab any number of enemies simultaneously.) If it has quick actions left, it will use its <i>devil’s beak</i> and <i>cutting talon</i> attacks.<br> <i>Miss:</i> 10 damage.</p><p><b>Cutting talon +12 (+16 against a grabbed enemy) vs. AC</b> — 40 damage<br> <i>Natural even hit:</i> The target also takes 20 ongoing damage.<br> <i>Natural odd miss:</i> 20 ongoing damage.<br> <i>Quick use:</i> This ability only requires a quick action (once per round) to use.</p><p><i>[Special trigger]</i> <b>Devil’s beak +16 vs. AC (one enemy it’s grabbing; includes +4 grab bonus)</b> — 30 damage<br> <i>Miss:</i> 15 damage.<br> <i>Quick use:</i> This ability only requires a quick action (once per round) to use.</p><p><i>Devil’s due (Trouble):</i> When you choose to add the escalation die to an attack against the Fang Devil, you are hampered until the end of your next turn after you make the attack.</p><p><i>Resist energy 13+:</i> When an energy attack targets this creature, the attacker must roll a natural 13+ on the attack roll or it only deals half damage.</p></td><td><p><b>AC</b></p><p><b>PD</b></p><p><b>MD</b></p><p><b>HP</b></p></td><td><p><b>22</b></p><p><b>22</b></p><p><b>22</b></p><p><b>360</b></p></td></tr></tbody></table>`;
const fangDevilParser = new SrdHtmlParser(fangDevilText);
console.log("--- Fang Devil");
console.log(fangDevilParser.getFullMonster());

const empyreanDragontext = `<table><tbody><tr><td><p><b>Huge</b></p><p><b>9<sup>th</sup>&nbsp;level</b></p><p><b>Spoiler</b></p><p><b>Dragon</b></p></td><td><p>Initiative: +17</p><p><b>Gleaming bite +14 vs. AC</b> — 50 damage, and one effect triggers based on the head that attacks (GM’s choice)<br> <i>Head 1:</i> The target can’t use recoveries until end of its next turn.<br> <i>Head 2:</i> One enemy that hit the dragon since the dragon’s last turn takes 12 damage.<br> <i>Head 3:</i> The target moves to a nearby non-harmful location of the dragon’s choice as a free action. This movement can provoke opportunity attacks.</p><p><b>C: Venom breath +13 vs. PD (1d3 + 1 nearby enemies)</b> — 35 damage<br> <i>Swarming motes:</i> Each time the dragon uses this attack, a swarm of light motes that resolve into scorpions and stinging insects swirl around the targets. The swarm harasses each targeted enemy, hit or miss. During its next turn, any enemy being swarmed this way must choose one: Take 25 damage; OR roll twice for each attack roll it makes that turn, taking the lower result.</p><p><i>[Special trigger]</i> <b>C: Crying heavens +13 vs. MD (each enemy in the battle)</b> — 20 ongoing damage<br> <i>Miss:</i> 10 ongoing damage.<br> <i>Temporal manastorm:</i> The empyrean dragon’s connection to the overworld falters, creating a storm of distorted time and magic in the area. The dragon’s critical hit range for all attacks expands by 2 until the end of the battle. In addition, when a target saves against the ongoing damage from this attack, the crit range of its attacks against the dragon expands by 1 until the end of the battle.<br> <i>Limited use:</i> 1/battle, as a free action when first staggered.</p><p><i>Three heads are better than one:</i> The empyrean dragon can make two <i>gleaming bite</i> attacks as a single standard action, one each from two heads. The third head is assumed to be maneuvering the body around. It can choose not to make one of those attacks to end any condition affecting it except for ongoing damage (this includes the stunned condition, even though it technically doesn’t get an action when stunned).<br> An enemy who scores a critical hit against an empyrean dragon can forego the extra damage to lop off one of the dragon’s heads. If an enemy deals 150 damage with a single attack against the dragon, the attack will also remove a head. An empyrean dragon with two remaining heads can make only one <i>gleaming bite</i> attack as a standard action and can’t sacrifice that attack to remove conditions. The dragon dies if all three heads are removed.</p><p><i>Intermittent breath:</i> An empyrean dragon can use <i>venom breath</i> 1d2 + 1 times per battle, but never two turns in a row.</p></td><td><p><b>AC</b></p><p><b>PD</b></p><p><b>MD</b></p><p><b>HP</b></p></td><td><p><b>25</b></p><p><b>23</b></p><p><b>21</b></p><p><b>510</b></p></td></tr></tbody></`;
const dragonParser = new SrdHtmlParser(empyreanDragontext);
console.log("--- Empyrean Dragon");
console.log(dragonParser.getFullMonster());

const gorgeDragonText = `<table><tbody><tr><td><p><b>Large</b></p><p><b>5<sup>th</sup>&nbsp;level</b></p><p><b>Spoiler</b></p><p><b>Dragon</b></p></td><td><p>Initiative: +13<br>Vulnerability: fire</p><p><b>Coiling +10 vs. PD</b> — 18 damage, and the dragon grabs the target; while grabbed, the target takes 9 damage at the start of each of its turns<br> <i>Natural 5, 10, 15, or 20:</i> The dragon regains the use of its <i>dazzling breath</i> if it’s expended and can use it during its next turn.</p><p><b>Bite +13 (includes grab bonus) vs. AC (one enemy it’s grabbing)</b> — 25 damage<br> <i>Natural 16+:</i> The target takes no damage and is instead <i>swallowed whole</i> (see below).<br> <i>Limited use:</i> 1/round, as a free action.</p><p><b>C: Dazzling breath +9 vs. MD (1d3 nearby enemies)</b> — 14 damage, and if the target has 40 HP or fewer after being hit, it’s weakened until the end of its next turn<br> <i>Limited use:</i> 1/battle, as a quick action.</p><p><i>Swallowed whole:</i> A creature that is swallowed whole must start making last gasp saves during its next turn. An ally can assist with the save as normal, but the save remains hard (16+) in that case. A roll of 16–19 causes the creature to be regurgitated from the dragon’s gut, while a 20 means that the creature cuts/rips a hole through the dragon’s flesh to escape (dealing basic attack damage automatically).</p><p><i>Chain constrictor:</i> The gorge dragon can have up to two enemies grabbed at the same time.</p><p><i>Resist cold 14+:</i> When a cold attack targets this creature, the attacker must roll a natural 14+ on the attack roll or it only deals half damage.</p><p><i>Water-breathing:</i> Gorge dragons swim well and can breathe underwater.</p></td><td><p><b>AC</b></p><p><b>PD</b></p><p><b>MD</b></p><p><b>HP</b></p></td><td><p><b>21</b></p><p><b>19</b></p><p><b>17</b></p><p><b>164</b></p></td></tr></tbody></table>`
const gorgeDragonParser = new SrdHtmlParser(gorgeDragonText);
console.log("--- Gorge Dragon");
console.log(gorgeDragonParser.getFullMonster());
*/

const cenotapheDragonText =  `<table><tbody><tr><td><p><b>Normal</b></p><p><b>3<sup>rd</sup>&nbsp;level</b></p><p><b>Troop</b></p><p><b>Dragon</b></p></td><td><p>Initiative: +8<br>Vulnerability: fire</p><p><b>Claws and bite +7 vs. AC (2 attacks)</b> — 6 damage<br> <i>Natural 16+:</i> The cenotaph dragon can make an <i>infused ice breath</i> attack as a free action.</p><p><i>[Special trigger]</i> <b>C: Infused ice breath +7 vs. PD (1d3 nearby enemies)</b> — 6 cold damage<br> <i>Natural 20:</i> The target also takes 5 ongoing holy damage (in addition to double damage for crit).<br> <i>Natural odd hit or miss:</i> The dragon takes 1d6 damage.</p><p><i>Resist cold and negative energy 12+:</i> When a cold or negative energy attack targets this creature, the attacker must roll a natural 12+ on the attack roll or it only deals half damage.</p></td><td><p><b>AC</b></p><p><b>PD</b></p><p><b>MD</b></p><p><b>HP</b></p></td><td><p><b>18</b></p><p><b>18</b></p><p><b>14</b></p><p><b>48</b></p></td></tr></tbody></table>`
const cenoDragonParser = new SrdHtmlParser(cenotapheDragonText);
console.log("--- Cenotaphe Dragon");
console.log(cenoDragonParser.getFullMonster());

// End
console.log("hello");
