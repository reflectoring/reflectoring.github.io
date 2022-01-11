# reflectoring.io
This is the repository for the [reflectoring.io](https://reflectoring.io) blog on software engineering and Java topics.

This blog runs on [Hugo](https://gohugo.io/), a static site generator.

## Local preview with Docker

If you have Docker installed, you can run the blog locally with this command:

```shell
docker run --rm -it \
  -v $(pwd):/src \
  -p 1313:1313 \
  klakegg/hugo:0.83.1 \
  server
```

## Local preview by installing Hugo

If you don't have Docker, you can [install Hugo on your machine](https://gohugo.io/getting-started/installing/) and then run this command:

```
hugo server
```

## Contributing to this Blog

See the [Become an Author](https://reflectoring.io/contribute/become-an-author) page on the blog.
