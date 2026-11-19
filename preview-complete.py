"""Preview the additive whole-project entry without editing the team's entry files."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import sys
import threading
import urllib.request
import webbrowser

DIST = Path(__file__).resolve().parent / 'ten-years' / 'dist'


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def main():
    for port in range(8894, 8904):
        url = f'http://127.0.0.1:{port}/complete.html'
        try:
            with urllib.request.urlopen(url, timeout=.5) as response:
                page = response.read(5000).decode('utf-8', errors='replace')
            if 'opening/complete.html' in page:
                print(url, flush=True)
                if '--serve-only' not in sys.argv:
                    webbrowser.open(url)
                return
        except Exception:
            pass
        try:
            server = ThreadingHTTPServer(('127.0.0.1', port), partial(Handler, directory=str(DIST)))
        except OSError:
            continue
        print(url, flush=True)
        if '--serve-only' not in sys.argv:
            threading.Timer(.35, lambda: webbrowser.open(url)).start()
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
        finally:
            server.server_close()
        return
    raise RuntimeError('No available preview port between 8894 and 8903.')


if __name__ == '__main__':
    main()
