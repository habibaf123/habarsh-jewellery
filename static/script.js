/* =========================================================
   HABARSH JEWELLERY
   PREMIUM E-COMMERCE JAVASCRIPT
========================================================= */


/* =========================================================
   GLOBAL STATE
========================================================= */

let cart = [];

let allProducts = [];

let currentCategory = "all";

let isProcessingPayment = false;


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    initializePage();

});


/* =========================================================
   INITIALIZE
========================================================= */

async function initializePage() {

    setupLoader();

    setupNavigation();

    setupCategoryButtons();

    setupPaymentMethods();

    setupSearch();

    setupScrollReveal();

    setupHeroParallax();

    setupCollectionClicks();

    loadCart();

    updateCartUI();

    await loadProducts();

}


/* =========================================================
   LOADER
========================================================= */

function setupLoader() {

    const loader =
        document.getElementById("pageLoader");

    if (!loader) return;

    window.addEventListener("load", () => {

        setTimeout(() => {

            loader.classList.add("hide");

        }, 500);

    });

}


/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

    const nav =
        document.querySelector(".luxury-nav");

    if (!nav) return;


    window.addEventListener("scroll", () => {

        if (window.scrollY > 80) {

            nav.classList.add("scrolled");

        } else {

            nav.classList.remove("scrolled");

        }

    });


    document
        .querySelectorAll('a[href^="#"]')
        .forEach(link => {

            link.addEventListener("click", function(e) {

                const targetId =
                    this.getAttribute("href");

                if (!targetId || targetId === "#") {
                    return;
                }

                const target =
                    document.querySelector(targetId);

                if (!target) return;

                e.preventDefault();

                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            });

        });

}


/* =========================================================
   HERO PARALLAX
========================================================= */

function setupHeroParallax() {

    const hero =
        document.querySelector(".luxury-hero");

    const image =
        document.querySelector(".hero-photo img");

    if (!hero || !image) return;


    if (
        !window.matchMedia(
            "(pointer:fine)"
        ).matches
    ) {
        return;
    }


    hero.addEventListener("mousemove", (event) => {

        const rect =
            hero.getBoundingClientRect();

        const x =
            (event.clientX - rect.left)
            / rect.width - .5;

        const y =
            (event.clientY - rect.top)
            / rect.height - .5;


        image.style.transform =
            `scale(1.07)
             translate(${x * -8}px, ${y * -5}px)`;

    });


    hero.addEventListener("mouseleave", () => {

        image.style.transform =
            "scale(1.03) translate(0,0)";

    });

}


/* =========================================================
   LOAD PRODUCTS
========================================================= */

async function loadProducts() {

    const grid =
        document.getElementById("productGrid");

    const loading =
        document.getElementById("productLoading");


    if (loading) {
        loading.classList.add("show");
    }


    try {

        const response =
            await fetch("/api/products");


        if (!response.ok) {

            throw new Error(
                "Unable to load products"
            );

        }


        const data =
            await response.json();


        if (Array.isArray(data)) {

            allProducts = data;

        } else if (
            data &&
            Array.isArray(data.products)
        ) {

            allProducts = data.products;

        } else {

            allProducts = [];

        }


        renderProducts();


    } catch (error) {

        console.error(
            "Product loading error:",
            error
        );


        if (grid) {

            grid.innerHTML = `
                <div class="product-error">
                    <h3>Something went wrong</h3>
                    <p>
                        We couldn't load our jewellery.
                        Please refresh the page.
                    </p>
                </div>
            `;

        }

    } finally {

        if (loading) {
            loading.classList.remove("show");
        }

    }

}


/* =========================================================
   PRODUCT IMAGES
========================================================= */

function getProductImage(product) {

    if (product.image) {
        return product.image;
    }

    if (product.imageUrl) {
        return product.imageUrl;
    }

    const category =
        String(product.category || "")
            .toLowerCase();


    const images = {

        jhumkas:
            "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=90",

        earrings:
            "https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&w=900&q=90",

        bangles:
            "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=900&q=90",

        pendants:
            "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=90",

        necklaces:
            "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=90",

        rings:
            "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=90"

    };


    return (
        images[category]
        ||
        images.pendants
    );

}


/* =========================================================
   RENDER PRODUCTS
========================================================= */

function renderProducts() {

    const grid =
        document.getElementById("productGrid");

    if (!grid) return;


    let products =
        [...allProducts];


    if (currentCategory !== "all") {

        products =
            products.filter(product => {

                const category =
                    String(
                        product.category || ""
                    ).toLowerCase();

                return (
                    category ===
                    currentCategory
                );

            });

    }


    if (!products.length) {

        grid.innerHTML = `

            <div class="product-error">

                <h3>
                    Coming soon
                </h3>

                <p>
                    Beautiful pieces are being curated
                    for this collection.
                </p>

            </div>

        `;

        return;

    }


    grid.innerHTML =
        products.map(createProductCard).join("");


    attachProductEvents();

}


/* =========================================================
   PRODUCT CARD
========================================================= */

function createProductCard(product) {

    const id =
        product._id ||
        product.id ||
        "";


    const name =
        escapeHTML(
            product.name ||
            "Beautiful Jewellery"
        );


    const category =
        escapeHTML(
            product.category ||
            "jewellery"
        );


    const description =
        escapeHTML(
            product.description ||
            "Elegant jewellery for every moment."
        );


    const price =
        Number(product.price || 0);


    const oldPrice =
        Number(
            product.oldPrice ||
            product.comparePrice ||
            0
        );


    const stock =
        Number(
            product.stock ??
            10
        );


    const image =
        getProductImage(product);


    const isOut =
        stock <= 0;


    return `

        <article
            class="product-card reveal"
            data-product-id="${escapeHTML(String(id))}"
        >

            <div class="product-image-wrap">

                ${
                    oldPrice > price
                    ?
                    `
                    <span class="product-badge">
                        SPECIAL
                    </span>
                    `
                    :
                    ""
                }


                <img
                    src="${escapeHTML(image)}"
                    alt="${name}"
                    loading="lazy"
                    onerror="this.src='https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=90'"
                >


                <button
                    type="button"
                    class="product-heart"
                    data-action="wishlist"
                    aria-label="Add to wishlist"
                >
                    ♡
                </button>

            </div>


            <div class="product-info">

                <span class="product-category">
                    ${category.toUpperCase()}
                </span>


                <h3 class="product-name">
                    ${name}
                </h3>


                <p class="product-description">
                    ${description}
                </p>


                <div class="product-price-row">

                    <div>

                        <span class="product-price">
                            ₹${formatMoney(price)}
                        </span>

                        ${
                            oldPrice > price
                            ?
                            `
                            <span class="product-old-price">
                                ₹${formatMoney(oldPrice)}
                            </span>
                            `
                            :
                            ""
                        }

                    </div>


                    <button
                        type="button"
                        class="add-cart-btn"
                        data-action="add"
                        data-id="${escapeHTML(String(id))}"
                        ${isOut ? "disabled" : ""}
                    >
                        ${
                            isOut
                            ?
                            "SOLD OUT"
                            :
                            "ADD TO BAG"
                        }
                    </button>

                </div>

            </div>

        </article>

    `;

}


/* =========================================================
   PRODUCT EVENTS
========================================================= */

function attachProductEvents() {

    document
        .querySelectorAll(
            '[data-action="add"]'
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        button.dataset.id;

                    addToCart(id);

                }
            );

        });


    document
        .querySelectorAll(
            '[data-action="wishlist"]'
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    button.textContent =
                        button.textContent === "♡"
                        ? "♥"
                        : "♡";

                    showToast(
                        "Wishlist updated"
                    );

                }
            );

        });


    setupScrollReveal();

}


/* =========================================================
   CATEGORY BUTTONS
========================================================= */

function setupCategoryButtons() {

    document
        .querySelectorAll(".category-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".category-btn"
                        )
                        .forEach(btn => {

                            btn.classList.remove(
                                "active"
                            );

                        });


                    button.classList.add(
                        "active"
                    );


                    currentCategory =
                        button.dataset.category
                        || "all";


                    renderProducts();

                }
            );

        });

}


/* =========================================================
   COLLECTION CLICK
========================================================= */

function setupCollectionClicks() {

    document
        .querySelectorAll(
            ".collection-card"
        )
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    const collection =
                        card.dataset.collection;

                    if (!collection) return;


                    currentCategory =
                        collection;


                    document
                        .querySelectorAll(
                            ".category-btn"
                        )
                        .forEach(btn => {

                            btn.classList.toggle(
                                "active",
                                btn.dataset.category
                                === collection
                            );

                        });


                    renderProducts();

                }
            );

        });

}


/* =========================================================
   CART STORAGE
========================================================= */

function loadCart() {

    try {

        const saved =
            localStorage.getItem(
                "habarsh_cart"
            );


        cart =
            saved
            ? JSON.parse(saved)
            : [];


        if (!Array.isArray(cart)) {
            cart = [];
        }

    } catch {

        cart = [];

    }

}


function saveCart() {

    localStorage.setItem(
        "habarsh_cart",
        JSON.stringify(cart)
    );

}


/* =========================================================
   ADD TO CART
========================================================= */

function addToCart(productId) {

    const product =
        allProducts.find(
            item =>
                String(
                    item._id ||
                    item.id
                )
                === String(productId)
        );


    if (!product) {

        showToast(
            "Product not found"
        );

        return;

    }


    const stock =
        Number(
            product.stock ??
            10
        );


    if (stock <= 0) {

        showToast(
            "This item is currently out of stock."
        );

        return;

    }


    const existing =
        cart.find(
            item =>
                String(item.id)
                === String(productId)
        );


    if (existing) {

        if (
            existing.quantity >=
            stock
        ) {

            showToast(
                `Only ${stock} item(s) available.`
            );

            return;

        }

        existing.quantity += 1;

    } else {

        cart.push({

            id:
                product._id ||
                product.id,

            name:
                product.name,

            price:
                Number(product.price || 0),

            image:
                getProductImage(product),

            quantity: 1,

            stock: stock

        });

    }


    saveCart();

    updateCartUI();

    showToast(
        `${product.name} added to your bag`
    );

}


/* =========================================================
   UPDATE CART
========================================================= */

function updateCartUI() {

    renderCart();

    updateCartCount();

}


/* =========================================================
   CART COUNT
========================================================= */

function updateCartCount() {

    const count =
        cart.reduce(
            (total, item) =>
                total + Number(item.quantity || 0),
            0
        );


    const element =
        document.getElementById(
            "cartCount"
        );


    if (!element) return;


    element.textContent =
        count;


    element.classList.remove(
        "bump"
    );


    void element.offsetWidth;


    element.classList.add(
        "bump"
    );

}


/* =========================================================
   RENDER CART
========================================================= */

function renderCart() {

    const container =
        document.getElementById(
            "cartItems"
        );


    const totalElement =
        document.getElementById(
            "cartTotal"
        );


    if (!container) return;


    if (!cart.length) {

        container.innerHTML = `

            <div class="empty-cart">

                <span>♡</span>

                <p>
                    Your bag is waiting
                    for something beautiful.
                </p>

            </div>

        `;


        if (totalElement) {
            totalElement.textContent = "₹0";
        }

        return;

    }


    container.innerHTML =
        cart.map((item, index) => `

            <div
                class="cart-item"
                data-index="${index}"
            >

                <img
                    class="cart-item-image"
                    src="${escapeHTML(item.image)}"
                    alt="${escapeHTML(item.name)}"
                >


                <div>

                    <div class="cart-item-name">
                        ${escapeHTML(item.name)}
                    </div>

                    <div class="cart-item-price">
                        ₹${formatMoney(item.price)}
                    </div>


                    <div class="quantity-control">

                        <button
                            type="button"
                            onclick="changeQuantity(${index}, -1)"
                        >
                            −
                        </button>

                        <span>
                            ${item.quantity}
                        </span>

                        <button
                            type="button"
                            onclick="changeQuantity(${index}, 1)"
                        >
                            +
                        </button>

                    </div>


                    <button
                        type="button"
                        class="remove-item"
                        onclick="removeFromCart(${index})"
                    >
                        REMOVE
                    </button>

                </div>


                <strong>
                    ₹${formatMoney(
                        item.price *
                        item.quantity
                    )}
                </strong>

            </div>

        `).join("");


    const total =
        calculateCartTotal();


    if (totalElement) {

        totalElement.textContent =
            `₹${formatMoney(total)}`;

    }

}


/* =========================================================
   QUANTITY
========================================================= */

function changeQuantity(
    index,
    change
) {

    const item =
        cart[index];

    if (!item) return;


    const maxStock =
        Number(
            item.stock ??
            99
        );


    const newQuantity =
        Number(item.quantity)
        + Number(change);


    if (newQuantity <= 0) {

        removeFromCart(index);

        return;

    }


    if (
        newQuantity >
        maxStock
    ) {

        showToast(
            `Only ${maxStock} item(s) available.`
        );

        return;

    }


    item.quantity =
        newQuantity;


    saveCart();

    updateCartUI();

}


/* =========================================================
   REMOVE
========================================================= */

function removeFromCart(index) {

    if (
        index < 0 ||
        index >= cart.length
    ) {
        return;
    }


    cart.splice(index, 1);

    saveCart();

    updateCartUI();

    showToast(
        "Item removed from your bag"
    );

}


/* =========================================================
   TOTAL
========================================================= */

function calculateCartTotal() {

    return cart.reduce(
        (total, item) =>
            total +
            (
                Number(item.price || 0)
                *
                Number(item.quantity || 0)
            ),
        0
    );

}


/* =========================================================
   OPEN CART
========================================================= */

function openCart() {

    const overlay =
        document.getElementById(
            "cartOverlay"
        );


    if (!overlay) return;


    renderCart();

    overlay.classList.add("open");

    document.body.classList.add(
        "no-scroll"
    );

}


/* =========================================================
   CLOSE CART
========================================================= */

function closeCart() {

    const overlay =
        document.getElementById(
            "cartOverlay"
        );


    if (!overlay) return;


    overlay.classList.remove(
        "open"
    );


    document.body.classList.remove(
        "no-scroll"
    );

}


/* =========================================================
   ORDER MODAL
========================================================= */

function openOrderModal() {

    if (!cart.length) {

        showToast(
            "Your cart is empty."
        );

        return;

    }


    closeCart();


    renderOrderSummary();


    const modal =
        document.getElementById(
            "orderModal"
        );


    if (!modal) return;


    modal.classList.add("open");

    document.body.classList.add(
        "no-scroll"
    );

}


function closeOrderModal() {

    const modal =
        document.getElementById(
            "orderModal"
        );


    if (!modal) return;


    modal.classList.remove(
        "open"
    );


    document.body.classList.remove(
        "no-scroll"
    );

}


/* =========================================================
   ORDER SUMMARY
========================================================= */

function renderOrderSummary() {

    const container =
        document.getElementById(
            "orderSummaryItems"
        );


    const totalElement =
        document.getElementById(
            "orderTotal"
        );


    if (!container) return;


    container.innerHTML =
        cart.map(item => `

            <div class="summary-item">

                <span>
                    ${escapeHTML(item.name)}
                    × ${item.quantity}
                </span>

                <strong>
                    ₹${formatMoney(
                        item.price *
                        item.quantity
                    )}
                </strong>

            </div>

        `).join("");


    if (totalElement) {

        totalElement.textContent =
            `₹${formatMoney(
                calculateCartTotal()
            )}`;

    }

}


/* =========================================================
   PAYMENT METHODS
========================================================= */

function setupPaymentMethods() {

    document
        .querySelectorAll(
            'input[name="paymentMethod"]'
        )
        .forEach(input => {

            input.addEventListener(
                "change",
                updatePaymentUI
            );

        });


    updatePaymentUI();

}


function updatePaymentUI() {

    const selected =
        document.querySelector(
            'input[name="paymentMethod"]:checked'
        );


    const note =
        document.getElementById(
            "paymentNote"
        );


    const buttonText =
        document.getElementById(
            "payButtonText"
        );


    document
        .querySelectorAll(
            ".payment-option"
        )
        .forEach(option => {

            const input =
                option.querySelector(
                    "input"
                );

            option.classList.toggle(
                "active",
                input &&
                input.checked
            );

        });


    if (!selected) return;


    if (
        selected.value ===
        "COD"
    ) {

        if (note) {

            note.textContent =
                "Pay in cash when your HABARSH jewellery is delivered.";

        }


        if (buttonText) {

            buttonText.textContent =
                "PLACE COD ORDER";

        }

    } else {

        if (note) {

            note.textContent =
                "Secure checkout powered by Razorpay.";

        }


        if (buttonText) {

            buttonText.textContent =
                "PAY SECURELY WITH RAZORPAY";

        }

    }

}


/* =========================================================
   ORDER FORM
========================================================= */

const orderForm =
    document.getElementById(
        "orderForm"
    );


if (orderForm) {

    orderForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            if (isProcessingPayment) {
                return;
            }


            if (!cart.length) {

                showToast(
                    "Your cart is empty."
                );

                return;

            }


            const name =
                document
                    .getElementById(
                        "customerName"
                    )
                    .value
                    .trim();


            const phone =
                document
                    .getElementById(
                        "phone"
                    )
                    .value
                    .trim();


            const email =
                document
                    .getElementById(
                        "email"
                    )
                    .value
                    .trim();


            const giftFor =
                document
                    .getElementById(
                        "giftFor"
                    )
                    .value;


            const address =
                document
                    .getElementById(
                        "address"
                    )
                    .value
                    .trim();


            const personalMessage =
                document
                    .getElementById(
                        "personalMessage"
                    )
                    .value
                    .trim();


            const paymentMethod =
                document.querySelector(
                    'input[name="paymentMethod"]:checked'
                )?.value
                || "RAZORPAY";


            if (
                !/^[0-9]{10}$/.test(phone)
            ) {

                showToast(
                    "Please enter a valid 10 digit phone number."
                );

                return;

            }


            if (!name || !email || !address) {

                showToast(
                    "Please complete all required details."
                );

                return;

            }


            const button =
                document.getElementById(
                    "payButton"
                );


            isProcessingPayment = true;


            if (button) {

                button.classList.add(
                    "loading"
                );

            }


            try {

                if (
                    paymentMethod ===
                    "COD"
                ) {

                    await placeCODOrder({

                        name,
                        phone,
                        email,
                        giftFor,
                        address,
                        personalMessage

                    });

                } else {

                    await startRazorpayPayment({

                        name,
                        phone,
                        email,
                        giftFor,
                        address,
                        personalMessage

                    });

                }


            } catch (error) {

                console.error(
                    "Checkout error:",
                    error
                );


                showToast(
                    error.message
                    ||
                    "Something went wrong. Please try again."
                );

            } finally {

                isProcessingPayment = false;


                if (button) {

                    button.classList.remove(
                        "loading"
                    );

                }

            }

        }
    );

}


/* =========================================================
   RAZORPAY PAYMENT
========================================================= */

/* =========================================================
   RAZORPAY PAYMENT
========================================================= */

async function startRazorpayPayment(customer) {

    if (!cart.length) {
        throw new Error("Your cart is empty.");
    }

    const payload = {
        customerName: customer.name,
        phone: customer.phone,
        email: customer.email,
        giftFor: customer.giftFor,
        address: customer.address,
        personalMessage: customer.personalMessage,

        items: cart.map(item => ({
            productId: item.id,
            name: item.name,
            price: Number(item.price),
            quantity: Number(item.quantity)
        }))
    };

    const response = await fetch(
        "/api/payment/create-order",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(
            data.message ||
            data.error ||
            "Unable to create Razorpay order."
        );
    }

    openRazorpayCheckout(data, customer);
}
/* =========================================================
   RAZORPAY CHECKOUT
========================================================= */

function openRazorpayCheckout(
    paymentData,
    customer
) {

    if (
        typeof Razorpay ===
        "undefined"
    ) {

        throw new Error(
            "Razorpay checkout could not be loaded. Please refresh the page."
        );

    }


    const razorpayKey =
        paymentData.razorpayKeyId
        ||
        paymentData.keyId;


    const razorpayOrderId =
        paymentData.razorpayOrderId;


    if (
        !razorpayKey ||
        !razorpayOrderId
    ) {

        throw new Error(
            "Invalid Razorpay order response."
        );

    }


    const options = {

        key:
            razorpayKey,

        amount:
            paymentData.amount,

        currency:
            "INR",

        name:
            "HABARSH",

        description:
            "HABARSH Jewellery Purchase",

        order_id:
            razorpayOrderId,



        prefill: {

            name:
                customer.name,

            email:
                customer.email,

            contact:
                customer.phone

        },


        theme: {

            color:
                "#4b2d21"

        },


        modal: {

            ondismiss:
                function() {

                    showToast(
                        "Payment window closed."
                    );

                }

        },


        handler:
            async function(response) {

                await verifyRazorpayPayment(
                    response,
                    paymentData
                );

            }

    };


    const razorpay =
        new Razorpay(options);


    razorpay.on(
        "payment.failed",
        function(response) {

            console.error(
                "Razorpay payment failed:",
                response
            );


            showToast(
                "Payment failed. Please try again."
            );

        }
    );


    razorpay.open();

}


/* =========================================================
   VERIFY RAZORPAY
========================================================= */

/* =========================================================
   VERIFY RAZORPAY
========================================================= */

async function verifyRazorpayPayment(response, paymentData) {

    const verificationPayload = {
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        order_id: paymentData.orderId,
        order_number: paymentData.orderNumber
    };

    const verifyResponse = await fetch(
        "/api/payment/verify",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(verificationPayload)
        }
    );

    const data = await verifyResponse.json();

    if (!verifyResponse.ok || !data.success) {
        throw new Error(
            data.message ||
            data.error ||
            "Payment verification failed."
        );
    }

    clearCart();

    closeOrderModal();

    showSuccessModal(
        data.orderNumber ||
        paymentData.orderNumber ||
        "HABARSH"
    );
}


/* =========================================================
   COD
========================================================= */

async function placeCODOrder(customer) {

    const payload = {

        customerName:
            customer.name,

        phone:
            customer.phone,

        email:
            customer.email,

        giftFor:
            customer.giftFor,

        address:
            customer.address,

        personalMessage:
            customer.personalMessage,

        paymentMethod:
            "COD",

        items:
            cart.map(item => ({

                productId:
                    item.id,

                name:
                    item.name,

                price:
                    Number(item.price),

                quantity:
                    Number(item.quantity)

            })),

        total:
            calculateCartTotal()

    };


    const response =
        await fetch(
            "/api/orders",
            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body:
                    JSON.stringify(payload)

            }
        );


    const data =
        await response.json();


    if (
        !response.ok ||
        !data.success
    ) {

        throw new Error(
            data.message
            ||
            data.error
            ||
            "Unable to place COD order."
        );

    }


    clearCart();


    closeOrderModal();


    showSuccessModal(
        data.orderNumber
        ||
        "HABARSH"
    );

}


/* =========================================================
   CLEAR CART
========================================================= */

function clearCart() {

    cart = [];

    saveCart();

    updateCartUI();

}


/* =========================================================
   SUCCESS
========================================================= */

function showSuccessModal(
    orderNumber
) {

    const modal =
        document.getElementById(
            "successModal"
        );


    const number =
        document.getElementById(
            "successOrderNumber"
        );


    if (number) {

        number.textContent =
            orderNumber
            ||
            "HABARSH";

    }


    if (modal) {

        modal.classList.add(
            "open"
        );

        document.body.classList.add(
            "no-scroll"
        );

    }

}


function closeSuccessModal() {

    const modal =
        document.getElementById(
            "successModal"
        );


    if (modal) {

        modal.classList.remove(
            "open"
        );

    }


    document.body.classList.remove(
        "no-scroll"
    );

}


/* =========================================================
   SEARCH
========================================================= */

function setupSearch() {

    const button =
        document.getElementById(
            "searchButton"
        );


    const overlay =
        document.getElementById(
            "searchOverlay"
        );


    const input =
        document.getElementById(
            "searchInput"
        );


    if (!button || !overlay) {
        return;
    }


    button.addEventListener(
        "click",
        () => {

            overlay.classList.add(
                "open"
            );

            document.body.classList.add(
                "no-scroll"
            );


            setTimeout(() => {

                input?.focus();

            }, 300);

        }
    );


    input?.addEventListener(
        "input",
        performSearch
    );

}


function closeSearch() {

    const overlay =
        document.getElementById(
            "searchOverlay"
        );


    if (overlay) {

        overlay.classList.remove(
            "open"
        );

    }


    document.body.classList.remove(
        "no-scroll"
    );

}


function performSearch() {

    const input =
        document.getElementById(
            "searchInput"
        );


    const results =
        document.getElementById(
            "searchResults"
        );


    if (!input || !results) return;


    const query =
        input.value
            .trim()
            .toLowerCase();


    if (!query) {

        results.innerHTML = "";

        return;

    }


    const matches =
        allProducts
            .filter(product => {

                const name =
                    String(
                        product.name || ""
                    ).toLowerCase();

                const category =
                    String(
                        product.category || ""
                    ).toLowerCase();

                return (
                    name.includes(query)
                    ||
                    category.includes(query)
                );

            })
            .slice(0, 6);


    if (!matches.length) {

        results.innerHTML = `

            <div class="search-result">
                No jewellery found.
            </div>

        `;

        return;

    }


    results.innerHTML =
        matches.map(product => `

            <div
                class="search-result"
                onclick="searchProductClick('${escapeHTML(
                    String(
                        product._id ||
                        product.id
                    )
                )}')"
            >

                <span>
                    ${escapeHTML(
                        product.name
                    )}
                </span>

                <strong>
                    ₹${formatMoney(
                        product.price
                    )}
                </strong>

            </div>

        `).join("");

}


function searchProductClick(id) {

    closeSearch();

    currentCategory = "all";

    document
        .querySelectorAll(
            ".category-btn"
        )
        .forEach(btn => {

            btn.classList.toggle(
                "active",
                btn.dataset.category
                === "all"
            );

        });


    renderProducts();


    setTimeout(() => {

        const card =
            document.querySelector(
                `[data-product-id="${CSS.escape(String(id))}"]`
            );


        card?.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });


    }, 100);

}


/* =========================================================
   NEWSLETTER
========================================================= */

function subscribeNewsletter(event) {

    event.preventDefault();


    const input =
        document.getElementById(
            "newsletterEmail"
        );


    if (!input) return;


    if (!input.value.trim()) {
        return;
    }


    showToast(
        "Welcome to the HABARSH journal."
    );


    input.value = "";

}


/* =========================================================
   ACCOUNT
========================================================= */

function openAccountMessage() {

    showToast(
        "Account features are coming soon."
    );

}


/* =========================================================
   TOAST
========================================================= */

function showToast(message) {

    let toast =
        document.querySelector(
            ".habarsh-toast"
        );


    if (!toast) {

        toast =
            document.createElement(
                "div"
            );

        toast.className =
            "habarsh-toast";

        document.body.appendChild(
            toast
        );

    }


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toast._timer
    );


    toast._timer =
        setTimeout(() => {

            toast.classList.remove(
                "show"
            );

        }, 2800);

}


/* =========================================================
   SCROLL REVEAL
========================================================= */

function setupScrollReveal() {

    const elements =
        document.querySelectorAll(
            ".reveal"
        );


    if (!elements.length) {
        return;
    }


    const observer =
        new IntersectionObserver(
            entries => {

                entries.forEach(entry => {

                    if (
                        entry.isIntersecting
                    ) {

                        entry.target
                            .classList
                            .add("visible");

                        observer.unobserve(
                            entry.target
                        );

                    }

                });

            },
            {
                threshold: .12
            }
        );


    elements.forEach(element => {

        observer.observe(element);

    });

}


/* =========================================================
   ESCAPE KEY
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (event.key !== "Escape") {
            return;
        }


        closeCart();

        closeOrderModal();

        closeSuccessModal();

        closeSearch();

    }
);


/* =========================================================
   BACKDROP CLICK
========================================================= */

document.addEventListener(
    "click",
    event => {

        const cartOverlay =
            document.getElementById(
                "cartOverlay"
            );


        if (
            event.target ===
            cartOverlay
        ) {

            closeCart();

        }


        const searchOverlay =
            document.getElementById(
                "searchOverlay"
            );


        if (
            event.target ===
            searchOverlay
        ) {

            closeSearch();

        }


        const successModal =
            document.getElementById(
                "successModal"
            );


        if (
            event.target ===
            successModal
        ) {

            closeSuccessModal();

        }

    }
);


/* =========================================================
   UTILITIES
========================================================= */

function formatMoney(value) {

    return Number(
        value || 0
    ).toLocaleString(
        "en-IN"
    );

}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}