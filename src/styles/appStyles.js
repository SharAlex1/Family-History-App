import { C } from "../config/theme.js";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');
#fa-root { position: fixed; inset: 0; display: flex;
  background: radial-gradient(1100px 600px at 12% -8%, #15233055, transparent 60%), radial-gradient(900px 500px at 100% 0%, #2a1f1255, transparent 55%), ${C.bg};
  color: ${C.text}; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; -webkit-font-smoothing: antialiased; overflow: hidden; }
dialog, dialog * { box-sizing: border-box; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; }
dialog::backdrop { background: transparent; }
dialog button { cursor: pointer; }
.fa-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
:where(button,input,select,textarea,[tabindex]):focus-visible { outline: 2px solid ${C.amber}; outline-offset: 3px; }
.fa-notice { padding: 12px 18px; background: ${C.panelSolid}; border-bottom: 1px solid ${C.danger}; color: ${C.text}; font-size: 13px; }
.fa-notice button { margin: 6px 8px 0 0; padding: 5px 8px; background: ${C.panel2}; color: ${C.text}; border: 1px solid ${C.border}; border-radius: 6px; }
#fa-root * { box-sizing: border-box; }
#fa-root button { font-family: inherit; cursor: pointer; }
.fa-input:focus { border-color: ${C.amber}99 !important; }
.fa-select option { background: ${C.panelSolid}; color: ${C.text}; }
.fa-sidebar { width: 224px; flex-shrink: 0; height: 100%; background: #0c0e14cc; backdrop-filter: blur(8px); border-right: 1px solid ${C.border}; padding: 18px 14px; display: flex; flex-direction: column; gap: 3px; }
.fa-navbtn { display: flex; align-items: center; gap: 12px; width: 100%; text-align: left; border: none; padding: 10px 12px; border-radius: 9px; font-size: 13.5px; transition: background .15s, color .15s; }
.fa-navbtn:hover { color: ${C.text}; background: ${C.borderSoft}; }
.fa-main { flex: 1; min-width: 0; display: flex; flex-direction: column; height: 100%; position: relative; }
.fa-topbar { min-height: 60px; flex-shrink: 0; display: flex; align-items: center; gap: 12px; padding: 8px 24px; border-bottom: 1px solid ${C.border}; background: #0c0e1499; backdrop-filter: blur(8px); z-index: 20; }
.fa-content { flex: 1; overflow: auto; }
.fa-card { transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease; }
.fa-card:hover { transform: translateY(-2px); border-color: ${C.faint}; }
.fa-click { transition: filter .15s, opacity .15s, background .15s, color .15s, border-color .15s; }
.fa-click:hover { filter: brightness(1.12); }
.fa-slider { position: absolute; left: 50%; bottom: 18px; transform: translateX(-50%); width: min(820px, calc(100% - 48px)); z-index: 25; display: flex; align-items: center; gap: 16px; background: #12141ccc; backdrop-filter: blur(14px); border: 1px solid ${C.border}; border-radius: 18px; padding: 12px 18px; box-shadow: 0 18px 50px #000a; }
.fa-range { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; border-radius: 999px; background: linear-gradient(90deg, ${C.amber}55, ${C.amber}22); outline: none; }
.fa-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; border-radius: 50%; background: ${C.amber}; border: 3px solid #1a1206; cursor: pointer; box-shadow: 0 0 0 4px ${C.amber}33; }
.fa-range::-moz-range-thumb { width: 18px; height: 18px; border-radius: 50%; background: ${C.amber}; border: 3px solid #1a1206; cursor: pointer; }
.fa-panel { position: fixed; top: 0; right: 0; height: 100%; width: 420px; max-width: 92vw; background: ${C.panelSolid}; border-left: 1px solid ${C.border}; z-index: 60; overflow-y: auto; box-shadow: -20px 0 60px #0009; animation: fa-slidein .26s cubic-bezier(.2,.8,.2,1); }
.fa-backdrop { position: fixed; inset: 0; background: #0008; z-index: 55; animation: fa-fade .2s; }
.fa-modal-wrap { position: fixed; inset: 0; background: #000a; z-index: 80; display: flex; align-items: flex-start; justify-content: center; padding: 40px 16px; overflow: auto; animation: fa-fade .15s; }
.fa-modal { background: ${C.panelSolid}; border: 1px solid ${C.border}; border-radius: 18px; max-width: 100%; box-shadow: 0 30px 80px #000c; animation: fa-pop .2s cubic-bezier(.2,.8,.2,1); margin: auto; }
@keyframes fa-slidein { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes fa-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes fa-pop { from { transform: scale(.97); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.fa-flow { stroke-dasharray: 7 9; animation: fa-dash 1.4s linear infinite; }
@keyframes fa-dash { to { stroke-dashoffset: -32; } }
.fa-pulse { animation: fa-pulse 2.6s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
@keyframes fa-pulse { 0%,100% { opacity: .08; } 50% { opacity: .22; } }
#fa-root ::-webkit-scrollbar { width: 10px; height: 10px; }
#fa-root ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 999px; border: 2px solid ${C.bg}; }
#fa-root ::-webkit-scrollbar-track { background: transparent; }
@media (max-width: 900px) {
  .fa-sidebar { width: 60px; padding: 18px 8px; }
  .fa-label { display: none; }
  .fa-navbtn { justify-content: center; }
  .fa-dash-grid, .fa-rel-grid { grid-template-columns: 1fr !important; }
}
@media (max-width: 600px) {
  .fa-topbar { flex-wrap: wrap; padding: 10px 14px; }
  .fa-search { flex-basis: 100% !important; max-width: none !important; min-width: 0; }
  .fa-branch-filters { width: 100%; justify-content: flex-start !important; }
  .fa-slider { width: calc(100% - 24px); bottom: 10px; padding: 10px; gap: 10px; flex-wrap: wrap; }
  .fa-slider-track { flex-basis: 100% !important; }
  .fa-modal-wrap { padding: 12px; }
  .fa-modal { max-width: 100%; }
  .fa-modal [style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
}
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }
`;

export { CSS };
