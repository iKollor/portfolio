import en from "./en";
import es from "./es";

export type Locale = "en" | "es";
export type Dict = typeof en;

export function getDict(locale: Locale): Dict {
    return locale === "es" ? (es as Dict) : (en as Dict);
}
