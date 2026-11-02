export interface PaymentResult {
  success: boolean;
  transactionId: string;
  paymentMethod: 'upi' | 'card' | 'wallet' | 'netbanking';
  amount: number;
  timestamp: string;
}

export const paymentService = {
  async simulatePayment(
    amount: number,
    method: 'upi' | 'card' | 'wallet' | 'netbanking'
  ): Promise<PaymentResult> {
    // Artificial 1-second delay for realistic transaction simulation
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const transactionId = `TXN${Date.now()}${Math.floor(100 + Math.random() * 900)}`;

    return {
      success: true,
      transactionId,
      paymentMethod: method,
      amount,
      timestamp: new Date().toISOString(),
    };
  },
};
