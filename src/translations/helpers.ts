import { I18nService } from "nestjs-i18n";
import { LocalizedString } from "./types";

export function resolveLocalizedString(
  i18n: I18nService, 
  localized: LocalizedString, 
  lang: string
): string {
  if (typeof localized === 'string') {
    return localized;
  } else {
    return i18n.translate(localized.key, { lang, args: localized.args });
  }
}
