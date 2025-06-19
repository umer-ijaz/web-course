const express = require("express")
const session = require("express-session")
const expressLayouts = require("express-ejs-layouts")
const path = require("path")
const multer = require("multer")

const app = express()
const PORT = process.env.PORT || 3000

// In-memory storage for users and sessions
const users = [
  { id: 1, email: "demo@jackwills.com", password: "password123", name: "Demo User", isAdmin: false },
  { id: 2, email: "admin@jackwills.com", password: "admin123", name: "Admin User", isAdmin: true },
]

const products = [
  {
    id: 1,
    name: "Heritage Rugby Shirt",
    price: 89.99,
    category: "mens",
    image: "/images/greentee.avif",
    description: "Classic rugby shirt with heritage styling",
  },
  {
    id: 2,
    name: "Vintage Hoodie",
    price: 79.99,
    category: "womens",
    image: "/images/ayelford.avif",
    description: "Comfortable vintage-style hoodie",
  },
  {
    id: 3,
    name: "Polo Shirt",
    price: 59.99,
    category: "mens",
    image: "/images/brown_tee.avif",
    description: "Classic polo shirt in premium cotton",
  },
  {
    id: 4,
    name: "Knit Sweater",
    price: 99.99,
    category: "womens",
    image: "/images/white_tee.avif",
    description: "Cozy knit sweater for autumn days",
  },
]

const vehicles = [
  {
    id: 1,
    name: "Tesla Model S",
    brand: "Tesla",
    price: 79999.99,
    type: "sedan",
    image: "/images/vehicles/tesla-model-s.jpeg",
    description: "Premium electric sedan with autopilot features",
  },
  {
    id: 2,
    name: "BMW X5",
    brand: "BMW",
    price: 65999.99,
    type: "SUV",
    image: "/images/vehicles/bmw-x5.jpeg",
    description: "Luxury SUV with advanced technology",
  },
  {
    id: 3,
    name: "Ford F-150",
    brand: "Ford",
    price: 45999.99,
    type: "truck",
    image: "/images/vehicles/ford-f150.jpeg",
    description: "America's best-selling pickup truck",
  },
]

// In-memory storage for orders
const orders = []

// Cart helper functions
const getCart = (req) => {
  if (!req.session.cart) {
    req.session.cart = []
  }
  return req.session.cart
}

const addToCart = (req, productId, quantity = 1) => {
  const cart = getCart(req)
  const product = products.find((p) => p.id === Number.parseInt(productId))

  if (!product) return false

  const existingItem = cart.find((item) => item.productId === Number.parseInt(productId))

  if (existingItem) {
    existingItem.quantity += quantity
  } else {
    cart.push({
      productId: Number.parseInt(productId),
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: quantity,
    })
  }

  return true
}

const removeFromCart = (req, productId) => {
  const cart = getCart(req)
  req.session.cart = cart.filter((item) => item.productId !== Number.parseInt(productId))
}

const updateCartQuantity = (req, productId, quantity) => {
  const cart = getCart(req)
  const item = cart.find((item) => item.productId === Number.parseInt(productId))

  if (item) {
    if (quantity <= 0) {
      removeFromCart(req, productId)
    } else {
      item.quantity = quantity
    }
  }
}

const getCartTotal = (cart) => {
  return cart.reduce((total, item) => total + item.price * item.quantity, 0)
}

const getCartItemCount = (cart) => {
  return cart.reduce((total, item) => total + item.quantity, 0)
}

// Middleware
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.static("public"))

// Session configuration
app.use(
  session({
    secret: "jackwills-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
  }),
)

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images/vehicles/")
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true)
    } else {
      cb(new Error("Only image files are allowed!"), false)
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
})

// EJS configuration
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))
app.use(expressLayouts)
app.set("layout", "layouts/main")
app.set("view cache", false)

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session.userId) {
    next()
  } else {
    // Store the intended destination
    req.session.redirectTo = req.originalUrl
    req.session.errorMessage = "Please log in to continue with checkout."
    res.redirect("/login")
  }
}

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (req.session.userId) {
    const user = users.find((u) => u.id === req.session.userId)
    if (user && user.isAdmin) {
      next()
    } else {
      req.session.errorMessage = "Access denied. Admin privileges required."
      res.redirect("/")
    }
  } else {
    req.session.redirectTo = req.originalUrl
    req.session.errorMessage = "Please log in as admin to continue."
    res.redirect("/login")
  }
}

// Make user available in all templates
app.use((req, res, next) => {
  const user = req.session.userId ? users.find((u) => u.id === req.session.userId) : null
  res.locals.user = user
  res.locals.isAdmin = user ? user.isAdmin : false
  next()
})

// Make cart available in all templates
app.use((req, res, next) => {
  const cart = getCart(req)
  res.locals.cart = cart
  res.locals.cartItemCount = getCartItemCount(cart)
  res.locals.cartTotal = getCartTotal(cart)
  next()
})

// Flash messages middleware
app.use((req, res, next) => {
  res.locals.successMessage = req.session.successMessage
  res.locals.errorMessage = req.session.errorMessage
  delete req.session.successMessage
  delete req.session.errorMessage
  next()
})

// Routes
app.get("/", (req, res) => {
  const featuredProducts = products.slice(0, 4)
  res.render("index", {
    title: "Jack Wills - British Heritage Fashion",
    products: featuredProducts,
    layout: "layouts/main",
  })
})

app.get("/products", (req, res) => {
  const category = req.query.category
  const filteredProducts = category ? products.filter((p) => p.category === category) : products

  res.render("products", {
    title: "Products - Jack Wills",
    products: filteredProducts,
    selectedCategory: category,
    layout: "layouts/main",
  })
})

app.get("/product/:id", (req, res) => {
  const product = products.find((p) => p.id === Number.parseInt(req.params.id))
  if (!product) {
    return res.status(404).render("404", { title: "Product Not Found" })
  }

  res.render("product-detail", {
    title: `${product.name} - Jack Wills`,
    product,
    layout: "layouts/main",
  })
})

app.get("/about", (req, res) => {
  res.render("about", {
    title: "About Us - Jack Wills",
    layout: "layouts/main",
  })
})

// Authentication routes
app.get("/login", (req, res) => {
  if (req.session.userId) {
    return res.redirect("/")
  }
  res.render("auth/login", {
    title: "Login - Jack Wills",
    error: null,
    layout: "layouts/auth",
  })
})

app.post("/login", (req, res) => {
  const { email, password } = req.body
  const user = users.find((u) => u.email === email && u.password === password)

  if (user) {
    req.session.userId = user.id

    // Redirect admin users to admin dashboard, others to intended destination or home
    let redirectTo = "/"
    if (user.isAdmin) {
      redirectTo = "/admin"
    } else {
      redirectTo = req.session.redirectTo || "/"
    }

    delete req.session.redirectTo
    res.redirect(redirectTo)
  } else {
    res.render("auth/login", {
      title: "Login - Jack Wills",
      error: "Invalid email or password",
      layout: "layouts/auth",
    })
  }
})

app.get("/register", (req, res) => {
  if (req.session.userId) {
    return res.redirect("/")
  }
  res.render("auth/register", {
    title: "Register - Jack Wills",
    error: null,
    layout: "layouts/auth",
  })
})

app.post("/register", (req, res) => {
  const { name, email, password } = req.body

  // Check if user already exists
  if (users.find((u) => u.email === email)) {
    return res.render("auth/register", {
      title: "Register - Jack Wills",
      error: "Email already registered",
      layout: "layouts/auth",
    })
  }

  // Create new user
  const newUser = {
    id: users.length + 1,
    name,
    email,
    password,
  }

  users.push(newUser)
  req.session.userId = newUser.id

  // Redirect to intended destination or home
  const redirectTo = req.session.redirectTo || "/"
  delete req.session.redirectTo
  res.redirect(redirectTo)
})

app.get("/profile", requireAuth, (req, res) => {
  const user = users.find((u) => u.id === req.session.userId)
  res.render("profile", {
    title: "My Profile - Jack Wills",
    user,
    layout: "layouts/main",
  })
})

app.post("/logout", (req, res) => {
  req.session.destroy()
  res.redirect("/")
})

// Cart routes
app.post("/cart/add", (req, res) => {
  const { productId, quantity } = req.body
  const success = addToCart(req, productId, Number.parseInt(quantity) || 1)

  if (success) {
    req.session.successMessage = "Product added to cart!"
  } else {
    req.session.errorMessage = "Product not found!"
  }

  res.redirect("back")
})

app.get("/cart", (req, res) => {
  const cart = getCart(req)
  res.render("cart", {
    title: "Shopping Cart - Jack Wills",
    cart,
    layout: "layouts/main",
  })
})

app.post("/cart/update", (req, res) => {
  const { productId, quantity } = req.body
  updateCartQuantity(req, productId, Number.parseInt(quantity))

  req.session.successMessage = "Cart updated!"
  res.redirect("/cart")
})

app.post("/cart/remove", (req, res) => {
  const { productId } = req.body
  removeFromCart(req, productId)

  req.session.successMessage = "Item removed from cart!"
  res.redirect("/cart")
})

app.get("/checkout", requireAuth, (req, res) => {
  const cart = getCart(req)

  if (cart.length === 0) {
    req.session.errorMessage = "Your cart is empty!"
    return res.redirect("/cart")
  }

  res.render("checkout", {
    title: "Checkout - Jack Wills",
    cart,
    layout: "layouts/main",
  })
})

app.post("/checkout", requireAuth, (req, res) => {
  const cart = getCart(req)

  if (cart.length === 0) {
    req.session.errorMessage = "Your cart is empty!"
    return res.redirect("/cart")
  }

  const { name, phone, address } = req.body

  // Create order
  const order = {
    id: orders.length + 1,
    userId: req.session.userId,
    customerName: name,
    customerPhone: phone,
    customerAddress: address,
    items: [...cart],
    total: getCartTotal(cart),
    status: "pending",
    paymentMethod: "cash",
    createdAt: new Date(),
  }

  orders.push(order)

  // Clear cart
  req.session.cart = []

  req.session.successMessage = `Order #${order.id} placed successfully! We'll contact you soon.`
  res.redirect("/order-success/" + order.id)
})

app.get("/order-success/:id", (req, res) => {
  const orderId = Number.parseInt(req.params.id)
  const order = orders.find((o) => o.id === orderId)

  if (!order) {
    return res.status(404).render("404", { title: "Order Not Found" })
  }

  res.render("order-success", {
    title: "Order Confirmation - Jack Wills",
    order,
    layout: "layouts/main",
  })
})

// Admin routes
app.get("/admin", requireAdmin, (req, res) => {
  res.render("admin/dashboard", {
    title: "Admin Dashboard - Jack Wills",
    products,
    orders,
    users,
    vehicles,
    layout: "layouts/main",
  })
})

// Product management routes
app.get("/admin/products", requireAdmin, (req, res) => {
  res.render("admin/products", {
    title: "Manage Products - Admin",
    products,
    layout: "layouts/main",
  })
})

app.get("/admin/products/add", requireAdmin, (req, res) => {
  res.render("admin/product-form", {
    title: "Add Product - Admin",
    product: null,
    action: "/admin/products/add",
    layout: "layouts/main",
  })
})

app.post("/admin/products/add", requireAdmin, (req, res) => {
  const { name, price, category, image, description } = req.body

  // Generate new ID based on highest existing ID
  const maxId = products.length > 0 ? Math.max(...products.map((p) => p.id)) : 0

  const newProduct = {
    id: maxId + 1,
    name,
    price: Number.parseFloat(price),
    category,
    image,
    description,
  }

  products.push(newProduct)
  req.session.successMessage = "Product added successfully!"
  res.redirect("/admin/products")
})

app.get("/admin/products/edit/:id", requireAdmin, (req, res) => {
  const product = products.find((p) => p.id === Number.parseInt(req.params.id))
  if (!product) {
    req.session.errorMessage = "Product not found!"
    return res.redirect("/admin/products")
  }

  res.render("admin/product-form", {
    title: "Edit Product - Admin",
    product,
    action: `/admin/products/edit/${product.id}`,
    layout: "layouts/main",
  })
})

app.post("/admin/products/edit/:id", requireAdmin, (req, res) => {
  const productIndex = products.findIndex((p) => p.id === Number.parseInt(req.params.id))
  if (productIndex === -1) {
    req.session.errorMessage = "Product not found!"
    return res.redirect("/admin/products")
  }

  const { name, price, category, image, description } = req.body

  products[productIndex] = {
    ...products[productIndex],
    name,
    price: Number.parseFloat(price),
    category,
    image,
    description,
  }

  req.session.successMessage = "Product updated successfully!"
  res.redirect("/admin/products")
})

app.post("/admin/products/delete/:id", requireAdmin, (req, res) => {
  const productIndex = products.findIndex((p) => p.id === Number.parseInt(req.params.id))
  if (productIndex === -1) {
    req.session.errorMessage = "Product not found!"
    return res.redirect("/admin/products")
  }

  products.splice(productIndex, 1)
  req.session.successMessage = "Product deleted successfully!"
  res.redirect("/admin/products")
})

// Order management routes
app.get("/admin/orders", requireAdmin, (req, res) => {
  // Get orders with user details
  const ordersWithUsers = orders.map((order) => {
    const user = users.find((u) => u.id === order.userId)
    return {
      ...order,
      user: user || { name: "Unknown User", email: "N/A" },
    }
  })

  res.render("admin/orders", {
    title: "Manage Orders - Admin",
    orders: ordersWithUsers,
    layout: "layouts/main",
  })
})

app.post("/admin/orders/update-status/:id", requireAdmin, (req, res) => {
  const { status } = req.body
  const orderIndex = orders.findIndex((o) => o.id === Number.parseInt(req.params.id))

  if (orderIndex === -1) {
    req.session.errorMessage = "Order not found!"
    return res.redirect("/admin/orders")
  }

  orders[orderIndex].status = status
  req.session.successMessage = "Order status updated successfully!"
  res.redirect("/admin/orders")
})

// Vehicle routes
app.get("/vehicles", (req, res) => {
  res.render("vehicles", {
    title: "Vehicles - Jack Wills",
    vehicles,
    layout: "layouts/main",
  })
})

app.get("/vehicle/:id", (req, res) => {
  const vehicle = vehicles.find((v) => v.id === Number.parseInt(req.params.id))
  if (!vehicle) {
    return res.status(404).render("404", { title: "Vehicle Not Found" })
  }

  res.render("vehicle-detail", {
    title: `${vehicle.name} - Jack Wills`,
    vehicle,
    layout: "layouts/main",
  })
})

// Admin vehicle management routes
app.get("/admin/vehicles", requireAdmin, (req, res) => {
  res.render("admin/vehicles", {
    title: "Manage Vehicles - Admin",
    vehicles,
    layout: "layouts/main",
  })
})

app.get("/admin/vehicles/add", requireAdmin, (req, res) => {
  res.render("admin/vehicle-form", {
    title: "Add Vehicle - Admin",
    vehicle: null,
    action: "/admin/vehicles/add",
    layout: "layouts/main",
  })
})

app.post("/admin/vehicles/add", requireAdmin, upload.single("image"), (req, res) => {
  const { name, brand, price, type, description } = req.body

  // Generate new ID based on highest existing ID
  const maxId = vehicles.length > 0 ? Math.max(...vehicles.map((v) => v.id)) : 0

  const newVehicle = {
    id: maxId + 1,
    name,
    brand,
    price: Number.parseFloat(price),
    type,
    image: req.file ? `/images/vehicles/${req.file.filename}` : "/placeholder.svg?height=300&width=400",
    description,
  }

  vehicles.push(newVehicle)
  req.session.successMessage = "Vehicle added successfully!"
  res.redirect("/admin/vehicles")
})

app.get("/admin/vehicles/edit/:id", requireAdmin, (req, res) => {
  const vehicle = vehicles.find((v) => v.id === Number.parseInt(req.params.id))
  if (!vehicle) {
    req.session.errorMessage = "Vehicle not found!"
    return res.redirect("/admin/vehicles")
  }

  res.render("admin/vehicle-form", {
    title: "Edit Vehicle - Admin",
    vehicle,
    action: `/admin/vehicles/edit/${vehicle.id}`,
    layout: "layouts/main",
  })
})

app.post("/admin/vehicles/edit/:id", requireAdmin, upload.single("image"), (req, res) => {
  const vehicleIndex = vehicles.findIndex((v) => v.id === Number.parseInt(req.params.id))
  if (vehicleIndex === -1) {
    req.session.errorMessage = "Vehicle not found!"
    return res.redirect("/admin/vehicles")
  }

  const { name, brand, price, type, description } = req.body

  vehicles[vehicleIndex] = {
    ...vehicles[vehicleIndex],
    name,
    brand,
    price: Number.parseFloat(price),
    type,
    image: req.file ? `/images/vehicles/${req.file.filename}` : vehicles[vehicleIndex].image,
    description,
  }

  req.session.successMessage = "Vehicle updated successfully!"
  res.redirect("/admin/vehicles")
})

app.post("/admin/vehicles/delete/:id", requireAdmin, (req, res) => {
  const vehicleIndex = vehicles.findIndex((v) => v.id === Number.parseInt(req.params.id))
  if (vehicleIndex === -1) {
    req.session.errorMessage = "Vehicle not found!"
    return res.redirect("/admin/vehicles")
  }

  vehicles.splice(vehicleIndex, 1)
  req.session.successMessage = "Vehicle deleted successfully!"
  res.redirect("/admin/vehicles")
})

// 404 handler
app.use((req, res) => {
  res.status(404).render("404", {
    title: "Page Not Found - Jack Wills",
    layout: "layouts/main",
  })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
