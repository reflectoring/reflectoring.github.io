# reflectoring.io
This is the repository for the [reflectoring.io](https://reflectoring.io) blog on software engineering and Java topics.

This blog runs on [Hugo](https://gohugo.io/), a static site generator.

## Local preview with Docker

If you have Docker installed, you can run the blog locally with this command:

```shell
docker-compose up
```

or, if you want to have more control over the Hugo command:

```shell
docker run -it \
  -v "$(pwd):/src" \
  -p 1313:1313 \
  "peaceiris/hugo:v0.91.2" \
  server --bind 0.0.0.0 --buildDrafts
```

You can replace `server ...` with the [Hugo command](https://gohugo.io/commands/) that you want to run.

In any case, you can then browse the site via [http://localhost:1313](http://localhost:1313).

## Local preview by installing Hugo

If you don't have Docker, you can [install Hugo on your machine](https://gohugo.io/getting-started/installing/) (version 0.91.2+extended) and then run this command:

```
hugo server
```

You can then browse the site via [http://localhost:1313](http://localhost:1313).

## Contributing to this Blog

See the [Become an Author](https://reflectoring.io/contribute/become-an-author) page on the blog.
