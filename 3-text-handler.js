export class TextHandler {
    #textArray = [];
    #currentIndex = 0;

    // Static Factory to enable creating Objects with CustomJS plugin
    static create(textBlock) {
        return new TextHandler(textBlock);
    }

    constructor(textBlock) {
        this.#textArray = textBlock.split('\n').filter(s => s.length > 0).map(s => s.trim());
    }

    reset() {
        this.#textArray = [];
        this.#currentIndex = 0;
    };

    get atEnd() {
        return this.#currentIndex >= this.#textArray.length;
    };

    get currentLine() {
        return this.#textArray[this.#currentIndex];
    };

    get index() {
        return this.#currentIndex;
    };

    set index(i) {
        this.#currentIndex = i;
    };

    advanceIndex(i = 1) {
        this.index += i;
    }
}