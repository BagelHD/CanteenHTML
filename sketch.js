
// ------------------------- Set Up ------------------------------
const cartList = document.querySelector('#cart-list');



function setup() {


  // background('#83c0ef');
  db = initializeApp()
  keyPressListener = ''

  cart = [];

  localUsersUCIDs = loadStrings('localUsersData.csv');
  localProductBarcodes = loadStrings('localProductData.csv')
  
  // Page Objects
  //UCID Input
  input = createInput('').attribute('placeholder', "Enter UCID (eg.'clh42')");
  input.position((windowWidth/3)-(input.size().width/2), (windowHeight/4)*3)-(input.size().height/2);

  waiting = false

  //Checkout Button
  button = createButton('Checkout');
  button.position((windowWidth/3)+(input.size().width/2), (windowHeight/4)*3)-(input.size().height/2);
  button.mousePressed(checkoutCart);

  barcode = 'klawndawdhgaoin'

}

// --------------------------- Initilization ------------------------

function initializeApp() {

  // Initialize Cloud Firestore through Firebase
  firebase.initializeApp({
    apiKey: 'AIzaSyDggxmJqOV3wuVv3lZW7Tb1p9LXoD7LxKE',
    authDomain: 'college-house-canteen.firebaseapp.com',
    projectId: 'college-house-canteen'
  });
  return db = firebase.firestore()
}

// ------------------------- Populate/Create Database --------------------------------

//Iterates through a json file of user info and adds it to the database
function addNewUsers(jasonFileLocationAndName) {
  json = loadJSON(jasonFileLocationAndName)
  for (var i = 0; i < json.length; i++){
    var newUser = json[i];
    addUser(newUser, i);
 }
}
//Add new user to the userDatabase
function addUser(User, i=0) {
  db.collection("userData").add(User)
  .then(function(docRef) {
    console.log(i, "User: ", User.firstName, User.lastName, " Document written with ID: ", docRef.id);
  })
  .catch(function(error) {
    console.error("Error adding document: ", error);
  });
}


//Products
//Iterates through a json file of product info and adds it to the product database
function addNewProducts(jsonData) {
  for (var i = 0; i < jsonData.length; i++){
    var newUser = jsonData[i];
    console.log(newUser)
    addProduct(newUser, i);
 }
}

 //Add new product to the productDatabase
function addProduct(Product, i=0) {
  console.log(Product)
  db.collection("productData").add(Product).then(function(docRef) {
    console.log(i, "Product: ", Product.productName, " Document written with ID: ", docRef.id);
  }).catch(function(error) {
    console.error("Error adding document: ", error);
  });
}

// -------------------------- Functionality ----------------------------------

function keyTyped(){
  //Barcode Listener
  keyPressListener += key;
  if (keyPressListener.length >= 14){
    keyPressListener = keyPressListener.slice(1, keyPressListener.length)
  }
  for (i=0; i<localProductBarcodes.length; i++){
    if (keyPressListener.includes(localProductBarcodes[i]) && localProductBarcodes[i] != '' ){
      barcode = localProductBarcodes[i]
      keyPressListener = ''
      addToCart(barcode)
      break
    }
  }
}

//Clears the barcode from the input (probably intensive so kinda bad)
function draw(){
  if ((input.value()).includes(barcode)){
    console.log("input contains barcode")
    input.value(input.value().replace(barcode,''))
  }
}

// -------------------------------- userData access and updates ----------------------------------

function updateUserDataFromUCID(UCID) {
  db.collection('userData').where('UCID', '==', UCID).get().then((snapshot) => snapshot.docs.forEach(doc => {
    specificUserData = [doc.data().totalSpent, doc.id]
    updateUserData(specificUserData)
    cartHistory()
  }))
  }

function updateUserData(specificUserData){
  db.collection('userData').doc(specificUserData[1]).update({
    totalSpent: total + specificUserData[0],
  })
}

function cartHistory(){
  simpleCart = ''
  for (i=0; i < cart.length; i++){
    simpleCart += cart[i][1] + ' ' + cart[i][2] + ' @ $'+ cart[i][3].toFixed(2) + ' each.\n'
  }
  date = Date(String)
  console.log(simpleCart + '\n' + date + '\n')
  db.collection('userData').doc(specificUserData[1]).collection('cartHistory').add({
    purchase: simpleCart + '\n' + date
  })
  cart = []
  return 
}

// ----------------------------- productDatabase access and updates -------------------------------

function getProductDataFromBarcode(barcode) {
  db.collection('productData').where('barcode', '==', parseInt(barcode)).get().then((snapshot) => snapshot.docs.forEach(doc => {
    cart.push([barcode, 1, doc.data().productName, doc.data().salePrice, doc.id, doc.data().totalSold])
    updateTable(cart)
  }))
  }

function updateTotalSold(){
  for (i=0;i<cart.length;i++){
    db.collection('productData').doc(cart[i][4]).update({
      totalSold: cart[i][5] + cart[i][1]
    })
  }
}


// -------------------------- Local CSV Files ------------------------- // Kinda not necessary, maybe change later

function isValidUCID(){
  if (localUsersUCIDs.includes(input.value()) && input.value() != ''){
    return true;
  }else{
    console.log('This is not a valid UCID')
    return false
  }
}

function isValidBarcode(barcode){
  if (localProductBarcodes.includes(barcode) && barcode != ''){
    return true;
  }else{
    return false
  }
}

//---------------------------- Cart Table --------------------------------

function resetTable(){
  var table = document.getElementById("Cart");
  for(var i = 1; i < table.rows.length-1; i++){
    table.rows[i].cells[0].innerHTML = ''
    table.rows[i].cells[1].innerHTML = ''
    table.rows[i].cells[2].innerHTML = ''
  }
  table.rows[table.rows.length-1].cells[1].innerHTML =  ''
}

function updateTotal(){
  var table = document.getElementById("Cart");
  total = 0
  for(var i = 0; i < cart.length; i++){
    total += parseFloat(cart[i][3]) * parseFloat(cart[i][1])
  }
  table.rows[table.rows.length-1].cells[1].innerHTML = total.toFixed(2)
  waiting = false
}

function updateTable(cart){
  var table = document.getElementById("Cart");
  for (i=1; i<cart.length+1; i++){
    table.rows[i].cells[0].innerHTML = cart[i-1][1]
    table.rows[i].cells[1].innerHTML = cart[i-1][2]
    table.rows[i].cells[2].innerHTML = (cart[i-1][3] * cart[i-1][1]).toFixed(2)
  }
  updateTotal()
}

// --------------------------- Methods ----------------------------


function addToCart(barcode){
  var table = document.getElementById("Cart");
  if (isValidBarcode(barcode) && waiting == false){
    for (i=0; i < cart.length; i++){
      if (cart[i][0] == barcode){
        cart[i][1] ++;
        updateTable(cart)
        return;
      }
    }
    if (cart.length >= table.rows.length -5){
      var row = table.insertRow(table.rows.length - 1)
      row.insertCell(0);
      row.insertCell(1);
      row.insertCell(2);
    }
    getProductDataFromBarcode(barcode)
  }
}

function removeFromCart(i){
  if (cart[i][1]-1 <= 0){
    cart.splice(i, 1)
    resetTable()
    updateTable(cart)
    return;
    }
  cart[i][1]--;
  updateTable(cart)
  return;
}


function checkoutCart(){
  UCID = input.value()
  if (isValidUCID() && cart.length > 0) {
    console.log('checkoutCart for', UCID)
    updateUserDataFromUCID(UCID)
    updateTotalSold()
    resetTable()
    input.value('')
    }
  }
