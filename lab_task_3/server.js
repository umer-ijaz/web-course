const express = require('express');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory storage for users and sessions
const users = [
  { id: 1, email: 'demo@jackwills.com', password: 'password123', name: 'Demo User' }
];

const products = [
  {
    id: 1,
    name: 'Heritage Rugby Shirt',
    price: 89.99,
    category: 'mens',
    image: '/images/greentee.avif',
    description: 'Classic rugby shirt with heritage styling'
  },
  {
    id: 2,
    name: 'Vintage Hoodie',
    price: 79.99,
    category: 'womens',
    image: '/images/ayelford.avif',
    description: 'Comfortable vintage-style hoodie'
  },
  {
    id: 3,
    name: 'Polo Shirt',
    price: 59.99,
    category: 'mens',
    image: '/images/brown_tee.avif',
    description: 'Classic polo shirt in premium cotton'
  },
  {
    id: 4,
    name: 'Knit Sweater',
    price: 99.99,
    category: 'womens',
    image: '/images/white_tee.avif',
    description: 'Cozy knit sweater for autumn days'
  }
];

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// Session configuration
app.use(session({
  secret: 'jackwills-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// EJS configuration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set('view cache', false);

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.redirect('/login');
  }
};

// Make user available in all templates
app.use((req, res, next) => {
  res.locals.user = req.session.userId ? users.find(u => u.id === req.session.userId) : null;
  next();
});

// Routes
app.get('/', (req, res) => {
  const featuredProducts = products.slice(0, 4);
  res.render('index', { 
    title: 'Jack Wills - British Heritage Fashion',
    products: featuredProducts,
    layout: 'layouts/main'
  });
});

app.get('/products', (req, res) => {
  const category = req.query.category;
  const filteredProducts = category ? products.filter(p => p.category === category) : products;
  
  res.render('products', { 
    title: 'Products - Jack Wills',
    products: filteredProducts,
    selectedCategory: category,
    layout: 'layouts/main'
  });
});

app.get('/product/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) {
    return res.status(404).render('404', { title: 'Product Not Found' });
  }
  
  res.render('product-detail', { 
    title: `${product.name} - Jack Wills`,
    product,
    layout: 'layouts/main'
  });
});

app.get('/about', (req, res) => {
  res.render('about', { 
    title: 'About Us - Jack Wills',
    layout: 'layouts/main'
  });
});

// Authentication routes
app.get('/login', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/');
  }
  res.render('auth/login', { 
    title: 'Login - Jack Wills',
    error: null,
    layout: 'layouts/auth'
  });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    req.session.userId = user.id;
    res.redirect('/');
  } else {
    res.render('auth/login', { 
      title: 'Login - Jack Wills',
      error: 'Invalid email or password',
      layout: 'layouts/auth'
    });
  }
});

app.get('/register', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/');
  }
  res.render('auth/register', { 
    title: 'Register - Jack Wills',
    error: null,
    layout: 'layouts/auth'
  });
});

app.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  
  // Check if user already exists
  if (users.find(u => u.email === email)) {
    return res.render('auth/register', { 
      title: 'Register - Jack Wills',
      error: 'Email already registered',
      layout: 'layouts/auth'
    });
  }
  
  // Create new user
  const newUser = {
    id: users.length + 1,
    name,
    email,
    password
  };
  
  users.push(newUser);
  req.session.userId = newUser.id;
  res.redirect('/');
});

app.get('/profile', requireAuth, (req, res) => {
  const user = users.find(u => u.id === req.session.userId);
  res.render('profile', { 
    title: 'My Profile - Jack Wills',
    user,
    layout: 'layouts/main'
  });
});

app.post('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { 
    title: 'Page Not Found - Jack Wills',
    layout: 'layouts/main'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});