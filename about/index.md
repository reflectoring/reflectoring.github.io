---

title: About reflectoring
modified: 2016-11-21
comments: true
share: false
ads: false
image:
  feature: 
  teaser: teaser/about.jpg
  thumb:
---

reflectoring is a group of professional software developers who like to play
around with technologies and develop their own projects at night. The name 
'reflectoring' came up as a mix of 'reflection' and 'refactoring' which we
deemed geeky enough to serve as a name for our blog.

The blog will mainly contain articles about software technologies (focused on but not exclusively 
Java) and software development methodology. 

If you want to get in touch with us, simply drop us an email or post a comment.

## Authors

<footer class="page-footer">

  {% for a in site.data.authors %}
  {% assign author = a[1] %}
  {% include author.html %}
  {% endfor %}

</footer>

## Projects

<footer class="page-footer">

  {% for project in site.projects %}
  {% include project.html %}
  {% endfor %}

</footer>
