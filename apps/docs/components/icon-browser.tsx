'use client';

import { useMemo, useRef, useState } from 'react';
import { toSvg } from '@bloxwap/icons';
import type { CatalogIcon, Collection } from '@/lib/catalog';
import { CopyButton } from './copy-button';

export function IconArt({ icon, size = 24, stroke, color = 'currentColor' }: { icon: Pick<CatalogIcon, 'body' | 'strokeWidth'>; size?: number; stroke?: number; color?: string }) {
  // Geometry comes only from the reviewed package catalog, never from user input.
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" color={color} stroke={color} strokeWidth={stroke ?? icon.strokeWidth} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: icon.body }} />;
}

const categories = ['All icons', 'Interface', 'Navigation', 'Finance', 'Security', 'Communication', 'Chart tools'];
const colors = [{ label: 'White', value: '#fafafa' }, { label: 'Green', value: '#00ff3f' }, { label: 'Blue', value: '#35b5ff' }, { label: 'Gold', value: '#f5b300' }];
type Format = 'React' | 'React Native' | 'SVG';

export function IconBrowser({ icons }: { icons: CatalogIcon[] }) {
  const inspector = useRef<HTMLElement>(null);
  const results = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [collection, setCollection] = useState<Collection | 'all'>('all');
  const [category, setCategory] = useState('All icons');
  const [selectedName, setSelectedName] = useState('wallet');
  const [size, setSize] = useState(24);
  const [stroke, setStroke] = useState<number | null>(null);
  const [color, setColor] = useState(colors[0].value);
  const [format, setFormat] = useState<Format>('React');
  const [limit, setLimit] = useState(60);
  const selected = icons.find(icon => icon.name === selectedName)!;
  const activeStroke = stroke ?? selected.strokeWidth;
  const filtered = useMemo(() => icons.filter(icon => (collection === 'all' || icon.collections.includes(collection)) && (category === 'All icons' || icon.category === category) && [icon.name, icon.symbol, ...icon.aliases].some(value => value.toLowerCase().includes(query.trim().toLowerCase()))), [icons, query, category, collection]);
  const svg = toSvg(selected, { color, strokeWidth: activeStroke }).replace('width="24" height="24"', `width="${size}" height="${size}"`);
  const code = format === 'SVG' ? svg : `import { ${selected.symbol} } from '@bloxwap/icons/${format === 'React' ? 'react' : 'native'}/${selected.name}';\n\n<${selected.symbol}\n  size={${size}}\n  color="${color}"\n  strokeWidth={${activeStroke}}\n/>`;
  function reset() { setQuery(''); setCollection('all'); setCategory('All icons'); setLimit(60); }

  return <div className="icon-browser">
    <div className="collection-filters" aria-label="Icon collection">{([
      ['all', 'All collections'], ['bloxwap', 'Bloxwap'], ['pro-chart', 'Pro chart'],
    ] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={collection === value} onClick={() => { setCollection(value); setCategory('All icons'); setLimit(60); setStroke(null); if (value !== 'all') setSelectedName(value === 'pro-chart' ? 'pro-chart-candlestick' : 'wallet'); }}>{label}<span>{value === 'all' ? icons.length : icons.filter(icon => icon.collections.includes(value)).length}</span></button>)}</div>
    <div className="browser-toolbar">
      <label className="icon-search"><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></svg><input type="search" aria-label="Search icons" placeholder={`Search ${icons.length} icons…`} value={query} onChange={event => { setQuery(event.target.value); setLimit(60); }} /></label>
      <span className="result-count" role="status">{filtered.length} {filtered.length === 1 ? 'icon' : 'icons'}</span>
    </div>
    <div className="category-filters" aria-label="Filter icons by category">{categories.map(item => <button type="button" key={item} aria-pressed={category === item} onClick={() => { setCategory(item); setLimit(60); }}>{item}</button>)}</div>
    <div className="browser-body">
      <div className="catalog-results" ref={results}>
        <div className="icon-grid" style={{ color }}>
          {filtered.slice(0, limit).map(icon => <button type="button" className="icon-tile" key={icon.name} aria-label={`Select ${icon.symbol}`} aria-pressed={selectedName === icon.name} onClick={() => { setSelectedName(icon.name); setStroke(null); if (window.matchMedia('(max-width: 800px)').matches) inspector.current?.scrollIntoView({ block: 'start' }); }}><IconArt icon={icon} size={size} stroke={stroke ?? icon.strokeWidth} /><span>{icon.name}</span></button>)}
        </div>
        {filtered.length === 0 && <div className="empty-state"><h3>No icons found</h3><p>Try “arrow”, “wallet”, or another icon name.</p><button type="button" className="hig-button" data-intent="secondary" onClick={reset}>Clear filters</button></div>}
        {filtered.length > limit && <button type="button" className="hig-button show-more" data-intent="secondary" onClick={() => setLimit(limit + 60)}>Show more icons ({filtered.length - limit})</button>}
      </div>
      <aside className="icon-inspector" aria-label="Icon details" ref={inspector}>
        <div className="inspector-heading"><h3 aria-live="polite">{selected.symbol}</h3><span>24 × 24</span></div>
        <a className="icon-source" href={selected.sourceUrl}>{selected.collections.includes('pro-chart') ? 'Pro chart artwork' : 'Used in Bloxwap'} ↗</a>
        <div className="inspector-preview" style={{ color }}><IconArt icon={selected} size={size * 3} stroke={activeStroke} /></div>
        <div className="preview-controls">
          <label>Size <output>{size} px</output><input aria-label="Icon size" type="range" min="16" max="40" step="4" value={size} onChange={e => setSize(Number(e.target.value))} /></label>
          <label>Stroke <output>{activeStroke} px</output><input aria-label="Stroke width" type="range" min="1" max="3" step="0.5" value={activeStroke} onChange={e => setStroke(Number(e.target.value))} /></label>
        </div>
        <div className="color-controls"><span>Color</span><div>{colors.map(item => <button type="button" key={item.label} aria-label={`${item.label} icons`} aria-pressed={color === item.value} style={{ background: item.value }} onClick={() => setColor(item.value)} />)}</div></div>
        <div className="format-tabs" aria-label="Code format">{(['React', 'React Native', 'SVG'] as const).map(item => <button type="button" key={item} aria-pressed={format === item} onClick={() => setFormat(item)}>{item}</button>)}</div>
        <pre className="icon-code" tabIndex={0}><code>{code}</code></pre>
        <div className="inspector-actions"><CopyButton key={`${selected.name}-${format}-${size}-${stroke}-${color}`} text={code} /><a className="download-link" href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`} download={`${selected.name}.svg`}>Download SVG ↗</a></div>
        <button type="button" className="back-to-icons" onClick={() => results.current?.scrollIntoView({ block: 'start' })}>↑ Back to icons</button>
        <p className="inspector-note">Decorative by default. Give the containing button an accessible name.</p>
      </aside>
    </div>
  </div>;
}
