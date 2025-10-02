import { eq } from 'drizzle-orm';
import { db } from '../../db/db';
import { ordersTable, Order } from '../../db/schemas/orders';
import axios from 'axios';
import axiosRetry from "axios-retry";
import CircuitBreaker from "opossum";

// Load env vars if not already loaded
if (!process.env.API_BASE_URL || !process.env.API_TIMEOUT) {
  require('dotenv').config();
}

// Create an axios instance using env vars
const api = axios.create({
  baseURL: process.env.API_BASE_URL,
  timeout: process.env.API_TIMEOUT ? parseInt(process.env.API_TIMEOUT, 10) : 2000,
});

// Add retry config
axiosRetry(api, {
  retries: 5, // total number of retries
  retryDelay: axiosRetry.exponentialDelay, // backoff strategy
  retryCondition: (error) => {
    // Only retry on network errors or 5xx errors
    return axiosRetry.isNetworkOrIdempotentRequestError(error);
  },
  onRetry: (retryCount, error, requestConfig) => {
    console.log(`Retrying request... Attempt #${retryCount}`);
  }
});

async function validateUser(userId: string) {
  try {
    const res = await api.get(`/api/users/${userId}`);
    const data = res.data;
    
    if (
      data &&
      typeof data.id === 'string'
    ) {
      return true;
    }
    return false;
  } catch (err: any) {
    if (err.response && err.response.data && err.response.data.error === 'User not found') {
      return false;
    }
    console.log(err);
    throw err;
  }
}

// Configure circuit breaker
const breaker = new CircuitBreaker(validateUser, {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 10000,
});


// Add fallback
breaker.fallback((userId: string) => ({
  error: `Service unavailable for user ${userId}. Please try again later.`,
}));


// Event logging (optional but useful)
breaker.on("open", () => console.log("Circuit OPEN"));
breaker.on("halfOpen", () => console.log("Circuit HALF-OPEN"));
breaker.on("close", () => console.log("Circuit CLOSED"));

export const createOrder = async (order: Order): Promise<Order> => {
  try {

    //check for idempotency
    const idempotencyKey = order.idempotencyKey;
    const existingOrder = await db.query.ordersTable.findFirst({
      where: eq(ordersTable.idempotencyKey, idempotencyKey!)
    });
    if (existingOrder) {
      return existingOrder;
    }

    // Validate userId using circuit breaker
    const isUserValid = await breaker.fire(order.userId);
    if (!isUserValid) {
      throw new Error('Invalid userId. User does not exist.');
    }

    // Insert order into the database
    const [createdOrder] = await db.insert(ordersTable).values(order).returning();
    return createdOrder;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error; // Re-throw the specific error for better handling upstream
  }
};

export const getAllOrders = async (): Promise<Order[]> => {
  try {
    const orders: Order[] = await db.query.ordersTable.findMany();
    return orders;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw new Error('Failed to retrieve orders.');
  }
};
