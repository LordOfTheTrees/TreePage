---
layout: page
title: Anonymous Feedback
permalink: /pages/feedback/
---

If you've worked with me, managed me, been managed by me, or just interacted with me professionally, I'd genuinely like to know what I could do better — and what's working. This form is anonymous: I don't collect your name, email, or any other identifying information, and nothing here is logged or stored anywhere.

Be candid. That's the point.

<form id="feedback-form">
  <div class="form-group">
    <label for="feedback-topic">What's this about?</label>
    <select id="feedback-topic" name="topic">
      <option value="what">What I do</option>
      <option value="how">How I do it</option>
      <option value="seem">How I seem</option>
      <option value="other">Other</option>
    </select>
  </div>

  <div class="form-group">
    <label for="feedback-action">Suggested action</label>
    <select id="feedback-action" name="action">
      <option value="start">Start doing</option>
      <option value="stop">Stop doing</option>
      <option value="keep">Keep doing</option>
      <option value="other">Other</option>
    </select>
  </div>

  <div class="form-group">
    <label for="feedback-message">Your feedback:</label>
    <textarea id="feedback-message" name="message" rows="6" required></textarea>
  </div>

  <button type="submit" class="button">Send Anonymous Feedback</button>
  <div id="feedback-form-status" class="form-status" hidden></div>
</form>
