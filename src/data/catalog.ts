import { logoManifest } from './logoManifest'
import { synopses } from './synopses'

export type UniverseId =
  | 'mcu'
  | 'fox'
  | 'raimi'
  | 'amazing'
  | 'sony'
  | 'legacy'
  | 'marvel-tv'
  | 'defenders'
  | 'animation'
  | 'alternate'

export type TitleFormat = 'Film' | 'Series' | 'Special' | 'Short'
export type ContinuityStatus = 'confirmed' | 'disputed' | 'alternate' | 'mcu-adjacent' | 'separate'

export interface Universe {
  id: UniverseId
  name: string
  shortName: string
  color: string
  earth?: string
  description: string
}

export interface MarvelTitle {
  id: string
  title: string
  year: number
  releaseDate: string
  format: TitleFormat
  seasons?: number
  universeId: UniverseId
  viewUniverseIds?: UniverseId[]
  continuity: string
  continuityStatus: ContinuityStatus
  earth?: string
  chronologyYear?: number
  track: string
  poster?: string
  /** Transparent title lockup used by the map and inspector when available. */
  logo?: string
  featured?: boolean
  event?: 'crossover' | 'hub' | 'future'
  released: boolean
  summary?: string
  /** One-to-two sentence plot synopsis (TMDB overview), shown in the inspector. */
  synopsis?: string
}

export type ConnectionType = 'direct-sequel' | 'crossover' | 'multiverse' | 'time-travel' | 'timeline-reset'

export interface Connection {
  id: string
  from: string
  to: string
  type: ConnectionType
  label: string
  explanation: string
}

export const universes: Universe[] = [
  { id: 'mcu', name: 'MCU / Earth-616', shortName: 'MCU / EARTH-616', color: '#f0253e', earth: 'Earth-616', description: 'Marvel Studios films, series, specials and shorts.' },
  { id: 'fox', name: 'Fox X-Men', shortName: 'FOX X-MEN', color: '#398cff', earth: 'Earth-10005', description: 'Original and revised mutant film timelines.' },
  { id: 'raimi', name: 'Raimi Spider-Man', shortName: 'RAIMI SPIDER-MAN', color: '#f6c63e', earth: 'Earth-96283', description: 'Sam Raimi’s Spider-Man trilogy.' },
  { id: 'amazing', name: 'Amazing Spider-Man', shortName: 'AMAZING SPIDER-MAN', color: '#21cee8', earth: 'Earth-120703', description: 'Marc Webb’s Amazing Spider-Man continuity.' },
  { id: 'sony', name: 'Sony / Venom', shortName: 'SONY / VENOM', color: '#bd65f5', description: 'Sony’s separate live-action Spider-Man character continuity.' },
  { id: 'legacy', name: 'Legacy Marvel', shortName: 'LEGACY MARVEL', color: '#a8b2c8', description: 'Independent pre-MCU and non-MCU film continuities.' },
  { id: 'marvel-tv', name: 'Marvel Television', shortName: 'MARVEL TELEVISION', color: '#51d98b', description: 'Broadcast, cable and streaming Marvel television continuities.' },
  { id: 'defenders', name: 'Defenders Saga', shortName: 'DEFENDERS SAGA', color: '#d35a68', description: 'The connected street-level saga, grouped under Marvel Television.' },
  { id: 'animation', name: 'Marvel Animation', shortName: 'MARVEL ANIMATION', color: '#ff9d4c', description: 'Animated series, films and specials across separate continuities.' },
  { id: 'alternate', name: 'Alternate Realities', shortName: 'ALTERNATE REALITIES', color: '#a999ff', description: 'Explicit alternate worlds and Marvel Studios multiverse animation.' },
]

type Seed = [
  title: string,
  releaseDate: string,
  format?: TitleFormat,
  seasons?: number,
  track?: string,
  chronologyYear?: number,
]

const slugify = (value: string) => value
  .toLowerCase()
  .replace(/&/g, 'and')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')

const posterByTitle: Record<string, string> = {
  'mcu:Iron Man': '/assets/posters/iron-man.jpg',
  'mcu:The Avengers': '/assets/posters/the-avengers.jpg',
  'mcu:Avengers: Endgame': '/assets/posters/avengers-endgame.jpg',
  'mcu:Spider-Man: Far From Home': '/assets/posters/spider-man-far-from-home.jpg',
  'mcu:Spider-Man: No Way Home': '/assets/posters/spider-man-no-way-home.jpg',
  'mcu:Doctor Strange in the Multiverse of Madness': '/assets/posters/doctor-strange-multiverse.jpg',
  'mcu:Deadpool & Wolverine': '/assets/posters/deadpool-wolverine.jpg',
  'mcu:The Fantastic Four: First Steps': '/assets/posters/fantastic-four-first-steps.jpg',
  'fox:X-Men': '/assets/posters/x-men.jpg',
  'fox:Logan': '/assets/posters/logan.jpg',
  'fox:Deadpool': '/assets/posters/deadpool.png',
  'raimi:Spider-Man': '/assets/posters/spider-man-2002.jpg',
  'raimi:Spider-Man 2': '/assets/posters/spider-man-2.jpg',
  'raimi:Spider-Man 3': '/assets/posters/spider-man-3.jpg',
  'amazing:The Amazing Spider-Man': '/assets/posters/amazing-spider-man.jpg',
  'amazing:The Amazing Spider-Man 2': '/assets/posters/amazing-spider-man-2.jpg',
  'sony:Venom': '/assets/posters/venom.png',
  'sony:Venom: Let There Be Carnage': '/assets/posters/venom-carnage.jpg',
  'legacy:Blade': '/assets/posters/blade.jpg',
  'animation:Spider-Man: Into the Spider-Verse': '/assets/posters/spider-verse.png',
}

// Logos stay separate from posters so the map can remain a title-archive rather
// than turning into a wall of stills. More records can be added here as local
// transparent assets are collected; titles without one use the same styled
// wordmark fallback rendered by TitleNode.
const logoByTitle: Record<string, string> = logoManifest

// Same-titled records in different continuities share a universe:title key, so
// films that need distinct artwork are overridden here by catalog id.
const logoById: Record<string, string> = {
  'legacy-captain-america-1944': '/assets/logos/legacy-captain-america-1944.png',
  'legacy-captain-america-1979': '/assets/logos/legacy-captain-america-1979.png',
  'legacy-captain-america-1990': '/assets/logos/legacy-captain-america-1990.png',
  'legacy-fantastic-four-2005': '/assets/logos/legacy-fantastic-four-2005.png',
  'legacy-fantastic-four-2015': '/assets/logos/legacy-fantastic-four-2015.png',
  'legacy-the-punisher-1989': '/assets/logos/legacy-the-punisher-1989.png',
  'legacy-the-punisher-2004': '/assets/logos/legacy-the-punisher-2004.png',
}

const featuredTitles = new Set([
  'Iron Man', 'The Avengers', 'Avengers: Endgame', 'Spider-Man: Far From Home',
  'Spider-Man: No Way Home', 'Doctor Strange in the Multiverse of Madness',
  'Loki', 'Thunderbolts*', 'The Fantastic Four: First Steps', 'Spider-Man: Brand New Day',
  'X-Men', 'Logan', 'Deadpool', 'Deadpool & Wolverine',
  'Spider-Man', 'Spider-Man 2', 'Spider-Man 3',
  'The Amazing Spider-Man', 'The Amazing Spider-Man 2',
  'Venom', 'Venom: Let There Be Carnage', 'Morbius', 'Venom: The Last Dance',
  'Blade', 'Daredevil', 'Fantastic Four', 'Ghost Rider',
  'Agents of S.H.I.E.L.D.', 'The Defenders', 'X-Men: The Animated Series',
  'Spider-Man: Into the Spider-Verse', 'Spider-Man: Across the Spider-Verse',
  'What If...?', 'Marvel Zombies', 'X-Men ’97', 'Your Friendly Neighborhood Spider-Man',
  'Avengers: Doomsday', 'Avengers: Secret Wars',
])

const isFeatured = (universeId: UniverseId, title: string, year: number) => {
  if (!featuredTitles.has(title)) return false
  if (title === 'Spider-Man') return universeId === 'raimi'
  if (title === 'The Amazing Spider-Man') return universeId === 'amazing'
  if (title === 'Daredevil') return universeId === 'legacy' || universeId === 'defenders'
  if (title === 'Fantastic Four') return universeId === 'legacy' && year === 2005
  return true
}

const addGroup = (
  universeId: UniverseId,
  continuity: string,
  status: ContinuityStatus,
  earth: string | undefined,
  seeds: Seed[],
  released = true,
): MarvelTitle[] => seeds.map(([title, releaseDate, format = 'Film', seasons, track = continuity, chronologyYear]) => ({
  id: `${universeId}-${slugify(title)}-${releaseDate.slice(0, 4)}`,
  title,
  year: Number(releaseDate.slice(0, 4)),
  releaseDate,
  format,
  seasons,
  universeId,
  continuity,
  continuityStatus: status,
  earth,
  chronologyYear,
  track,
  poster: posterByTitle[`${universeId}:${title}`],
  logo: logoByTitle[`${universeId}:${title}`],
  featured: isFeatured(universeId, title, Number(releaseDate.slice(0, 4))),
  released,
}))

const mcuFilms = addGroup('mcu', 'Marvel Studios main continuity', 'confirmed', 'Earth-616', [
  ['Iron Man', '2008-05-02', 'Film', undefined, 'mcu-films', 2010],
  ['The Incredible Hulk', '2008-06-13', 'Film', undefined, 'mcu-films', 2010],
  ['Iron Man 2', '2010-05-07', 'Film', undefined, 'mcu-films', 2010],
  ['Thor', '2011-05-06', 'Film', undefined, 'mcu-films', 2011],
  ['Captain America: The First Avenger', '2011-07-22', 'Film', undefined, 'mcu-films', 1943],
  ['The Avengers', '2012-05-04', 'Film', undefined, 'mcu-films', 2012],
  ['Iron Man 3', '2013-05-03', 'Film', undefined, 'mcu-films', 2013],
  ['Thor: The Dark World', '2013-11-08', 'Film', undefined, 'mcu-films', 2013],
  ['Captain America: The Winter Soldier', '2014-04-04', 'Film', undefined, 'mcu-films', 2014],
  ['Guardians of the Galaxy', '2014-08-01', 'Film', undefined, 'mcu-films', 2014],
  ['Avengers: Age of Ultron', '2015-05-01', 'Film', undefined, 'mcu-films', 2015],
  ['Ant-Man', '2015-07-17', 'Film', undefined, 'mcu-films', 2015],
  ['Captain America: Civil War', '2016-05-06', 'Film', undefined, 'mcu-films', 2016],
  ['Doctor Strange', '2016-11-04', 'Film', undefined, 'mcu-films', 2016],
  ['Guardians of the Galaxy Vol. 2', '2017-05-05', 'Film', undefined, 'mcu-films', 2014],
  ['Spider-Man: Homecoming', '2017-07-07', 'Film', undefined, 'mcu-films', 2016],
  ['Thor: Ragnarok', '2017-11-03', 'Film', undefined, 'mcu-films', 2017],
  ['Black Panther', '2018-02-16', 'Film', undefined, 'mcu-films', 2016],
  ['Avengers: Infinity War', '2018-04-27', 'Film', undefined, 'mcu-films', 2018],
  ['Ant-Man and the Wasp', '2018-07-06', 'Film', undefined, 'mcu-films', 2018],
  ['Captain Marvel', '2019-03-08', 'Film', undefined, 'mcu-films', 1995],
  ['Avengers: Endgame', '2019-04-26', 'Film', undefined, 'mcu-films', 2023],
  ['Spider-Man: Far From Home', '2019-07-02', 'Film', undefined, 'mcu-films', 2024],
  ['Black Widow', '2021-07-09', 'Film', undefined, 'mcu-films', 2016],
  ['Shang-Chi and the Legend of the Ten Rings', '2021-09-03', 'Film', undefined, 'mcu-films', 2024],
  ['Eternals', '2021-11-05', 'Film', undefined, 'mcu-films', 2024],
  ['Spider-Man: No Way Home', '2021-12-17', 'Film', undefined, 'mcu-films', 2024],
  ['Doctor Strange in the Multiverse of Madness', '2022-05-06', 'Film', undefined, 'mcu-films', 2024],
  ['Thor: Love and Thunder', '2022-07-08', 'Film', undefined, 'mcu-films', 2025],
  ['Black Panther: Wakanda Forever', '2022-11-11', 'Film', undefined, 'mcu-films', 2025],
  ['Ant-Man and the Wasp: Quantumania', '2023-02-17', 'Film', undefined, 'mcu-films', 2026],
  ['Guardians of the Galaxy Vol. 3', '2023-05-05', 'Film', undefined, 'mcu-films', 2026],
  ['The Marvels', '2023-11-10', 'Film', undefined, 'mcu-films', 2026],
  ['Deadpool & Wolverine', '2024-07-26', 'Film', undefined, 'mcu-crossovers', 2024],
  ['Captain America: Brave New World', '2025-02-14', 'Film', undefined, 'mcu-films', 2027],
  ['Thunderbolts*', '2025-05-02', 'Film', undefined, 'mcu-films', 2027],
  ['The Fantastic Four: First Steps', '2025-07-25', 'Film', undefined, 'mcu-alt-films', 2027],
  ['Spider-Man: Brand New Day', '2026-07-31', 'Film', undefined, 'mcu-films', 2027],
])

const mcuSeries = addGroup('mcu', 'Marvel Studios television and specials', 'confirmed', 'Earth-616', [
  ['The Consultant', '2011-09-13', 'Short', undefined, 'mcu-one-shots', 2011],
  ['A Funny Thing Happened on the Way to Thor’s Hammer', '2011-10-25', 'Short', undefined, 'mcu-one-shots', 2010],
  ['Item 47', '2012-09-25', 'Short', undefined, 'mcu-one-shots', 2012],
  ['Agent Carter', '2013-09-03', 'Short', undefined, 'mcu-one-shots', 1946],
  ['All Hail the King', '2014-02-04', 'Short', undefined, 'mcu-one-shots', 2013],
  ['WHIH Newsfront', '2015-07-02', 'Short', 2, 'mcu-web', 2015],
  ['Team Thor', '2016-08-28', 'Short', undefined, 'mcu-shorts', 2016],
  ['Team Thor: Part 2', '2017-02-14', 'Short', undefined, 'mcu-shorts', 2016],
  ['Team Darryl', '2018-02-20', 'Short', undefined, 'mcu-shorts', 2017],
  ['Peter’s To-Do List', '2019-10-01', 'Short', undefined, 'mcu-shorts', 2024],
  ['The Daily Bugle', '2019-10-23', 'Short', 3, 'mcu-web', 2024],
  ['WandaVision', '2021-01-15', 'Series', 1, 'mcu-series', 2023],
  ['Agent Carter', '2015-01-06', 'Series', 2, 'mcu-series', 1946],
  ['The Falcon and the Winter Soldier', '2021-03-19', 'Series', 1, 'mcu-series', 2024],
  ['Loki', '2021-06-09', 'Series', 2, 'mcu-tva', 2023],
  ['Hawkeye', '2021-11-24', 'Series', 1, 'mcu-series', 2024],
  ['Moon Knight', '2022-03-30', 'Series', 1, 'mcu-series', 2025],
  ['Ms. Marvel', '2022-06-08', 'Series', 1, 'mcu-series', 2025],
  ['I Am Groot', '2022-08-10', 'Short', 2, 'mcu-animation', 2014],
  ['She-Hulk: Attorney at Law', '2022-08-18', 'Series', 1, 'mcu-series', 2025],
  ['Werewolf by Night', '2022-10-07', 'Special', undefined, 'mcu-specials', 2025],
  ['The Guardians of the Galaxy Holiday Special', '2022-11-25', 'Special', undefined, 'mcu-specials', 2025],
  ['Secret Invasion', '2023-06-21', 'Series', 1, 'mcu-series', 2026],
  ['Echo', '2024-01-09', 'Series', 1, 'mcu-series', 2025],
  ['Agatha All Along', '2024-09-18', 'Series', 1, 'mcu-series', 2026],
  ['Daredevil: Born Again', '2025-03-04', 'Series', 2, 'mcu-defenders-revival', 2026],
  ['Ironheart', '2025-06-24', 'Series', 1, 'mcu-series', 2025],
  ['Eyes of Wakanda', '2025-08-01', 'Series', 1, 'mcu-animation', 1942],
  ['Wonder Man', '2026-01-27', 'Series', 1, 'mcu-series', 2027],
  ['Daredevil: Born Again — Season 2', '2026-03-24', 'Series', 1, 'mcu-defenders-revival', 2027],
  ['The Punisher: One Last Kill', '2026-05-12', 'Special', undefined, 'mcu-defenders-revival', 2027],
])

const fox = addGroup('fox', 'Fox X-Men film continuity', 'disputed', 'Earth-10005', [
  // Story years from Fox tie-in chronologies + consensus guides. The DoFP
  // 1973 divergence splits original (erased) from revised (canonical) lines;
  // DoFP's 2023 future frames the bridge entry itself (see note below).
  ['X-Men: First Class', '2011-06-03', 'Film', undefined, 'fox-revised', 1962],
  ['X-Men Origins: Wolverine', '2009-05-01', 'Film', undefined, 'fox-wolverine-origin', 1979],
  ['X-Men', '2000-07-14', 'Film', undefined, 'fox-original', 2004],
  ['X2: X-Men United', '2003-05-02', 'Film', undefined, 'fox-original', 2004],
  ['X-Men: The Last Stand', '2006-05-26', 'Film', undefined, 'fox-original', 2006],
  ['The Wolverine', '2013-07-26', 'Film', undefined, 'fox-original', 2013],
  ['X-Men: Days of Future Past', '2014-05-23', 'Film', undefined, 'fox-revised', 1973],
  ['X-Men: Apocalypse', '2016-05-27', 'Film', undefined, 'fox-revised', 1983],
  ['Dark Phoenix', '2019-06-07', 'Film', undefined, 'fox-revised', 1992],
  ['Deadpool', '2016-02-12', 'Film', undefined, 'fox-deadpool', 2016],
  ['Deadpool 2', '2018-05-18', 'Film', undefined, 'fox-deadpool', 2018],
  ['The New Mutants', '2020-08-28', 'Film', undefined, 'fox-new-mutants', 2020],
  ['Logan', '2017-03-03', 'Film', undefined, 'fox-logan-future', 2029],
])

const raimi = addGroup('raimi', 'Raimi trilogy', 'confirmed', 'Earth-96283', [
  ['Spider-Man', '2002-05-03', 'Film', undefined, 'raimi-trilogy', 2002],
  ['Spider-Man 2', '2004-06-30', 'Film', undefined, 'raimi-trilogy', 2004],
  ['Spider-Man 3', '2007-05-04', 'Film', undefined, 'raimi-trilogy', 2007],
])

const amazing = addGroup('amazing', 'Amazing Spider-Man films', 'confirmed', 'Earth-120703', [
  ['The Amazing Spider-Man', '2012-07-03', 'Film', undefined, 'amazing-duology', 2012],
  ['The Amazing Spider-Man 2', '2014-05-02', 'Film', undefined, 'amazing-duology', 2014],
])

const sony = addGroup('sony', 'Sony live-action continuity', 'disputed', undefined, [
  ['Madame Web', '2024-02-14', 'Film', undefined, 'sony-madame-web', 2003],
  ['Venom', '2018-10-05', 'Film', undefined, 'venom-series', 2018],
  ['Venom: Let There Be Carnage', '2021-10-01', 'Film', undefined, 'venom-series', 2021],
  ['Morbius', '2022-04-01', 'Film', undefined, 'sony-morbius', 2022],
  ['Venom: The Last Dance', '2024-10-25', 'Film', undefined, 'venom-series', 2024],
  ['Kraven the Hunter', '2024-12-13', 'Film', undefined, 'sony-kraven', 2024],
])

const legacy = [
  ...addGroup('legacy', 'Captain America serial continuity', 'separate', undefined, [
    ['Captain America', '1944-02-05', 'Series', 1, 'legacy-cap-serial'],
  ]),
  ...addGroup('legacy', 'Incredible Hulk television continuity', 'separate', undefined, [
    ['The Incredible Hulk', '1977-11-04', 'Series', 5, 'legacy-hulk-tv'],
    ['The Incredible Hulk Returns', '1988-05-22', 'Film', undefined, 'legacy-hulk-tv'],
    ['The Trial of the Incredible Hulk', '1989-05-07', 'Film', undefined, 'legacy-hulk-tv'],
    ['The Death of the Incredible Hulk', '1990-02-18', 'Film', undefined, 'legacy-hulk-tv'],
  ]),
  ...addGroup('legacy', 'Independent television films', 'separate', undefined, [
    ['The Amazing Spider-Man', '1977-09-14', 'Film', undefined, 'legacy-spider-tv'],
    ['Spider-Man Strikes Back', '1978-05-08', 'Film', undefined, 'legacy-spider-tv'],
    ['Spider-Man: The Dragon’s Challenge', '1981-05-09', 'Film', undefined, 'legacy-spider-tv'],
    ['Dr. Strange', '1978-09-06', 'Film', undefined, 'legacy-dr-strange'],
    ['Captain America', '1979-01-19', 'Film', undefined, 'legacy-cap-tv'],
    ['Captain America II: Death Too Soon', '1979-11-23', 'Film', undefined, 'legacy-cap-tv'],
    ['Generation X', '1996-02-20', 'Film', undefined, 'legacy-generation-x'],
    ['Nick Fury: Agent of S.H.I.E.L.D.', '1998-05-26', 'Film', undefined, 'legacy-nick-fury'],
    ['Power Pack', '1991-09-28', 'Film', undefined, 'legacy-power-pack'],
    ['Spider-Man (Toei)', '1978-05-17', 'Series', 1, 'legacy-toei-spider'],
    ['Spider-Man (Toei film)', '1978-07-22', 'Film', undefined, 'legacy-toei-spider'],
  ]),
  ...addGroup('legacy', 'Standalone legacy films', 'separate', undefined, [
    ['Howard the Duck', '1986-08-01', 'Film', undefined, 'legacy-howard'],
    ['The Punisher', '1989-10-05', 'Film', undefined, 'legacy-punisher-1989'],
    ['Captain America', '1990-12-14', 'Film', undefined, 'legacy-cap-1990'],
    ['Hulk', '2003-06-20', 'Film', undefined, 'legacy-hulk-2003'],
    ['Man-Thing', '2005-04-21', 'Film', undefined, 'legacy-man-thing'],
  ]),
  ...addGroup('legacy', 'Blade trilogy', 'confirmed', undefined, [
    ['Blade', '1998-08-21', 'Film', undefined, 'legacy-blade'],
    ['Blade II', '2002-03-22', 'Film', undefined, 'legacy-blade'],
    ['Blade: Trinity', '2004-12-08', 'Film', undefined, 'legacy-blade'],
    ['Blade: The Series', '2006-06-28', 'Series', 1, 'legacy-blade'],
  ]),
  ...addGroup('legacy', 'Daredevil / Elektra continuity', 'confirmed', undefined, [
    ['Daredevil', '2003-02-14', 'Film', undefined, 'legacy-daredevil'],
    ['Elektra', '2005-01-14', 'Film', undefined, 'legacy-daredevil'],
  ]),
  ...addGroup('legacy', 'Fantastic Four film continuity', 'confirmed', 'Earth-121698', [
    ['Fantastic Four', '2005-07-08', 'Film', undefined, 'legacy-ff'],
    ['Fantastic Four: Rise of the Silver Surfer', '2007-06-15', 'Film', undefined, 'legacy-ff'],
  ]),
  ...addGroup('legacy', 'Fantastic Four reboot continuity', 'separate', 'Earth-15866', [
    ['Fantastic Four', '2015-08-07', 'Film', undefined, 'legacy-ff-2015'],
  ]),
  ...addGroup('legacy', 'Ghost Rider films', 'disputed', undefined, [
    ['Ghost Rider', '2007-02-16', 'Film', undefined, 'legacy-ghost-rider'],
    ['Ghost Rider: Spirit of Vengeance', '2012-02-17', 'Film', undefined, 'legacy-ghost-rider'],
  ]),
  ...addGroup('legacy', 'Punisher films', 'separate', undefined, [
    ['The Punisher', '2004-04-16', 'Film', undefined, 'legacy-punisher-2004'],
    ['Punisher: War Zone', '2008-12-05', 'Film', undefined, 'legacy-punisher-war-zone'],
  ]),
]

const marvelTv = [
  ...addGroup('marvel-tv', 'Marvel Television / adjacent continuities', 'disputed', undefined, [
    ['Mutant X', '2001-10-06', 'Series', 3, 'marvel-tv-mutant-x'],
    ['Agents of S.H.I.E.L.D.', '2013-09-24', 'Series', 7, 'marvel-tv-shield'],
    ['Agents of S.H.I.E.L.D.: Slingshot', '2016-12-13', 'Short', 1, 'marvel-tv-shield'],
    ['Legion', '2017-02-08', 'Series', 3, 'marvel-tv-fox'],
    ['The Gifted', '2017-10-02', 'Series', 2, 'marvel-tv-fox'],
    ['Runaways', '2017-11-21', 'Series', 3, 'marvel-tv-young'],
    ['Cloak & Dagger', '2018-06-07', 'Series', 2, 'marvel-tv-young'],
    ['Helstrom', '2020-10-16', 'Series', 1, 'marvel-tv-helstrom'],
  ]),
  // Ignored by every later production: kept for orientation, not continuity.
  ...addGroup('marvel-tv', 'Marvel Television / adjacent continuities', 'separate', undefined, [
    ['Inhumans', '2017-09-29', 'Series', 1, 'marvel-tv-inhumans'],
  ]),
]

const defenders = addGroup('defenders', 'Defenders Saga', 'mcu-adjacent', 'Earth-616', [
  ['Daredevil', '2015-04-10', 'Series', 3, 'defenders-saga'],
  ['Jessica Jones', '2015-11-20', 'Series', 3, 'defenders-saga'],
  ['Luke Cage', '2016-09-30', 'Series', 2, 'defenders-saga'],
  ['Iron Fist', '2017-03-17', 'Series', 2, 'defenders-saga'],
  ['The Defenders', '2017-08-18', 'Series', 1, 'defenders-saga'],
  ['The Punisher', '2017-11-17', 'Series', 2, 'defenders-saga'],
])

const animation = [
  ...addGroup('animation', 'Classic Marvel animation', 'alternate', undefined, [
    ['The Marvel Super Heroes', '1966-09-01', 'Series', 1, 'animation-classic'],
    ['Fantastic Four', '1967-09-09', 'Series', 1, 'animation-classic'],
    ['Spider-Man', '1967-09-09', 'Series', 3, 'animation-classic'],
    ['The New Fantastic Four', '1978-09-09', 'Series', 1, 'animation-classic'],
    ['Spider-Woman', '1979-09-22', 'Series', 1, 'animation-classic'],
    ['Fred and Barney Meet the Thing', '1979-09-08', 'Series', 1, 'animation-classic'],
    ['Spider-Man', '1981-09-12', 'Series', 1, 'animation-1980s'],
    ['Spider-Man and His Amazing Friends', '1981-09-12', 'Series', 3, 'animation-1980s'],
    ['The Incredible Hulk', '1982-09-18', 'Series', 1, 'animation-1980s'],
    ['Pryde of the X-Men', '1989-09-16', 'Special', undefined, 'animation-xmen-pilot'],
  ]),
  ...addGroup('animation', '1990s animated continuities', 'alternate', undefined, [
    ['X-Men: The Animated Series', '1992-10-31', 'Series', 5, 'animation-xmen-92'],
    ['Fantastic Four', '1994-09-24', 'Series', 2, 'animation-marvel-action-hour'],
    ['Iron Man', '1994-09-24', 'Series', 2, 'animation-marvel-action-hour'],
    ['Spider-Man: The Animated Series', '1994-11-19', 'Series', 5, 'animation-spider-94'],
    ['The Incredible Hulk', '1996-09-08', 'Series', 2, 'animation-1990s'],
    ['Silver Surfer', '1998-02-07', 'Series', 1, 'animation-silver-surfer'],
    ['Spider-Man Unlimited', '1999-10-02', 'Series', 1, 'animation-spider-unlimited'],
    ['Avengers: United They Stand', '1999-10-30', 'Series', 1, 'animation-avengers-united'],
  ]),
  ...addGroup('animation', 'Modern animated series', 'alternate', undefined, [
    ['X-Men: Evolution', '2000-11-04', 'Series', 4, 'animation-xmen-evolution'],
    ['Spider-Man: The New Animated Series', '2003-07-11', 'Series', 1, 'animation-spider-mtv'],
    ['Fantastic Four: World’s Greatest Heroes', '2006-09-02', 'Series', 1, 'animation-ff-wgh'],
    ['The Spectacular Spider-Man', '2008-03-08', 'Series', 2, 'animation-spectacular'],
    ['Wolverine and the X-Men', '2009-01-23', 'Series', 1, 'animation-wolverine-xmen'],
    ['Iron Man: Armored Adventures', '2009-04-24', 'Series', 2, 'animation-armored'],
    ['The Super Hero Squad Show', '2009-09-14', 'Series', 2, 'animation-super-hero-squad'],
    ['The Avengers: Earth’s Mightiest Heroes', '2010-09-22', 'Series', 2, 'animation-avengers-emh'],
    ['Ultimate Spider-Man', '2012-04-01', 'Series', 4, 'animation-ultimate-spider'],
    ['Avengers Assemble', '2013-05-26', 'Series', 5, 'animation-avengers-assemble'],
    ['Hulk and the Agents of S.M.A.S.H.', '2013-08-11', 'Series', 2, 'animation-smash'],
    ['Marvel Disk Wars: The Avengers', '2014-04-02', 'Series', 1, 'animation-disk-wars'],
    ['Guardians of the Galaxy', '2015-09-26', 'Series', 3, 'animation-guardians'],
    ['Marvel Future Avengers', '2017-07-22', 'Series', 2, 'animation-future-avengers'],
    ['Marvel’s Spider-Man', '2017-08-19', 'Series', 3, 'animation-spider-2017'],
    ['Big Hero 6: The Series', '2017-11-20', 'Series', 3, 'animation-big-hero'],
    ['Marvel Rising', '2018-08-13', 'Series', 1, 'animation-marvel-rising'],
    ['M.O.D.O.K.', '2021-05-21', 'Series', 1, 'animation-modok'],
    ['Hit-Monkey', '2021-11-17', 'Series', 2, 'animation-hit-monkey'],
    ['Spidey and His Amazing Friends', '2021-08-06', 'Series', 4, 'animation-spidey-friends'],
    ['Baymax!', '2022-06-29', 'Series', 1, 'animation-big-hero'],
    ['Moon Girl and Devil Dinosaur', '2023-02-10', 'Series', 2, 'animation-moon-girl'],
    ['X-Men ’97', '2024-03-20', 'Series', 2, 'animation-xmen-92'],
    ['Iron Man and His Awesome Friends', '2025-08-11', 'Series', 1, 'animation-preschool'],
    ['LEGO Marvel Avengers: Strange Tails', '2025-11-14', 'Special', undefined, 'animation-lego'],
  ]),
  ...addGroup('animation', 'Marvel Anime', 'alternate', undefined, [
    ['Iron Man: Anime', '2010-10-01', 'Series', 1, 'animation-anime'],
    ['Wolverine: Anime', '2011-01-07', 'Series', 1, 'animation-anime'],
    ['X-Men: Anime', '2011-04-01', 'Series', 1, 'animation-anime'],
    ['Blade: Anime', '2011-07-01', 'Series', 1, 'animation-anime'],
  ]),
  ...addGroup('animation', 'Animated features and specials', 'alternate', undefined, [
    ['Dracula: Sovereign of the Damned', '1980-08-19', 'Film', undefined, 'animation-toei-horror'],
    ['The Monster of Frankenstein', '1981-07-27', 'Film', undefined, 'animation-toei-horror'],
    ['Ultimate Avengers', '2006-02-21', 'Film', undefined, 'animation-ultimate-avengers'],
    ['Ultimate Avengers 2', '2006-08-08', 'Film', undefined, 'animation-ultimate-avengers'],
    ['The Invincible Iron Man', '2007-01-23', 'Film', undefined, 'animation-lionsgate'],
    ['Doctor Strange: The Sorcerer Supreme', '2007-08-14', 'Film', undefined, 'animation-lionsgate'],
    ['Next Avengers: Heroes of Tomorrow', '2008-09-02', 'Film', undefined, 'animation-lionsgate'],
    ['Hulk Vs.', '2009-01-27', 'Film', undefined, 'animation-lionsgate'],
    ['Planet Hulk', '2010-02-02', 'Film', undefined, 'animation-lionsgate'],
    ['Thor: Tales of Asgard', '2011-05-17', 'Film', undefined, 'animation-lionsgate'],
    ['Iron Man: Rise of Technovore', '2013-04-16', 'Film', undefined, 'animation-anime-films'],
    ['Iron Man & Hulk: Heroes United', '2013-12-03', 'Film', undefined, 'animation-heroes-united'],
    ['Avengers Confidential: Black Widow & Punisher', '2014-03-25', 'Film', undefined, 'animation-anime-films'],
    ['Iron Man & Captain America: Heroes United', '2014-07-29', 'Film', undefined, 'animation-heroes-united'],
    ['Big Hero 6', '2014-11-07', 'Film', undefined, 'animation-big-hero'],
    ['Marvel Super Hero Adventures: Frost Fight!', '2016-02-23', 'Special', undefined, 'animation-animated-specials'],
    ['Hulk: Where Monsters Dwell', '2016-10-21', 'Film', undefined, 'animation-animated-specials'],
    ['LEGO Marvel Super Heroes: Maximum Overload', '2013-11-05', 'Special', undefined, 'animation-lego'],
    ['LEGO Marvel Super Heroes: Avengers Reassembled', '2015-11-16', 'Special', undefined, 'animation-lego'],
    ['LEGO Marvel Super Heroes: The Thanos Threat', '2017-12-09', 'Special', undefined, 'animation-lego'],
    ['LEGO Marvel Super Heroes: Trouble in Wakanda', '2018-06-03', 'Special', undefined, 'animation-lego'],
    ['LEGO Marvel Spider-Man: Vexed by Venom', '2019-08-03', 'Special', undefined, 'animation-lego'],
    ['LEGO Marvel Avengers: Climate Conundrum', '2020-10-23', 'Special', undefined, 'animation-lego'],
    ['LEGO Marvel Avengers: Loki in Training', '2021-11-01', 'Special', undefined, 'animation-lego'],
    ['LEGO Marvel Avengers: Time Twisted', '2022-01-17', 'Special', undefined, 'animation-lego'],
    ['LEGO Marvel Avengers: Code Red', '2023-10-27', 'Special', undefined, 'animation-lego'],
    ['LEGO Marvel Avengers: Mission Demolition', '2024-10-18', 'Special', undefined, 'animation-lego'],
  ]),
  ...addGroup('animation', 'Spider-Verse films', 'alternate', 'Earth-1610B / connected worlds', [
    ['Spider-Man: Into the Spider-Verse', '2018-12-14', 'Film', undefined, 'spider-verse-films'],
    ['Spider-Ham: Caught in a Ham', '2019-02-26', 'Short', undefined, 'spider-verse-films'],
    ['Spider-Man: Across the Spider-Verse', '2023-06-02', 'Film', undefined, 'spider-verse-films'],
    ['The Spider Within: A Spider-Verse Story', '2024-03-27', 'Short', undefined, 'spider-verse-films'],
  ]),
  ...addGroup('animation', 'Marvel Rising universe', 'alternate', undefined, [
    ['Marvel Rising: Secret Warriors', '2018-09-30', 'Film', undefined, 'animation-marvel-rising'],
    ['Marvel Rising: Chasing Ghosts', '2019-01-16', 'Special', undefined, 'animation-marvel-rising'],
    ['Marvel Rising: Heart of Iron', '2019-04-03', 'Special', undefined, 'animation-marvel-rising'],
    ['Marvel Rising: Battle of the Bands', '2019-08-28', 'Special', undefined, 'animation-marvel-rising'],
    ['Marvel Rising: Operation Shuri', '2019-10-11', 'Special', undefined, 'animation-marvel-rising'],
    ['Marvel Rising: Playing with Fire', '2019-12-18', 'Special', undefined, 'animation-marvel-rising'],
  ]),
]

const alternate = addGroup('alternate', 'Marvel Studios alternate realities', 'alternate', 'Multiple realities', [
  ['What If...?', '2021-08-11', 'Series', 3, 'what-if'],
  ['Your Friendly Neighborhood Spider-Man', '2025-01-29', 'Series', 1, 'friendly-spider'],
  ['Marvel Zombies', '2025-09-24', 'Series', 1, 'marvel-zombies'],
])

const sonyAlternate = addGroup('sony', 'Sony alternate live-action reality', 'alternate', undefined, [
  ['Spider-Noir', '2026-05-25', 'Series', 1, 'sony-noir', 1933],
])

const futureEvents = [
  ...addGroup('mcu', 'Future convergence event', 'confirmed', 'Multiple realities', [
    ['Avengers: Doomsday', '2026-12-18', 'Film', undefined, 'future-convergence', 2027],
    ['Avengers: Secret Wars', '2027-12-17', 'Film', undefined, 'future-convergence'],
  ], false),
  ...addGroup('animation', 'Spider-Verse films', 'alternate', 'Connected Spider-Verse worlds', [
    ['Spider-Man: Beyond the Spider-Verse', '2027-06-18', 'Film', undefined, 'spider-verse-films'],
  ], false),
  ...addGroup('mcu', 'Announced Marvel Television', 'confirmed', 'Earth-616', [
    ['VisionQuest', '2026-10-14', 'Series', 1, 'mcu-series', 2026],
  ], false),
]

const sharedAnimationTracks = new Set([
  'animation-xmen-92',
  'spider-verse-films',
  'animation-ultimate-avengers',
  'animation-heroes-united',
  'animation-big-hero',
  'animation-anime',
  'animation-marvel-rising',
])

export const catalog: MarvelTitle[] = [
  ...mcuFilms,
  ...mcuSeries,
  ...fox,
  ...raimi,
  ...amazing,
  ...sony,
  ...legacy,
  ...marvelTv,
  ...defenders,
  ...animation,
  ...alternate,
  ...sonyAlternate,
  ...futureEvents,
].map((title) => {
  const event = title.title === 'Spider-Man: No Way Home' || title.title === 'Deadpool & Wolverine'
    ? 'crossover'
    : title.title === 'Loki'
      ? 'hub'
      : title.released ? undefined : 'future'
  const summary = title.title === 'Spider-Man: No Way Home'
    ? 'A fractured spell brings visitors from separate Spider-Man realities into the MCU.'
    : title.title === 'Loki'
      ? 'The TVA sits outside ordinary time and exposes the branching architecture of the multiverse.'
      : undefined
  return {
    ...title,
    logo: logoById[title.id] ?? title.logo,
    track: title.universeId === 'animation' && !sharedAnimationTracks.has(title.track)
      ? `${title.track}:${title.id}`
      : title.track,
    earth: title.title === 'The Fantastic Four: First Steps' ? 'Earth-828' : title.earth,
    viewUniverseIds: title.title === 'Deadpool & Wolverine'
      ? ['fox']
      : title.title === 'The Fantastic Four: First Steps'
        ? ['alternate']
        : title.title === 'Eyes of Wakanda'
          ? ['animation']
          : title.universeId === 'defenders'
            ? ['marvel-tv']
            : title.viewUniverseIds,
    event,
    summary,
    synopsis: synopses[title.id],
  }
})

const idOf = (universeId: UniverseId, title: string) => {
  const match = catalog.find((item) => item.universeId === universeId && item.title === title)
  if (!match) throw new Error(`Missing catalog title: ${universeId} / ${title}`)
  return match.id
}

const connect = (
  id: string,
  fromUniverse: UniverseId,
  fromTitle: string,
  toUniverse: UniverseId,
  toTitle: string,
  type: ConnectionType,
  explanation: string,
): Connection => ({
  id,
  from: idOf(fromUniverse, fromTitle),
  to: idOf(toUniverse, toTitle),
  type,
  label: type.replace('-', ' '),
  explanation,
})

export const connections: Connection[] = [
  connect('mcu-spider-home-far', 'mcu', 'Spider-Man: Homecoming', 'mcu', 'Spider-Man: Far From Home', 'direct-sequel', 'Peter Parker’s MCU film story continues after the Avengers conflict and the Blip.'),
  connect('mcu-spider-far-nwh', 'mcu', 'Spider-Man: Far From Home', 'mcu', 'Spider-Man: No Way Home', 'direct-sequel', 'No Way Home begins directly from the public identity reveal at the end of Far From Home.'),
  connect('mcu-spider-nwh-brandnew', 'mcu', 'Spider-Man: No Way Home', 'mcu', 'Spider-Man: Brand New Day', 'direct-sequel', 'Brand New Day continues the MCU Peter Parker story after the world forgets his identity.'),
  connect('guardians-1-2', 'mcu', 'Guardians of the Galaxy', 'mcu', 'Guardians of the Galaxy Vol. 2', 'direct-sequel', 'The second Guardians film continues the same team’s story shortly after their formation.'),
  connect('guardians-2-holiday', 'mcu', 'Guardians of the Galaxy Vol. 2', 'mcu', 'The Guardians of the Galaxy Holiday Special', 'direct-sequel', 'The Holiday Special revisits the team and leads into Vol. 3.'),
  connect('guardians-holiday-3', 'mcu', 'The Guardians of the Galaxy Holiday Special', 'mcu', 'Guardians of the Galaxy Vol. 3', 'direct-sequel', 'The team’s Knowhere status and relationships in the Holiday Special carry into Vol. 3.'),
  connect('wandavision-agatha', 'mcu', 'WandaVision', 'mcu', 'Agatha All Along', 'direct-sequel', 'Agatha’s series follows the Westview spell and consequences established in WandaVision.'),
  connect('wandavision-mom', 'mcu', 'WandaVision', 'mcu', 'Doctor Strange in the Multiverse of Madness', 'crossover', 'Wanda’s grief, magic and Darkhold story after Westview drive the central conflict of Multiverse of Madness.'),
  connect('hawkeye-echo', 'mcu', 'Hawkeye', 'mcu', 'Echo', 'direct-sequel', 'Maya Lopez and Wilson Fisk’s story continues from Hawkeye into Echo.'),
  connect('echo-born-again', 'mcu', 'Echo', 'mcu', 'Daredevil: Born Again', 'crossover', 'Fisk and Daredevil’s street-level arcs continue toward the political conflict in Born Again.'),
  connect('defenders-daredevil-bornagain', 'defenders', 'Daredevil', 'mcu', 'Daredevil: Born Again', 'direct-sequel', 'Marvel’s current MCU chronology treats Born Again as a continuation of Matt Murdock and Fisk’s earlier Defenders Saga history.'),
  connect('punisher-series-special', 'defenders', 'The Punisher', 'mcu', 'The Punisher: One Last Kill', 'direct-sequel', 'The special continues Frank Castle’s story from the Defenders-era series before and during the Born Again conflict.'),
  connect('punisher-special-bornagain2', 'mcu', 'The Punisher: One Last Kill', 'mcu', 'Daredevil: Born Again — Season 2', 'crossover', 'Frank Castle’s special feeds into his role in the second season of Daredevil: Born Again.'),
  connect('falcon-bravenewworld', 'mcu', 'The Falcon and the Winter Soldier', 'mcu', 'Captain America: Brave New World', 'direct-sequel', 'Sam Wilson’s acceptance of the Captain America mantle continues into Brave New World.'),
  connect('wakanda-ironheart', 'mcu', 'Black Panther: Wakanda Forever', 'mcu', 'Ironheart', 'direct-sequel', 'Riri Williams’s Wakandan introduction precedes her return to Chicago in Ironheart.'),
  connect('captainmarvel-marvels', 'mcu', 'Captain Marvel', 'mcu', 'The Marvels', 'crossover', 'Carol Danvers returns as one of the three linked heroes at the center of The Marvels.'),
  connect('msmarvel-marvels', 'mcu', 'Ms. Marvel', 'mcu', 'The Marvels', 'crossover', 'Kamala Khan’s bangle and admiration for Captain Marvel lead directly into the three-hero convergence.'),
  connect('cloak-runaways', 'marvel-tv', 'Cloak & Dagger', 'marvel-tv', 'Runaways', 'crossover', 'Tandy and Tyrone cross into the third season of Runaways; this is a supported television crossover, not a claim that every Marvel Television show shares one Earth.'),
  connect('raimi-1-2', 'raimi', 'Spider-Man', 'raimi', 'Spider-Man 2', 'direct-sequel', 'Peter Parker’s story continues in the same Raimi continuity.'),
  connect('raimi-2-3', 'raimi', 'Spider-Man 2', 'raimi', 'Spider-Man 3', 'direct-sequel', 'The trilogy continues in the same Raimi continuity.'),
  connect('amazing-1-2', 'amazing', 'The Amazing Spider-Man', 'amazing', 'The Amazing Spider-Man 2', 'direct-sequel', 'Andrew Garfield’s Peter Parker continues in the same Amazing Spider-Man continuity.'),
  connect('venom-1-2', 'sony', 'Venom', 'sony', 'Venom: Let There Be Carnage', 'direct-sequel', 'Eddie Brock and Venom continue in Sony’s live-action continuity.'),
  connect('venom-2-3', 'sony', 'Venom: Let There Be Carnage', 'sony', 'Venom: The Last Dance', 'direct-sequel', 'The Last Dance continues Eddie and Venom’s story in the same Sony continuity.'),
  connect('fox-x1-x2', 'fox', 'X-Men', 'fox', 'X2: X-Men United', 'direct-sequel', 'The original X-Men cast and conflicts continue directly.'),
  connect('fox-x2-x3', 'fox', 'X2: X-Men United', 'fox', 'X-Men: The Last Stand', 'direct-sequel', 'The Last Stand follows the original X-Men film timeline.'),
  connect('fox-firstclass-dofp', 'fox', 'X-Men: First Class', 'fox', 'X-Men: Days of Future Past', 'time-travel', 'Days of Future Past returns to the younger cast and uses time travel to change mutant history.'),
  connect('fox-laststand-dofp', 'fox', 'X-Men: The Last Stand', 'fox', 'X-Men: Days of Future Past', 'timeline-reset', 'Wolverine travels back from the original future, creating a revised timeline rather than an ordinary sequel chain.'),
  connect('fox-dofp-apocalypse', 'fox', 'X-Men: Days of Future Past', 'fox', 'X-Men: Apocalypse', 'direct-sequel', 'Apocalypse proceeds from the revised past created in Days of Future Past.'),
  connect('fox-apocalypse-darkphoenix', 'fox', 'X-Men: Apocalypse', 'fox', 'Dark Phoenix', 'direct-sequel', 'Dark Phoenix follows the younger X-Men cast in the revised film timeline.'),
  connect('fox-deadpool-2', 'fox', 'Deadpool', 'fox', 'Deadpool 2', 'direct-sequel', 'Deadpool 2 directly continues Wade Wilson’s story.'),
  connect('fox-deadpool-dpw', 'fox', 'Deadpool 2', 'mcu', 'Deadpool & Wolverine', 'direct-sequel', 'Deadpool and Wolverine continues Wade Wilson’s story while moving it into a TVA-driven multiverse event.'),
  connect('nwh-raimi', 'raimi', 'Spider-Man 3', 'mcu', 'Spider-Man: No Way Home', 'multiverse', 'Tobey Maguire’s Peter Parker and villains from the Raimi reality enter the MCU through Doctor Strange’s fractured spell.'),
  connect('nwh-amazing', 'amazing', 'The Amazing Spider-Man 2', 'mcu', 'Spider-Man: No Way Home', 'multiverse', 'Andrew Garfield’s Peter Parker and villains from the Amazing reality enter the MCU through the same multiverse breach.'),
  connect('nwh-venom', 'sony', 'Venom: Let There Be Carnage', 'mcu', 'Spider-Man: No Way Home', 'multiverse', 'The Venom post-credit sequence briefly displaces Eddie Brock into the MCU; the link is limited and does not merge the continuities.'),
  connect('nwh-venom-return', 'mcu', 'Spider-Man: No Way Home', 'sony', 'Venom: The Last Dance', 'multiverse', 'Eddie returns to his own reality after the MCU detour; the symbiote residue is a consequence, not a merger of universes.'),
  connect('endgame-loki', 'mcu', 'Avengers: Endgame', 'mcu', 'Loki', 'time-travel', 'The Avengers’ 2012 time-heist creates the Loki variant whose escape leads to the TVA.'),
  connect('loki-whatif', 'mcu', 'Loki', 'alternate', 'What If...?', 'multiverse', 'The TVA’s branching timeline framework provides context for the alternate realities observed by the Watcher.'),
  connect('whatif-zombies', 'alternate', 'What If...?', 'alternate', 'Marvel Zombies', 'crossover', 'Marvel Zombies expands the zombie reality first explored in What If...? into its own animated series.'),
  connect('logan-dpw', 'fox', 'Logan', 'mcu', 'Deadpool & Wolverine', 'multiverse', 'Deadpool’s world faces collapse after the death of its anchor being, Logan, while a different Wolverine variant is recruited.'),
  connect('loki-dpw', 'mcu', 'Loki', 'mcu', 'Deadpool & Wolverine', 'multiverse', 'The TVA and Void connect Deadpool’s Fox-related reality with people and artifacts from other timelines.'),
  connect('blade-dpw', 'legacy', 'Blade', 'mcu', 'Deadpool & Wolverine', 'multiverse', 'The Void contains the Blade variant from the legacy film continuity, who joins the resistance.'),
  connect('elektra-dpw', 'legacy', 'Elektra', 'mcu', 'Deadpool & Wolverine', 'multiverse', 'The legacy Elektra appears in the Void as part of the resistance against Cassandra Nova.'),
  connect('ff-dpw', 'legacy', 'Fantastic Four', 'mcu', 'Deadpool & Wolverine', 'multiverse', 'A version of Johnny Storm from the 2005 Fantastic Four continuity is stranded in the Void.'),
  connect('spiderverse-sequel', 'animation', 'Spider-Man: Into the Spider-Verse', 'animation', 'Spider-Man: Across the Spider-Verse', 'direct-sequel', 'Across the Spider-Verse directly continues Miles Morales’s story and expands the connected Spider-Society realities.'),
  connect('spiderverse-beyond', 'animation', 'Spider-Man: Across the Spider-Verse', 'animation', 'Spider-Man: Beyond the Spider-Verse', 'direct-sequel', 'Beyond the Spider-Verse is the announced continuation of the unresolved Across the Spider-Verse story.'),
  connect('xmen92-xmen97', 'animation', 'X-Men: The Animated Series', 'animation', 'X-Men ’97', 'direct-sequel', 'X-Men ’97 revives and directly continues the 1990s animated continuity.'),
  connect('ff-doomsday', 'mcu', 'The Fantastic Four: First Steps', 'mcu', 'Avengers: Doomsday', 'multiverse', 'Marvel has confirmed that the Fantastic Four return in Doomsday, where worlds collide.'),
  connect('thunderbolts-doomsday', 'mcu', 'Thunderbolts*', 'mcu', 'Avengers: Doomsday', 'multiverse', 'The Thunderbolts* post-credit scene shows the Fantastic Four ship entering Earth-616 airspace — the first on-screen tease of the Doomsday convergence.'),
  connect('bnw-doomsday', 'mcu', 'Captain America: Brave New World', 'mcu', 'Avengers: Doomsday', 'multiverse', 'Brave New World establishes the adamantium arms race over the Celestial Island — the resource conflict positioned as setup for the Doomsday convergence.'),
  connect('doomsday-secretwars', 'mcu', 'Avengers: Doomsday', 'mcu', 'Avengers: Secret Wars', 'direct-sequel', 'Secret Wars is positioned as the next announced Avengers convergence after Doomsday.'),
]

export const selectedDefaultId = idOf('mcu', 'Spider-Man: No Way Home')

export const catalogStats = {
  released: catalog.filter((item) => item.released).length,
  announced: catalog.filter((item) => !item.released).length,
  universes: universes.length,
}
