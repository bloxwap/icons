import {ICON_STROKE_WIDTH, toSvg, type IconDefinition, type IconPaint} from '../core/index.js';

// Android Expo Image's data-URL loader expects base64, not percent-encoded SVG.
// Keep the browser serializer unchanged and avoid relying on Buffer/btoa in Hermes.
function toDataUri(definition: IconDefinition, paint: IconPaint) {
  const bytes = encodeURIComponent(toSvg(definition, paint)).replace(/%([0-9A-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let encoded = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes.charCodeAt(i), b = bytes.charCodeAt(i + 1), c = bytes.charCodeAt(i + 2);
    const bits = (a << 16) | ((b || 0) << 8) | (c || 0);
    encoded += alphabet[(bits >>> 18) & 63] + alphabet[(bits >>> 12) & 63]
      + (i + 1 < bytes.length ? alphabet[(bits >>> 6) & 63] : "=")
      + (i + 2 < bytes.length ? alphabet[bits & 63] : "=");
  }
  return `data:image/svg+xml;base64,${encoded}`;
}

const LIMIT = 256;
type Source = Readonly<{uri: string}>;
// Default sources live only as long as their imported definitions. They must not
// evict one another when a screen renders more icons than the variant limit.
const defaults = new WeakMap<IconDefinition, Source>();
const identities = new WeakMap<IconDefinition, number>();
let nextIdentity = 0;
const sources = new Map<string, Source>();

/** Reuse the default source per definition; bound customized paint to 256 variants. */
export function iconSource(definition: IconDefinition, paint: IconPaint): Source {
  const defaultStroke = definition.strokeWidth ?? ICON_STROKE_WIDTH;
  const {color = '#000000', fill = 'none', strokeWidth = defaultStroke,
    strokeLinecap = 'round', strokeLinejoin = 'round'} = paint;
  const isDefault = color === '#000000' && fill === 'none' && strokeWidth === defaultStroke
    && strokeLinecap === 'round' && strokeLinejoin === 'round';
  if (isDefault) {
    let source = defaults.get(definition);
    if (!source) {
      source = Object.freeze({uri: toDataUri(definition, {color})});
      defaults.set(definition, source);
    }
    return source;
  }
  let identity = identities.get(definition);
  if (identity === undefined) identities.set(definition, identity = nextIdentity++);
  // Cache hits serialize only paint, never the SVG geometry.
  const key = JSON.stringify([identity, color, fill, strokeWidth, strokeLinecap, strokeLinejoin]);
  const cached = sources.get(key);
  if (cached) {
    sources.delete(key);
    sources.set(key, cached);
    return cached;
  }
  const source = Object.freeze({uri: toDataUri(definition, {color, fill, strokeWidth, strokeLinecap, strokeLinejoin})});
  if (sources.size >= LIMIT) sources.delete(sources.keys().next().value!);
  sources.set(key, source);
  return source;
}
