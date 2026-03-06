const axios = require('axios');  // To make HTTP requests to Chapa's API
const { v4: uuidv4 } = require('uuid'); // For generating unique transaction IDs

const processPaymentGateway = async (paymentDetails, totalAmount) => {
  const { paymentMethod, paymentData } = paymentDetails;

  // Handle Chapa payment processing
  if (paymentMethod === 'chapa') {
    try {
      // Call Chapa's API to process the payment
      const response = await processChapaPayment(paymentData, totalAmount);

      if (response.success) {
        return {
          success: true,
          transactionId: response.transactionId,
          paymentUrl: response.paymentUrl, // Assuming Chapa returns a payment URL
        };
      } else {
        return {
          success: false,
          error: response.error || 'Chapa payment failed.',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Error processing Chapa payment.',
      };
    }
  }

  // Handle Screenshot payment processing (bank transfer)
  if (paymentMethod === 'screenshot') {
    try {
      const isValidScreenshot = await verifyScreenshot(paymentData);
      if (isValidScreenshot) {
        return {
          success: true,
          transactionId: uuidv4(), // Generate a unique transaction ID for screenshot payments
        };
      } else {
        return {
          success: false,
          error: 'Invalid screenshot or failed verification.',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Error verifying screenshot.',
      };
    }
  }

  // If payment method is unknown
  return {
    success: false,
    error: 'Unsupported payment method.',
  };
};

// Chapa payment processing function with real API call
const processChapaPayment = async (paymentData, totalAmount) => {
  try {
    // Example: Chapa payment API integration (adjust the endpoint and parameters based on Chapa's API documentation)
    const chapaApiUrl = 'https://api.chapa.co/v1/checkout/create'; // Example URL - adjust based on Chapa's docs
    const chapaApiKey = 'your-chapa-api-key';  // Replace with your actual Chapa API key

    const payload = {
      amount: totalAmount,
      currency: 'ETB', // Assuming you're using Ethiopian Birr
      return_url: 'http://localhost:3000/success', // URL to redirect on success
      cancel_url: 'http://localhost:3000/cancel', // URL to redirect on cancellation
      customer_email: paymentData.customerEmail,
      customer_name: paymentData.customerName,
      customer_phone: paymentData.customerPhone,
      // Any additional data required by Chapa's API
    };

    const headers = {
      'Authorization': `Bearer ${chapaApiKey}`, // Bearer token for authentication
      'Content-Type': 'application/json',
    };

    // Make a request to Chapa's API to create the payment link
    const response = await axios.post(chapaApiUrl, payload, { headers });

    if (response.data.status === 'success') {
      // Assuming Chapa's response includes a payment URL
      return {
        success: true,
        transactionId: response.data.transaction_id,
        paymentUrl: response.data.payment_url, // URL to redirect user for payment
      };
    } else {
      return {
        success: false,
        error: response.data.message || 'Chapa payment creation failed.',
      };
    }
  } catch (error) {
    return { success: false, error: error.message || 'Chapa payment failed' };
  }
};

// Mock function to simulate screenshot validation (you can add logic here to validate the screenshot)
const verifyScreenshot = async (screenshotData) => {
  if (screenshotData) {
    return true; // Simulate successful screenshot verification
  }
  return false;
};

module.exports = { processPaymentGateway };
