---
layout: page
title: Posts & Written Investigations
permalink: /pages/posts/
---

<div class="posts-archive">
  {% for post in site.posts %}
    <article class="post-preview">
      {% if post.banner_image %}
      <a href="{{ post.url | relative_url }}" class="post-preview-banner">
        <img src="{{ post.banner_image | relative_url }}" alt="{{ post.banner_alt | default: post.title | escape }}" loading="lazy" decoding="async" />
      </a>
      {% endif %}
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