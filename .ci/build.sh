#!/usr/bin/env bash
set -e

yarn

if [ -n "${TRAVIS_TAG}" ]; then
  yarn build:prod:zip:all
  rename 's|artifacts/(.*)/(.*)\.zip$|artifacts/$1/$2-$1\.zip|' artifacts/*/*.zip
else
  yarn build:all
fi
