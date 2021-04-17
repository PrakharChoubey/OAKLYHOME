const client = contentful.createClient({
  // This is the space ID. A space is like a project folder in Contentful terms
  space: "b6stxwdogfxk",
  // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
  accessToken: "mhlczaGAR4FReatnrJ1SoqBMal8EOgUBnJRZhia4OEU",
});

console.log(client);

// variables
const cartButton = document.querySelector(".cart-btn");
const closeCartButton = document.querySelector(".close-cart");
const clearCartButton = document.querySelector(".clear-cart");
const cartDOM = document.querySelector(".cart");
const cartOverlay = document.querySelector(".cart-overlay");
const cartItems = document.querySelector(".cart-items");
const cartTotal = document.querySelector(".cart-total");
const cartContent = document.querySelector(".cart-content");
const productsDOM = document.querySelector(".products-center");

let cart = [];

let buttonsDOM = [];

// getting the products
class Products {
  async getProducts() {
    try {
      let contentful = await client.getEntries({
        content_type: "oaklyhomeProducts",
      });
      console.log(contentful);

      // .then((response) => console.log(response.items))
      // .catch(console.error);
      //local JSON-data
      let result = await fetch("products.json");
      let data = await result.json();
      let products = contentful.items;
      products = products.map((items) => {
        const { title, price } = items.fields;
        const { id } = items.sys;
        const image = items.fields.image.fields.file.url;
        return { title, price, id, image };
      });
      return products;
    } catch (error) {
      console.log(error);
    }
  }
}

// diplay products
class UI {
  displayProducts(products) {
    let result = "";
    products.forEach((products) => {
      result += `
         <article class="product">
        <div class="img-container">
          <img src=${products.image} alt="product"
          class="product-img">
          <button class="bag-btn" data-id=${products.id}>
            <i class="fas fa-shopping-cart">add to cart</i>
          </button>
        </div>
        <h3>${products.title}</h3>
        <h4>$${products.price}</h4>
        </article>
        `;
      productsDOM.innerHTML = result;
    });
  }
  getBagButtons() {
    const buttons = [...document.querySelectorAll(".bag-btn")];
    buttonsDOM = buttons;
    buttons.forEach((button) => {
      let id = button.dataset.id;
      let inCart = cart.find((item) => item.id === id);
      if (inCart) {
        button.innerText = " In Cart";
        button.disabled = true;
      }
      button.addEventListener("click", (event) => {
        event.target.innerText = " In Cart";
        event.target.disabled = true;
        // get product
        let cartItem = { ...Storage.getProduct(id), amount: 1 };
        // add to cart
        cart = [...cart, cartItem];
        // save cart to storage
        Storage.saveCart(cart);
        // set cart values
        this.setCartValues(cart);
        // display cart item
        this.addCartItem(cartItem);
        // show the cart
        this.showCart();
      });
    });
  }
  setCartValues(cart) {
    let tempTotal = 0;
    let itemsTotal = 0;
    cart.map((item) => {
      tempTotal += item.price * item.amount;
      itemsTotal += item.amount;
    });
    cartTotal.innerText = parseFloat(tempTotal.toFixed(2));
    cartItems.innerText = itemsTotal;
    // console.log(cartTotal, cartItems);
  }
  addCartItem(item) {
    const div = document.createElement("div");
    div.classList.add("cart-item");
    div.innerHTML = `<img src=${item.image} alt="product">
           <div>
             <h4>${item.title}</h4>
             <h5>$${item.price}</h5>
             <span class="remove-item" data-id=${item.id}>remove</span>
           </div>
           <div>
             <i class="fas fa-chevron-up" data-id=${item.id}></i>
             <p class="item-amount">${item.amount}</p>
             <i class="fas fa-chevron-down" data-id=${item.id}></i>
           </div>`;
    cartContent.appendChild(div);
    // console.log(cartContent);
  }
  showCart() {
    cartOverlay.classList.add("transparentBcg");
    cartDOM.classList.add("showCart");
  }
  setupApp() {
    cart = Storage.getCart();
    this.setCartValues(cart);
    this.populate(cart);
    cartButton.addEventListener("click", this.showCart);
    closeCartButton.addEventListener("click", this.hideCart);
  }
  populate(cart) {
    cart.forEach((item) => {
      this.addCartItem(item);
    });
  }
  hideCart() {
    cartOverlay.classList.remove("transparentBcg");
    cartDOM.classList.remove("showCart");
  }
  cartLogic() {
    clearCartButton.addEventListener("click", () => {
      this.clearCart();
    });
    // cart functionalities
    // using event-bubbling
    cartContent.addEventListener("click", (event) => {
      if (event.target.classList.contains("remove-item")) {
        let removeItem = event.target;
        let id = removeItem.dataset.id;
        this.removeItem(id);
        cartContent.removeChild(removeItem.parentElement.parentElement);
      } else if (event.target.classList.contains("fa-chevron-up")) {
        let addAmount = event.target;
        let id = event.target.dataset.id;
        let tempItem = cart.find((item) => item.id === id);
        tempItem.amount = tempItem.amount + 1;
        Storage.saveCart(cart);
        this.setCartValues(cart);
        addAmount.nextElementSibling.innerText = tempItem.amount;
      } else if (event.target.classList.contains("fa-chevron-down")) {
        let lowerAmount = event.target;
        let id = lowerAmount.dataset.id;
        let tempItem = cart.find((item) => item.id === id);
        tempItem.amount = tempItem.amount - 1;
        if (tempItem.amount > 0) {
          Storage.saveCart(cart);
          this.setCartValues(cart);
          lowerAmount.previousElementSibling.innerText = tempItem.amount;
        } else {
          cartContent.removeChild(lowerAmount.parentElement.parentElement);
          this.removeItem(id);
        }
      }
    });
  }
  clearCart() {
    let cartItems = cart.map((item) => item.id);
    cartItems.forEach((id) => this.removeItem(id));
    console.log(cartContent.children);
    while (cartContent.children.length > 0) {
      cartContent.removeChild(cartContent.children[0]);
    }
    this.hideCart();
  }
  removeItem(id) {
    cart = cart.filter((item) => item.id !== id);
    this.setCartValues(cart);
    Storage.saveCart(cart);
    let button = this.getSingleButton(id);
    button.disabled = false;
    button.innerHTML = `<i class="fas fa-shopping-cart">add to cart</i>`;
  }
  getSingleButton(id) {
    console.log(buttonsDOM);
    return buttonsDOM.find((button) => button.dataset.id === id);
  }
}

// local storage
class Storage {
  static saveProducts(products) {
    localStorage.setItem("products", JSON.stringify(products));
  }
  static getProduct(id) {
    let products = JSON.parse(localStorage.getItem("products"));
    return products.find((product) => product.id == id);
  }
  static saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
  }
  static getCart() {
    return localStorage.getItem("cart")
      ? JSON.parse(localStorage.getItem("cart"))
      : [];
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const ui = new UI();
  const products = new Products();
  // setup app
  ui.setupApp();
  //   get all products
  products
    .getProducts()
    .then((products) => {
      ui.displayProducts(products);
      Storage.saveProducts(products);
    })
    .then(() => {
      ui.getBagButtons();
      ui.cartLogic();
    });
});
