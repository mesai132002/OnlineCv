document.addEventListener("DOMContentLoaded", () => {
  const yearNode = document.getElementById("year");
  if (yearNode) {
    yearNode.textContent = new Date().getFullYear();
  }

  const today = new Date();
  let age = today.getFullYear() - 2002;
  if (today.getMonth() < 8 || (today.getMonth() === 8 && today.getDate() < 13)) {
    age -= 1;
  }
  document.querySelectorAll("[data-age]").forEach((node) => {
    node.textContent = age;
  });

  const printButton = document.getElementById("printButton");
  if (printButton) {
    printButton.addEventListener("click", () => window.print());
  }
});
