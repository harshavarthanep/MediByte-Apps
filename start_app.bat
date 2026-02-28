@echo off
echo Starting the local web server...
echo.
echo Please open your browser on this laptop and go to: http://localhost:8000
echo.
echo To open this on another laptop connected to the SAME Wi-Fi network, go to:
echo http://192.168.31.150:8000
echo.
echo Press Ctrl+C to stop the server when you are done.
echo.
python -m http.server 8000
pause
