---
layout: page
title: Contact
permalink: /pages/contact/
---


## Contact Information

- **LinkedIn**: [LinkedIn Profile](https://www.linkedin.com/in/andrew-erbs-59bb9365)
- **GitHub**: [GitHub Profile](https://github.com/LordOfTheTrees)

Feel free to reach out if you'd like to collaborate on a project or discuss job opportunities.

## Contact Form

<form id="contact-form">
  <div class="form-group">
    <label for="name">Name:</label>
    <input type="text" id="name" name="name" required>
  </div>
  
  <div class="form-group">
    <label for="email">Email:</label>
    <input type="email" id="email" name="email" required>
  </div>
  
  <div class="form-group">
    <label for="subject">Subject:</label>
    <input type="text" id="subject" name="subject">
  </div>
  
  <div class="form-group">
    <label for="message">Message:</label>
    <textarea id="message" name="message" rows="5" required></textarea>
  </div>
  
  <button type="submit" class="button">Send Message</button>
  <div id="form-status" class="form-status" hidden></div>
</form>