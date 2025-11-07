# Fonts Assets

This directory contains the IranSansX variable font files and related utilities.

## Font Files

- `IRANSansXV.woff2` - Variable font (WOFF2 format, preferred)
- `IRANSansXV.woff` - Variable font (WOFF format, fallback)
- `IRANSansX-Regular.woff` - Static font fallback (400 weight)
- `IRANSansX-Bold.woff` - Static font fallback (700 weight)

## Usage

The fonts are automatically loaded via `fonts.css` which is imported in `index.tsx`.

### Variable Font Weights

The variable font supports weights from 100 to 900. Use the utility functions from `fonts.ts`:

```typescript
import { fontWeights, getFontWeight, fontFamily } from '@/src/assets/fonts/fonts';

// Use predefined weights
const style = { fontWeight: fontWeights.bold }; // 700

// Or use numeric values
const style = { fontWeight: 500 };

// Get CSS variable
const style = { fontFamily };
```

### CSS Usage

```css
/* Use the CSS variable */
.my-element {
  font-family: var(--font-iransansx);
  font-weight: 500; /* Variable font supports 100-900 */
}

/* Or use predefined classes */
.font-thin { font-weight: 100; }
.font-light { font-weight: 300; }
.font-normal { font-weight: 400; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }
.font-extrabold { font-weight: 800; }
.font-black { font-weight: 900; }
```

## Font Features

- **Variable Font**: Supports continuous weight range (100-900)
- **RTL Support**: Optimized for Persian/Arabic text
- **Font Display**: Uses `swap` for better loading performance
- **Font Smoothing**: Enabled for better rendering

