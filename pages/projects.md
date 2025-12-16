---
layout: page
title: Projects
permalink: /pages/projects/
---

# My Projects

Below is a selection of personal and academic projects I've worked on.

<div class="projects-container">
  {% for project in site.data.projects %}
    <div class="project-card">
      <h2>{{ project.title }}</h2>
      <p class="project-description">{{ project.description }}</p>
      
      {% if project.technologies %}
      <div class="project-technologies">
        <h3>Technologies Used:</h3>
        <ul>
          {% for tech in project.technologies %}
            <li>{{ tech }}</li>
          {% endfor %}
        </ul>
      </div>
      {% endif %}
      
      <div class="project-links">
        {% if project.github_url %}
          <a href="{{ project.github_url }}" class="button" target="_blank" rel="noopener">View on GitHub</a>
        {% endif %}
        
        {% if project.live_url %}
          <a href="{{ project.live_url }}" class="button" target="_blank" rel="noopener">View Live</a>
        {% endif %}
        
        {% if project.documentation %}
          <a href="{{ project.documentation }}" class="button" target="_blank" rel="noopener">Documentation</a>
        {% endif %}
      </div>
    </div>
  {% endfor %}
</div>

## Documents

Below are documents related to my work:

<div class="documents-container">
  {% for document in site.data.documents %}
    <div class="document-card">
      <h2>{{ document.title }}</h2>
      <p class="document-description">{{ document.description }}</p>
      <a href="{{ site.baseurl }}{{ document.file_url }}" class="button" target="_blank" rel="noopener">Download</a>
    </div>
  {% endfor %}
</div>