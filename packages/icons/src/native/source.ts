import {ICON_STROKE_WIDTH, toDataUri, type IconDefinition, type IconPaint} from '../core/index.js';

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
