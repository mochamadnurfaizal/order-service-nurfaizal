import express, { Application, Request, Response } from "express";
import { orderRouter } from "./modules/orders/order.routes";
import cors from "cors";
import { connectKafkaProducer } from "./modules/orders/order.service";
import axios from "axios";


const app: Application = express();
app.use(cors());
app.use(express.json());

// Loki logging middleware
app.use(async (req: Request, res: Response, next) => {
  const lokiUrl = process.env.LOKI_URL || "http://host.docker.internal:3100/loki/api/v1/push";
  const log = {
    streams: [
      {
        stream: {
          service: "order-service",
          method: req.method,
          path: req.originalUrl,
          timestamp: new Date().toISOString(),
        },
        values: [[`${Date.now()}000000`, JSON.stringify({
          method: req.method,
          path: req.originalUrl,
          body: req.body,
          query: req.query,
          headers: req.headers,
        })]]
      }
    ]
  };
  try {
    await axios.post(lokiUrl, log, {
      headers: { "Content-Type": "application/json" }
    });
    console.log(`[LOKI] Log sent for ${req.method} ${req.originalUrl}`);
  } catch (err) {
  const errorMsg = (err && typeof err === 'object' && 'message' in err) ? (err as Error).message : String(err);
  console.error(`[LOKI] Failed to send log for ${req.method} ${req.originalUrl}:`, errorMsg);
  }
  next();
});

app.get("/", (req: Request, res: Response) => {
  res.send("Order Service is running");
});

app.use("/api/orders", orderRouter);

const PORT = process.env.PORT || 3000;

// Connect to Kafka before starting the server
connectKafkaProducer().then(() => {
  app.listen(PORT, () => {
    console.log(`Order Service is running on port ${PORT}`);
  });
});