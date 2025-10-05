import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import { Card, Button, Modal } from '../components/UI.jsx';
import { api } from '../utils/api.js';
import toast from 'react-hot-toast';

const SendEmails = () => {
  const [user, setUser] = useState(null);
  const [emails, setEmails] = useState([]);
  const [selected, setSelected] = useState({});
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [sendReport, setSendReport] = useState(null);


  useEffect(() => {
    async function load() {
      try {
        const [list, tpl] = await Promise.all([
          api.getContacts(),
          api.getTemplate(),
        ]);
        setEmails(list || []);
        if (tpl && typeof tpl.body === 'string') setMessage(tpl.body);
      } catch (err) {
        const msg = err.message || 'Failed to load';
        setError(msg);
        toast.error(msg);
      }
    }
    load();
  }, []);

  const selectedIds = useMemo(() => Object.keys(selected).filter((id) => selected[id]), [selected]);
  const allSelected = selectedIds.length === emails.length && emails.length > 0;

  function toggleAll(flag) {
    const map = {};
    emails.forEach((e) => (map[e._id] = flag));
    setSelected(map);
  }

  async function onSaveTemplate() {
    if (!message.trim()) return;
    setSavingTemplate(true);
    try {
      await api.saveTemplate({ body: message });
      toast.success('Template saved');
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSavingTemplate(false);
    }
  }

  async function onSend() {
    if (!subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }
    
    setSending(true);
    setProgress(0);
    setSendReport(null);
    
    try {
      const response = await api.sendBulkEmail({ 
        contactIds: selectedIds, 
        subject: subject, 
        messageTemplate: message 
      });
      
      setSendReport(response.report);
      
      if (response.report.sent.length > 0) {
        toast.success(`Successfully sent ${response.report.sent.length} emails`);
      }
      
      if (response.report.failed.length > 0) {
        toast.error(`Failed to send ${response.report.failed.length} emails`);
      }
      
      // Clear form after successful send
      setMessage('');
      setSubject('');
      setSelected({});
      
    } catch (err) {
      toast.error(err.message || 'Failed to send emails');
      setError(err.message || 'Send failed');
    } finally {
      setSending(false);
      setProgress(0);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Send Emails</h1>
          <p className="text-lg text-gray-600">Send personalized emails to your contacts</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="shadow-lg">
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Content</h2>
                <p className="text-gray-600">Compose your email with personalized content</p>
              </div>
              
              {/* Subject Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject Line</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  placeholder="Enter email subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              
              {/* Message Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message Template</label>
                <textarea
                  className="w-full min-h-[300px] border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 resize-none"
                  placeholder="Write your message. Use [Name] and [Company Name] placeholders for personalization."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <div className="mt-2 text-sm text-gray-500">
                  <p>Use <code className="bg-gray-100 px-2 py-1 rounded">[Name]</code> and <code className="bg-gray-100 px-2 py-1 rounded">[Company Name]</code> for personalization</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  onClick={onSaveTemplate} 
                  disabled={savingTemplate || !message.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {savingTemplate ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Save Template
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </Card>
          <Card className="shadow-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Recipients</h2>
                  <p className="text-gray-600 mt-1">Select contacts to receive your email</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200" 
                    onClick={() => toggleAll(true)}
                  >
                    Select All
                  </button>
                  <button 
                    className="text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200" 
                    onClick={() => toggleAll(false)}
                  >
                    Unselect All
                  </button>
                </div>
              </div>
              
              <div className="overflow-auto rounded-lg border border-gray-200 max-h-[400px] min-w-full">
                <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: '600px' }}>
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input 
                          type="checkbox" 
                          checked={allSelected}
                          onChange={(e) => toggleAll(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {emails.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center">
                          <div className="text-gray-500">
                            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <p className="text-lg font-medium text-gray-900 mb-1">No contacts found</p>
                            <p className="text-gray-500">Add contacts from the Dashboard to send emails</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      emails.map((e) => (
                        <tr key={e._id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input 
                              type="checkbox" 
                              checked={!!selected[e._id]} 
                              onChange={(ev) => setSelected({ ...selected, [e._id]: ev.target.checked })}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-sm font-medium text-blue-600">
                                    {e.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{e.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{e.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{e.company || '-'}</div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>

        {/* Send Section */}
        <Card className="shadow-lg">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Ready to Send</h3>
                <p className="text-sm text-gray-600">
                  Selected: <span className="font-medium text-blue-600">{selectedIds.length}</span> / {emails.length} contacts
                </p>
              </div>
              <div className="flex items-center gap-4">
                {sending && (
                  <div className="flex items-center gap-3">
                    <div className="w-48 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div className="bg-blue-600 h-2 transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-sm text-gray-600">Sending...</span>
                  </div>
                )}
                <Button 
                  onClick={onSend} 
                  disabled={sending || selectedIds.length === 0 || !message.trim() || !subject.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Send Emails
                    </div>
                  )}
                </Button>
              </div>
            </div>
            
            {/* Send Report */}
            {sendReport && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Send Report</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sendReport.sent.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 text-green-600 mb-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm font-medium">Successfully Sent ({sendReport.sent.length})</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {sendReport.sent.join(', ')}
                      </div>
                    </div>
                  )}
                  
                  {sendReport.failed.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 text-red-600 mb-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="text-sm font-medium">Failed ({sendReport.failed.length})</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {sendReport.failed.map((f, i) => (
                          <div key={i}>{f.name}: {f.reason}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SendEmails;



