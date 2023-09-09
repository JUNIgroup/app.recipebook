#!/bin/sh
set -e

echo ""
echo ""
echo "==== Install all packages ===="
npm install
if [ -n "$(git status --porcelain)" ]; then
  echo "Uncommit changes found"
  exit 1
fi

echo ""
echo ""
echo "==== Clean ===="
npx concurrently --kill-others-on-fail "npm:clean" "npm:emulator:kill"

echo ""
echo ""
echo "==== Lint ===="
npx concurrently --kill-others-on-fail "npm:eslint" "npm:prettier" "npm:stylelint" "npx tsc"

echo ""
echo ""
echo "==== Run all tests (no emulator) ===="
npm run test

echo ""
echo ""
echo "==== Run all tests (emulator) ===="
npm run test:emulator

echo ""
echo ""
echo "==== Build ===="
npm run build:only
