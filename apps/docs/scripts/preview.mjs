import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
const root = resolve('out');
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const port = Number(process.env.PORT ?? 3918);
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain' };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (basePath && pathname === basePath) { response.writeHead(308, { Location: `${basePath}/` }).end(); return; }
    if (!pathname.startsWith(`${basePath}/`)) throw new Error('Not found');
    let file = resolve(root, `.${pathname.slice(basePath.length)}`);
    if (!file.startsWith(`${root}${sep}`) && file !== root) throw new Error('Not found');
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    response.setHeader('Content-Type', mime[extname(file)] ?? 'application/octet-stream');
    response.end(await readFile(file));
  } catch {
    response.statusCode = 404;
    response.setHeader('Content-Type', 'text/html');
    response.end(await readFile(resolve(root, '404.html')).catch(() => 'Not found'));
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}${basePath}/`));
