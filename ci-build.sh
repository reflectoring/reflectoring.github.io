#!/usr/bin/env bash
set -e # halt script on error

gem install bundler --version 2.0.1
bundle exec jekyll build
bundle exec htmlproofer ./_site --disable-external --allow-hash-href
