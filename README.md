# reflectoring.io
This is the repository for the [reflectoring.io](https://reflectoring.io) blog on software engineering and Java topics.

## Running the Blog Locally on Windows

1. download and install ruby using the [ruby installer](https://rubyinstaller.org/) (I have used Ruby+Devkit 2.6.5-1 successfully)
1. open a console and run `ruby --version` to verify that it has been installed successfully (if this command seems to run forever, restart the computer and try again :)
1. in the folder you cloned this repo into, run `bundle install`
1. run `bundle exec jekyll serve` to start jekyll
1. go to [http://localhost:4000](http://localhost:4000) to view the blog in your browser
1. changes to the markdown files should automatically trigger a re-start of jekyll (if not, kill the process with `CMD+C` and restart it)  

## Contributing to this Blog

See the [Write For Me](https://reflectoring.io/write-for-me) page on the blog.