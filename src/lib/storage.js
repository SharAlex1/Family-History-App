import { makeSeed } from "../data/seed.js";

const LS_KEY = "familyAtlas.v2";

function loadSaved() { try { const r = window.localStorage.getItem(LS_KEY); if (r) return JSON.parse(r); } catch (e) {} return null; }

function persist(d) { try { window.localStorage.setItem(LS_KEY, JSON.stringify(d)); } catch (e) {} }

function coercePerson(p) {
  const branches = Array.isArray(p.branches) ? p.branches : (p.branch ? [p.branch] : []);
  const { branch, ...rest } = p;
  return { ...rest, branches };
}

function normalize(d) {
  const seed = makeSeed();
  return {
    people: Array.isArray(d.people) ? d.people.map(coercePerson) : seed.people,
    locations: Array.isArray(d.locations) ? d.locations : seed.locations,
    events: Array.isArray(d.events) ? d.events : seed.events,
    documents: Array.isArray(d.documents) ? d.documents : seed.documents,
    migrations: Array.isArray(d.migrations) ? d.migrations : [],
    branches: Array.isArray(d.branches) ? d.branches : seed.branches,
  };
}

/* ================================= APP ================================= */

export { LS_KEY, loadSaved, persist, coercePerson, normalize };
