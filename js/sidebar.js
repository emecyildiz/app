function sidebarScroll(){
    const togglebutton = document.getElementById("menuToggle");
    const sidebar = document.getElementById("sidebar");

    if( togglebutton && sidebar){
        togglebutton.addEventListener("click", function () {
        sidebar.classList.toggle("closed");
        });
    }
}
sidebarScroll();
 
function uploadPhoto(){
    document.getElementById("photoInput").click();
}
 document.getElementById("photoInput").addEventListener("change", function(){
    const file = this.files[0];

    if (file){
        const reader = new FileReader();

        reader.onload = function (e){
            document.getElementById("profilePhoto").src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
 });