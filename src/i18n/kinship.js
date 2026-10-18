import i18n, { tr } from "./index.js";
// Kinship is calculated from canonical links; grammar is a presentation concern.
export function kinshipLabel(label) {
  if (i18n.language !== "ru") return label;
  const grand = label.match(/^((?:great-)*)grand(father|mother|parent|child)$/);
  if (grand) {
    const base = {
      father: "дедушка",
      mother: "бабушка",
      parent: "дедушка / бабушка",
      child: "внук / внучка",
    }[grand[2]];
    return "пра".repeat(grand[1].split("great-").length - 1) + base;
  }
  const cousin = label.match(
    /^(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|\d+th) cousin(?: (once|twice|\d+ times) removed)?$/,
  );
  if (cousin) {
    const rank =
      [
        "first",
        "second",
        "third",
        "fourth",
        "fifth",
        "sixth",
        "seventh",
        "eighth",
        "ninth",
        "tenth",
      ].indexOf(cousin[1]) + 1 || parseInt(cousin[1]);
    const distance = cousin[2]
      ? cousin[2] === "once"
        ? 1
        : cousin[2] === "twice"
          ? 2
          : parseInt(cousin[2])
      : 0;
    const title =
      rank === 1
        ? "Двоюродный брат / сестра"
        : rank === 2
          ? "Троюродный брат / сестра"
          : `Родство через общего предка (${rank + 1} поколения)`;
    return title + (distance ? `; разница поколений: ${distance}` : "");
  }
  const extended = label.match(
    /^((?:great-)+)(aunt|uncle|aunt\/uncle|niece|nephew|niece\/nephew)$/,
  );
  if (extended)
    return `${tr(extended[2])}; разница поколений: ${extended[1].split("great-").length}`;
  return tr(label);
}
