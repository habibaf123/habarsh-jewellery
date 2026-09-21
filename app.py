from flask import (
    Flask,
    request,
    jsonify,
    render_template,
    session,
    redirect,
    url_for
)

from pymongo import MongoClient
from dotenv import load_dotenv
from bson import ObjectId
from datetime import datetime, timezone
import os
import random
import razorpay


# =========================================================
# LOAD ENVIRONMENT VARIABLES
# =========================================================

load_dotenv()


# =========================================================
# FLASK APP
# =========================================================

app = Flask(__name__)

app.secret_key = os.getenv(
    "SECRET_KEY",
    "habarsh-development-secret"
)


# =========================================================
# MONGODB
# =========================================================

MONGO_URI = os.getenv(
    "MONGO_URI",
    "mongodb://127.0.0.1:27017/"
)

DB_NAME = os.getenv(
    "DB_NAME",
    "habarsh"
)

client = MongoClient(MONGO_URI)

db = client[DB_NAME]

products = db["products"]

orders = db["orders"]


# =========================================================
# RAZORPAY
# =========================================================

RAZORPAY_KEY_ID = os.getenv(
    "RAZORPAY_KEY_ID"
)

RAZORPAY_KEY_SECRET = os.getenv(
    "RAZORPAY_KEY_SECRET"
)


if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:

    print(
        "WARNING: Razorpay keys are missing from .env"
    )

    razorpay_client = None

else:

    razorpay_client = razorpay.Client(
        auth=(
            RAZORPAY_KEY_ID,
            RAZORPAY_KEY_SECRET
        )
    )


# =========================================================
# CONNECTION CHECK
# =========================================================

try:

    client.admin.command("ping")

    print(
        "MongoDB connected successfully!"
    )

    print(
        "Database:",
        DB_NAME
    )

except Exception as error:

    print(
        "MongoDB connection failed!"
    )

    print(error)


# =========================================================
# DEFAULT PRODUCTS
# =========================================================

DEFAULT_PRODUCTS = [

    {
        "name":
            "Royal Pearl Jhumka",

        "price":
            899,

        "oldPrice":
            1299,

        "category":
            "Jhumka",

        "stock":
            20,

        "active":
            True
    },

    {
        "name":
            "Rose Gold Jhumka",

        "price":
            1099,

        "oldPrice":
            1499,

        "category":
            "Jhumka",

        "stock":
            20,

        "active":
            True
    },

    {
        "name":
            "Golden Love Bangles",

        "price":
            1499,

        "oldPrice":
            1999,

        "category":
            "Bangles",

        "stock":
            20,

        "active":
            True
    },

    {
        "name":
            "Pearl Charm Bangles",

        "price":
            1299,

        "oldPrice":
            1799,

        "category":
            "Bangles",

        "stock":
            20,

        "active":
            True
    },

    {
        "name":
            "Forever Heart Pendant",

        "price":
            1199,

        "oldPrice":
            1699,

        "category":
            "Pendants",

        "stock":
            20,

        "active":
            True
    },

    {
        "name":
            "Elegant Diamond Pendant",

        "price":
            1799,

        "oldPrice":
            2499,

        "category":
            "Pendants",

        "stock":
            20,

        "active":
            True
    }

]


# =========================================================
# SEED PRODUCTS
# =========================================================

if products.count_documents({}) == 0:

    products.insert_many(
        DEFAULT_PRODUCTS
    )

    print(
        "Default products added to MongoDB."
    )


# =========================================================
# HOME
# =========================================================

@app.route("/")
def home():

    return render_template(
        "index.html"
    )


# =========================================================
# GET ACTIVE PRODUCTS
# =========================================================

@app.route(
    "/api/products",
    methods=["GET"]
)
def get_products():

    product_list = []

    for product in products.find(
        {
            "active": True
        }
    ):

        product_list.append({

            "id":
                str(product["_id"]),

            "name":
                product["name"],

            "price":
                product["price"],

            "oldPrice":
                product.get("oldPrice"),

            "category":
                product["category"],

            "stock":
                product.get(
                    "stock",
                    0
                )
        })


    return jsonify({

        "success":
            True,

        "products":
            product_list
    })


# =========================================================
# CREATE ORDER + RAZORPAY ORDER
# =========================================================
@app.route(
    "/api/payment/create-order",
    methods=["POST"]
)
def create_order():

    data = request.get_json()

    if not data:

        return jsonify({

            "success":
                False,

            "message":
                "Invalid request."
        }), 400


    # -----------------------------------------------------
    # CUSTOMER DETAILS
    # -----------------------------------------------------

        # -----------------------------------------------------
    # CUSTOMER DETAILS
    # -----------------------------------------------------

    customer_name = data.get(
        "customerName",
        ""
    ).strip()

    phone = data.get(
        "phone",
        ""
    ).strip()

    email = data.get(
        "email",
        ""
    ).strip()

    gift_for = data.get(
        "giftFor",
        ""
    ).strip()

    address = data.get(
        "address",
        ""
    ).strip()

    personal_message = data.get(
        "personalMessage",
        ""
    ).strip()

    cart = data.get(
        "items",
        []
    )


    # -----------------------------------------------------
    # VALIDATION
    # -----------------------------------------------------

    if not customer_name:

        return jsonify({

            "success":
                False,

            "message":
                "Customer name is required."
        }), 400


    if not phone:

        return jsonify({

            "success":
                False,

            "message":
                "Phone number is required."
        }), 400


    if not address:

        return jsonify({

            "success":
                False,

            "message":
                "Address is required."
        }), 400


    if not cart:

        return jsonify({

            "success":
                False,

            "message":
                "Your cart is empty."
        }), 400


    # -----------------------------------------------------
    # VERIFY PRODUCTS FROM DATABASE
    # -----------------------------------------------------

    final_products = []

    total_amount = 0


    for item in cart:

        product_name = item.get(
            "name"
        )


        try:

            quantity = int(
                item.get(
                    "quantity",
                    1
                )
            )

        except (
            ValueError,
            TypeError
        ):

            return jsonify({

                "success":
                    False,

                "message":
                    "Invalid quantity."
            }), 400


        if quantity <= 0:

            return jsonify({

                "success":
                    False,

                "message":
                    "Invalid quantity."
            }), 400


        # -------------------------------------------------
        # FIND PRODUCT
        # -------------------------------------------------

        product = products.find_one({

            "name":
                product_name,

            "active":
                True
        })


        if not product:

            return jsonify({

                "success":
                    False,

                "message":
                    f"Product not found: {product_name}"
            }), 400


        # -------------------------------------------------
        # STOCK CHECK
        # -------------------------------------------------

        stock = int(
            product.get(
                "stock",
                0
            )
        )


        if quantity > stock:

            return jsonify({

                "success":
                    False,

                "message":
                    f"Only {stock} item(s) available for {product_name}."
            }), 400


        # -------------------------------------------------
        # SERVER-SIDE PRICE
        # -------------------------------------------------

        price = int(
            product["price"]
        )


        line_total = (
            price * quantity
        )


        final_products.append({

            "productId":
                str(product["_id"]),

            "name":
                product["name"],

            "price":
                price,

            "quantity":
                quantity,

            "lineTotal":
                line_total
        })


        total_amount += line_total


    # =====================================================
    # CREATE UNIQUE HABARSH ORDER NUMBER
    # =====================================================

    while True:

        order_number = (

            "HBR-"

            + datetime.now().strftime(
                "%Y%m%d"
            )

            + "-"

            + str(
                random.randint(
                    100000,
                    999999
                )
            )
        )


        existing_order = orders.find_one({

            "orderNumber":
                order_number
        })


        if not existing_order:

            break


    # =====================================================
    # CHECK RAZORPAY
    # =====================================================

    if razorpay_client is None:

        return jsonify({

            "success":
                False,

            "message":
                "Razorpay is not configured. Check your .env file."
        }), 500


    # =====================================================
    # CREATE RAZORPAY ORDER
    # =====================================================

    try:

        razorpay_order = (
            razorpay_client.order.create({

                # Amount in paise
                "amount":
                    total_amount * 100,

                "currency":
                    "INR",

                "receipt":
                    order_number,

                "notes": {

                    "order_number":
                        order_number,

                    "customer_name":
                        customer_name
                }
            })
        )


    except Exception as error:

        print(
            "Razorpay order creation error:"
        )

        print(error)


        return jsonify({

            "success":
                False,

            "message":
                "Unable to create Razorpay payment order."
        }), 500


    # =====================================================
    # SAVE ORDER IN MONGODB
    # =====================================================

    order_document = {

        "orderNumber":
            order_number,

        "customer": {

            "name":
                customer_name,

            "phone":
                phone,

            "email":
                email
        },

        "giftFor":
            gift_for,

        "address":
            address,

        "personalMessage":
            personal_message,

        "products":
            final_products,

        "totalAmount":
            total_amount,

        "payment": {

            "status":
                "Pending",

            "method":
                None,

            "razorpayOrderId":
                razorpay_order["id"],

            "razorpayPaymentId":
                None
        },

        "orderStatus":
            "Pending",

        "createdAt":
            datetime.now(
                timezone.utc
            )
    }


    result = orders.insert_one(
        order_document
    )


    # =====================================================
    # RESPONSE TO FRONTEND
    # =====================================================

    return jsonify({

        "success":
            True,

        "message":
            "Payment order created.",

        "orderNumber":
            order_number,

        "orderId":
            str(
                result.inserted_id
            ),

        "razorpayOrderId":
            razorpay_order["id"],

        "razorpayKeyId":
            RAZORPAY_KEY_ID,

        "amount":
            total_amount * 100,

        "currency":
            "INR"
    })


# =========================================================
# VERIFY RAZORPAY PAYMENT
# =========================================================

@app.route(
    "/api/payment/verify",
    methods=["POST"]
)
def verify_payment():

    data = request.get_json()

    if not data:

        return jsonify({

            "success":
                False,

            "message":
                "Invalid payment data."
        }), 400


    razorpay_order_id = data.get(
        "razorpay_order_id"
    )

    razorpay_payment_id = data.get(
        "razorpay_payment_id"
    )

    razorpay_signature = data.get(
        "razorpay_signature"
    )

    order_id = data.get(
        "order_id"
    )


    if not all([

        razorpay_order_id,

        razorpay_payment_id,

        razorpay_signature,

        order_id

    ]):

        return jsonify({

            "success":
                False,

            "message":
                "Incomplete payment details."
        }), 400


    # =====================================================
    # VERIFY PAYMENT
    # =====================================================

    try:

        razorpay_client.utility.verify_payment_signature({

            "razorpay_order_id":
                razorpay_order_id,

            "razorpay_payment_id":
                razorpay_payment_id,

            "razorpay_signature":
                razorpay_signature
        })


    except Exception as error:

        print(
            "Razorpay signature verification failed:"
        )

        print(error)


        # Mark payment failed

        try:

            orders.update_one(

                {
                    "_id":
                        ObjectId(
                            order_id
                        )
                },

                {
                    "$set": {

                        "payment.status":
                            "Failed",

                        "updatedAt":
                            datetime.now(
                                timezone.utc
                            )
                    }
                }
            )

        except Exception:

            pass


        return jsonify({

            "success":
                False,

            "message":
                "Payment verification failed."
        }), 400


    # =====================================================
    # UPDATE ORDER AS PAID
    # =====================================================

    try:

        result = orders.update_one(

            {

                "_id":
                    ObjectId(
                        order_id
                    ),

                "payment.razorpayOrderId":
                    razorpay_order_id
            },

            {

                "$set": {

                    "payment.status":
                        "Paid",

                    "payment.method":
                        "Razorpay",

                    "payment.razorpayPaymentId":
                        razorpay_payment_id,

                    "orderStatus":
                        "Confirmed",

                    "updatedAt":
                        datetime.now(
                            timezone.utc
                        )
                }
            }
        )


        if result.matched_count == 0:

            return jsonify({

                "success":
                    False,

                "message":
                    "Order not found."
            }), 404


        # =================================================
        # REDUCE STOCK
        # =================================================

        order = orders.find_one({

            "_id":
                ObjectId(
                    order_id
                )
        })


        if order:

            for item in order.get(
                "products",
                []
            ):

                product_id = item.get(
                    "productId"
                )

                quantity = int(
                    item.get(
                        "quantity",
                        1
                    )
                )


                try:

                    products.update_one(

                        {
                            "_id":
                                ObjectId(
                                    product_id
                                ),

                            "stock":
                                {
                                    "$gte":
                                        quantity
                                }
                        },

                        {
                            "$inc":
                                {
                                    "stock":
                                        -quantity
                                }
                        }
                    )

                except Exception as stock_error:

                    print(
                        "Stock update error:",
                        stock_error
                    )


        return jsonify({

            "success":
                True,

            "message":
                "Payment verified successfully.",

            "orderStatus":
                "Confirmed"
        })


    except Exception as error:

        print(
            "Payment update error:"
        )

        print(error)


        return jsonify({

            "success":
                False,

            "message":
                "Payment received but order update failed."
        }), 500


# =========================================================
# GET SINGLE ORDER
# =========================================================

@app.route(
    "/api/orders/<order_id>",
    methods=["GET"]
)
def get_order(order_id):

    try:

        order = orders.find_one({

            "_id":
                ObjectId(
                    order_id
                )
        })


        if not order:

            return jsonify({

                "success":
                    False,

                "message":
                    "Order not found."
            }), 404


        order["_id"] = str(
            order["_id"]
        )


        if order.get(
            "createdAt"
        ):

            order["createdAt"] = (
                order["createdAt"]
                .isoformat()
            )


        if order.get(
            "updatedAt"
        ):

            order["updatedAt"] = (
                order["updatedAt"]
                .isoformat()
            )


        return jsonify({

            "success":
                True,

            "order":
                order
        })


    except Exception as error:

        print(
            "Get order error:",
            error
        )


        return jsonify({

            "success":
                False,

            "message":
                "Invalid order ID."
        }), 400


# =========================================================
# ADMIN LOGIN PAGE
# =========================================================

@app.route(
    "/admin"
)
def admin():

    if not session.get(
        "admin_logged_in"
    ):

        return redirect(
            url_for(
                "admin_login"
            )
        )


    return render_template(
        "admin.html"
    )


# =========================================================
# ADMIN LOGIN
# =========================================================

@app.route(
    "/admin/login",
    methods=["GET", "POST"]
)
def admin_login():

    if session.get(
        "admin_logged_in"
    ):

        return redirect(
            url_for(
                "admin"
            )
        )


    if request.method == "POST":

        data = request.get_json(
            silent=True
        )


        if not data:

            return jsonify({

                "success":
                    False,

                "message":
                    "Invalid login request."
            }), 400


        email = data.get(
            "email",
            ""
        ).strip()

        password = data.get(
            "password",
            ""
        )


        admin_email = os.getenv(
            "ADMIN_EMAIL"
        )

        admin_password = os.getenv(
            "ADMIN_PASSWORD"
        )


        if not admin_email or not admin_password:

            return jsonify({

                "success":
                    False,

                "message":
                    "Admin credentials are not configured."
            }), 500


        if (

            email ==
            admin_email

            and

            password ==
            admin_password

        ):

            session[
                "admin_logged_in"
            ] = True


            return jsonify({

                "success":
                    True,

                "message":
                    "Login successful."
            })


        return jsonify({

            "success":
                False,

            "message":
                "Invalid email or password."
        }), 401


    return render_template(
        "admin_login.html"
    )


# =========================================================
# ADMIN LOGOUT
# =========================================================

@app.route(
    "/admin/logout"
)
def admin_logout():

    session.pop(
        "admin_logged_in",
        None
    )


    return redirect(
        url_for(
            "admin_login"
        )
    )


# =========================================================
# ADMIN ORDERS
# =========================================================

@app.route(
    "/api/admin/orders",
    methods=["GET"]
)
def admin_orders():

    if not session.get(
        "admin_logged_in"
    ):

        return jsonify({

            "success":
                False,

            "message":
                "Unauthorized."
        }), 401


    order_list = []


    for order in orders.find().sort(
        "createdAt",
        -1
    ):

        order["_id"] = str(
            order["_id"]
        )


        if order.get(
            "createdAt"
        ):

            order["createdAt"] = (
                order["createdAt"]
                .isoformat()
            )


        if order.get(
            "updatedAt"
        ):

            order["updatedAt"] = (
                order["updatedAt"]
                .isoformat()
            )


        order_list.append(
            order
        )


    return jsonify({

        "success":
            True,

        "orders":
            order_list
    })


# =========================================================
# UPDATE ORDER STATUS
# =========================================================

@app.route(
    "/api/admin/orders/<order_id>/status",
    methods=["PUT"]
)
def update_order_status(
    order_id
):

    if not session.get(
        "admin_logged_in"
    ):

        return jsonify({

            "success":
                False,

            "message":
                "Unauthorized."
        }), 401


    try:

        data = request.get_json(
            silent=True
        )


        if not data:

            return jsonify({

                "success":
                    False,

                "message":
                    "Invalid request."
            }), 400


        new_status = data.get(
            "status"
        )


        allowed_statuses = [

            "Pending",

            "Confirmed",

            "Packed",

            "Shipped",

            "Delivered",

            "Cancelled"
        ]


        if new_status not in allowed_statuses:

            return jsonify({

                "success":
                    False,

                "message":
                    "Invalid order status."
            }), 400


        result = orders.update_one(

            {
                "_id":
                    ObjectId(
                        order_id
                    )
            },

            {

                "$set": {

                    "orderStatus":
                        new_status,

                    "updatedAt":
                        datetime.now(
                            timezone.utc
                        )
                }
            }
        )


        if result.matched_count == 0:

            return jsonify({

                "success":
                    False,

                "message":
                    "Order not found."
            }), 404


        return jsonify({

            "success":
                True,

            "message":
                "Order status updated successfully.",

            "status":
                new_status
        })


    except Exception as error:

        print(
            "Status update error:",
            error
        )


        return jsonify({

            "success":
                False,

            "message":
                "Invalid order ID."
        }), 400


# =========================================================
# RUN SERVER
# =========================================================

if __name__ == "__main__":

    app.run(

        debug=True,

        host="0.0.0.0",

        port=5000
    )