#!/bin/bash

# Claude Auto-Update Fix Script
# This script cleans up temporary directories that can cause update failures

echo "🔧 Fixing Claude auto-update issues..."

# Check if Claude is installed
if ! command -v claude &> /dev/null; then
    echo "❌ Claude CLI not found. Please install it first with: npm i -g @anthropic-ai/claude-code"
    exit 1
fi

echo "📍 Current Claude version: $(claude --version)"

# Clean up any leftover temporary directories
CLAUDE_DIR="/opt/homebrew/lib/node_modules/@anthropic-ai"
if [ -d "$CLAUDE_DIR" ]; then
    echo "🧹 Cleaning up temporary directories..."
    
    # Remove any temporary directories (they start with .claude-code-)
    find "$CLAUDE_DIR" -name ".claude-code-*" -type d -exec rm -rf {} + 2>/dev/null || true
    
    echo "✅ Cleanup complete"
else
    echo "⚠️  Claude installation directory not found at $CLAUDE_DIR"
fi

# Verify npm cache
echo "🔍 Verifying npm cache..."
npm cache verify

# Try to update Claude
echo "🚀 Attempting to update Claude..."
npm i -g @anthropic-ai/claude-code

echo "✅ Claude update process completed!"
echo "📍 New Claude version: $(claude --version)"

# Run diagnostics
echo "🩺 Running Claude diagnostics..."
claude doctor
