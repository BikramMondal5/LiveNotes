@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================================
echo         LiveNotes Windows CLI Installer
echo ========================================================
echo.

:: 1. Pre-flight checks
where curl.exe >nul 2>nul
if errorlevel 1 (
    echo [LiveNotes] Error: curl.exe was not found.
    echo curl.exe is pre-installed on Windows 10 [version 1803+] and Windows 11.
    echo Please install curl or upgrade Windows.
    exit /b 1
)

where certutil.exe >nul 2>nul
if errorlevel 1 (
    echo [LiveNotes] Error: certutil.exe was not found.
    exit /b 1
)

where reg.exe >nul 2>nul
if errorlevel 1 (
    echo [LiveNotes] Error: reg.exe was not found.
    exit /b 1
)

:: 2. Set up temporary directory
set "TMP_DIR=%TEMP%\livenotes_inst_%RANDOM%"
mkdir "%TMP_DIR%" 2>nul
if not exist "%TMP_DIR%" (
    echo [LiveNotes] Error: Failed to create temporary directory '%TMP_DIR%'.
    exit /b 1
)

set "BASE_URL=https://livenotes.vercel.app"
set "LOCAL_FALLBACK_EXE="
if exist "%~dp0bin\livenotes.exe" set "LOCAL_FALLBACK_EXE=%~dp0bin\livenotes.exe"
if not defined LOCAL_FALLBACK_EXE if exist "%~dp0livenotes.exe" set "LOCAL_FALLBACK_EXE=%~dp0livenotes.exe"
if not defined LOCAL_FALLBACK_EXE if exist "D:\Programming\Oct-edition\LiveNotes\public\bin\livenotes.exe" set "LOCAL_FALLBACK_EXE=D:\Programming\Oct-edition\LiveNotes\public\bin\livenotes.exe"

echo [LiveNotes] Downloading standalone CLI release...

:: Download binary or copy from local repo if running locally
if exist "%LOCAL_FALLBACK_EXE%" (
    copy /y "%LOCAL_FALLBACK_EXE%" "%TMP_DIR%\livenotes.exe" >nul
) else (
    curl.exe -fsSL "%BASE_URL%/bin/livenotes.exe" -o "%TMP_DIR%\livenotes.exe"
)

if not exist "%TMP_DIR%\livenotes.exe" (
    echo [LiveNotes] Error: Failed to download livenotes.exe from '%BASE_URL%/bin/livenotes.exe'.
    rmdir /s /q "%TMP_DIR%" 2>nul
    exit /b 1
)

:: Check for empty file
for %%A in ("%TMP_DIR%\livenotes.exe") do (
    if %%~zA equ 0 (
        echo [LiveNotes] Error: Downloaded file is empty.
        rmdir /s /q "%TMP_DIR%" 2>nul
        exit /b 1
    )
)

:: Download and verify checksum
set "LOCAL_FALLBACK_SHA=%~dp0bin\livenotes.exe.sha256"
if not exist "%LOCAL_FALLBACK_SHA%" set "LOCAL_FALLBACK_SHA=%~dp0livenotes.exe.sha256"

if exist "%LOCAL_FALLBACK_SHA%" (
    copy /y "%LOCAL_FALLBACK_SHA%" "%TMP_DIR%\livenotes.exe.sha256" >nul
) else (
    curl.exe -fsSL "%BASE_URL%/bin/livenotes.exe.sha256" -o "%TMP_DIR%\livenotes.exe.sha256"
)

echo [LiveNotes] Verifying package integrity (SHA-256)...
set "EXPECTED_HASH="
if exist "%TMP_DIR%\livenotes.exe.sha256" (
    for /f "usebackq tokens=1" %%A in ("%TMP_DIR%\livenotes.exe.sha256") do (
        if not defined EXPECTED_HASH set "EXPECTED_HASH=%%A"
    )
)

:: Fallback expected hash hardcoded for maximum security against tampering
if not defined EXPECTED_HASH set "EXPECTED_HASH=09003d627ce6b802745b52bdebc31f257759c5c781a6102d87e96ecfb964008a"

set "ACTUAL_HASH="
for /f "skip=1 tokens=1" %%A in ('certutil -hashfile "%TMP_DIR%\livenotes.exe" SHA256') do (
    if not defined ACTUAL_HASH set "ACTUAL_HASH=%%A"
)

if /i not "!ACTUAL_HASH!"=="!EXPECTED_HASH!" (
    echo [LiveNotes] Error: Checksum verification failed!
    echo   Expected: !EXPECTED_HASH!
    echo   Actual:   !ACTUAL_HASH!
    echo The downloaded file may be corrupt or an HTML error page.
    rmdir /s /q "%TMP_DIR%" 2>nul
    exit /b 1
)
echo [LiveNotes] Checksum verified: !ACTUAL_HASH!

:: Download or prepare launcher
set "LOCAL_FALLBACK_CMD=%~dp0livenotes.cmd"
if exist "%LOCAL_FALLBACK_CMD%" (
    copy /y "%LOCAL_FALLBACK_CMD%" "%TMP_DIR%\livenotes.cmd" >nul
) else (
    curl.exe -fsSL "%BASE_URL%/livenotes.cmd" -o "%TMP_DIR%\livenotes.cmd" 2>nul
)

if not exist "%TMP_DIR%\livenotes.cmd" (
    (
        echo @echo off
        echo if exist "%%~dp0livenotes.exe" (
        echo     "%%~dp0livenotes.exe" %%*
        echo     exit /b %%ERRORLEVEL%%
        echo ^)
    ) > "%TMP_DIR%\livenotes.cmd"
)

:: 3. Install to %LOCALAPPDATA%\LiveNotes
set "INSTALL_DIR=%LOCALAPPDATA%\LiveNotes"
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%" 2>nul

copy /y "%TMP_DIR%\livenotes.exe" "%INSTALL_DIR%\livenotes.exe" >nul
copy /y "%TMP_DIR%\livenotes.cmd" "%INSTALL_DIR%\livenotes.cmd" >nul

:: 4. Add to user PATH without duplicates
::    CRITICAL: Must always write as REG_EXPAND_SZ (not REG_SZ) so Windows
::    propagates the PATH correctly to new CMD/PowerShell sessions.
set "USER_PATH="
for /f "tokens=2* skip=2" %%A in ('reg query HKEY_CURRENT_USER\Environment /v Path 2^>nul') do (
    set "USER_PATH=%%B"
)

echo ;!USER_PATH!; | findstr /i /c:";%INSTALL_DIR%;" >nul 2>nul
if errorlevel 1 (
    echo [LiveNotes] Adding %INSTALL_DIR% to user PATH...
    if defined USER_PATH (
        set "NEW_PATH=!USER_PATH!;%INSTALL_DIR%"
    ) else (
        set "NEW_PATH=%INSTALL_DIR%"
    )
    reg add HKEY_CURRENT_USER\Environment /v Path /t REG_EXPAND_SZ /d "!NEW_PATH!" /f >nul
) else (
    echo [LiveNotes] Installation directory is already in user PATH.
    :: Always re-write as REG_EXPAND_SZ to fix any previous REG_SZ corruption
    reg add HKEY_CURRENT_USER\Environment /v Path /t REG_EXPAND_SZ /d "!USER_PATH!" /f >nul 2>nul
)

:: Update PATH in current running environment
set "PATH=%PATH%;%INSTALL_DIR%"

:: 5. Verification
"%INSTALL_DIR%\livenotes.exe" --version >nul 2>nul
if errorlevel 1 (
    echo [LiveNotes] Error: Verification failed. The installed binary could not be executed.
    rmdir /s /q "%TMP_DIR%" 2>nul
    exit /b 1
)

:: 6. Clean up temporary files
rmdir /s /q "%TMP_DIR%" 2>nul

echo.
echo ========================================================
echo   [OK] LiveNotes CLI installed successfully!
echo ========================================================
echo   Installed location: %INSTALL_DIR%
echo.
echo   You can now run from any directory:
echo     livenotes --help
echo     livenotes -r ^<room_name^>
echo.
echo   Example:
echo     livenotes -r 291026
echo.
echo   Notice: Open a new CMD window to use livenotes
echo   (PATH changes only apply to new sessions).
echo ========================================================
echo.
exit /b 0
