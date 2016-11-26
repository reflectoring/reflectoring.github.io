---
layout: archive
title: "Latest Posts"
date: 2016-11-26
modified:
tags: [reflectoring, posts, blog, software, engineering, programming, java]
image:
  feature: 
  teaser: archive.jpg
---

<div class="tiles">
{% for post in site.posts %}
  {% include post-grid.html %}
{% endfor %}
</div>
