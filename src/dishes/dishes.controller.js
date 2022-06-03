const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

// create, read, update, and list funcions 
const list = (req, res) => {
  res.json({ data: dishes });
};

function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function read(req, res, next) {
  res.json({ data: res.locals.dish });
}

function update(req, res) {
  const dish = res.locals.dish;
  const { data: { name, description, price, image_url } = {} } = req.body;

  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  res.json({ data: dish });
}

// begin middleware validation functions 
// validate dish objects have the required properties 
function hasProp(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Dish must include a ${propertyName}` });
  };
}

// validate dishId matches to a dish object and set object to res.locals
function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish not found: ${req.params.dishId}`,
  });
}

// validate dishId param matches the dish.id for the requested dish object
function verifyDishId(req, res, next){
  const {dishId} = req.params;
  const {data: {id} = {} } = req.body; 
  if(!id)
  {
    next();
  } 
  if(id !== dishId){
    next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    })
  }
  next();
}

// validate dish.price property is a valid price greater than 0 
function priceCheck(req, res, next){
    const {data: {price} = {}} = req.body;

    if (price <= 0 || typeof price !== 'number')
    {
        next({
            status: 400,
            message: `price`,
          });
    }
    return next();
}


module.exports = {
  list,
  create: [
    hasProp("name"),
    hasProp("description"),
    hasProp("price"),
    hasProp("image_url"),
    priceCheck,
    create,
  ],
  read: [dishExists, read],
  update: [
    dishExists,
    verifyDishId,
    hasProp("name"),
    hasProp("description"),
    hasProp("price"),
    hasProp("image_url"),
    priceCheck,
    update,
  ],
  dishExists,
};
