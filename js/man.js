function loadPage(page){
    fetch(`/pages/${page}.html`)
    .then(res => res.text())
    .then(data => {
        document.getElementById("content").innerHTML = data;
        if(page == "Filmler") {
            loadScript("js/script.js");
        }else if(page == "Profil"){
            loadScript("js/sidebar.js");
        }
    });
}

function loadScript(src){
    const script = document.createElement("script");
    script.src = src;
    script.defer = true;
    document.body.appendChild(script);
}



async function loadComponent(id, file) {
  const response = await fetch(file);
  const html = await response.text();
  document.getElementById(id).innerHTML = html;
}

window.onload = async() => {
    await loadComponent("navbar","../templates/navbar.html");
    loadPage("Home");

    document.querySelectorAll(".btn, .giriş").forEach(item =>{
        item.addEventListener("click", () => {
            const page = item.getAttribute("data-page");
            loadPage(page);
        });
    });
};

