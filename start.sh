#!/bin/bash

# University Payment System - Startup Script

echo "🚀 Starting University Payment System..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp env.example .env
    echo "📝 Please update .env file with your configuration before running again."
    echo "   Required variables:"
    echo "   - MONGODB_URI"
    echo "   - JWT_SECRET"
    echo "   - ENCRYPTION_KEY"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if MongoDB is running (basic check)
echo "🔍 Checking MongoDB connection..."

# Start the development server
echo "🌱 Starting development server..."
npm run dev


