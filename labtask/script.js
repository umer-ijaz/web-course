function validateForm() {
    const name = document.getElementById("name").value;
    const addr = document.getElementById("address").value;
    const email = document.getElementById("email").value;
 

    const nameErr = document.getElementById("name-error");
    const addrErr = document.getElementById("address-error");
    const emailErr = document.getElementById("email-error");


    nameErr.textContent = "";
    addrErr.textContent = "";
    emailErr.textContent = "";


    let isValid = true;

    if (name === "" || /\d/.test(name)) {
        nameErr.textContent = "Please enter your name.";
        isValid = false;
    }

    if (addr === "") {
        addrErr.textContent = "Please enter your address.";
        isValid = false;
    }

    if (email === "" || !email.includes("@") || !email.includes(".")) {
        emailErr.textContent = "Please enter a valid email address.";
        isValid = false;
    }
    else {
        return false;
    }
}

function resetErrors() {
    document.getElementById("name-error").textContent = "";
    document.getElementById("address-error").textContent = "";
    document.getElementById("email-error").textContent = "";

}
