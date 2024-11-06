const words = [
  'The sky',
  'above',
  'highlight',
  'the port',
  '\n',
  'variables',
  'Generating',
  'random',
  'the color of television',
  'words',
  '\n',
  'from',
  'a dead channel',
  'sentence',
  'of',
  'words',
  '\n',
  'define',
  'were',
  'was',
  'tuned',
  'representing shorthand for',
  '.',
  '\n',
  'All',
  'this happened',
  'more or less',
  '.',
  'I',
  'had',
  'the story',
  '\n',
  'and',
  'bit by bit',
  'from various people',
  'as generally',
  'happens',
  '\n',
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
  'Sequences of white space are collapsed',
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
