const DeliveryBoy = require('../models/DeliveryBoy.js');
const Shopper = require('../models/Shopper.js');

// Function to send notifications to both shopper and delivery boy
const sendOrderNotification = async (shopper, deliveryBoy, order) => {
  try {
    // Validate input parameters
    if (!shopper || !deliveryBoy || !order) {
      throw new Error("Invalid input: Missing shopper, delivery boy, or order data.");
    }

    // Notification message for the shopper
    const shopperMessage = `Dear ${shopper.full_name},\n\nYou have been assigned a new order.\n\nOrder Details:\n- Order ID: ${order.id}\n- Customer Name: ${order.customer_name}\n- Total Price: $${Number(order.total_price).toFixed(
      2
    )}\n\nPlease prepare the order for delivery.\n\nThank you,\nGebya Net Team`;

    // Notification message for the delivery boy
    const deliveryBoyMessage = `Dear ${deliveryBoy.full_name},\n\nYou have been assigned a new delivery.\n\nOrder Details:\n- Order ID: ${order.id}\n- Customer Name: ${order.customer_name}\n- Total Price: $${Number(order.total_price).toFixed(
      2
    )}\n\nPlease coordinate with the shopper for order pickup.\n\nThank you,\nGebya Net Team`;

    // Simulate sending the notification by logging the messages
    console.log("=== Shopper Notification ===\n", shopperMessage);
    console.log("=== Delivery Boy Notification ===\n", deliveryBoyMessage);

    console.log("Notifications generated successfully.");
  } catch (error) {
    console.error("Error generating notifications:", error);
    throw new Error("Failed to generate notifications");
  }
};

// Export the function as default
module.exports = sendOrderNotification;
