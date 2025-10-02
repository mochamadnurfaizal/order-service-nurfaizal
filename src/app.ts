import express, { Application, Request, Response } from "express";
import { orderRouter } from "./modules/orders/order.routes";
import cors from "cors";

const app: Application = express();
app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Order Service is running");
});

app.use("/api/orders", orderRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Order Service is running on port ${PORT}`);
});