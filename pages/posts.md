---
layout: page
title: Posts
permalink: /pages/posts/
---

# Posts & Written Investigations

<div class="posts-archive">
  {% for post in site.posts %}
    <article class="post-preview">
      <h2><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h2>
      <span class="post-date">{{ post.date | date: "%B %-d, %Y" }}</span>
      <div class="post-categories">
        {% for category in post.categories %}
          <span class="category-tag">{{ category }}</span>
        {% endfor %}
      </div>
      <p>{{ post.excerpt }}</p>
    </article>
  {% endfor %}
</div>