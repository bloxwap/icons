import Link from 'next/link';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import { getIcons } from '@/lib/catalog';
import { IconArt, IconBrowser } from '@/components/icon-browser';
import { CopyButton } from '@/components/copy-button';
import { SiteFooter } from '@/components/site-footer';

export default function Home() {
  const icons = getIcons();
  const featured = ['arrow-up-right', 'layers', 'globe', 'zap', 'pro-chart-candlestick', 'wallet', 'shield-check', 'coins', 'terminal', 'pro-fib', 'activity', 'code', 'star', 'pro-trendline', 'orbit'].filter(name => icons.some(icon => icon.name === name));
  return <HomeLayout {...baseOptions()}>
    <div className="home" id="main">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="status-dot" /> @BLOXWAP/ICONS · v0.1.0</p>
          <h1>One library.<br />Every interface.</h1>
          <p className="hero-description">The icons behind Bloxwap, from everyday actions to Pro’s chart controls and drawing tools. One curated collection for React, React Native, and SVG.</p>
          <div className="hero-actions"><a href="#icons" className="hig-button">Explore the icons <span aria-hidden="true">↓</span></a><Link href="/docs/getting-started" className="hig-button" data-intent="secondary">Start building <span aria-hidden="true">↗</span></Link></div>
          <div className="hero-facts"><span><strong>{icons.length}</strong> icons</span><span><strong>24 × 24</strong> grid</span><span><strong>3</strong> ways to build</span></div>
        </div>
        <div className="hero-art" aria-label="A selection from the Bloxwap icon collection"><div className="hero-art-grid">{featured.map((name, index) => <div key={name} className={index === 5 ? 'hero-icon hero-icon-active' : 'hero-icon'}><IconArt icon={icons.find(icon => icon.name === name)!} size={index === 5 ? 44 : 32} /></div>)}</div><div className="hero-art-caption"><span className="status-dot" /> ONE CATALOG. SHARED GEOMETRY.<span>24 / 2</span></div></div>
      </section>
      <section id="icons" className="catalog-section" aria-labelledby="icons-title">
        <div className="section-heading"><div><p className="eyebrow">USED IN BLOXWAP + PRO CHARTS</p><h2 id="icons-title">Find your next icon.</h2></div><p>Pick an icon. Make it yours.<br />{' '}Copy the code and keep building.</p></div>
        <IconBrowser icons={icons} />
      </section>
      <section className="start-grid" aria-labelledby="usage-title">
        <div><p className="eyebrow">REACT · REACT NATIVE · SVG</p><h2 id="usage-title">Same shape.<br />Wherever you ship.</h2><p>Import just the icons you use. Every renderer draws from the same reviewed catalog, with size, color, and stroke in your hands.</p><Link href="/docs/react" className="text-link">Read the React guide ↗</Link></div>
        <figure className="code-window"><figcaption className="code-toolbar"><span>your-interface.tsx</span><span>REACT</span></figcaption><pre><code><span className="syntax-keyword">import</span> {'{ Wallet }'} <span className="syntax-keyword">from</span>{'\n'}  <span className="syntax-string">'@bloxwap/icons/react/wallet'</span>;{'\n\n'}<span className="syntax-muted">{'// A little clarity for your next action.'}</span>{'\n'}{'<button aria-label="Open wallet">\n  <Wallet size={24} />\n</button>'}</code></pre><div className="code-bottom"><CopyButton text={`import { Wallet } from '@bloxwap/icons/react/wallet';\n\n<button aria-label="Open wallet">\n  <Wallet size={24} />\n</button>`} /></div></figure>
      </section>
      <section className="start-grid" aria-labelledby="docs-title"><div><p className="eyebrow">DOCUMENTATION</p><h2 id="docs-title">Small details.<br />A clear starting point.</h2><p>Everything you need to put the library to work, from installation to accessible interfaces.</p></div><div className="guide-links">{[
        ['/docs/getting-started', '01', 'Getting started', 'Install the package and add your first icon.'],
        ['/docs/react-native', '02', 'Go native', 'Use the same catalog in your Expo app.'],
        ['/docs/accessibility', '03', 'Make it meaningful', 'Labels, decorative icons, and interactive controls.'],
        ['/docs/assets', '04', 'Working with assets', 'SVG exports, brand artwork, and attribution.'],
      ].map(([href, number, title, description]) => <Link href={href} key={href}><span>{number}</span><div><h3>{title}</h3><p>{description}</p></div><span aria-hidden="true">↗</span></Link>)}</div></section>
    </div><SiteFooter />
  </HomeLayout>;
}
