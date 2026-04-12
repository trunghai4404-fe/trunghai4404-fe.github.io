document.addEventListener("DOMContentLoaded", () => {
    let lastScroll = 0;
    const header = document.getElementById("site-header");
    window.addEventListener("scroll", () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > lastScroll) {
            header.classList.add("hide");
        } else {
            header.classList.remove("hide");
        }

        lastScroll = currentScroll;
    });
});
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.site-header__nav-item a');

window.addEventListener('scroll', () => {
    let current = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.clientHeight;

        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.parentElement.classList.remove('active');

        if (link.getAttribute('href') === `#${current}`) {
            link.parentElement.classList.add('active');
        }
    });
});
