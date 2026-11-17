import Link from 'next/link';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
export default function NotFound() { return <HomeLayout {...baseOptions()}><div id="main" className="not-found"><p className="eyebrow">404</p><h1>This icon is off the grid.</h1><p>The page you’re looking for could not be found.</p><Link className="hig-button" href="/">Back to the icons</Link></div></HomeLayout>; }
