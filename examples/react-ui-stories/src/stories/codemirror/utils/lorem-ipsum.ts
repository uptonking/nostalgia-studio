const words = [
  'The sky',
  'above',
  'the port',
  "variables",
  '\n',
  "Generating",
  "random",
  'the color of television',
  "words",
  "from",
  '\n',
  'a dead channel',
  "sentence",
  "of",
  "words",
  "define",
  '\n',
  'were',
  'was',
  'tuned',
  'to',
  '.',
  'All',
  '\n',
  'this happened',
  'more or less',
  '.',
  'I',
  'had',
  'the story',
  'bit by bit',
  'from various people',
  'and',
  '\n',
  'as generally',
  'happens',
  'in such cases',
  'each time',
  'it',
  'was',
  'a different story',
  '.',
  '\n',
  'It',
  'was',
  'a pleasure',
  'to',
  'burn',
];

export function makeTextByWords(wordsCount: number = 120) {
  let n = wordsCount;
  let sentence = '';
  while (n--) {
    if (n > 0) {
      sentence += words[Math.floor(Math.random() * words.length)] + ' ';
    } else {
      break;
    }
  }
  return sentence;
}
