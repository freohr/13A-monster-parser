export default class ParsingRegexes {
	static get strengthLine1eRegex() {
		return /(?<strength>.+?)? ?(((?<ordinal>(?<level>\d+)\s*(st|nd|rd|th))[ -])level|level (?<levelAfter>\d+)) (?<role>\S+) \[((?<size>\S+) )?(?<type>\S+)]/i;
	}

	static get strengthLine2eRegex() {
		return /((?<ordinal>(?<level>\d+)\s*(st|nd|rd|th))) level (?<strength>(double|triple)-strength)? ?(?<mook>mook )?(?<role>\S+) \[ ?(?<size>tiny|small|large|huge)? ?(?<type>\S+) ?]/i;
	}

	static get htmlStrengthLineRegex() {
		return /(?<strength>.+?)? ?(((?<ordinal>(?<level>\d+)\s*(st|nd|rd|th))[ -])level|level (?<levelAfter>\d+)) (?<role>\S+) (?<type>\S+)/i;
	}

	static get attackStarterRegex() {
		return /^(?<full_name>(\[(?<special>.*)] ?)?(?<base_name>([CR]Q?:)?[^:]+)) ?[—–-] ?(?<attack_desc>.*)/i;
	}

	static get triggeredAttackRegex() {
		return /^special trigger$/i;
	}

	static get attackTraitStarterRegex() {
		return /^ ?(?<trait_name>.+)(?<![RC]Q?): ?(?<trait_desc>.*)/;
	}

	static get standardAttackTraitNames() {
		return /^(Limited Use|.*Natural (\d+(-\d+)?|odd|even)|.*Hit|.*Miss|.*target.*|.*failed save.*|.*per battle.*|Criti?c?a?l?|Quick Use)/i;
	}

	static get traitStarterRegex() {
		return /^(?! )(?<trait_name>.+?)(?<![RC]Q?): ?(?<trait_desc>.*)/;
	}

	static get resistStarterRegex() {
		return /^Resist (?<element>\S+|Negative Energy) (?<value>\d{2})\+\.$/;
	}

	static get followUpRegex() {
		return /^ (?<follow_up>.*)/;
	}

	static get pdfFollowUpRegex() {
		return /^([^:—–-]+|[^A-Z].+(action|attack|enemy|\d|battle|effect|roll|move):|[^A-Z\[].+[—–-].*)$/m;
	}

	static get nastierHeaderRegex() {
		return /^Nastier Specials?$/i;
	}

	static get initiativeRegex() {
		return /^Initiative:? \+?(?<initiative>.+)$/;
	}

	static get vulnerabilityRegex() {
		return /^(Vulnerability|Vulnerable): (?<vulnerability>.+)/;
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
			anyDefenseOneLine: /^(?<name>AC|PD|MD|HP)(?<base>\d+)? (?<value>\d+)( \(mook\))?$/i,
			allDefensesOneLine: /^AC +(?<ac>\d+) +PD +(?<pd>\d+) +MD +(?<md>\d+) +HP +(?<hp>\d+)( \(mook\))?/i,
			other: /^\((?<name>.+)\)+/,
			value: /^(?<value>\d+)/,
		};
	}

	static get italicElement() {
		return /<em>(?<italic_text>[^:<\[]*)<\/em>/i;
	}

	static get boldElement() {
		return /<strong>(?<strong_text>[^:<]*)(?<!ac|pd|md|hp)<\/strong>/i;
	}

	static get splitAttackRoll() {
		return /^(?<name>[^+]+?) (?<bonus>\+\d+) (?<desc>.*)/i;
	}

	static get inlineAutomaticRolls() {
		return /((\d+d\d+(\+\d+)?|(?<!d)\d+)(?=( \S+){0,2} damage)|\d+d\d+(\+\d+)?)/i;
	}

	static get inlineManualRolls() {
		return /(?<!\d)d\d+(\+\d+)?/i;
	}
};