#!/usr/bin/env python3
"""Serve the extracted playtest on a local computer; no tunnel or public hosting."""
import argparse
import functools
import http.server
import pathlib
import socket


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--lan', action='store_true', help='Allow phones on the same local Wi-Fi to connect')
    parser.add_argument('--port', type=int, default=4175)
    parser.add_argument('--directory', type=pathlib.Path, default=pathlib.Path(__file__).resolve().parent)
    args = parser.parse_args()
    root = args.directory.resolve()
    entry = root / 'Squirrel-Control-Playtest.html'
    if not entry.is_file():
        parser.error('Squirrel-Control-Playtest.html was not found. Extract the ZIP first, or set --directory.')
    if not 1 <= args.port <= 65535:
        parser.error('--port must be between 1 and 65535')

    class Handler(http.server.SimpleHTTPRequestHandler):
        def do_GET(self):
            if self.path.split('?', 1)[0] == '/':
                query = self.path.partition('?')[2]
                self.path = '/Squirrel-Control-Playtest.html' + ('?' + query if query else '')
            return super().do_GET()

        def end_headers(self):
            self.send_header('Cache-Control', 'no-store')
            super().end_headers()

        def list_directory(self, path):
            self.send_error(404)
            return None

    bind = '0.0.0.0' if args.lan else '127.0.0.1'
    handler = functools.partial(Handler, directory=str(root))
    with http.server.ThreadingHTTPServer((bind, args.port), handler) as server:
        print('Squirrel Control local playtest; Ctrl+C stops sharing.', flush=True)
        print(f'Computer: http://127.0.0.1:{args.port}/', flush=True)
        if args.lan:
            try:
                addresses = sorted({r[4][0] for r in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET) if not r[4][0].startswith('127.')})
            except OSError:
                addresses = []
            for address in addresses:
                print(f'Phone on the same Wi-Fi: http://{address}:{args.port}/', flush=True)
            if not addresses:
                print(f'Phone: use your computer’s LAN IPv4 address and port {args.port}.', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print('\nPlaytest server stopped.', flush=True)


if __name__ == '__main__':
    main()
