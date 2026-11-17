import {optimize} from 'svgo';

const tags = new Set(['path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon']);
const attributes = new Set(['d', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height', 'points', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'fill-rule', 'clip-rule', 'pathLength', 'stroke-dasharray']);
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');

export function optimizeIcon(icon) {
  for (const [tag, attrs] of icon.nodes) {
    if (!tags.has(tag) || Object.keys(attrs).some(key => !attributes.has(key))) throw new Error(`Unsupported geometry in ${icon.name}`);
  }
  const body = icon.nodes.map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([key, value]) => `${key}="${escape(value)}"`).join(' ')}/>`).join('');
  const document = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${icon.strokeWidth ?? 2}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  let nodes;
  const optimized = optimize(document, {multipass: true, plugins: [
    {name: 'preset-default', params: {overrides: {
      // Apple's SVG decoder misreads packed arc flags. Keep them separated.
      convertPathData: {noSpaceAfterFlags: false, floatPrecision: 3},
      // A circle must remain a circle when the host deliberately applies fill.
      convertShapeToPath: false,
    }}},
    {name: 'capture-geometry', fn: () => ({root: {exit(root) {
      const svg = root.children.find(node => node.name === 'svg');
      nodes = svg.children.filter(node => node.type === 'element').map(node => {
        if (!tags.has(node.name)) throw new Error(`Unexpected optimized node ${node.name}`);
        return [node.name, node.attributes];
      });
    }}})},
  ]}).data;
  const optimizedBody = optimized.slice(optimized.indexOf('>') + 1, optimized.lastIndexOf('</svg>'));
  return {nodes, body: optimizedBody, svg: optimized};
}
