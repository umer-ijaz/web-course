let express = require("express");
let app = express();
let ejsLayouts = require("express-ejs-layouts");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(ejsLayouts);
app.get("/contact-us", (req, res) => {
  res.render("contact-us");
});

app.get("/", (req, res) => {
  res.render("homepage");
});

app.listen(4000, () => {
  console.log("server started at localhost:4000");
});