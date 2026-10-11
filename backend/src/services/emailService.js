const nodemailer = require('nodemailer');

// Create transporter based on environment variables or dev fallback
const createTransporter = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Development fallback transporter using Ethereal Test Account
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });
};

/**
 * Send generic email
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = await createTransporter();
    const from = process.env.SMTP_FROM || '"Local Artisan Marketplace" <noreply@artisanmarketplace.com>';

    // Forward demo / mock addresses to configured developer email so real emails land in your inbox
    let destination = to;
    if (!destination || destination.endsWith('@lam.in') || destination.includes('example.com') || destination.includes('@kanjeevaram.com')) {
      destination = process.env.SMTP_USER || to;
    }

    const info = await transporter.sendMail({
      from,
      to: destination,
      subject: destination !== to ? `[Demo: ${to}] ${subject}` : subject,
      text: text || html.replace(/<[^>]*>?/gm, ''),
      html
    });

    console.log(`[Email Service] Email sent to ${to}: ${info.messageId}`);
    if (nodemailer.getTestMessageUrl(info)) {
      console.log(`[Email Service Dev Preview]: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info) || null
    };
  } catch (error) {
    console.error(`[Email Service Error]: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send Order Confirmation Email
 */
const sendOrderConfirmationEmail = async ({ user, order }) => {
  const itemsListHtml = (order.items || [])
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          <strong>${item.name || 'Handcrafted Item'}</strong><br/>
          <span style="color: #666; font-size: 12px;">Qty: ${item.quantity || item.qty || 1}</span>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">
          ₹${(item.price * (item.quantity || item.qty || 1)).toLocaleString()}
        </td>
      </tr>
    `
    )
    .join('');

  const html = `
    <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F7F3EC; padding: 24px; border-radius: 12px;">
      <div style="background: #2A2420; color: #F7F3EC; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-family: Georgia, serif;">Local Artisan Marketplace</h2>
        <p style="margin: 5px 0 0; font-size: 14px; color: #D9855F;">Order Confirmation #${order._id || order.id}</p>
      </div>
      <div style="background: #ffffff; padding: 24px; border-radius: 0 0 8px 8px; color: #2A2420;">
        <p style="font-size: 16px;">Namaste <strong>${user.name}</strong>,</p>
        <p>Thank you for supporting Indian artisans! Your order has been successfully placed.</p>
        
        <div style="margin: 20px 0; background: #F0EAE0; padding: 16px; border-radius: 8px;">
          <h4 style="margin: 0 0 10px; color: #C1673B;">Order Summary</h4>
          <table style="width: 100%; border-collapse: collapse;">
            ${itemsListHtml}
          </table>
          <div style="margin-top: 15px; text-align: right; font-size: 18px; font-weight: 700; color: #C1673B;">
            Total Paid: ₹${(order.totalAmount || order.total || 0).toLocaleString()}
          </div>
        </div>

        <p style="font-size: 14px; color: #666;">
          Delivery Address: ${order.shippingAddress?.address || 'As registered in profile'}, ${order.shippingAddress?.city || ''}
        </p>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/customer/orders/${order._id || order.id}" 
             style="background: #C1673B; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 50px; font-weight: 600; display: inline-block;">
            Track Order Status
          </a>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: `🎉 Order Confirmed! #${order._id || order.id} - Local Artisan Marketplace`,
    html
  });
};

/**
 * Send Custom Request Quote Received Email
 */
const sendCustomRequestQuoteEmail = async ({ customer, artisan, request, priceQuote }) => {
  const html = `
    <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F7F3EC; padding: 24px; border-radius: 12px;">
      <div style="background: #3F6B52; color: #ffffff; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-family: Georgia, serif;">New Price Quote Received!</h2>
      </div>
      <div style="background: #ffffff; padding: 24px; border-radius: 0 0 8px 8px; color: #2A2420;">
        <p>Hello <strong>${customer.name}</strong>,</p>
        <p>Artisan <strong>${artisan.name}</strong> has submitted a custom price quote for your request: <em>"${request.title}"</em>.</p>
        
        <div style="background: #e7f3ec; border-left: 4px solid #3F6B52; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0 0 8px; font-weight: 600;">Quoted Price: <span style="font-size: 20px; color: #3F6B52;">₹${Number(priceQuote).toLocaleString()}</span></p>
          <p style="margin: 0; font-size: 14px; color: #555;">Status: Quote Ready for Review</p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/customer/custom-requests/${request._id || request.id}" 
             style="background: #3F6B52; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 50px; font-weight: 600; display: inline-block;">
            View & Accept Quote
          </a>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: customer.email,
    subject: `🎨 New Custom Quote from ${artisan.name} - Local Artisan Marketplace`,
    html
  });
};

/**
 * Send OTP Email
 */
const sendOTPEmail = async ({ user, otp }) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h3 style="color: #C1673B; text-align: center;">Security Verification Code</h3>
      <p>Hello ${user.name || 'Valued User'},</p>
      <p>Use the following 6-digit OTP code to verify your identity or complete your transaction:</p>
      <div style="background: #F7F3EC; border: 2px dashed #C1673B; padding: 16px; text-align: center; border-radius: 8px; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #2A2420;">${otp}</span>
      </div>
      <p style="font-size: 12px; color: #888; text-align: center;">This code will expire in 10 minutes. Please do not share this OTP with anyone.</p>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: `🔐 Your OTP Code: ${otp} - Local Artisan Marketplace`,
    html
  });
};

module.exports = {
  sendEmail,
  sendOrderConfirmationEmail,
  sendCustomRequestQuoteEmail,
  sendOTPEmail
};
