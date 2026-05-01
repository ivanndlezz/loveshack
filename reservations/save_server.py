#!/usr/bin/env python3
"""
Love Shack Reservations - Auto-Save Server
==========================================
A minimal HTTP server that listens on localhost:8765 and
lets the browser JS automatically write reservations to disk.

Usage:
    python save_server.py

Then open reservations/index.html — saves will happen automatically.
"""

import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer

PORT = 8765
# Resolve paths relative to this script's location
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RESERVATIONS_FILE = os.path.join(BASE_DIR, "data", "loveshack_reservations.json")
V3_RESERVATIONS_FILE = os.path.join(os.path.dirname(BASE_DIR), "v3", "data", "reservations.json")


class SaveHandler(BaseHTTPRequestHandler):

    def _send_cors_headers(self, status: int = 200):
        self.send_response(status)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Type", "application/json")
        self.end_headers()

    # Handle pre-flight CORS request from browser
    def do_OPTIONS(self):
        self._send_cors_headers(204)

    def do_POST(self):
        target_file = None
        if self.path == "/save":
            target_file = RESERVATIONS_FILE
        elif self.path == "/save_v3":
            target_file = V3_RESERVATIONS_FILE
        else:
            self._send_cors_headers(404)
            self.wfile.write(json.dumps({"error": "Not found"}).encode())
            return

        try:
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            data = json.loads(body)

            # Validate: must be a list
            if not isinstance(data, list):
                raise ValueError("Payload must be a JSON array of reservations")

            # Ensure directory exists
            os.makedirs(os.path.dirname(target_file), exist_ok=True)

            # Write to file with pretty formatting
            with open(target_file, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

            print(f"[OK] Saved {len(data)} reservations → {target_file}")
            self._send_cors_headers(200)
            self.wfile.write(json.dumps({"ok": True, "count": len(data)}).encode())

        except Exception as exc:
            print(f"[ERROR] {exc}")
            self._send_cors_headers(500)
            self.wfile.write(json.dumps({"error": str(exc)}).encode())

    # Suppress default request log noise (optional — comment out to see all requests)
    def log_message(self, fmt, *args):
        pass


if __name__ == "__main__":
    os.makedirs(os.path.dirname(RESERVATIONS_FILE), exist_ok=True)
    server = HTTPServer(("localhost", PORT), SaveHandler)
    print(f"Love Shack Save Server running on http://localhost:{PORT}")
    print(f"Saving to: {RESERVATIONS_FILE}")
    print("Press Ctrl+C to stop.\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
