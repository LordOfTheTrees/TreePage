---
layout: page
title: Anonymous Feedback
permalink: /pages/feedback/
---

I would truly like to know your candid feedback about anything. Whatever you want to share, I'd like to hear it.

Please make it as concrete as possible, but try not to include anything identifying. I don't collect or store anything on my end.

THANK YOU

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
