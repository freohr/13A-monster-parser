export default class TextHandler {
    #textArray = [];
    #currentIndex = 0;

    constructor(textBlock, removeWhiteSpace = true) {
        if (typeof textBlock === "string") {
            let importedText = textBlock.split("\n");

            if (removeWhiteSpace) {
                importedText = importedText.map((s) => s.trim()).filter((s) => s.length > 0);
            }

            this.#textArray = importedText;
        }
    }

    reset() {
        this.#textArray = [];
        this.#currentIndex = 0;
    }

    get atEnd() {
        return this.#currentIndex >= this.#textArray.length;
    }

    get currentLine() {
        return this.#textArray[this.#currentIndex];
    }

    get index() {
        return this.#currentIndex;
    }

    set index(i) {
        this.#currentIndex = i;
    }

    advanceIndex(i = 1) {
        this.index += i;
    }
};