import { body } from 'express-validator';

export const orderValidator = {
    createOrder: [
        body('idempotencyKey').notEmpty().withMessage('Idempotency Key is required'),
        body('productId').isString().withMessage('Product ID must be a string'),
        body('userId').isString().withMessage('User ID must be a string'),
        body('quantity').isInt({ gt: 0 }).withMessage('Quantity must be a positive integer'),
        body('price').isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
        body('totalPrice').isFloat({ gt: 0 }).withMessage('Total Price must be a positive number'),
        body('status').isString().withMessage('Status must be a string'),
    ]
}