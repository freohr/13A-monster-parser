export default class Helpers {
    static stringToPascalCase(string) {
        const allWords = string.split(" ");
        const capitalizedWords = allWords.map((s) =>
            s.replace(/(\w)(\w*)/g, (_, g1, g2) => g1.toUpperCase() + g2.toLowerCase()),
        );

        return capitalizedWords.join(" ");
    }

    static setGlobalFlagOnRegex(regex) {
        return new RegExp(regex.source, "g");
    }

    static isEmpty(stuff) {
        if (stuff === undefined || stuff === null) return true;
        if (Array.isArray(stuff)) return stuff.length === 0;
        if (typeof stuff === "string") return stuff.length === 0;
        if (stuff instanceof Set) return stuff.size === 0;
        return Object.entries(stuff).length === 0;
    }

    static getOrdinal(number) {
        if (!(number instanceof Number)) {
            number = parseInt(number);
        }

        if (number === 0 || (number >= 4 && number <= 30)) {
            return `${number}th`;
        }

        if (number % 10 === 1) {
            return `${number}st`;
        }

        if (number % 10 === 2) {
            return `${number}nd`;
        }

        if (number % 10 === 3) {
            return `${number}rd`;
        }
    }
};
