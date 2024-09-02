const sidebarToggle = document.querySelector("#sidebar-toggle");
sidebarToggle.addEventListener("click",function(){
    document.querySelector("#sidebar").classList.toggle("collapsed");
});

document.querySelector(".theme-toggle").addEventListener("click",() => {
    toggleLocalStorage();
    toggleRootClass();
});

function toggleRootClass(){
    const current = document.documentElement.getAttribute('data-bs-theme');
    const inverted = current == 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-bs-theme',inverted);
}

function toggleLocalStorage(){
    if(isLight()){
        localStorage.removeItem("light");
    }else{
        localStorage.setItem("light","set");
    }
}

function isLight(){
    return localStorage.getItem("light");
}

if(isLight()){
    toggleRootClass();
}

document.querySelector("dashboard").style.display === "block"
document.querySelector("user-tables").style.display === "none"
document.querySelector("inmails-tables").style.display === "none"
document.querySelector("exmails-tables").style.display === "none"

document.addEventListener("DOMContentLoaded", function () {

    document.querySelector("#admin-dashboard").addEventListener("click", () => {
      if(document.querySelector("#dashboard").style.display === "none"){
        admin_dashboard()
      }
    });
    document.querySelector("#user-table").addEventListener("click", () => {
      if(document.querySelector("#user-tables").style.display === "none"){
        user_table()
      }
    });
    document.querySelector("#internal-mails").addEventListener("click", () => {
      if(document.querySelector("#inmails-table").style.display === "none"){
        internal_mails()
      }
    });
    document.querySelector("#external-mails").addEventListener("click", () => {
      if(document.querySelector("exmails-tables").style.display === "none"){
        external_mails()
      }
    });
    // history.pushState({compose : }, "", `./#${link.id}`)
    // By default, load the inbox
    load_mailbox("inbox");
  });

function admin_dashboard(){
      document.querySelector("dashboard").style.display === "block"
      document.querySelector("user-tables").style.display === "none"
      document.querySelector("inmails-tables").style.display === "none"
      document.querySelector("exmails-tables").style.display === "none"
    }
    
    function user_table(){
      document.querySelector("dashboard").style.display === "none"
      document.querySelector("user-tables").style.display === "block"
      document.querySelector("inmails-tables").style.display === "none"
      document.querySelector("exmails-tables").style.display === "none"
    }
    
    function internal_mails(){
      document.querySelector("dashboard").style.display === "none"
      document.querySelector("user-tables").style.display === "none"
      document.querySelector("inmails-tables").style.display === "block"
      document.querySelector("exmails-tables").style.display === "none"
    }
    
    function external_mails(){
      document.querySelector("dashboard").style.display === "none"
      document.querySelector("user-tables").style.display === "none"
      document.querySelector("inmails-tables").style.display === "none"
      document.querySelector("exmails-tables").style.display === "block"
    }