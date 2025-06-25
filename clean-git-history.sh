#!/bin/bash

echo "⚠️  WARNING: This script will rewrite git history to remove the exposed API key"
echo "⚠️  Make sure you have revoked the key on RapidAPI first!"
echo ""
echo "This script will:"
echo "1. Remove the API key from all commits"
echo "2. Force push to overwrite remote history"
echo ""
read -p "Have you revoked the API key on RapidAPI? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Please revoke the key first at: https://rapidapi.com/developer/dashboard"
    exit 1
fi

echo ""
echo "Creating backup branch..."
git branch backup-before-clean

echo ""
echo "Removing API key from git history..."

# Create a file with the API key to replace
echo "bf09369c78msha972aee72fe1c6cp1c5971jsn12c4733aa692==>YOUR_API_KEY_HERE" > replacements.txt

# Use git filter-branch to replace the key in all files
git filter-branch --tree-filter "
  if [ -f src/index.ts ]; then
    sed -i.bak \"s/bf09369c78msha972aee72fe1c6cp1c5971jsn12c4733aa692/YOUR_API_KEY_HERE/g\" src/index.ts
    rm -f src/index.ts.bak
  fi
  if [ -f tests/helpers/test-server.ts ]; then
    sed -i.bak \"s/bf09369c78msha972aee72fe1c6cp1c5971jsn12c4733aa692/YOUR_API_KEY_HERE/g\" tests/helpers/test-server.ts
    rm -f tests/helpers/test-server.ts.bak
  fi
" --tag-name-filter cat -- --all

# Clean up
rm -f replacements.txt
rm -rf .git/refs/original/

echo ""
echo "✅ Git history cleaned locally"
echo ""
echo "To push these changes and overwrite remote history:"
echo "  git push --force --all"
echo "  git push --force --tags"
echo ""
echo "⚠️  WARNING: This will overwrite history on GitHub!"
echo "⚠️  Anyone who has cloned/forked will need to re-clone"
echo ""
echo "Your original history is saved in branch: backup-before-clean"