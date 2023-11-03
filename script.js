// display elements on page scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    console.log(entry);
    if (entry.isIntersecting) {
      entry.target.classList.add("showedTop");
      entry.target.classList.add("showed");
    }
    /*else {
      entry.target.classList.remove("showed")
    }*/
  });
});

const hiddenElementsTop = document.querySelectorAll('.hiddenTop');
hiddenElementsTop.forEach((el) => observer.observe(el));


const hiddenElementsLeft = document.querySelectorAll('.hiddenLeft');
hiddenElementsLeft.forEach((el) => observer.observe(el));


const menuBtn = document.querySelector("#menubtn");

  
  var body = document.getElementById("body");
  var main = document.querySelector("#main");
  var navMenu = document.querySelector(".nav-menu");
  
  var menuClosebtn = document.querySelector(".menu-close");
  

menuBtn.addEventListener("click", function () {
  navMenu.classList.add("active");
  body.classList.add("active");
});

menuClosebtn.addEventListener("click", function() {

  navMenu.classList.remove("active");
  body.classList.remove("active");

});



window.onscroll = function() {
  scrollFunction();
}

function scrollFunction() {
var topBtn = document.querySelector(".back-to-top");

  if(document.body.scrollTop > 500 || document.documentElement.scrollTop > 500) {
    topBtn.classList.add("active");
  }else {
    topBtn.classList.remove("active");
  }
}
