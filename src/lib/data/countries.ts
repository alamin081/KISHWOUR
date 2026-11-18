/** ISO 3166-1 alpha-2 country codes (officially assigned). Names come from Intl.DisplayNames. */
const CODES =
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(
    " ",
  );

export const COUNTRY_CODES: ReadonlySet<string> = new Set(CODES);

const names = new Intl.DisplayNames(["en"], { type: "region" });

/** Countries sorted by English name, for select inputs. */
export const COUNTRY_OPTIONS: { code: string; name: string }[] = CODES.map((code) => ({
  code,
  name: names.of(code) ?? code,
})).sort((a, b) => a.name.localeCompare(b.name, "en"));

/** English country name for an ISO code; the code itself when it is not a known country. */
export function countryName(code: string): string {
  const upper = code.trim().toUpperCase();
  if (!upper) return "";
  return COUNTRY_CODES.has(upper) ? (names.of(upper) ?? upper) : upper;
}
