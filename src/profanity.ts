import { Profanity } from '@2toad/profanity';
import { readFileSync } from 'fs';
import { join } from 'path';


const loadBannedWords = () => {
  try {
    const path = join(process.cwd(), 'src/config/profanity-words.json');
    const data = JSON.parse(readFileSync(path, 'utf-8'));
    return {
      en: [...data.en],
      ar: [...data.ar]
    };
  } catch (error) {
    return { en: [], ar: [] };
  }
};

const bannedWords = loadBannedWords();
const createProfanityRegex = (words: string[]) => {
  const substitutions: { [key: string]: string } = {
    a: '[a4@]',
    s: '[s5$]',
    e: '[e3]',
    i: '[i1!]',
    o: '[o0]',
    t: '[t7]',
    b: '[b8]',
    g: '[g9]',

    ا: '[اإأآى]',
    ة: '[ةهٓ]',
    ي: '[يىئ]',
    و: '[ؤوٶ]',
    ح: '[ح7]',
    خ: '[خ5]',
    س: '[س$]',
    ر: '[ر2]',
    ع: '[ع3]',
    ص: '[ص6]',
    ق: '[ق9]',
    ك: '[كk]',
    م: '[mم]',
    ن: '[نñ]',
    ه: '[هة]',
    ء: '[ءؤ]',
  };

  const patterns = words.map(word => {
    const chars = word.split('').map(c => {
      const sub = substitutions[c.toLowerCase()] || c;

      return `(${sub}+)`;
    }).join('[^أ-يa-zA-Z]*');

    return `(${chars})`;
  });

  return new RegExp(`(${patterns.join('|')})`, 'gi');
};
const profanity = new Profanity({
  languages: ['ar', 'en'],
  wholeWord: false,
  grawlix: '*****',
  grawlixChar: '$',
});
const enRegex = createProfanityRegex(bannedWords.en);
const arRegex = createProfanityRegex(bannedWords.ar);
const combinedRegex = new RegExp(`${enRegex.source}|${arRegex.source}`, 'gi');

profanity.addWords([...bannedWords.en, ...bannedWords.ar]);
export const isProfane = (text: string) => {
  return profanity.exists(text) || combinedRegex.test(text);
};
export default profanity;
