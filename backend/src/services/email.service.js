const { logger } = require('../utils/logger');

/**
 * Email Service
 * Handles email sending through SendGrid or AWS SES
 *
 * For MVP: Uses console logging (stub)
 * For Production: Integrate with SendGrid/AWS SES
 */
class EmailService {
  constructor() {
    this.provider = process.env.EMAILPROVIDER || 'console'; // 'sendgrid', 'ses', or 'console'
    this.fromEmail = process.env.EMAILFROM || 'noreply@skycrop.com';
    this.fromName = process.env.EMAILFROMNAME || 'SkyCrop';

    // Initialize provider
    if (this.provider === 'sendgrid') {
      this.initSendGrid();
    } else if (this.provider === 'ses') {
      this.initSES();
    }
  }

  initSendGrid() {
    try {
      const sgMail = require('@sendgrid/mail');
      const apiKey = process.env.SENDGRIDAPIKEY;

      if (!apiKey) {
        logger.warn('SENDGRIDAPIKEY not set, email service will use console logging');
        this.provider = 'console';
        return;
      }

      sgMail.setApiKey(apiKey);
      this.sendGridClient = sgMail;
      logger.info('SendGrid email service initialized');
    } catch (error) {
      logger.warn('SendGrid not available, falling back to console logging', {
        error: error.message,
      });
      this.provider = 'console';
    }
  }

  initSES() {
    // AWS SES initialization (future implementation)
    logger.warn('AWS SES not yet implemented, using console logging');
    this.provider = 'console';
  }

  /**
   * Send email
   * @param {Object} emailData - Email data
   * @param {string} emailData.to - Recipient email
   * @param {string} emailData.subject - Email subject
   * @param {string} emailData.html - HTML content
   * @param {string} emailData.text - Plain text content (optional)
   * @returns {Promise<Object>} Send result
   */
  async sendEmail({ to, subject, html, text }) {
    const started = Date.now();

    try {
      if (this.provider === 'sendgrid') {
        return await this.sendViaSendGrid({ to, subject, html, text });
      }
      if (this.provider === 'ses') {
        return await this.sendViaSES({ to, subject, html, text });
      }
      return await this.sendViaConsole({ to, subject, html, text });
    } catch (error) {
      const latency = Date.now() - started;
      logger.error('email.send.error', {
        to,
        subject,
        provider: this.provider,
        latencyms: latency,
        error: error.message,
      });
      throw error;
    }
  }

  async sendViaSendGrid({ to, subject, html, text }) {
    const started = Date.now();

    const msg = {
      to,
      from: {
        email: this.fromEmail,
        name: this.fromName,
      },
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
    };

    await this.sendGridClient.send(msg);

    const latency = Date.now() - started;
    logger.info('email.sent', {
      to,
      subject,
      provider: 'sendgrid',
      latencyms: latency,
    });

    return {
      success: true,
      provider: 'sendgrid',
      messageId: `sendgrid-${Date.now()}`,
      latencyms: latency,
    };
  }

  async sendViaSES({ to, subject, html, text }) {
    // AWS SES implementation (future)
    throw new Error('AWS SES not yet implemented');
  }

  async sendViaConsole({ to, subject, html, text }) {
    const latency = Date.now() - Date.now();

    logger.info('email.sent.console', {
      to,
      subject,
      provider: 'console',
      htmllength: html.length,
      textlength: text ? text.length : 0,
    });

    // Log to console for development
    console.log('\n========== EMAIL (Console Mode) ==========');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`HTML Length: ${html.length} chars`);
    if (text) console.log(`Text: ${text.substring(0, 100)}...`);
    console.log('===========================================\n');

    return {
      success: true,
      provider: 'console',
      messageId: `console-${Date.now()}`,
      latencyms: latency,
    };
  }

  /**
   * Send health alert email
   * @param {string} userEmail - User email
   * @param {string} fieldName - Field name
   * @param {string} alertType - Alert type
   * @param {string} severity - Severity level
   * @returns {Promise<Object>}
   */
  async sendHealthAlert(userEmail, fieldName, alertType, severity) {
    const subject = `⚠️ ${severity.toUpperCase()} Alert: ${fieldName}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${severity === 'critical' ? '#dc3545' : '#ffc107'};">
          Health Alert for ${fieldName}
        </h2>
        <p><strong>Alert Type:</strong> ${alertType}</p>
        <p><strong>Severity:</strong> ${severity}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <hr>
        <p>Please check your field's health status in the SkyCrop app for detailed recommendations.</p>
        <p>
          <a href="${process.env.FRONTENDURL}/fields" style="
            background-color: #28a745;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            display: inline-block;
          ">View Field Details</a>
        </p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          You're receiving this because you have alerts enabled for ${fieldName}.
        </p>
      </div>
    `;

    return await this.sendEmail({
      to: userEmail,
      subject,
      html,
    });
  }

  /**
   * Send recommendation notification email
   * @param {string} userEmail - User email
   * @param {string} fieldName - Field name
   * @param {Object} recommendation - Recommendation data
   * @returns {Promise<Object>}
   */
  async sendRecommendationEmail(userEmail, fieldName, recommendation) {
    const subject = `📋 New Recommendation for ${fieldName}`;

    const priorityColor =
      {
        critical: '#dc3545',
        high: '#fd7e14',
        medium: '#ffc107',
        low: '#6c757d',
      }[recommendation.priority] || '#6c757d';

    const actionStepsHtml = recommendation.actionSteps
      ? recommendation.actionSteps.map((step, i) => `<li>${step}</li>`).join('')
      : '';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${priorityColor};">
          New Recommendation for ${fieldName}
        </h2>
        <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid ${priorityColor};">
          <h3 style="margin-top: 0;">${recommendation.title}</h3>
          <p><strong>Priority:</strong> <span style="color: ${priorityColor};">${recommendation.priority.toUpperCase()}</span></p>
          <p><strong>Type:</strong> ${recommendation.type}</p>
          <p>${recommendation.description}</p>
        </div>
        ${
          actionStepsHtml
            ? `
          <h4>Recommended Actions:</h4>
          <ol>
            ${actionStepsHtml}
          </ol>
        `
            : ''
        }
        ${
          recommendation.estimatedCost
            ? `
          <p><strong>Estimated Cost:</strong> LKR ${recommendation.estimatedCost.toLocaleString()}</p>
        `
            : ''
        }
        ${
          recommendation.timing
            ? `
          <p><strong>Timing:</strong> ${recommendation.timing}</p>
        `
            : ''
        }
        <p>
          <a href="${process.env.FRONTENDURL}/fields/${recommendation.field_id}/recommendations" style="
            background-color: #007bff;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            display: inline-block;
          ">View Full Details</a>
        </p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          SkyCrop Intelligent Farming Platform
        </p>
      </div>
    `;

    return await this.sendEmail({
      to: userEmail,
      subject,
      html,
    });
  }

  /**
   * Send yield prediction ready email
   * @param {string} userEmail - User email
   * @param {string} fieldName - Field name
   * @param {Object} prediction - Prediction data
   * @returns {Promise<Object>}
   */
  async sendYieldPredictionEmail(userEmail, fieldName, prediction) {
    const subject = `🌾 Yield Prediction Ready for ${fieldName}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">
          Yield Prediction for ${fieldName}
        </h2>
        <div style="background-color: #d4edda; padding: 15px; border-left: 4px solid #28a745; border-radius: 5px;">
          <h3 style="margin-top: 0; color: #155724;">Predicted Yield</h3>
          <p style="font-size: 24px; margin: 10px 0;">
            <strong>${prediction.predictedyieldperha.toLocaleString()} kg/ha</strong>
          </p>
          <p style="font-size: 18px; margin: 10px 0;">
            Total: <strong>${prediction.predictedtotalyield.toLocaleString()} kg</strong>
          </p>
        </div>
        <h4>Confidence Interval:</h4>
        <p>
          Lower: ${prediction.confidenceinterval.lower.toLocaleString()} kg/ha<br>
          Upper: ${prediction.confidenceinterval.upper.toLocaleString()} kg/ha
        </p>
        <h4>Expected Revenue:</h4>
        <p style="font-size: 20px; color: #28a745;">
          <strong>LKR ${prediction.expectedrevenue.toLocaleString()}</strong>
        </p>
        <p><strong>Estimated Harvest Date:</strong> ${prediction.harvestdateestimate}</p>
        <p>
          <a href="${process.env.FRONTENDURL}/fields/${prediction.field_id}/yield" style="
            background-color: #28a745;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            display: inline-block;
          ">View Detailed Prediction</a>
        </p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          This prediction is based on ML analysis of your field's health data and weather conditions.
        </p>
      </div>
    `;

    return await this.sendEmail({
      to: userEmail,
      subject,
      html,
    });
  }
}

// Singleton instance
let emailServiceInstance;

function getEmailService() {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService();
  }
  return emailServiceInstance;
}

module.exports = {
  EmailService,
  getEmailService,
};
