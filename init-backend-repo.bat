@echo off
echo Initializing HMS Backend Repository...

REM Initialize git repository
git init

REM Add all files
git add .

REM Create initial commit
git commit -m "Initial commit: HMS Backend with OTP-based password reset"

REM Add remote origin (replace with your actual repository URL)
echo.
echo Next steps:
echo 1. Create a new repository on GitHub named 'hms-backend'
echo 2. Run: git remote add origin https://github.com/yourusername/hms-backend.git
echo 3. Run: git branch -M main
echo 4. Run: git push -u origin main

pause