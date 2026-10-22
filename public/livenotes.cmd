@echo off
setlocal enabledelayedexpansion

set "ROOM="
set "OUTFILE="
set "SERVER_URL=https://livenotes.vercel.app"
set "FIREBASE_URL=https://livenotes-b31fe-default-rtdb.asia-southeast1.firebasedatabase.app"

:parse_args
if "%~1"=="" goto validate
if /i "%~1"=="-h" goto show_help
if /i "%~1"=="--help" goto show_help
if /i "%~1"=="-r" (
    set "ROOM=%~2"
    shift
    shift
    goto parse_args
)
if /i "%~1"=="-o" (
    set "OUTFILE=%~2"
    shift
    shift
    goto parse_args
)
if not defined ROOM (
    set "ROOM=%~1"
    shift
    goto parse_args
)
shift
goto parse_args

:show_help
echo.
echo   LiveNotes CLI - Instant Room Text Extractor
echo   -------------------------------------------
echo   Usage:
echo     livenotes -r ^<room_name^>
echo     livenotes -r ^<room_name^> -o ^<output_filename^>
echo     livenotes ^<room_name^>
echo.
echo   Examples:
echo     livenotes -r 291026
echo     livenotes -r 291026 -o notes.txt
echo.
exit /b 0

:validate
if "%ROOM%"=="" (
    echo [LiveNotes] Error: Missing room name.
    echo Usage: livenotes -r ^<room_name^>
    exit /b 1
)

if "%OUTFILE%"=="" (
    set "OUTFILE=%ROOM%.txt"
)

echo [LiveNotes] Extracting text from room: %ROOM% ...

:: 1. Try LiveNotes raw API endpoint
curl.exe -s -f "%SERVER_URL%/raw/%ROOM%" -o "%OUTFILE%" 2>nul
if %errorlevel% equ 0 goto success

:: 2. Fallback: Query Firebase Realtime Database directly using built-in PowerShell
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference = 'Stop';" ^
  "try {" ^
  "  $data = Invoke-RestMethod -Uri '%FIREBASE_URL%/rooms/%ROOM%/notes.json';" ^
  "  if ([string]::IsNullOrEmpty($data)) { exit 2 };" ^
  "  [System.IO.File]::WriteAllText('%OUTFILE%', $data, [System.Text.Encoding]::UTF8);" ^
  "  exit 0;" ^
  "} catch { exit 1 }"

if %errorlevel% equ 0 goto success
if %errorlevel% equ 2 (
    echo [LiveNotes] Room "%ROOM%" was found but has no text content.
    if exist "%OUTFILE%" del "%OUTFILE%" 2>nul
    exit /b 1
)

echo [LiveNotes] Error: Could not retrieve notes for room "%ROOM%".
echo Please check the room name or your internet connection.
if exist "%OUTFILE%" del "%OUTFILE%" 2>nul
exit /b 1

:success
echo [LiveNotes] Successfully saved text to: %OUTFILE%
exit /b 0

