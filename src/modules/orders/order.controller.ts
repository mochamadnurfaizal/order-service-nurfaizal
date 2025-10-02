import { Request, Response } from 'express';
import { createOrder, getAllOrders } from './order.service';
import { validationResult } from 'express-validator';

export const createOrderHandler = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const order = await createOrder(req.body);
    res.status(201).json(order);
  } catch (error: any) {
    console.log(error);
    // Check for user not found error
    if (
      error instanceof Error &&
      error.message &&
      error.message.toLowerCase().includes('invalid userid')
    ) {
      return res.status(404).json({ error: `Failed to create order. User ID [${req.body.userId}] not found!` });
    }
    res.status(500).json({ error: 'Failed to create order' });
  }
};

export const getAllOrdersHandler = async (req: Request, res: Response) => {
  try {
    const orders = await getAllOrders();
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};