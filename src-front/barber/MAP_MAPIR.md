# Map.ir in Barber Panel

- **Current map**: [mapir-react-component](https://github.com/map-ir/mapir-react-component) (React, used in `MapirMapSelector`).
- **Web SDK** (optional): You added `src-front/assets/map-dist` ([Web SDK installation](https://help.map.ir/documentation/websdk-installation/)).

The barber dev server serves `map-dist` at **`/map-dist/`** (e.g. `/map-dist/js/mapp.min.js`, `/map-dist/css/mapp.min.css`). To use the Web SDK instead of or alongside the React component:

1. In `index.html` (or dynamically in a component), load:
   - `<link rel="stylesheet" href="/map-dist/css/mapp.min.css">`
   - `<script src="/map-dist/js/jquery-3.2.1.min.js"></script>`
   - `<script src="/map-dist/js/mapp.min.js"></script>`
2. Use the global `Mapp` API from the [Web SDK docs](https://help.map.ir/documentation/websdk-installation/) (e.g. reverse, search, markers).

Alias **`@assets`** in Vite points to `src-front/assets` for imports.
