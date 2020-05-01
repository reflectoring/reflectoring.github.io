# reflectoring.io
This is the repository for the [reflectoring.io](https://reflectoring.io) blog on software engineering and Java topics.

## Running the Blog Locally on Windows

1. download and install ruby using the [ruby installer](https://rubyinstaller.org/) (I have used Ruby+Devkit 2.6.5-1 successfully)
1. open a console and run `ruby --version` to verify that it has been installed successfully (if this command seems to run forever, restart the computer and try again :)
1. in the folder you cloned this repo into, run `bundle install`
1. run `bundle exec jekyll serve` to start jekyll
1. go to [http://localhost:4000](http://localhost:4000) to view the blog in your browser
1. changes to the markdown files should automatically trigger a re-start of jekyll (if not, kill the process with `CMD+C` and restart it)  

## Viewing Your Blog Post Locally

1. copy one of the existing blog post `.md` files from the `_posts` folder into a new file 
1. change the name of the file so that it contains today's date and your blog post title
1. change the `date` and `modified` fields in the file header to today's date (replace the `+1100` with the offset of your local timezone to UTC; the blog post will only show in the preview if these dates are in the past)
1. don't worry about the rest of the header fields, I will update them before publishing
1. write the article in markdown format
1. run `bundle exec jekyll serve` to start up the blog locally
1. go to [http://localhost:4000](http://localhost:4000) to view the blog in your browser
1. your blog post should show up on the start page; click on it and check if it looks good

## Troubleshooting

### `bundle install` fails with "zlib is missing" (Ubuntu)

Run `sudo apt-get install --reinstall zlibc zlib1g zlib1g-dev` to install the missing zlib library and rerun `bundle install`.

## Contributing to this Blog

See the [Write For Me](https://reflectoring.io/write-for-me) page on the blog.
