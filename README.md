# 13th Age Monster Parser for Obsidian

/!\ Currently WIP, but the barebones parser should work (follow the instructions in [How to Use](#how-to-use))

A [QuickAdd](https://quickadd.obsidian.guide/) template, intended to be used to parse [13th Age](https://pelgranepress.com/13th-age/) monster statblocks from books (as pdf, both 1st and 3rd party) and display them using [Fantasy Statblocks](https://github.com/javalent/fantasy-statblocks).

## Notes

This repo does not include any actual statblocks, the tools within are to be used to **parse** statblocks and create them in your own vault. In the future (meaning, when this parser is working, and we started using it to actually parse monsters), I recommend checking out the [Obsidian TTRPG Community's 13th Age SRD repo](https://github.com/Obsidian-TTRPG-Community/13th-Age-SRD-Markdown) to find monster statblocks and rules related to 13th Age.

### Dependencies

- [CustomJS](https://github.com/saml-dev/obsidian-custom-js): to run the parser's Javascript from a dedicated script file
- [QuickAdd](https://quickadd.obsidian.guide/docs/): to create a file from the template via prompters
- [Fantasy Statblocks](https://plugins.javalent.com/statblocks): to render the statblocks

## How to Use

### First Setup

1. Install and enable the [needed dependencies](#dependencies) in your vault
2. From this repo, download the `assets` folder and its content, and put them somewhere in your vault (I like having an `assets` dir at the root of my vaults to group this kind of files and be able to locate them easily with core functionnalities and plugins). The suggested structure is:
```
assets
  |- scripts
  |   |- monster-parser.js
  |- templates
      |- monster-statblock-parser.md
```
3. In the **CustomJS** config, in the `Individual Files` field, put `[/path/from/vault/root]/assets/scripts/monster-parser.js` (or the path you've chosen pointing to the parser's JS file)
4. In the **QuickAdd** config:
   1. Put the path to your template folder (containing the template from this repo) in the `Template Folder Path` field
   2. Create a `Template` choice, named however you want (e.g. `13th Age Monster Parser`)
   3. Click on `Configure [template-name]` (in the list of choices, the small cog right of your newly created choice), then
      1. In `Template Path`, put the path to the template (the field is a suggester, so you can type `13A-monster-[etc.]` to find it easily)
      2. Enable `File Name Format`, then put `{{value}}` in the field
      3. Enable `Create in Folder` (to be able to choose where the new file will be created), then configure which folder you want for that
          - Enabling `Choose Folder when creating a note` allows you to put the new note anywhere in your vault, or
          - Disabling that, and selecting a few dedicated folders can help you centralise your monsters
      4. Disable `Create in same folder as active file`
      5. Disable `Append Link`
      6. Enable `Set default behavior if file exists`, and choose `None`, so that you don't overwrite your existing monsters when you import a new one (this can happen if 3rd party publishers choose the same name as an official monster, or 2 publishers name their monsters the same, or if you import the same monster by accident)
      7. You can enable `Open`, and then select `Source` to open the newly imported monster when finished (to check that everything was imported correctly)
      8. For `New Split`, choose which behavior you prefer (I prefer disabling it)
      9. Enable `Focus new pane` to focus the newly created note when finished
5. In the **Fantasy Statblocks** config:
   1. If you're prepping for a 13th Age campaign, I suggest putting the `Default Layout` config to `Basic 13th Age Monster Layout` so that you don't have to add the `layout: Basic 13th Age Monster Layout` line to your statblock YAML config everytime.
   2. For the rest, the module can do a lot more than just rendering statblocks, so configure it to your needs and liking.

### Parsing a monster

For now, the parser only exists as a minimalist set of prompters. In order, the parser will prompt you for:

1. The monster's **Description**
    - This is the top of the statblock, which contains: the Monster's **Name**, its **Flavor text**, the **"Strength" line** (e.g. `Large 8th level wrecker [giant]` for the [Fire Giant](https://www.13thagesrd.com/monsters/#Fire_Giant)), its **Initiative** bonus and its potential **Vulnerability**
    - /!\ **Important manual step**: Make sure that the monster's name on its entirety is on the **_first line_**, because the parser has no way of distinguishing between a potential second line of the monster's name and the start of it's flavor text
2. The monster's Attacks
    - All the lines containing attacks, including any `[Special Triggers]` if there is any
    - The expected format is `[Attack Name] [Attack Bonus] vs. [Target's Defense] [(Any additional info, like # of targets)]—[Effect]`
    - /!\ **Important manual step 1**: All attacks' names must be on **1 line** (until and including the em-dash), because the parser cannot distinguish between the start of a new attack line and the end of a potential description or trait from a previous attack. The description can be on multiple lines.
    - /!\ **Important manual step 2**: If there are any traits to the attack (expected format `[Trait Name/Roll trigger]: [trait effect]`), their name must be on a single line (up to and including the semicolon), because the parser cannot distinguish between the start of... same thing as the attacks.
3. The monster's **Traits**, if any
    - Any traits not linked to an attack
    - /!\ **Important manual step**: If there are any traits (expected format `[Trait Name/Roll trigger]: [trait effect]`), their name must be on a single line (up to and including the semicolon), because the parser cannot distinguish between the start of... same thing as above.
4. The monster's **"Nastier Specials"**, if any
    - Any traits grouped under the `Nastier Specials` heading
    - /!\ **Important manual step**: If there are any traits (expected format `[Trait Name/Roll trigger]: [trait effect]`), their name must be on a single line (up to and including the semicolon), because the parser cannot distinguish between the start of... same thing as above.
    - /!\  **Important note**: If a **nastier** adds an attack to the monster, **do not put it in this prompt**. The parser will not be able to interpret it correctly, put it in the next section 
5. the monster's **"Special Triggers"**, if there are some not included in its attacks
    - Sometimes, a trait will have a triggered action that is not labeled `[Special Trigger]` (looking at you, [Fire Giant](https://www.13thagesrd.com/monsters/#Fire_Giant) and the **nastier** _Strength of Giants_). Just put every remaining attacks in this prompt
6. the monster's **Defenses**
    - AC, PD, MD and HP. If you copy paste from a book, they should be on a line each. If not, manually put each on their dedicated line.

After that, the prompter should close, and your newly imported monster's note should open inn your current Obsidian view. If you get an error message during the process, check the format of the blocks (the parser usually throws an exception in the middle if something goes wrong), and if it still doesn't work, [open an issue](https://github.com/freohr/obsidian-13A-monster-parser/issues/new) here with the incriminating statblock, and I'll take a look at it.

## ToDo

In no particular order:

- [x] Write parser for the various blocks in a monster Statblock 
  - [x] Monster Desc,
  - [x] Attacks
  - [x] (including Triggered Attacks),
  - [x] Traits,
  - [x] Nastier Specials,
  - [x] Defenses
- [x] Write the YAML Writer
  - [x] Monster Desc,
  - [x] Attacks
  - [x] (including Triggered Attacks),
  - [x] Traits,
  - [x] Nastier Specials,
  - [x] Defenses
- [x] Write a barebones QuickAdd prompter
  - Intended order of prompting: 
  - [x] Monster Desc, 
  - [x] Attacks 
  - [x] (including Triggered Attacks),
  - [x] Traits, 
  - [x] Nastier Specials,
  - [x] Defenses
- [x] Put all that in a Markdown file to be used as a QuickAdd template
- [ ] Write a cleaned-up prompter with which you can choose which block to parse next
- [ ] Add a prompter to manually enter single attacks or partial attack blocks (triggered or not) and traits (because the 13A official statblock format is only 90% standardized >.> )
- [ ] Create a [Templater](https://silentvoid13.github.io/Templater/introduction.html) variant that can add partial monster data.
- [ ] Add a full parsing example with pictures and explicative text.

