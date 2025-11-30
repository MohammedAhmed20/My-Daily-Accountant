#!/bin/bash
# Deploy Script for GitHub Pages
# Run this file to deploy your project to GitHub Pages

set -e  # Exit on error

echo "📦 Building My Daily Accountant..."
npm run build

echo "🚀 Deploying to GitHub Pages..."
npm run deploy

echo "✅ Deployment complete!"
echo "Your site will be available at: https://MohammedAhmed20.github.io/My-Daily-Accountant/"
echo ""
echo "⏱️  Please wait 2-5 minutes for GitHub Pages to update..."
