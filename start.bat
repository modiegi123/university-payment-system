@echo off
echo 🚀 Starting University Payment System...

REM Check if .env file exists
if not exist .env (
    echo ⚠️  .env file not found. Creating from template...
    copy env.example .env
    echo 📝 Please update .env file with your configuration before running again.
    echo    Required variables:
    echo    - MONGODB_URI
    echo    - JWT_SECRET
    echo    - ENCRYPTION_KEY
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist node_modules (
    echo 📦 Installing dependencies...
    npm install
)

REM Start the development server
echo 🌱 Starting development server...
npm run dev


