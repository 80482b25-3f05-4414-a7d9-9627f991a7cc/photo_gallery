#!/bin/bash

# Build project
npm run build

# Sync changes to propagate to Android
npx cap sync android
