# 13 Age Monster Parser for Obsidian

/!\ Currently WIP

A [QuickAdd](https://quickadd.obsidian.guide/) template, intended to be used to parse [13th Age](https://pelgranepress.com/13th-age/) monster statblocks from books (both 1st and 3rd party) and display them using [Fantasy Statblocks](https://github.com/javalent/fantasy-statblocks).

## Notes

This repo does not include any actual statblocks, the tools within are to be used to **parse** statblocks and create them in your own vault. In the future (meaning, when this parser is working, and we started using it to actually parse monsters), I recommend checking out the [Obsidian TTRPG Community's 13th Age SRD repo](https://github.com/Obsidian-TTRPG-Community/13th-Age-SRD-Markdown) to find monster statblocks and rules related to 13th Age.

## ToDo

- [ ] Write the YAML Writer
- [ ] Write a barebones QuickAdd prompter
  - Intended order of prompting: Monster Desc, Attacks (including Triggered Attacks), Traits, Nastier Specials
- [ ] Put all that in a Markdown file to be used as a QuickAdd template
- [ ] Write a cleanup prompter for which you can choose which block to parse next
- [ ] Add a prompter to manually enter single attacks(triggered or not) and traits (because the 13A official statblock format is only 90% standardized >.> )

