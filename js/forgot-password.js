const form = document.getElementById('forgot-password-form');
const emailInput = document.getElementById('email');
const formMessage = document.getElementById('form-message');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  formMessage.textContent = '';
  formMessage.className = 'form-message';

  if (!emailInput.checkValidity()) {
    emailInput.classList.add('is-invalid');
    return;
  } else {
    emailInput.classList.remove('is-invalid');
  }

  // Simulate API call to send reset link
  try {
    // Example: replace with your backend API call
    // const response = await fetch('/api/auth/forgot-password', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email: emailInput.value }),
    // });
    // if (!response.ok) throw new Error('Network response was not ok');

    await new Promise((resolve) => setTimeout(resolve, 1000)); // simulate delay

    formMessage.textContent =
      'If an account with that email exists, a reset link has been sent.';
    formMessage.classList.add('text-success');
    form.reset();
  } catch (error) {
    formMessage.textContent =
      'Something went wrong. Please try again later.';
    formMessage.classList.add('text-danger');
  }
});
