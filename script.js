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
            const firstImgForWA = images[0] || ""; // WhatsApp preview ke liye pehli photo

            // --- LOCATION SETTING ---
            // Isse link banega: website.com/page#prod-12345
            const cleanUrl = window.location.href.split('#')[0];
            const productLocation = `${cleanUrl}#prod-${item.id}`;

            // --- WHATSAPP MESSAGE FORMATTING ---
            const message = `*NAYA ORDER - GHABA LUXURY*\n\n` +
                            `*Product:* ${item.name}\n` +
                            `*Price:* ₹${item.price}\n\n` +
                            `*Photo Link:* ${firstImgForWA}\n` +
                            `*View on Website:* ${productLocation}`;

            const whatsappUrl = `https://wa.me/919876543210?text=${encodeURIComponent(message)}`;

            // Images HTML
            let imageHTML = images.map((src, imgIndex) => 
                `<img src="${src}" 
                      class="p-img ${imgIndex === 0 ? 'active' : ''}" 
                      data-idx="${imgIndex}" 
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

            // ID yahan add kiya gaya hai (id="prod-${item.id}")
            return `
                <div class="item-card" id="prod-${item.id}" data-current="0" data-total="${images.length}" style="scroll-margin-top: 120px;">
                    <div class="item-img-box">
                        ${imageHTML}
                        ${dotsHTML}
                    </div>
                    <div class="item-details">
                        <h3 style="text-transform: uppercase; letter-spacing:1.5px; margin: 10px 0;">${item.name}</h3>
                        <div class="item-price">₹${Number(item.price).toLocaleString('en-IN')}</div>
                        <a href="${whatsappUrl}" class="wa-order-link" target="_blank">
                            ORDER ON WHATSAPP 💬
                        </a>
                    </div>
                </div>
            `;
        }).reverse().join('');

        initAutoSlider();

    } catch (error) {
        console.error("Cloud error:", error);
        container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:100px;"><h3>Data load nahi ho paya.</h3></div>`;
    }
}

// --- SLIDER LOGIC ---
function manualSlide(dotElement, targetIdx) {
    const card = dotElement.closest('.item-card');
    changeSlide(card, targetIdx);
}

function changeSlide(card, targetIdx) {
    const imgs = card.querySelectorAll('.p-img');
    const dots = card.querySelectorAll('.dot');
    if(!imgs[targetIdx]) return;
    imgs.forEach(img => img.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    imgs[targetIdx].classList.add('active');
    if(dots[targetIdx]) dots[targetIdx].classList.add('active');
    card.setAttribute('data-current', targetIdx);
}

function initAutoSlider() {
    if (window.ghabaSlider) clearInterval(window.ghabaSlider);
    window.ghabaSlider = setInterval(() => {
        const allCards = document.querySelectorAll('.item-card');
        allCards.forEach(card => {
            const current = parseInt(card.getAttribute('data-current') || 0);
            const total = parseInt(card.getAttribute('data-total') || 0);
            if (total > 1) {
                const next = (current + 1) % total;
                changeSlide(card, next);
            }
        });
    }, 4500); 
}

document.addEventListener('DOMContentLoaded', loadGhabaProducts);