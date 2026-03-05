const PHRASE_TO_TAG: Array<{ phrase: string; tag: string }> = [
  { phrase: "folk-pop", tag: "folk-pop" },
  { phrase: "indie pop", tag: "indie-pop" },
  { phrase: "acoustic guitar", tag: "acoustic-guitar" },
  { phrase: "light percussion", tag: "light-percussion" },
  { phrase: "female lead", tag: "female-vocals" },
  { phrase: "female vocals", tag: "female-vocals" },
  { phrase: "male lead", tag: "male-vocals" },
  { phrase: "male vocals", tag: "male-vocals" },
  { phrase: "angelic", tag: "angelic" },
  { phrase: "ethereal harmonies", tag: "ethereal-harmonies" },
  { phrase: "backing singers", tag: "backing-vocals" },
  { phrase: "operatic", tag: "operatic" },
  { phrase: "chorus", tag: "catchy-chorus" },
  { phrase: "warmth", tag: "warm" }
];

const STOP_WORDS = new Set([
  "the",
  "and",
  "with",
  "that",
  "this",
  "from",
  "into",
  "toward",
  "towards",
  "very",
  "more",
  "song",
  "songs",
  "sound",
  "style",
  "adds",
  "adding",
  "build",
  "builds",
  "deliver",
  "delivers",
  "where",
  "when",
  "then",
  "just"
]);

function slugifyTag(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function generateTagsFromStylePrompt(stylePrompt: string, maxTags = 10) {
  const normalized = stylePrompt.toLowerCase();
  const tags: string[] = [];

  for (const entry of PHRASE_TO_TAG) {
    if (normalized.includes(entry.phrase) && !tags.includes(entry.tag)) {
      tags.push(entry.tag);
    }
  }

  const words = normalized
    .split(/[^a-z0-9-]+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 4)
    .filter((word) => !STOP_WORDS.has(word));

  for (const word of words) {
    const tag = slugifyTag(word);
    if (!tag || tags.includes(tag)) {
      continue;
    }

    tags.push(tag);
    if (tags.length >= maxTags) {
      break;
    }
  }

  return tags.slice(0, maxTags);
}
