#!/bin/bash
# Simple HTTP server for testing the application
# Requires Python 3

echo "Starting HTTP server on http://localhost:8000"
echo "Open http://localhost:8000 in your browser"
echo "Press Ctrl+C to stop"
echo ""
python3 -m http.server 8000
