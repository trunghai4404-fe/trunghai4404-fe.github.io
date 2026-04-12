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