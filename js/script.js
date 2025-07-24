function initSlider(){
    const liste = document.querySelector("#list");
    const btnleft = document.querySelector("#left");
    const btnright = document.querySelector("#right");

    if(!liste || !btnleft || !btnright) {
        console.log("Slider elemanları buunamdı!");
        return;
    }

    btnleft.addEventListener("click", () => {
        liste.scrollBy({left: -300, behavior: "smooth"});
    });
    btnright.addEventListener("click", () => {
        liste.scrollBy({left: 300, behavior: "smooth"});
    });
}
 initSlider();