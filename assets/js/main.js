document.addEventListener('DOMContentLoaded', function() {
  // Mobile menu toggle functionality
  const header = document.querySelector('.site-header');
  const nav = document.querySelector('.site-nav');
  
  if (window.innerWidth < 600) {
    const menuToggle = document.createElement('button');
    menuToggle.classList.add('menu-toggle');
    menuToggle.textContent = 'Menu';
    
    menuToggle.addEventListener('click', function() {
      nav.classList.toggle('visible');
    });
    
    header.insertBefore(menuToggle, nav);
    nav.classList.add('mobile');
  }
  
  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      
      document.querySelector(this.getAttribute('href')).scrollIntoView({
        behavior: 'smooth'
      });
    });
  });
  
  // Contact form submission
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    const statusEl = document.getElementById('form-status');
    const submitBtn = contactForm.querySelector('button[type="submit"]');

    contactForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      const nameInput = document.getElementById('name');
      const emailInput = document.getElementById('email');
      const messageInput = document.getElementById('message');
      const subjectInput = document.getElementById('subject');

      // Client-side validation
      let isValid = true;
      [nameInput, emailInput, messageInput].forEach(input => {
        if (!input.value.trim() || (input === emailInput && !isValidEmail(input.value))) {
          isValid = false;
          input.classList.add('error');
        } else {
          input.classList.remove('error');
        }
      });

      if (!isValid) {
        showStatus('Please fill out all required fields correctly.', 'error');
        return;
      }

      // Disable button and show sending state
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
      statusEl.hidden = true;

      const netlifyUrl = window.NETLIFY_FUNCTIONS_URL || '';
      const functionUrl = `${netlifyUrl}/.netlify/functions/send-contact`;

      try {
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            subject: subjectInput.value.trim(),
            message: messageInput.value.trim()
          })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          showStatus('Message sent! Thanks for reaching out.', 'success');
          contactForm.reset();
        } else {
          showStatus(data.error || 'Something went wrong. Please try again.', 'error');
        }
      } catch (err) {
        showStatus('Could not reach the server. Please try again later.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
      }
    });

    function showStatus(msg, type) {
      statusEl.textContent = msg;
      statusEl.className = 'form-status ' + type;
      statusEl.hidden = false;
    }
  }
  
  function isValidEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }
});