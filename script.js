// 1. CLOUD URL SETTING
const SHEET_URL = "https://script.google.com/macros/s/AKfycbzC1l2Uq_vdAvIL63Y4I7zQbpwG36RvDljet5WTWZcxRKF8UnMsWfwsT60JnSAT6U6qxA/exec";

async function loadGhabaProducts() {
    const container = document.getElementById('web-display');
    if (!container) return;

    // Loading State
    container.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding:100px;">
            <div class="loader-spinner"></div>
            <h3 style="color:#d4af37; font-family: serif; margin-top:20px;">GHABA Luxury Designs Load Ho Rahe Hain...</h3>
        </div>`;

    try {
        const response = await fetch(SHEET_URL);
        const products = await response.json();
        
        const pageCategory = document.body.dataset.page ? document.body.dataset.page.toLowerCase() : "";
        
        const filteredItems = products.filter(item => 
            item.cat && item.cat.toLowerCase().trim() === pageCategory.trim()
        );

        if (!filteredItems || filteredItems.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align:center; padding:100px; color:#666;">
                    <h3 style="font-family:serif;">Naye Designs Jald Aa Rahe Hain</h3>
                    <p>Hamare naye ${pageCategory} collection ka intezar karein.</p>
                </div>`;
            return;
        }

        // Generate HTML
        container.innerHTML = filteredItems.map((item) => {
            // --- SAFE IMAGE HANDLING ---
            let images = [];
            try {
                if (Array.isArray(item.img)) {
                    images = item.img;
                } else if (typeof item.img === 'string') {
                    if (item.img.startsWith('[') || item.img.startsWith('{')) {
                        images = JSON.parse(item.img);
                    } else {
                        images = [item.img];
                    }
                }
            } catch (e) {
                images = ['https://via.placeholder.com/400x500?text=Ghaba+Jewelry'];
            }
            
            images = images.filter(src => src && src.trim() !== "");
            const firstImgForCheckout = images[0] || ""; 

            // --- LOCATION SETTING ---
            const cleanUrl = window.location.origin + window.location.pathname;
            const productLocation = `${cleanUrl}#prod-${item.id}`;

            // --- DATA STORAGE LOGIC (Fixed with Base64 for 100% Success) ---
            const orderObj = {
                name: item.name,
                price: item.price,
                img: firstImgForCheckout,
                loc: productLocation
            };

            // Encoding to Base64 to prevent any HTML/Quote breakage
            const base64Data = btoa(unescape(encodeURIComponent(JSON.stringify(orderObj))));

            // Images HTML
            let imageHTML = images.map((src, imgIndex) => 
                `<img src="${src}" 
                      class="p-img ${imgIndex === 0 ? 'active' : ''}" 
                      data-idx="${imgIndex}" 
                      onmouseover="manualSlide(this, ${imgIndex})"
                      loading="lazy"
                      decoding="async"
                      onerror="this.src='https://via.placeholder.com/400x500?text=Image+Not+Found'">`
            ).join('');

            // Dots HTML
            let dotsHTML = images.length > 1 ? 
                `<div class="slider-dots">` + 
                images.map((_, dotIndex) => 
                    `<span class="dot ${dotIndex === 0 ? 'active' : ''}" onclick="manualSlide(this, ${dotIndex})"></span>`
                ).join('') + `</div>` : '';

            // Card HTML
            return `
                <div class="item-card" id="prod-${item.id}" 
                      data-current="0" 
                      data-total="${images.length}" 
                      onwheel="handleScrollSlide(event, this)"
                      style="scroll-margin-top: 120px;">
                    <div class="item-img-box">
                        ${imageHTML}
                        ${dotsHTML}
                    </div>
                    <div class="item-details">
                        <h3 style="text-transform: uppercase; letter-spacing:1.5px; margin: 10px 0;">${item.name}</h3>
                        <div class="item-price">₹${Number(item.price).toLocaleString('en-IN')}</div>
                        <button onclick="goToCheckout('${base64Data}')" class="wa-order-link" style="width:100%; border:none; cursor:pointer; display:block; text-align:center; text-decoration:none;">
                            BUY NOW / ORDER NOW 🛒
                        </button>
                    </div>
                </div>
            `;
        }).reverse().join('');

        initAutoSlider(); 
        handleHashScroll();

    } catch (error) {
        console.error("Cloud error:", error);
        container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:100px;"><h3>Data load nahi ho paya.</h3></div>`;
    }
}

// --- WHEEL SCROLL LOGIC ---
function handleScrollSlide(event, card) {
    if (Math.abs(event.deltaY) > 30) { 
        event.preventDefault(); 
        const current = parseInt(card.getAttribute('data-current') || 0);
        const total = parseInt(card.getAttribute('data-total') || 0);
        if (total <= 1) return;

        let next;
        if (event.deltaY > 0) {
            next = (current + 1) % total;
        } else {
            next = (current - 1 + total) % total;
        }
        changeSlide(card, next);
    }
}

// --- HASH SCROLL LOGIC ---
function handleHashScroll() {
    if (window.location.hash) {
        setTimeout(() => {
            const element = document.querySelector(window.location.hash);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 800);
    }
}

// --- REDIRECTION FUNCTION (Updated for Base64) ---
function goToCheckout(base64Data) {
    try {
        const decodedData = decodeURIComponent(escape(atob(base64Data)));
        localStorage.setItem('ghaba_order', decodedData);
        window.location.href = 'checkout.html';
    } catch (e) {
        console.error("Encoding error:", e);
        alert("Pramaanikikaran mein truti (Error in processing). Kripya dobara koshish karein.");
    }
}

// --- SLIDER LOGIC ---
function manualSlide(element, targetIdx) {
    const card = element.closest('.item-card');
    clearTimeout(window.hoverTimer);
    window.hoverTimer = setTimeout(() => {
        changeSlide(card, targetIdx);
    }, 300); 
}

function changeSlide(card, targetIdx) {
    const imgs = card.querySelectorAll('.p-img');
    const dots = card.querySelectorAll('.dot');
    if(!imgs[targetIdx]) return;
    if(imgs[targetIdx].classList.contains('active')) return;

    imgs.forEach(img => img.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    imgs[targetIdx].classList.add('active');
    if(dots[targetIdx]) dots[targetIdx].classList.add('active');
    
    card.setAttribute('data-current', targetIdx);
}

// --- AUTO SLIDER ---
function initAutoSlider() {
    if (window.ghabaSlider) clearInterval(window.ghabaSlider);
    window.ghabaSlider = setInterval(() => {
        const allCards = document.querySelectorAll('.item-card');
        allCards.forEach(card => {
            if (!card.matches(':hover')) {
                const current = parseInt(card.getAttribute('data-current') || 0);
                const total = parseInt(card.getAttribute('data-total') || 0);
                if (total > 1) {
                    const next = (current + 1) % total;
                    changeSlide(card, next);
                }
            }
        });
    }, 4500); 
}

document.addEventListener('DOMContentLoaded', loadGhabaProducts);