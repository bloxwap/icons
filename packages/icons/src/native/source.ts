import {toDataUri, type IconDefinition, type IconPaint} from '../core/index.js';

const LIMIT = 256;
const sources = new Map<string, Readonly<{uri: string}>>();

/** Bound the cache even when a live color picker produces thousands of colors. */
export function iconSource(definition: IconDefinition, paint: IconPaint): Readonly<{uri: string}> {
  const key = JSON.stringify([definition.body, paint.color ?? '#000000', paint.fill ?? 'none',
    paint.strokeWidth ?? 2, paint.strokeLinecap ?? 'round', paint.strokeLinejoin ?? 'round']);
  const cached = sources.get(key);
  if (cached) {
    sources.delete(key);
    sources.set(key, cached);
    return cached;
  }
  const source = Object.freeze({uri: toDataUri(definition, {...paint, color: paint.color ?? '#000000'})});
  if (sources.size >= LIMIT) sources.delete(sources.keys().next().value!);
  sources.set(key, source);
  return source;
}
