import { getAccessToken } from './auth.js';

// Base URL for backend API. Override with VITE_API_URL in .env
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Perform an HTTP request with JSON defaults and JWT Authorization header.
 * - Sends: JSON body if provided
 * - Expects: JSON response for application/json; otherwise text
 * - Throws: Error with message from server (data.message) or statusText
 */
async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  // Attach JWT if available
  const token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = (isJson && data && data.message) ? data.message : response.statusText;
    throw new Error(message || 'Request failed');
  }
  return data;
}

// Auth endpoints
// - login(body): { email, password } → expects { accessToken }
// - register(body): { name, email, password } → expects { message } or created user (ignored by client)
const auth = {
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
};

// Contacts CRUD (backend uses /contacts)
// - getContacts(): expects Array<{ _id, name, email, company }>
// - addContact(body): { name, email, company } → expects created item
// - updateContact(id, body): { name?, email?, company? } → expects updated item
// - deleteContact(id): no body → expects { message } or 204
const contacts = {
  getContacts: () => request('/contacts'),
  addContact: (body) => request('/contacts', { method: 'POST', body: JSON.stringify(body) }),
  updateContact: (id, body) => request(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteContact: (id) => request(`/contacts/${id}`, { method: 'DELETE' }),
};

// Single message template (one per user/app)
// - getTemplate(): expects { body: string } if exists, or { body: '' }/404 mapped to empty
// - saveTemplate(body): { body: string } via PUT → expects saved { body }
const template = {
  async getTemplate() {
    try {
      const res = await request('/template');
      return res; // { body }
    } catch (err) {
      // If backend returns 404 for no template yet, surface empty template
      if (err && /404|not found/i.test(err.message)) return { body: '' };
      throw err;
    }
  },
  saveTemplate: (body) => request('/template', { method: 'PUT', body: JSON.stringify(body) }),
};

// Sending
// - sendBulkEmail(body): { contactIds: string[], subject: string, messageTemplate: string } → expects per-email results or { message }
const sending = {
  sendBulkEmail: (body) => request('/send-email', { method: 'POST', body: JSON.stringify(body) }),
};

// Public API surface re-exported as a single object
export const api = {
  ...auth,
  ...contacts,
  ...template,
  ...sending,
};


