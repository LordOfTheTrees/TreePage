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
  
  // Form validation
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      const nameInput = document.getElementById('name');
      const emailInput = document.getElementById('email');
      const messageInput = document.getElementById('message');
      
      let isValid = true;
      
      if (!nameInput.value.trim()) {
        isValid = false;
        nameInput.classList.add('error');
      } else {
        nameInput.classList.remove('error');
      }
      
      if (!emailInput.value.trim() || !isValidEmail(emailInput.value)) {
        isValid = false;
        emailInput.classList.add('error');
      } else {
        emailInput.classList.remove('error');
      }
      
      if (!messageInput.value.trim()) {
        isValid = false;
        messageInput.classList.add('error');
      } else {
        messageInput.classList.remove('error');
      }
      
      if (!isValid) {
        e.preventDefault();
        alert('Please fill out all required fields correctly.');
      }
    });
  }
  
  function isValidEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }
});