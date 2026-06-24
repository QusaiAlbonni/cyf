import {
  HumanizeDuration,
  HumanizeDurationLanguage,
} from 'humanize-duration-ts';

const languageService = new HumanizeDurationLanguage();
export const humanizer = new HumanizeDuration(languageService);