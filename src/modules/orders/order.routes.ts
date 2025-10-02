import { Router } from "express";
import { orderValidator } from "./orders.validator";
import { createOrderHandler, getAllOrdersHandler } from "./order.controller";

const router = Router();

router.post("/", orderValidator.createOrder, createOrderHandler);
router.get("/", getAllOrdersHandler);

export { router as orderRouter };