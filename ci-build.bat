call gem install bundler --version 2.0.1
call bundle exec jekyll build
call bundle exec htmlproofer ./_site --disable-external --allow-hash-href
