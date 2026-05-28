/* =============================================
   INFORMATION PAGE JAVASCRIPT
   Sidebar navigation and mobile section jump
   ============================================= */

let currentLanguage = localStorage.getItem('selectedLanguage') || 'en';
window.syncInfoPageLang = (lang) => {
  currentLanguage = lang;
};

const sidebarLinks = document.querySelectorAll('.sidebar-link');
const sections = document.querySelectorAll('.info-section');

function updateActiveSidebar() {
  const scrollPosition = window.scrollY + 100;

  sections.forEach((section) => {
    const sectionTop = section.offsetTop;
    const sectionBottom = sectionTop + section.offsetHeight;

    if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
      sidebarLinks.forEach((link) => link.classList.remove('active'));
      const correspondingLink = document.querySelector(`.sidebar-link[href="#${section.id}"]`);
      if (correspondingLink) correspondingLink.classList.add('active');
    }
  });
}

window.addEventListener('scroll', updateActiveSidebar);

const sectionDropdown = document.getElementById('sectionDropdown');
if (sectionDropdown) {
  sectionDropdown.addEventListener('change', (e) => {
    if (e.target.value) {
      const target = document.querySelector(e.target.value);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        e.target.value = '';
      }
    }
  });
}

function toggleMobileDropdown() {
  const dropdownWrap = document.getElementById('sectionDropdownWrap');
  if (!dropdownWrap) return;

  if (window.innerWidth <= 768) {
    dropdownWrap.style.display = 'block';
    const sidebar = document.querySelector('.info-sidebar');
    if (sidebar) sidebar.style.display = 'none';
  } else {
    dropdownWrap.style.display = 'none';
    const sidebar = document.querySelector('.info-sidebar');
    if (sidebar) sidebar.style.removeProperty('display');
  }
}

window.addEventListener('resize', toggleMobileDropdown);
window.addEventListener('load', toggleMobileDropdown);

sidebarLinks.forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetSection = document.querySelector(link.getAttribute('href'));
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.pushState(null, null, link.getAttribute('href'));
    }
  });
});
