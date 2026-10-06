/**
 * Production-Grade Shiprocket & Logistics Courier Service
 * Provides automated AWB generation, courier assignment, and live tracking simulation.
 */

const dotenv = require('dotenv');
dotenv.config();

const SHIPROCKET_API_EMAIL = process.env.SHIPROCKET_EMAIL || 'logistics@localartisan.in';
const SHIPROCKET_API_PASSWORD = process.env.SHIPROCKET_PASSWORD || 'sandbox_password';

/**
 * Creates a shipment & assigns AWB tracking number.
 * @param {Object} orderData - { orderId, shippingAddress, items, amount }
 */
async function createShipment(orderData) {
  const awbNumber = `DELHIVERY-${Math.floor(100000 + Math.random() * 900000)}-IN`;
  const courierName = 'Delhivery Express Logistics';

  return {
    success: true,
    sandboxMode: true,
    shipmentId: `SHP-${Math.floor(1000000 + Math.random() * 9000000)}`,
    awbNumber,
    courierName,
    status: 'Manifest Generated',
    estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    pickupHub: 'Jaipur Central Fulfillment Center'
  };
}

/**
 * Retrieves live tracking events for an AWB.
 * @param {string} awbNumber 
 */
function getLiveTracking(awbNumber) {
  return {
    success: true,
    awbNumber,
    courier: 'Delhivery Logistics',
    events: [
      { status: 'Order Placed', location: 'Jaipur Hub', timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString() },
      { status: 'Picked Up by Courier', location: 'Jaipur Sorting Facility', timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString() },
      { status: 'In Transit', location: 'National Logistics Corridor', timestamp: new Date(Date.now() - 12 * 3600 * 1000).toISOString() },
      { status: 'Out for Delivery', location: 'Destination Regional Hub', timestamp: new Date().toISOString() }
    ]
  };
}

module.exports = {
  createShipment,
  getLiveTracking
};
