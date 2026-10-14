import { C } from "../config/theme.js";
import { uid } from "../utils/ids.js";

function makeSeed() {
  const locations = [
    { id: "minsk",    name: "Minsk",         region: "Belarus",       lat: 53.9, lng: 27.6, x: 712, y: 196, desc: "Where the family's story begins." },
    { id: "warsaw",   name: "Warsaw",        region: "Poland",        lat: 52.2, lng: 21.0, x: 666, y: 206, desc: "A decade between the wars." },
    { id: "berlin",   name: "Berlin",        region: "Germany",       lat: 52.5, lng: 13.4, x: 622, y: 212, desc: "A short, uneasy stay." },
    { id: "brooklyn", name: "Brooklyn, NY",  region: "United States", lat: 40.6, lng: -73.9, x: 288, y: 236, desc: "The American anchor of the family." },
    { id: "la",       name: "Los Angeles",   region: "United States", lat: 34.0, lng: -118.2, x: 150, y: 300, desc: "Where the western branch took root." },
    { id: "sf",       name: "San Francisco", region: "United States", lat: 37.8, lng: -122.4, x: 132, y: 262, desc: "The present-day Bay Area branch." },
    { id: "telaviv",  name: "Tel Aviv",      region: "Israel",        lat: 32.1, lng: 34.8, x: 694, y: 318, desc: "The eastern branch founded by Lena." },
  ];
  const branches = [
    { id: "kaminski", name: "Kaminski", color: C.teal },
    { id: "roth",     name: "Roth",     color: C.violet },
  ];
  const people = [
    { id: "yosef", first: "Yosef", last: "Kaminski", gender: "m", branches: ["kaminski"], birth: 1896, death: 1971, born: "minsk", avatar: "", parents: [], spouses: ["rivka"], children: ["avram", "lena"], residences: [{ at: "minsk", from: 1896 }, { at: "warsaw", from: 1921 }, { at: "berlin", from: 1933 }, { at: "brooklyn", from: 1938 }], bio: "Patriarch of the line. A bookbinder from Minsk who carried the family west ahead of the wars." },
    { id: "rivka", first: "Rivka", last: "Kaminski", gender: "f", branches: ["kaminski"], birth: 1900, death: 1979, born: "minsk", avatar: "", parents: [], spouses: ["yosef"], children: ["avram", "lena"], residences: [{ at: "minsk", from: 1900 }, { at: "warsaw", from: 1921 }, { at: "berlin", from: 1933 }, { at: "brooklyn", from: 1938 }], bio: "Née Levin. Kept the family's letters and photographs through four countries." },
    { id: "avram", first: "Avram", last: "Kaminski", gender: "m", branches: ["kaminski"], birth: 1925, death: 2004, born: "warsaw", avatar: "", parents: ["yosef", "rivka"], spouses: ["sara"], children: ["david", "hannah"], residences: [{ at: "warsaw", from: 1925 }, { at: "berlin", from: 1933 }, { at: "brooklyn", from: 1938 }], bio: "Came of age between languages. Served in the U.S. Army, then ran the family print shop." },
    { id: "sara", first: "Sara", last: "Kaminski", gender: "f", branches: ["kaminski"], birth: 1928, death: 2011, born: "warsaw", avatar: "", parents: [], spouses: ["avram"], children: ["david", "hannah"], residences: [{ at: "warsaw", from: 1928 }, { at: "brooklyn", from: 1947 }], bio: "Née Goldstein. Taught piano on Eastern Parkway for decades." },
    { id: "lena", first: "Lena", last: "Roth", gender: "f", branches: ["roth"], birth: 1930, death: 2018, born: "warsaw", avatar: "", parents: ["yosef", "rivka"], spouses: ["daniel"], children: ["miriam"], residences: [{ at: "warsaw", from: 1930 }, { at: "berlin", from: 1933 }, { at: "brooklyn", from: 1938 }, { at: "telaviv", from: 1951 }], bio: "Left Brooklyn at twenty-one to help build a new town outside Tel Aviv." },
    { id: "daniel", first: "Daniel", last: "Roth", gender: "m", branches: ["roth"], birth: 1927, death: 2009, born: "berlin", avatar: "", parents: [], spouses: ["lena"], children: ["miriam"], residences: [{ at: "berlin", from: 1927 }, { at: "telaviv", from: 1949 }], bio: "An agronomist from Berlin who emigrated in 1949." },
    { id: "david", first: "David", last: "Kaminski", gender: "m", branches: ["kaminski"], birth: 1955, death: null, born: "brooklyn", avatar: "", parents: ["avram", "sara"], spouses: ["maria"], children: ["sam", "ella"], residences: [{ at: "brooklyn", from: 1955 }, { at: "la", from: 1980 }], bio: "First of the line born in America. Built an architecture practice in Los Angeles." },
    { id: "maria", first: "Maria", last: "Kaminski", gender: "f", branches: ["kaminski"], birth: 1958, death: null, born: "la", avatar: "", parents: [], spouses: ["david"], children: ["sam", "ella"], residences: [{ at: "la", from: 1958 }], bio: "Née Alvarez. Born and raised in Los Angeles." },
    { id: "hannah", first: "Hannah", last: "Kaminski", gender: "f", branches: ["kaminski"], birth: 1960, death: null, born: "brooklyn", avatar: "", parents: ["avram", "sara"], spouses: [], children: [], residences: [{ at: "brooklyn", from: 1960 }], bio: "A civil-rights attorney who still lives near the old print shop." },
    { id: "miriam", first: "Miriam", last: "Roth", gender: "f", branches: ["roth"], birth: 1958, death: null, born: "telaviv", avatar: "", parents: ["lena", "daniel"], spouses: [], children: [], residences: [{ at: "telaviv", from: 1958 }], bio: "A documentary filmmaker who keeps the family in contact across continents." },
    { id: "sam", first: "Sam", last: "Kaminski", gender: "m", branches: ["kaminski"], birth: 1985, death: null, born: "la", avatar: "", parents: ["david", "maria"], spouses: [], children: ["noah"], residences: [{ at: "la", from: 1985 }, { at: "sf", from: 2010 }], bio: "Moved to San Francisco for software work in 2010." },
    { id: "ella", first: "Ella", last: "Kaminski", gender: "f", branches: ["kaminski"], birth: 1988, death: null, born: "la", avatar: "", parents: ["david", "maria"], spouses: [], children: [], residences: [{ at: "la", from: 1988 }, { at: "sf", from: 2014 }], bio: "A marine biologist who began digitizing this archive in 2023." },
    { id: "noah", first: "Noah", last: "Kaminski", gender: "m", branches: ["kaminski"], birth: 2016, death: null, born: "sf", avatar: "", parents: ["sam"], spouses: [], children: [], residences: [{ at: "sf", from: 2016 }], bio: "The youngest leaf — five generations from a bookbinder's workshop in Minsk." },
  ];
  const events = [
    { id: "e1", type: "birth", year: 1896, people: ["yosef"], at: "minsk", title: "Yosef Kaminski born", desc: "Born in Minsk.", docs: [], historical: false },
    { id: "e3", type: "marriage", year: 1920, people: ["yosef", "rivka"], at: "minsk", title: "Yosef & Rivka marry", desc: "Married in Minsk in 1920.", docs: ["d1"], historical: false },
    { id: "e4", type: "migration", year: 1921, people: ["yosef", "rivka"], at: "warsaw", title: "Minsk → Warsaw", desc: "The young couple leaves for Warsaw.", docs: ["d8"], historical: false },
    { id: "e5", type: "birth", year: 1925, people: ["avram"], at: "warsaw", title: "Avram Kaminski born", desc: "Born in Warsaw.", docs: [], historical: false },
    { id: "e8", type: "birth", year: 1930, people: ["lena"], at: "warsaw", title: "Lena Kaminski born", desc: "Born in Warsaw.", docs: [], historical: false },
    { id: "e9", type: "migration", year: 1933, people: ["yosef", "rivka", "avram", "lena"], at: "berlin", title: "Warsaw → Berlin", desc: "A short stay in Berlin for work.", docs: [], historical: false },
    { id: "h1", type: "historical", year: 1933, people: [], at: "berlin", title: "Political upheaval in Germany", desc: "Rising danger reshapes the family's plans.", docs: [], historical: true },
    { id: "e10", type: "migration", year: 1938, people: ["yosef", "rivka", "avram", "lena"], at: "brooklyn", title: "Berlin → Brooklyn", desc: "The family emigrates aboard the SS Manhattan.", docs: ["d2"], historical: false },
    { id: "h2", type: "historical", year: 1939, people: [], at: "berlin", title: "Second World War begins", desc: "The Europe the family left goes to war.", docs: [], historical: true },
    { id: "e11", type: "military", year: 1944, people: ["avram"], at: "brooklyn", title: "Avram enlists, U.S. Army", desc: "Serves in the European theater.", docs: ["d3"], historical: false },
    { id: "e13", type: "marriage", year: 1947, people: ["avram", "sara"], at: "brooklyn", title: "Avram & Sara marry", desc: "Married in Brooklyn.", docs: [], historical: false },
    { id: "e15", type: "marriage", year: 1950, people: ["lena", "daniel"], at: "brooklyn", title: "Lena & Daniel marry", desc: "Married before relocating abroad.", docs: [], historical: false },
    { id: "e16", type: "migration", year: 1951, people: ["lena"], at: "telaviv", title: "Brooklyn → Tel Aviv", desc: "Lena founds the family's eastern branch.", docs: ["d4"], historical: false },
    { id: "e17", type: "birth", year: 1955, people: ["david"], at: "brooklyn", title: "David Kaminski born", desc: "First of the line born in America.", docs: [], historical: false },
    { id: "e21", type: "education", year: 1977, people: ["david"], at: "brooklyn", title: "David graduates in architecture", desc: "Earns his degree before heading west.", docs: ["d5"], historical: false },
    { id: "e22", type: "migration", year: 1980, people: ["david"], at: "la", title: "Brooklyn → Los Angeles", desc: "David moves west to start his career.", docs: [], historical: false },
    { id: "e24", type: "career", year: 1985, people: ["david"], at: "la", title: "Kaminski Studio founded", desc: "David opens his own architecture practice.", docs: ["d6"], historical: false },
    { id: "e25", type: "birth", year: 1985, people: ["sam"], at: "la", title: "Sam Kaminski born", desc: "Born in Los Angeles.", docs: [], historical: false },
    { id: "e27", type: "death", year: 1971, people: ["yosef"], at: "brooklyn", title: "Yosef Kaminski dies", desc: "Dies in Brooklyn at 75.", docs: [], historical: false },
    { id: "e32", type: "death", year: 2018, people: ["lena"], at: "telaviv", title: "Lena Roth dies", desc: "Dies in Tel Aviv at 88.", docs: [], historical: false },
    { id: "e33", type: "migration", year: 2010, people: ["sam"], at: "sf", title: "Los Angeles → San Francisco", desc: "Sam moves north for software work.", docs: [], historical: false },
    { id: "e35", type: "birth", year: 2016, people: ["noah"], at: "sf", title: "Noah Kaminski born", desc: "The youngest in the archive.", docs: [], historical: false },
    { id: "e36", type: "milestone", year: 2023, people: ["david", "ella", "sam", "hannah", "miriam", "noah"], at: "sf", title: "Family reunion, San Francisco", desc: "Three branches gather to digitize the archive.", docs: ["d7"], historical: false },
  ];
  const documents = [
    { id: "d1", title: "Marriage certificate", type: "certificate", year: 1920, people: ["yosef", "rivka"], events: ["e3"], desc: "Civil record of the marriage in Minsk." },
    { id: "d2", title: "Ship manifest — SS Manhattan", type: "record", year: 1938, people: ["yosef", "rivka", "avram", "lena"], events: ["e10"], desc: "Passenger manifest from arrival in New York." },
    { id: "d3", title: "Army discharge papers", type: "record", year: 1946, people: ["avram"], events: ["e11"], desc: "Avram's honorable discharge." },
    { id: "d4", title: "Passport — Lena", type: "passport", year: 1951, people: ["lena"], events: ["e16"], desc: "Issued for travel to Tel Aviv." },
    { id: "d5", title: "University diploma", type: "certificate", year: 1977, people: ["david"], events: ["e21"], desc: "David's degree in architecture." },
    { id: "d6", title: "Newspaper clipping", type: "clipping", year: 1985, people: ["david"], events: ["e24"], desc: "Feature on the opening of Kaminski Studio." },
    { id: "d7", title: "Reunion photograph", type: "photo", year: 2023, people: ["david", "ella", "sam", "hannah", "miriam", "noah"], events: ["e36"], desc: "Three branches together in San Francisco." },
    { id: "d8", title: "Letter from Minsk", type: "letter", year: 1919, people: ["yosef"], events: [], desc: "A letter Yosef carried west." },
  ];
  const migrations = genMigrations(people, locations);
  return { people, locations, events, documents, migrations, branches };
}


function genMigrations(people, locations) {
  const ln = Object.fromEntries(locations.map((l) => [l.id, l.name]));
  const out = [];
  people.forEach((p) => {
    for (let i = 1; i < p.residences.length; i++) {
      const from = p.residences[i - 1].at, to = p.residences[i].at;
      out.push({ id: uid("mig"), mode: "person", personId: p.id, branch: (p.branches && p.branches[0]) || "", from, to, startYear: p.residences[i].from, endYear: null, description: `${ln[from] || from} → ${ln[to] || to}` });
    }
  });
  return out;
}

/* ----------------------------- DERIVED CONSTS ---------------------------- */

export { makeSeed, genMigrations };
