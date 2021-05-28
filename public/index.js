document.addEventListener('DOMContentLoaded', () => {
  document.body.innerHTML =
    "<p>You'll be redirected to our main domain: https://www.aiaautd.com in 5 seconds.<p>";
  setTimeout(() => {
    window.location.href = 'http://www.aiaautd.com';
  }, 5000);
});
