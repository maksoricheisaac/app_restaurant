/**
 * Liste complète des pays (ISO 3166-1 alpha-2) avec, pour chacun :
 *  - le nom français,
 *  - la devise par défaut (ISO 4217),
 *  - ses fuseaux horaires IANA (utilisés pour filtrer la liste des fuseaux
 *    selon le pays sélectionné à l'onboarding).
 *
 * Le drapeau n'est PAS stocké : il est dérivé du code pays à la volée
 * (`flagEmoji`) via les « regional indicator symbols », ce qui évite de
 * maintenir ~250 emojis et garantit la cohérence.
 */

export interface Country {
  code: string;
  name: string;
  currency: string;
  timezones: string[];
}

/** Drapeau emoji dérivé du code ISO alpha-2 (ex: "FR" → 🇫🇷). */
export function flagEmoji(code: string): string {
  if (!code || code.length !== 2) return '🏳️';
  const A = 0x1f1e6;
  const base = 'A'.charCodeAt(0);
  return String.fromCodePoint(
    A + code.toUpperCase().charCodeAt(0) - base,
    A + code.toUpperCase().charCodeAt(1) - base,
  );
}

// tuple compact : [code, nom fr, devise, fuseaux]
type Row = [string, string, string, string[]];

const ROWS: Row[] = [
  ['AF', 'Afghanistan', 'AFN', ['Asia/Kabul']],
  ['ZA', 'Afrique du Sud', 'ZAR', ['Africa/Johannesburg']],
  ['AL', 'Albanie', 'ALL', ['Europe/Tirane']],
  ['DZ', 'Algérie', 'DZD', ['Africa/Algiers']],
  ['DE', 'Allemagne', 'EUR', ['Europe/Berlin']],
  ['AD', 'Andorre', 'EUR', ['Europe/Andorra']],
  ['AO', 'Angola', 'AOA', ['Africa/Luanda']],
  ['AG', 'Antigua-et-Barbuda', 'XCD', ['America/Antigua']],
  ['SA', 'Arabie saoudite', 'SAR', ['Asia/Riyadh']],
  ['AR', 'Argentine', 'ARS', ['America/Argentina/Buenos_Aires', 'America/Argentina/Cordoba', 'America/Argentina/Mendoza', 'America/Argentina/Ushuaia']],
  ['AM', 'Arménie', 'AMD', ['Asia/Yerevan']],
  ['AU', 'Australie', 'AUD', ['Australia/Sydney', 'Australia/Melbourne', 'Australia/Brisbane', 'Australia/Adelaide', 'Australia/Perth', 'Australia/Darwin', 'Australia/Hobart']],
  ['AT', 'Autriche', 'EUR', ['Europe/Vienna']],
  ['AZ', 'Azerbaïdjan', 'AZN', ['Asia/Baku']],
  ['BS', 'Bahamas', 'BSD', ['America/Nassau']],
  ['BH', 'Bahreïn', 'BHD', ['Asia/Bahrain']],
  ['BD', 'Bangladesh', 'BDT', ['Asia/Dhaka']],
  ['BB', 'Barbade', 'BBD', ['America/Barbados']],
  ['BE', 'Belgique', 'EUR', ['Europe/Brussels']],
  ['BZ', 'Belize', 'BZD', ['America/Belize']],
  ['BJ', 'Bénin', 'XOF', ['Africa/Porto-Novo']],
  ['BT', 'Bhoutan', 'BTN', ['Asia/Thimphu']],
  ['BY', 'Biélorussie', 'BYN', ['Europe/Minsk']],
  ['BO', 'Bolivie', 'BOB', ['America/La_Paz']],
  ['BA', 'Bosnie-Herzégovine', 'BAM', ['Europe/Sarajevo']],
  ['BW', 'Botswana', 'BWP', ['Africa/Gaborone']],
  ['BR', 'Brésil', 'BRL', ['America/Sao_Paulo', 'America/Bahia', 'America/Fortaleza', 'America/Manaus', 'America/Recife', 'America/Rio_Branco']],
  ['BN', 'Brunei', 'BND', ['Asia/Brunei']],
  ['BG', 'Bulgarie', 'BGN', ['Europe/Sofia']],
  ['BF', 'Burkina Faso', 'XOF', ['Africa/Ouagadougou']],
  ['BI', 'Burundi', 'BIF', ['Africa/Bujumbura']],
  ['KH', 'Cambodge', 'KHR', ['Asia/Phnom_Penh']],
  ['CM', 'Cameroun', 'XAF', ['Africa/Douala']],
  ['CA', 'Canada', 'CAD', ['America/Toronto', 'America/Montreal', 'America/Vancouver', 'America/Edmonton', 'America/Winnipeg', 'America/Halifax', 'America/St_Johns', 'America/Regina']],
  ['CV', 'Cap-Vert', 'CVE', ['Atlantic/Cape_Verde']],
  ['CL', 'Chili', 'CLP', ['America/Santiago', 'Pacific/Easter', 'America/Punta_Arenas']],
  ['CN', 'Chine', 'CNY', ['Asia/Shanghai', 'Asia/Urumqi']],
  ['CY', 'Chypre', 'EUR', ['Asia/Nicosia']],
  ['CO', 'Colombie', 'COP', ['America/Bogota']],
  ['KM', 'Comores', 'KMF', ['Indian/Comoro']],
  ['CG', 'Congo-Brazzaville', 'XAF', ['Africa/Brazzaville']],
  ['CD', 'Congo-Kinshasa', 'CDF', ['Africa/Kinshasa', 'Africa/Lubumbashi']],
  ['KR', 'Corée du Sud', 'KRW', ['Asia/Seoul']],
  ['KP', 'Corée du Nord', 'KPW', ['Asia/Pyongyang']],
  ['CR', 'Costa Rica', 'CRC', ['America/Costa_Rica']],
  ['CI', "Côte d'Ivoire", 'XOF', ['Africa/Abidjan']],
  ['HR', 'Croatie', 'EUR', ['Europe/Zagreb']],
  ['CU', 'Cuba', 'CUP', ['America/Havana']],
  ['DK', 'Danemark', 'DKK', ['Europe/Copenhagen']],
  ['DJ', 'Djibouti', 'DJF', ['Africa/Djibouti']],
  ['DM', 'Dominique', 'XCD', ['America/Dominica']],
  ['EG', 'Égypte', 'EGP', ['Africa/Cairo']],
  ['AE', 'Émirats arabes unis', 'AED', ['Asia/Dubai']],
  ['EC', 'Équateur', 'USD', ['America/Guayaquil', 'Pacific/Galapagos']],
  ['ER', 'Érythrée', 'ERN', ['Africa/Asmara']],
  ['ES', 'Espagne', 'EUR', ['Europe/Madrid', 'Atlantic/Canary']],
  ['EE', 'Estonie', 'EUR', ['Europe/Tallinn']],
  ['SZ', 'Eswatini', 'SZL', ['Africa/Mbabane']],
  ['US', 'États-Unis', 'USD', ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu']],
  ['ET', 'Éthiopie', 'ETB', ['Africa/Addis_Ababa']],
  ['FJ', 'Fidji', 'FJD', ['Pacific/Fiji']],
  ['FI', 'Finlande', 'EUR', ['Europe/Helsinki']],
  ['FR', 'France', 'EUR', ['Europe/Paris']],
  ['GA', 'Gabon', 'XAF', ['Africa/Libreville']],
  ['GM', 'Gambie', 'GMD', ['Africa/Banjul']],
  ['GE', 'Géorgie', 'GEL', ['Asia/Tbilisi']],
  ['GH', 'Ghana', 'GHS', ['Africa/Accra']],
  ['GR', 'Grèce', 'EUR', ['Europe/Athens']],
  ['GD', 'Grenade', 'XCD', ['America/Grenada']],
  ['GT', 'Guatemala', 'GTQ', ['America/Guatemala']],
  ['GN', 'Guinée', 'GNF', ['Africa/Conakry']],
  ['GW', 'Guinée-Bissau', 'XOF', ['Africa/Bissau']],
  ['GQ', 'Guinée équatoriale', 'XAF', ['Africa/Malabo']],
  ['GY', 'Guyana', 'GYD', ['America/Guyana']],
  ['HT', 'Haïti', 'HTG', ['America/Port-au-Prince']],
  ['HN', 'Honduras', 'HNL', ['America/Tegucigalpa']],
  ['HU', 'Hongrie', 'HUF', ['Europe/Budapest']],
  ['IN', 'Inde', 'INR', ['Asia/Kolkata']],
  ['ID', 'Indonésie', 'IDR', ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura', 'Asia/Pontianak']],
  ['IQ', 'Irak', 'IQD', ['Asia/Baghdad']],
  ['IR', 'Iran', 'IRR', ['Asia/Tehran']],
  ['IE', 'Irlande', 'EUR', ['Europe/Dublin']],
  ['IS', 'Islande', 'ISK', ['Atlantic/Reykjavik']],
  ['IL', 'Israël', 'ILS', ['Asia/Jerusalem']],
  ['IT', 'Italie', 'EUR', ['Europe/Rome']],
  ['JM', 'Jamaïque', 'JMD', ['America/Jamaica']],
  ['JP', 'Japon', 'JPY', ['Asia/Tokyo']],
  ['JO', 'Jordanie', 'JOD', ['Asia/Amman']],
  ['KZ', 'Kazakhstan', 'KZT', ['Asia/Almaty', 'Asia/Aqtobe', 'Asia/Aqtau']],
  ['KE', 'Kenya', 'KES', ['Africa/Nairobi']],
  ['KG', 'Kirghizistan', 'KGS', ['Asia/Bishkek']],
  ['KI', 'Kiribati', 'AUD', ['Pacific/Tarawa']],
  ['KW', 'Koweït', 'KWD', ['Asia/Kuwait']],
  ['LA', 'Laos', 'LAK', ['Asia/Vientiane']],
  ['LS', 'Lesotho', 'LSL', ['Africa/Maseru']],
  ['LV', 'Lettonie', 'EUR', ['Europe/Riga']],
  ['LB', 'Liban', 'LBP', ['Asia/Beirut']],
  ['LR', 'Liberia', 'LRD', ['Africa/Monrovia']],
  ['LY', 'Libye', 'LYD', ['Africa/Tripoli']],
  ['LI', 'Liechtenstein', 'CHF', ['Europe/Vaduz']],
  ['LT', 'Lituanie', 'EUR', ['Europe/Vilnius']],
  ['LU', 'Luxembourg', 'EUR', ['Europe/Luxembourg']],
  ['MK', 'Macédoine du Nord', 'MKD', ['Europe/Skopje']],
  ['MG', 'Madagascar', 'MGA', ['Indian/Antananarivo']],
  ['MY', 'Malaisie', 'MYR', ['Asia/Kuala_Lumpur', 'Asia/Kuching']],
  ['MW', 'Malawi', 'MWK', ['Africa/Blantyre']],
  ['MV', 'Maldives', 'MVR', ['Indian/Maldives']],
  ['ML', 'Mali', 'XOF', ['Africa/Bamako']],
  ['MT', 'Malte', 'EUR', ['Europe/Malta']],
  ['MA', 'Maroc', 'MAD', ['Africa/Casablanca']],
  ['MH', 'Îles Marshall', 'USD', ['Pacific/Majuro']],
  ['MU', 'Maurice', 'MUR', ['Indian/Mauritius']],
  ['MR', 'Mauritanie', 'MRU', ['Africa/Nouakchott']],
  ['MX', 'Mexique', 'MXN', ['America/Mexico_City', 'America/Cancun', 'America/Monterrey', 'America/Tijuana', 'America/Hermosillo']],
  ['FM', 'Micronésie', 'USD', ['Pacific/Pohnpei', 'Pacific/Chuuk']],
  ['MD', 'Moldavie', 'MDL', ['Europe/Chisinau']],
  ['MC', 'Monaco', 'EUR', ['Europe/Monaco']],
  ['MN', 'Mongolie', 'MNT', ['Asia/Ulaanbaatar']],
  ['ME', 'Monténégro', 'EUR', ['Europe/Podgorica']],
  ['MZ', 'Mozambique', 'MZN', ['Africa/Maputo']],
  ['MM', 'Myanmar', 'MMK', ['Asia/Yangon']],
  ['NA', 'Namibie', 'NAD', ['Africa/Windhoek']],
  ['NR', 'Nauru', 'AUD', ['Pacific/Nauru']],
  ['NP', 'Népal', 'NPR', ['Asia/Kathmandu']],
  ['NI', 'Nicaragua', 'NIO', ['America/Managua']],
  ['NE', 'Niger', 'XOF', ['Africa/Niamey']],
  ['NG', 'Nigeria', 'NGN', ['Africa/Lagos']],
  ['NO', 'Norvège', 'NOK', ['Europe/Oslo']],
  ['NZ', 'Nouvelle-Zélande', 'NZD', ['Pacific/Auckland', 'Pacific/Chatham']],
  ['OM', 'Oman', 'OMR', ['Asia/Muscat']],
  ['UG', 'Ouganda', 'UGX', ['Africa/Kampala']],
  ['UZ', 'Ouzbékistan', 'UZS', ['Asia/Tashkent', 'Asia/Samarkand']],
  ['PK', 'Pakistan', 'PKR', ['Asia/Karachi']],
  ['PW', 'Palaos', 'USD', ['Pacific/Palau']],
  ['PA', 'Panama', 'PAB', ['America/Panama']],
  ['PG', 'Papouasie-Nouvelle-Guinée', 'PGK', ['Pacific/Port_Moresby']],
  ['PY', 'Paraguay', 'PYG', ['America/Asuncion']],
  ['NL', 'Pays-Bas', 'EUR', ['Europe/Amsterdam']],
  ['PE', 'Pérou', 'PEN', ['America/Lima']],
  ['PH', 'Philippines', 'PHP', ['Asia/Manila']],
  ['PL', 'Pologne', 'PLN', ['Europe/Warsaw']],
  ['PT', 'Portugal', 'EUR', ['Europe/Lisbon', 'Atlantic/Azores', 'Atlantic/Madeira']],
  ['QA', 'Qatar', 'QAR', ['Asia/Qatar']],
  ['RO', 'Roumanie', 'RON', ['Europe/Bucharest']],
  ['GB', 'Royaume-Uni', 'GBP', ['Europe/London']],
  ['RU', 'Russie', 'RUB', ['Europe/Moscow', 'Europe/Kaliningrad', 'Asia/Yekaterinburg', 'Asia/Novosibirsk', 'Asia/Krasnoyarsk', 'Asia/Irkutsk', 'Asia/Yakutsk', 'Asia/Vladivostok', 'Asia/Magadan', 'Asia/Kamchatka']],
  ['RW', 'Rwanda', 'RWF', ['Africa/Kigali']],
  ['KN', 'Saint-Kitts-et-Nevis', 'XCD', ['America/St_Kitts']],
  ['SM', 'Saint-Marin', 'EUR', ['Europe/San_Marino']],
  ['VC', 'Saint-Vincent-et-les-Grenadines', 'XCD', ['America/St_Vincent']],
  ['LC', 'Sainte-Lucie', 'XCD', ['America/St_Lucia']],
  ['SB', 'Îles Salomon', 'SBD', ['Pacific/Guadalcanal']],
  ['SV', 'Salvador', 'USD', ['America/El_Salvador']],
  ['WS', 'Samoa', 'WST', ['Pacific/Apia']],
  ['ST', 'Sao Tomé-et-Principe', 'STN', ['Africa/Sao_Tome']],
  ['SN', 'Sénégal', 'XOF', ['Africa/Dakar']],
  ['RS', 'Serbie', 'RSD', ['Europe/Belgrade']],
  ['SC', 'Seychelles', 'SCR', ['Indian/Mahe']],
  ['SL', 'Sierra Leone', 'SLE', ['Africa/Freetown']],
  ['SG', 'Singapour', 'SGD', ['Asia/Singapore']],
  ['SK', 'Slovaquie', 'EUR', ['Europe/Bratislava']],
  ['SI', 'Slovénie', 'EUR', ['Europe/Ljubljana']],
  ['SO', 'Somalie', 'SOS', ['Africa/Mogadishu']],
  ['SD', 'Soudan', 'SDG', ['Africa/Khartoum']],
  ['SS', 'Soudan du Sud', 'SSP', ['Africa/Juba']],
  ['LK', 'Sri Lanka', 'LKR', ['Asia/Colombo']],
  ['SE', 'Suède', 'SEK', ['Europe/Stockholm']],
  ['CH', 'Suisse', 'CHF', ['Europe/Zurich']],
  ['SR', 'Suriname', 'SRD', ['America/Paramaribo']],
  ['SY', 'Syrie', 'SYP', ['Asia/Damascus']],
  ['TJ', 'Tadjikistan', 'TJS', ['Asia/Dushanbe']],
  ['TZ', 'Tanzanie', 'TZS', ['Africa/Dar_es_Salaam']],
  ['TD', 'Tchad', 'XAF', ["Africa/Ndjamena"]],
  ['CZ', 'Tchéquie', 'CZK', ['Europe/Prague']],
  ['TH', 'Thaïlande', 'THB', ['Asia/Bangkok']],
  ['TL', 'Timor oriental', 'USD', ['Asia/Dili']],
  ['TG', 'Togo', 'XOF', ['Africa/Lome']],
  ['TO', 'Tonga', 'TOP', ['Pacific/Tongatapu']],
  ['TT', 'Trinité-et-Tobago', 'TTD', ['America/Port_of_Spain']],
  ['TN', 'Tunisie', 'TND', ['Africa/Tunis']],
  ['TM', 'Turkménistan', 'TMT', ['Asia/Ashgabat']],
  ['TR', 'Turquie', 'TRY', ['Europe/Istanbul']],
  ['TV', 'Tuvalu', 'AUD', ['Pacific/Funafuti']],
  ['UA', 'Ukraine', 'UAH', ['Europe/Kyiv']],
  ['UY', 'Uruguay', 'UYU', ['America/Montevideo']],
  ['VU', 'Vanuatu', 'VUV', ['Pacific/Efate']],
  ['VE', 'Venezuela', 'VES', ['America/Caracas']],
  ['VN', 'Viêt Nam', 'VND', ['Asia/Ho_Chi_Minh']],
  ['YE', 'Yémen', 'YER', ['Asia/Aden']],
  ['ZM', 'Zambie', 'ZMW', ['Africa/Lusaka']],
  ['ZW', 'Zimbabwe', 'ZWL', ['Africa/Harare']],
];

export const COUNTRIES: Country[] = ROWS.map(([code, name, currency, timezones]) => ({
  code,
  name,
  currency,
  timezones,
})).sort((a, b) => a.name.localeCompare(b.name, 'fr'));

export const COUNTRY_BY_CODE: Record<string, Country> = Object.fromEntries(
  COUNTRIES.map((c) => [c.code, c]),
);

/** Étiquette lisible d'un fuseau : "Europe/Paris" → "Paris" + offset courant. */
export function timezoneLabel(tz: string): string {
  const city = tz.split('/').pop()?.replace(/_/g, ' ') ?? tz;
  let offset = '';
  try {
    const parts = new Intl.DateTimeFormat('fr-FR', {
      timeZone: tz,
      timeZoneName: 'shortOffset',
    }).formatToParts(new Date());
    offset = parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
  } catch {
    /* fuseau non reconnu par l'environnement — on affiche juste la ville */
  }
  return offset ? `${city} (${offset})` : city;
}
