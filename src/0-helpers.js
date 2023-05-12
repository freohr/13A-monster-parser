class helpers {
  static stringToPascalCase(string) {
    const allWords = string.split(" ");
    const capitalizedWords = allWords.map((s) =>
      s.replace(
        /(\w)(\w*)/g,
        (g0, g1, g2) => g1.toUpperCase() + g2.toLowerCase()
      )
    );

    return capitalizedWords.join(" ");
  }

  static isEmpty(stuff) {
    if (stuff === undefined) return true;
    if (Array.isArray(stuff) && stuff.length === 0) return true;
    if (typeof stuff === "string" && stuff.length === 0) return true;
    return Object.entries(stuff).length === 0;
  }
}
