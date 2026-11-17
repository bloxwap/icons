import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { assetUrl, repository } from './site';
export function baseOptions(): BaseLayoutProps {
  return {
    nav: { title: <span className="brand"><img src={assetUrl('/logos/bloxwap-icon-green.svg')} alt="Bloxwap" width={28} height={28} /><span className="brand-product">Icons</span></span>, url: '/' },
    links: [{ text: 'Icons', url: '/#icons' }, { text: 'Docs', url: '/docs', active: 'nested-url' }],
    themeSwitch: { enabled: false }, githubUrl: repository,
  };
}
