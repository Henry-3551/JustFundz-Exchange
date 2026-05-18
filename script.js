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
  

if (menuBtn && navMenu && body) {
  menuBtn.addEventListener("click", function () {
    navMenu.classList.add("active");
    body.classList.add("active");
  });
}

if (menuClosebtn && navMenu && body) {
  menuClosebtn.addEventListener("click", function() {

    navMenu.classList.remove("active");
    body.classList.remove("active");

  });
}



window.onscroll = function() {
  scrollFunction();
}

function scrollFunction() {
var topBtn = document.querySelector(".back-to-top");

  if (!topBtn) {
    return;
  }

  if(document.body.scrollTop > 500 || document.documentElement.scrollTop > 500) {
    topBtn.classList.add("active");
  }else {
    topBtn.classList.remove("active");
  }
}

const tradingViewContainer = document.querySelector("#tradingview-ticker");

if (tradingViewContainer) {
  const loadingMessage = tradingViewContainer.querySelector(".ticker-loading");

  const tradingViewConfig = {
    symbols: [
      {
        proName: "BITSTAMP:BTCUSD",
        title: "Bitcoin"
      },
      {
        proName: "BITSTAMP:ETHUSD",
        title: "Ethereum"
      },
      {
        proName: "FX_IDC:EURUSD",
        title: "EUR/USD"
      },
      {
        proName: "FOREXCOM:SPXUSD",
        title: "S&P 500"
      },
      {
        proName: "FOREXCOM:NSXUSD",
        title: "US 100"
      }
    ],
    showSymbolLogo: true,
    colorTheme: "light",
    isTransparent: false,
    displayMode: "adaptive",
    locale: "en"
  };

  const tradingViewScript = document.createElement("script");
  tradingViewScript.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
  tradingViewScript.async = true;
  tradingViewScript.text = JSON.stringify(tradingViewConfig);
  tradingViewScript.addEventListener("load", () => {
    if (loadingMessage) {
      loadingMessage.remove();
    }
  });
  tradingViewScript.addEventListener("error", () => {
    if (loadingMessage) {
      loadingMessage.textContent = "Ticker unavailable. Please refresh to try again.";
    }
  });
  tradingViewContainer.appendChild(tradingViewScript);
}

if (typeof Swiper !== "undefined") {
  new Swiper(".hero-swiper", {
    loop: true,
    speed: 900,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false
    },
    pagination: {
      el: ".swiper-pagination",
      clickable: true
    },
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev"
    }
  });
}

const API_BASE = (() => {
  if (window.location.protocol === "file:") {
    return "http://localhost:4000";
  }

  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return "http://localhost:4000";
  }

  return window.location.origin;
})();

async function postJson(path, payload) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify(payload)
  });

  let data = {};
  try {
    data = await response.json();
  } catch (error) {
    data = {};
  }

  if (!response.ok) {
    const message = data.error || "Something went wrong. Please try again.";
    throw new Error(message);
  }

  return data;
}

function setAlert(alertEl, message, isError) {
  if (!alertEl) {
    return;
  }

  alertEl.textContent = message;
  alertEl.classList.add("is-visible");
  alertEl.classList.toggle("is-error", Boolean(isError));
}

const loginForm = document.querySelector("#login-form");
if (loginForm) {
  const alertEl = loginForm.querySelector(".form-alert");

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.querySelector("#login-email").value.trim();
    const password = document.querySelector("#login-password").value.trim();

    try {
      setAlert(alertEl, "Signing you in...", false);
      await postJson("/api/auth/login", { email, password });
      setAlert(alertEl, "Login successful. Redirecting...", false);
      window.setTimeout(() => {
        window.location.href = "index.html";
      }, 800);
    } catch (error) {
      setAlert(alertEl, error.message, true);
    }
  });
}

const registerForm = document.querySelector("#register-form");
if (registerForm) {
  const alertEl = registerForm.querySelector(".form-alert");

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.querySelector("#register-name").value.trim();
    const email = document.querySelector("#register-email").value.trim();
    const password = document.querySelector("#register-password").value.trim();
    const confirm = document.querySelector("#register-confirm").value.trim();

    if (password !== confirm) {
      setAlert(alertEl, "Passwords do not match.", true);
      return;
    }

    try {
      setAlert(alertEl, "Creating your account...", false);
      await postJson("/api/auth/register", { name, email, password });
      setAlert(alertEl, "Registration complete. Please check your email to verify.", false);
      registerForm.reset();
    } catch (error) {
      setAlert(alertEl, error.message, true);
    }
  });
}

const resetRequestForm = document.querySelector("#reset-request-form");
const resetConfirmForm = document.querySelector("#reset-confirm-form");

if (resetRequestForm || resetConfirmForm) {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  if (token && resetRequestForm && resetConfirmForm) {
    resetRequestForm.classList.add("is-hidden");
    resetConfirmForm.classList.remove("is-hidden");
    const tokenInput = document.querySelector("#reset-token");
    if (tokenInput) {
      tokenInput.value = token;
    }
  }
}

if (resetRequestForm) {
  const alertEl = resetRequestForm.querySelector(".form-alert");

  resetRequestForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.querySelector("#reset-email").value.trim();

    try {
      setAlert(alertEl, "Sending reset link...", false);
      await postJson("/api/auth/reset", { email });
      setAlert(alertEl, "If the email exists, a reset link has been sent.", false);
      resetRequestForm.reset();
    } catch (error) {
      setAlert(alertEl, error.message, true);
    }
  });
}

if (resetConfirmForm) {
  const alertEl = resetConfirmForm.querySelector(".form-alert");

  resetConfirmForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const token = document.querySelector("#reset-token").value.trim();
    const password = document.querySelector("#reset-new-password").value.trim();
    const confirm = document.querySelector("#reset-confirm-password").value.trim();

    if (!token) {
      setAlert(alertEl, "Missing reset token. Please use the link from your email.", true);
      return;
    }

    if (password !== confirm) {
      setAlert(alertEl, "Passwords do not match.", true);
      return;
    }

    try {
      setAlert(alertEl, "Updating password...", false);
      await postJson("/api/auth/reset/confirm", { token, password });
      setAlert(alertEl, "Password updated. You can now log in.", false);
      resetConfirmForm.reset();
    } catch (error) {
      setAlert(alertEl, error.message, true);
    }
  });
}
