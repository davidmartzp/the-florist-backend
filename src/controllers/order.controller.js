const orderService = require('../services/order.service');

function getStatusCode(error) {
  return error.statusCode || 500;
}

async function listOrders(req, res) {
  try {
    const orders = await orderService.listOrders(req.query);
    res.json(orders);
  } catch (error) {
    res.status(getStatusCode(error)).json({ error: error.message });
  }
}

async function getOrder(req, res) {
  try {
    const order = await orderService.getOrderById(req.params.orderId);
    res.json(order);
  } catch (error) {
    res.status(getStatusCode(error)).json({ error: error.message });
  }
}

async function createOrder(req, res) {
  try {
    const order = await orderService.createOrder(req.user.id, req.body);
    res.status(201).json(order);
  } catch (error) {
    res.status(getStatusCode(error)).json({ error: error.message });
  }
}

async function updateOrder(req, res) {
  try {
    const order = await orderService.updateOrder(req.params.orderId, req.body);
    res.json(order);
  } catch (error) {
    res.status(getStatusCode(error)).json({ error: error.message });
  }
}

async function deleteOrder(req, res) {
  try {
    const result = await orderService.deleteOrder(req.params.orderId);
    res.json(result);
  } catch (error) {
    res.status(getStatusCode(error)).json({ error: error.message });
  }
}

module.exports = {
  createOrder,
  deleteOrder,
  getOrder,
  listOrders,
  updateOrder,
};
