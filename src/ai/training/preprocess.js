const { trainingData } = require('./dataset');
// use natural for tokenization
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();

/**
 * Build vocabulary from trainingData texts.
 * Returns an object { wordIndex, indexWord, vocabSize }.
 */
function buildVocabulary() {
  const wordIndex = {};
  const indexWord = {};
  let nextIndex = 1; // reserve 0 for padding

  trainingData.forEach(({ text }) => {
    const tokens = tokenize(text);
    tokens.forEach((token) => {
      if (!(token in wordIndex)) {
        wordIndex[token] = nextIndex;
        indexWord[nextIndex] = token;
        nextIndex++;
      }
    });
  });

  return { wordIndex, indexWord, vocabSize: nextIndex };
}

/**
 * Build vocabulary as a Set of unique tokens.
 * Useful for deduplication and quick membership tests.
 */
function buildVocabularySet() {
  const vocab = new Set();
  trainingData.forEach(({ text }) => {
    const tokens = tokenize(text);
    tokens.forEach((t) => vocab.add(t));
  });
  return vocab;
}

/**
 * Write the vocabulary Set to a JSON file (as an array).
 */
const fs = require('fs');

function saveVocabulary(vocabSet, outPath = './vocab.json') {
  const arr = Array.from(vocabSet);
  fs.writeFileSync(outPath, JSON.stringify(arr, null, 2), 'utf8');
}

function loadVocabulary(path = './vocab.json') {
  const raw = fs.readFileSync(path, 'utf8');
  const arr = JSON.parse(raw);
  return new Set(arr);
}

/**
 * Tokenizer using natural.WordTokenizer.
 * Lowercases and strips basic punctuation.
 */
function tokenize(text) {
  return tokenizer
    .tokenize(text.toLowerCase())
    .map((t) => t.replace(/[.,!?;:\\"']/g, ''))
    .filter((t) => t.length > 0);
}

/**
 * Convert a string into an array of word indices using provided wordIndex.
 * Unknown words map to 0.
 */
function textToSequence(text, wordIndex) {
  const tokens = tokenize(text);
  return tokens.map((t) => wordIndex[t] || 0);
}

module.exports = { buildVocabulary, tokenize, textToSequence };