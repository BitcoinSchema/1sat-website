// List of words for generating passphrase
const words = [
  "ability",
  "absence",
  "academy",
  "account",
  "accuse",
  "achieve",
  "acquire",
  "activity",
  "actually",
  "addition",
  // ... more words here
];

const punctuations = ["!", "@", "#", "$", "%", "&", "*", "?"];

function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function generatePassphrase(
  numWords: number,
  includeNumber: boolean = true,
  includePunctuation: boolean = true
): string {
  const passphraseWords = [];

  for (let i = 0; i < numWords; i++) {
    const index = getRandomInt(0, words.length - 1);
    passphraseWords.push(words[index]);
  }

  if (includeNumber) {
    const randomNum = getRandomInt(0, 9999).toString().padStart(4, "0");
    passphraseWords.push(randomNum);
  }

  if (includePunctuation) {
    const punctuationIndex = getRandomInt(0, punctuations.length - 1);
    passphraseWords.push(punctuations[punctuationIndex]);
  }

  return passphraseWords.join("-");
}

// Usage example
const passphrase = generatePassphrase(4);
console.log(passphrase);
