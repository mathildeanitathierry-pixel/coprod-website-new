# coprod landing page

Single-file landing page for [coprod.co](https://coprod.co) — dark, self-contained, no external requests (fonts and images embedded).

## Structure

- `index.html` — the deployable page. Serve it from any static host as-is.
- `src/shell.html` — page markup, styles, and the scroll/motion layer (`<!--ENGINE-->` marks where the engines are injected)
- `src/engine.js` — the dithered co:dodo biped renderer (drag to rotate, click to light the visor, double-click for hearts)
- `src/actuator.js` — the co:motion actuator renderer (opens/closes on scroll, click to toggle)
- `src/build.py` — concatenates the three into `index.html`

## Build

    python3 src/build.py

