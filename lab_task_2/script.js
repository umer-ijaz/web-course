document.getElementById('checkoutForm').addEventListener('submit', function (e) {
    let isValid = true;
  
    const fullName = document.getElementById('fullName');
    const email = document.getElementById('email');
    const phone = document.getElementById('phone');
    const address = document.getElementById('address');
    const ccNumber = document.getElementById('ccNumber');
    const expiry = document.getElementById('expiry');
    const cvv = document.getElementById('cvv');
  
    const now = new Date().toISOString().split('T')[0];
  
    // Clear all errors first
    ['fullNameError','emailError','phoneError','addressError','ccError','expiryError','cvvError']
      .forEach(id => document.getElementById(id).textContent = '');
  
    // Full Name: required and alphabet only
    if (!fullName.value.trim()) {
      document.getElementById('fullNameError').textContent = 'Full Name is required';
      isValid = false;
    } else if (!/^[A-Za-z ]+$/.test(fullName.value)) {
      document.getElementById('fullNameError').textContent = 'Only alphabets allowed';
      isValid = false;
    }
  
    // Email: valid format
    if (!email.value.trim()) {
      document.getElementById('emailError').textContent = 'Email is required';
      isValid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(email.value)) {
      document.getElementById('emailError').textContent = 'Invalid email format';
      isValid = false;
    }
  
    // Phone Number: 10-15 digits
    if (!phone.value.trim()) {
      document.getElementById('phoneError').textContent = 'Phone number is required';
      isValid = false;
    } else if (!/^\d{10,15}$/.test(phone.value)) {
      document.getElementById('phoneError').textContent = 'Phone must be 10-15 digits';
      isValid = false;
    }
  
    // Address: required
    if (!address.value.trim()) {
      document.getElementById('addressError').textContent = 'Address is required';
      isValid = false;
    }
  
    // Credit Card Number: exactly 16 digits
    if (!ccNumber.value.trim()) {
      document.getElementById('ccError').textContent = 'Credit card number is required';
      isValid = false;
    } else if (!/^\d{16}$/.test(ccNumber.value)) {
      document.getElementById('ccError').textContent = 'Credit card must be 16 digits';
      isValid = false;
    }
  
    // Expiry Date: must be in the future
    if (!expiry.value) {
      document.getElementById('expiryError').textContent = 'Expiry date is required';
      isValid = false;
    } else if (expiry.value <= now) {
      document.getElementById('expiryError').textContent = 'Expiry date must be in the future';
      isValid = false;
    }
  
    // CVV: exactly 3 digits
    if (!cvv.value.trim()) {
      document.getElementById('cvvError').textContent = 'CVV is required';
      isValid = false;
    } else if (!/^\d{3}$/.test(cvv.value)) {
      document.getElementById('cvvError').textContent = 'CVV must be 3 digits';
      isValid = false;
    }
  
    if (!isValid) {
      e.preventDefault();
    }
  });
  