import {tr} from "../i18n/index.js";
import { useState, useEffect } from "react";
import * as d3 from "d3";

const LAND_PATHS = [
  // North & Central America (Pacific NW, west coast, Baja, Gulf of Mexico, Florida, Atlantic seaboard, Canada)
  "M150 176 C138 205 130 232 126 260 C130 278 138 292 144 300 C152 318 158 334 166 346 C178 342 192 348 208 350 C226 350 244 344 260 338 C272 340 282 348 294 354 C304 350 308 336 306 320 C305 298 304 272 300 248 C299 242 298 238 300 234 C306 220 316 210 326 204 C336 198 340 190 335 180 C318 170 280 161 240 159 C198 158 164 162 150 176 Z",
  // South America
  "M286 360 C270 364 261 377 267 392 C273 408 281 426 289 446 C295 466 301 490 307 512 C311 521 318 521 323 511 C331 489 339 462 349 438 C359 414 369 396 366 379 C364 367 352 359 335 359 C318 358 300 357 286 360 Z",
  // Greenland
  "M380 90 C360 100 352 130 360 155 C366 172 382 184 406 184 C432 184 452 168 458 144 C462 124 452 102 430 92 C412 84 396 84 380 90 Z",
  // Iceland
  "M500 166 C493 168 492 176 499 179 C507 181 512 174 507 168 C504 165 502 165 500 166 Z",
  // Great Britain
  "M530 186 C521 190 520 202 527 212 C531 218 539 215 540 206 C542 196 537 188 532 185 C531 185 530 185 530 186 Z",
  // Ireland
  "M510 199 C504 201 504 210 511 213 C518 215 520 206 516 200 C514 198 512 198 510 199 Z",
  // Europe (Iberia, France, Scandinavia, the Italian boot, the Balkans, east toward Belarus)
  "M548 246 C542 232 548 222 560 220 C556 214 558 208 566 206 C575 210 582 206 586 198 C590 192 598 188 605 186 C600 178 604 170 612 172 C616 176 620 178 624 176 C626 168 630 162 636 158 C644 152 652 148 658 150 C662 154 660 162 656 168 C652 174 648 178 652 182 C660 184 678 182 696 184 C708 185 718 188 724 196 C728 204 726 214 718 220 C708 226 698 230 692 236 C684 242 676 244 668 244 C660 246 654 250 648 248 C642 244 640 238 636 236 C632 244 630 254 628 261 C624 262 620 256 619 248 C616 240 612 234 608 228 C600 230 590 234 582 236 C572 238 564 240 558 244 C556 250 552 250 548 246 Z",
  // Africa (Atlantic bulge of West Africa, southern cape, East Africa, the Horn, Red Sea coast, Mediterranean shore)
  "M545 268 C539 282 539 298 545 310 C551 320 559 322 565 330 C559 344 556 358 560 370 C567 384 578 392 588 406 C598 424 606 442 614 458 C620 468 628 470 634 460 C642 444 648 426 654 408 C662 388 668 372 672 356 C678 366 690 374 702 376 C712 376 716 368 712 360 C704 356 696 354 690 346 C686 334 684 320 682 304 C681 292 680 284 680 278 C668 272 648 268 626 266 C604 264 582 264 564 266 C556 266 550 266 545 268 Z",
  // Asia & the Middle East (Anatolia, the Levant coast, the Arabian peninsula, India, and the Siberian north)
  "M724 150 C760 142 820 138 880 142 C930 146 975 150 988 160 C992 175 990 200 985 220 C980 245 972 262 968 280 C962 300 958 318 952 332 C944 340 936 338 930 330 C922 338 916 352 912 368 C906 384 900 398 894 404 C888 398 884 384 882 368 C878 350 872 340 862 338 C850 340 840 346 832 350 C820 356 808 364 800 372 C792 380 784 382 776 378 C766 372 760 360 758 348 C752 338 748 330 744 322 C738 314 732 308 728 302 C722 308 716 314 708 320 C700 326 694 324 688 316 C686 304 686 290 686 276 C684 268 682 260 688 254 C702 250 720 250 740 250 C748 244 746 236 740 232 C728 236 718 238 712 234 C710 226 712 216 718 210 C716 196 718 174 722 158 C722 154 723 152 724 150 Z",
];

/* ------------------------------ SEED DATA -------------------------------- */

const WORLD_SOURCES = [
  "https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json",
  "https://unpkg.com/world-atlas@2/land-110m.json",
  "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/land-110m.json",
];
// Minimal, dependency-free TopoJSON → GeoJSON Feature decoder.

function topoFeature(topology, o) {
  const tf = topology.transform;
  const abs = (() => {
    if (tf == null) return (input) => input.slice();
    let x0, y0; const kx = tf.scale[0], ky = tf.scale[1], dx = tf.translate[0], dy = tf.translate[1];
    return (input, i) => { if (!i) { x0 = 0; y0 = 0; } x0 += input[0]; y0 += input[1]; return [x0 * kx + dx, y0 * ky + dy]; };
  })();
  function arc(i, points) {
    if (points.length) points.pop();
    const a = topology.arcs[i < 0 ? ~i : i];
    const tmp = [];
    for (let k = 0; k < a.length; k++) tmp.push(abs(a[k], k));
    if (i < 0) tmp.reverse();
    for (let k = 0; k < tmp.length; k++) points.push(tmp[k]);
    return points;
  }
  function line(arcs) { const pts = []; for (let i = 0; i < arcs.length; i++) arc(arcs[i], pts); return pts; }
  const polygon = (arcs) => arcs.map(line);
  function geom(g) {
    switch (g.type) {
      case "GeometryCollection": return { type: "GeometryCollection", geometries: g.geometries.map(geom) };
      case "Polygon": return { type: "Polygon", coordinates: polygon(g.arcs) };
      case "MultiPolygon": return { type: "MultiPolygon", coordinates: g.arcs.map(polygon) };
      case "LineString": return { type: "LineString", coordinates: line(g.arcs) };
      case "MultiLineString": return { type: "MultiLineString", coordinates: g.arcs.map(line) };
      default: return null;
    }
  }
  return { type: "Feature", properties: o.properties || {}, geometry: geom(o) };
}
// Load + project the Natural Earth land once and share it across components.

let _worldCache = null;   // { landPath, proj } once resolved

let _worldPromise = null;

function loadWorld() {
  if (_worldCache) return Promise.resolve(_worldCache);
  if (_worldPromise) return _worldPromise;
  _worldPromise = (async () => {
    for (const url of WORLD_SOURCES) {
      try {
        const topo = await fetch(url).then((r) => { if (!r.ok) throw new Error(tr("http")); return r.json(); });
        const land = topoFeature(topo, topo.objects.land);
        const proj = d3.geoNaturalEarth1().fitExtent([[16, 18], [984, 542]], land);
        _worldCache = { landPath: d3.geoPath(proj)(land), proj };
        return _worldCache;
      } catch (e) { /* try the next source */ }
    }
    _worldCache = { landPath: null, proj: null };
    return _worldCache;
  })();
  return _worldPromise;
}

function useWorldMap() {
  const [w, setW] = useState(_worldCache);
  useEffect(() => { let c = false; loadWorld().then((r) => { if (!c) setW(r); }); return () => { c = true; }; }, []);
  return w || { landPath: null, proj: null };
}

function arcPath(a, b) {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  const lift = Math.min(130, dist * 0.32);
  return `M ${a.x} ${a.y} Q ${mx} ${my - lift} ${b.x} ${b.y}`;
}

export { LAND_PATHS, WORLD_SOURCES, topoFeature, loadWorld, useWorldMap, arcPath };
