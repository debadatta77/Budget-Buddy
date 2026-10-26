/**
 * Budget Buddy - Contact & Inquiry Service
 * Connects directly to Google Apps Script / Google Sheets Webhook
 */

export const GOOGLE_SHEET_ENDPOINT = 
  import.meta.env.VITE_GOOGLE_SHEET_CONTACT_URL || 
  'https://script.google.com/macros/s/AKfycbxb6h9n32BFfJcvI9nChInj_dOlMURbuu9RIBNkOtpxS-8TB8d7jIQKr1ec0gMQVqk/exec';

const BACKEND_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const CONTACT_STORAGE_KEY = 'budget_buddy_contact_logs';

/**
 * Submits contact inquiry or customer complaint to Google Sheet and MongoDB
 * @param {Object} inquiryData { name, email, phone, subject, message, type, severity, complaintCategory }
 * @returns {Promise<{ success: boolean, message: string, ticketId?: string }>}
 */
export const submitContactInquiry = async (inquiryData) => {
  const timestamp = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'medium'
  });

  const isComplaint =
    inquiryData.type === 'complaint' ||
    (inquiryData.complaintCategory && inquiryData.complaintCategory.trim().length > 0) ||
    (inquiryData.subject && inquiryData.subject.toLowerCase().includes('complaint'));

  // Generate fallback ticket ID if complaint
  const randomTicketNum = Math.floor(10000 + Math.random() * 90000);
  const ticketId = inquiryData.ticketId || (isComplaint ? `CMP-${randomTicketNum}` : `INQ-${randomTicketNum}`);

  const formattedSubject = isComplaint
    ? `[${ticketId}] ${inquiryData.complaintCategory || inquiryData.subject || 'Customer Grievance'}`
    : (inquiryData.subject || 'General Inquiry').trim();

  const payload = {
    timestamp,
    ticketId,
    type: isComplaint ? 'complaint' : (inquiryData.type || 'inquiry'),
    severity: inquiryData.severity || (isComplaint ? 'High' : 'Medium'),
    complaintCategory: inquiryData.complaintCategory || '',
    name: (inquiryData.name || '').trim(),
    email: (inquiryData.email || '').trim(),
    phone: (inquiryData.phone || '').trim(),
    subject: formattedSubject,
    message: (inquiryData.message || '').trim()
  };

  try {
    // 1. Dispatch to Google Apps Script Webhook
    // Note: text/plain prevents unnecessary CORS preflight OPTIONS rejection in Google Scripts
    fetch(GOOGLE_SHEET_ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    }).catch(sheetErr => console.warn('Google Sheet background push notice:', sheetErr));

    // 2. Transmit directly to Budget Buddy MongoDB Backend for Admin Response Sheet
    let serverTicketId = ticketId;
    try {
      const apiRes = await fetch(`${BACKEND_API_URL}/admin/feedback-public`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ticketId,
          type: payload.type,
          severity: payload.severity,
          complaintCategory: payload.complaintCategory,
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          subject: payload.subject,
          message: payload.message,
          source: isComplaint ? 'Customer Grievance Portal' : 'Contact Form & Webhook'
        })
      });
      const data = await apiRes.json();
      if (data.ticketId) {
        serverTicketId = data.ticketId;
      }
    } catch (apiErr) {
      console.warn('Backend feedback recording notice:', apiErr);
    }

    // Save to local logs for client persistence
    try {
      const existing = JSON.parse(localStorage.getItem(CONTACT_STORAGE_KEY) || '[]');
      existing.unshift({ ...payload, ticketId: serverTicketId });
      localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(existing.slice(0, 50)));
    } catch (cacheErr) {
      console.warn('Could not cache contact message locally:', cacheErr);
    }

    return {
      success: true,
      ticketId: serverTicketId,
      message: isComplaint
        ? `Complaint logged under Ticket #${serverTicketId}. Our compliance desk has received your report.`
        : 'Inquiry successfully transmitted to platform support ledger.'
    };
  } catch (err) {
    console.error('Error submitting inquiry to Google Sheet:', err);
    // Still save locally so data isn't lost
    try {
      const existing = JSON.parse(localStorage.getItem(CONTACT_STORAGE_KEY) || '[]');
      existing.unshift({ ...payload, deliveryStatus: 'offline_cached' });
      localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(existing.slice(0, 50)));
    } catch {
      // ignore
    }

    return {
      success: false,
      ticketId,
      message: err.message || 'Network error while contacting Google Sheet'
    };
  }
};

/**
 * Returns saved submissions from local storage
 */
export const getCachedContactInquiries = () => {
  try {
    return JSON.parse(localStorage.getItem(CONTACT_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};
