import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { prescriptionAPI, dispenseAPI, chemistAPI } from '../../api/api';
import { Pill, CheckCircle2, Clock, Loader2, Search, Calendar, FileText, AlertTriangle, AlertCircle, HelpCircle, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PrescriptionQueue() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dispensing, setDispensing] = useState(null);
  const [notes, setNotes] = useState('');
  
  // Medicine request modal state
  const [activeRequestPresId, setActiveRequestPresId] = useState(null);
  const [medQuery, setMedQuery] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Issue modal state
  const [activeIssuePresId, setActiveIssuePresId] = useState(null);
  const [issueReason, setIssueReason] = useState('');
  const [submittingIssue, setSubmittingIssue] = useState(false);

  const loadPending = async () => {
    try {
      const [pRes, rRes] = await Promise.all([
        prescriptionAPI.getPending(),
        chemistAPI.getRequests(),
      ]);
      setPrescriptions(pRes.data);
      setRequests(rRes.data);
    } catch (err) {
      toast.error('Failed to load queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPending(); }, []);

  const handleDispense = async (prescriptionId) => {
    setDispensing(prescriptionId);
    try {
      await dispenseAPI.dispense(prescriptionId, notes);
      toast.success('Prescription marked as dispensed!');
      setNotes('');
      loadPending();
    } catch (err) {
      toast.error('Failed to dispense prescription');
    } finally {
      setDispensing(null);
    }
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!medQuery.trim()) return;
    setSubmittingRequest(true);
    try {
      await chemistAPI.requestMedicineChange({
        prescriptionId: activeRequestPresId,
        requestedMedicine: medQuery
      });
      toast.success('Substitution query sent to doctor!');
      setMedQuery('');
      setActiveRequestPresId(null);
      loadPending();
    } catch (err) {
      toast.error('Failed to send query');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleReportIssue = async (e) => {
    e.preventDefault();
    if (!issueReason.trim()) return;
    setSubmittingIssue(true);
    try {
      await chemistAPI.reportIssue({
        prescriptionId: activeIssuePresId,
        reason: issueReason
      });
      toast.success('Emergency issue reported to Admin/Doctor!');
      setIssueReason('');
      setActiveIssuePresId(null);
      loadPending();
    } catch (err) {
      toast.error('Failed to report issue');
    } finally {
      setSubmittingIssue(false);
    }
  };

  const filtered = prescriptions.filter(p =>
    p.medicines?.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toString().includes(search) ||
    p.patientId.toString().includes(search)
  );

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner w-8 h-8" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2"><Clock className="w-6 h-6 text-amber-500" /> Prescription Queue</h1>
        <p className="page-subtitle">Pending prescriptions waiting to be dispensed</p>
      </div>

      <div className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
          <input type="text" className="input-field pl-10" placeholder="Search by ID, patient ID, or medicines..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center border border-dashed border-dark-700"><CheckCircle2 className="w-12 h-12 text-emerald-500/50 mx-auto mb-3" /><div className="text-dark-400">Queue is empty! Great job.</div></div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filtered.map((p, idx) => {
              const matchedRequests = requests.filter(r => r.prescriptionId === p.id);
              const activeRequest = matchedRequests.length > 0 ? matchedRequests[matchedRequests.length - 1] : null;

              return (
                <motion.div key={p.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ delay: idx * 0.05 }} className="glass-card p-5 border-l-4 border-l-amber-500">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="badge-warning mb-2"><Clock className="w-3 h-3" /> PENDING</span>
                          <div className="text-lg font-bold text-dark-100">Prescription #{p.id}</div>
                          <div className="text-xs text-dark-400">Patient ID: {p.patientId} • Doctor ID: {p.doctorId}</div>
                        </div>
                      </div>

                      <div className="bg-dark-800/50 p-4 rounded-lg border border-dark-700/30">
                        <div className="text-xs text-dark-500 mb-1 flex items-center gap-1"><Pill className="w-3.5 h-3.5 text-amber-400" /> Prescribed Medicines</div>
                        <div className="text-sm font-semibold text-dark-100 whitespace-pre-line">{p.medicines}</div>
                      </div>

                      {p.notes && (
                        <div className="text-xs text-dark-400 border-l-2 border-dark-700 pl-3 italic flex items-start gap-1">
                          <FileText className="w-3 h-3 shrink-0 mt-0.5" /> Note: {p.notes}
                        </div>
                      )}

                      {/* Display substitution query status */}
                      {activeRequest && (
                        <div className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                          activeRequest.status === 'APPROVED' ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400' :
                          activeRequest.status === 'REJECTED' ? 'bg-red-950/20 border-red-900/30 text-red-400' :
                          'bg-cyan-950/20 border-cyan-900/30 text-cyan-400 animate-pulse'
                        }`}>
                          <div className="flex items-center gap-2">
                            <HelpCircle className="w-4 h-4" />
                            <span>
                              <strong>Substitute Query:</strong> "{activeRequest.requestedMedicine}"
                            </span>
                          </div>
                          <span className="font-bold tracking-wider uppercase text-[10px] px-2 py-0.5 rounded bg-dark-900 border border-current">
                            {activeRequest.status}
                          </span>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 pt-2">
                        <button
                          onClick={() => setActiveRequestPresId(p.id)}
                          disabled={activeRequest?.status === 'PENDING'}
                          className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 border-dashed hover:border-amber-500/50"
                        >
                          <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                          {activeRequest ? 'Send Another Query' : 'Medicine Not Available'}
                        </button>
                        <button
                          onClick={() => setActiveIssuePresId(p.id)}
                          className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 border-dashed border-red-800/40 hover:border-red-500/50 text-red-400 hover:text-red-300"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Report Emergency / Stop
                        </button>
                      </div>

                      <div className="text-xs text-dark-500 flex items-center gap-1 pt-2">
                        <Calendar className="w-3.5 h-3.5" /> Created: {formatDate(p.createdAt)}
                      </div>
                    </div>

                    <div className="w-full md:w-64 space-y-3 md:border-l md:border-dark-800 md:pl-6 flex flex-col justify-end">
                      <div className="form-group">
                        <label className="input-label text-xs">Dispense Notes (Optional)</label>
                        <input
                          type="text"
                          className="input-field text-sm"
                          placeholder="e.g., provided substitute for..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                      </div>
                      <button
                        onClick={() => handleDispense(p.id)}
                        disabled={dispensing === p.id}
                        className="btn-success w-full justify-center py-2.5 shadow-lg shadow-emerald-950/20"
                      >
                        {dispensing === p.id ? <><Loader2 className="w-4 h-4 animate-spin" /> Dispensing...</> : <><CheckCircle2 className="w-4 h-4" /> Mark Dispensed</>}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Medicine Substitution Request Modal */}
      <AnimatePresence>
        {activeRequestPresId && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="glass-card max-w-md w-full p-6 space-y-5 border border-amber-500/30">
              <div className="flex items-center gap-2 text-amber-400">
                <HelpCircle className="w-5 h-5" />
                <h3 className="font-bold text-dark-100 text-lg">Query Medicine Substitution</h3>
              </div>
              <p className="text-xs text-dark-400">Send a request to the prescribing doctor asking for permission to substitute or replace the unavailable medicines for Prescription #{activeRequestPresId}.</p>
              
              <form onSubmit={handleSendRequest} className="space-y-4">
                <div className="form-group">
                  <label className="input-label text-xs">Describe Query / Proposed Alternative</label>
                  <textarea
                    rows={3}
                    className="input-field text-sm resize-none"
                    placeholder="e.g. Paracetamol 500mg is out of stock. Can I substitute with Acetaminophen 500mg or Ibuprofen?"
                    value={medQuery}
                    onChange={(e) => setMedQuery(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setActiveRequestPresId(null)} className="btn-secondary flex-1 justify-center py-2 text-xs">Cancel</button>
                  <button type="submit" disabled={submittingRequest} className="btn-primary flex-1 justify-center py-2 text-xs flex items-center gap-1">
                    {submittingRequest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Send Request
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Emergency Issue Modal */}
      <AnimatePresence>
        {activeIssuePresId && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="glass-card max-w-md w-full p-6 space-y-5 border border-red-500/30">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-dark-100 text-lg">Report Dispense Emergency</h3>
              </div>
              <p className="text-xs text-dark-400">Report why you are unable to dispense this prescription. An Admin or Doctor will review and resolve this safety or inventory issue.</p>
              
              <form onSubmit={handleReportIssue} className="space-y-4">
                <div className="form-group">
                  <label className="input-label text-xs">Reason for Reporting</label>
                  <textarea
                    rows={3}
                    className="input-field text-sm resize-none"
                    placeholder="e.g. Patient claims severe allergy history to penicillin; dosage of paracetamol is abnormally high."
                    value={issueReason}
                    onChange={(e) => setIssueReason(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setActiveIssuePresId(null)} className="btn-secondary flex-1 justify-center py-2 text-xs">Cancel</button>
                  <button type="submit" disabled={submittingIssue} className="btn-danger flex-1 justify-center py-2 text-xs flex items-center gap-1">
                    {submittingIssue ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    Report Emergency
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatDate(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
