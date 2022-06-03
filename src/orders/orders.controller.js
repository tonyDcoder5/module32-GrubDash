const { stat } = require("fs");
const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
// create, read, update, and list
const list = (req, res) => {
  res.json({ data: orders });
};

function checkStatus(req, res, next) {
  const { orderId } = req.params;
  const { data: { status } = {} } = req.body;

  if (status === "invalid") {
    return next({
      status: 400,
      message: `invalid status: ${orderId}`,
    });
  }

  next();
}

function checkPendingStatus(req, res, next) {
  const status = res.locals.order.status;

  if (status === "pending") {
    return next();
  } else {
    next({
      status: 400,
      message: `pending order`,
    });
  }
}

function destroy(req, res) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === Number(orderId));
  
  orders.splice(index, 1);
  
  res.sendStatus(204).json({ data: orders });
}

function hasProp(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Order must include a ${propertyName}` });
  };
}

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order not found: ${req.params.orderId}`,
  });
}

function checkDishes(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (!dishes || dishes.length === 0 || !Array.isArray(dishes)) {
    return next({
      status: 400,
      message: `Order must include at least one dish`,
    });
  }
  next();
}

function checkDishQty(req, res, next) {
  const { data: { dishes } = {} } = req.body;

  dishes.map((dish) => {
    if (
      !dish.quantity ||
      dish.quantity <= 0 ||
      typeof dish.quantity != "number"
    ) {
      return next({
        status: 400,
        message: `quantity requires a valid number: ${dish.id}`,
      });
    }
  });
  next();
}

function create(req, res) {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function verifyOrderId(req, res, next) {
  const { orderId } = req.params;
  const { data: { id } = {} } = req.body;
  if (!id) {
    next();
  }
  if (id !== orderId) {
    next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
    });
  }
  next();
}

function read(req, res, next) {
  res.json({ data: res.locals.order });
}

function update(req, res) {
  const order = res.locals.order;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;

  res.json({ data: order });
}

module.exports = {
  list,
  create: [
    hasProp("deliverTo"),
    hasProp("mobileNumber"),
    checkDishes,
    checkDishQty,
    create,
  ],
  read: [orderExists, read],
  update: [
    orderExists,
    verifyOrderId,
    hasProp("deliverTo"),
    hasProp("mobileNumber"),
    hasProp("status"),
    checkStatus,
    checkDishes,
    checkDishQty,
    update,
  ],
  delete: [orderExists, checkPendingStatus, destroy],
  orderExists,
};
