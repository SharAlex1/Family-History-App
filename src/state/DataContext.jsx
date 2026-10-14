import { createContext, useContext } from "react";

const DataCtx = createContext(null);

function useData() { return useContext(DataCtx); }

/* ============================== UI PRIMITIVES =========================== */

export { DataCtx, useData };
