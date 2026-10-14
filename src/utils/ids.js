

let _idc = 0;

const uid = (p) => `${p}_${Date.now().toString(36)}${(_idc++).toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;

const uniq = (a) => [...new Set(a)];

/* ------------------------- STYLIZED MAP LANDMASSES ------------------------ */

export { uid, uniq };
