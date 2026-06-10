import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdAttachMoney, MdSearch, MdPayment } from 'react-icons/md';
import toast from 'react-hot-toast';
import api from '../services/api';

const Fees = () => {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Payment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMode: 'Bank Transfer',
    transactionId: ''
  });

  const fetchFees = async () => {
    setLoading(true);
    try {
      const res = await api.get('/fees');
      if (res.data.success) {
        setFees(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch fees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredFees = fees.filter(fee => 
    fee.student?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fee.student?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fee.student?.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openPaymentModal = (fee) => {
    setSelectedFee(fee);
    setPaymentData({ amount: '', paymentMode: 'Bank Transfer', transactionId: '' });
    setIsModalOpen(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFee) return;

    try {
      const res = await api.post(`/fees/${selectedFee.id}/payments`, paymentData);
      if (res.data.success) {
        toast.success('Payment added successfully');
        setIsModalOpen(false);
        fetchFees();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fees & Payments</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage student fee collections and statuses.</p>
        </div>
      </div>

      <div className="glass bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MdSearch className="text-muted-foreground" size={20} />
            </div>
            <input 
              type="text" 
              placeholder="Search by student name or ID..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-muted-foreground">
            <thead className="bg-muted/50 text-xs uppercase text-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider">Student ID</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Name</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Total Fee</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Paid Fee</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Due</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan="7" className="text-center py-8">Loading fees...</td></tr>
              ) : filteredFees.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-8 text-muted-foreground">No records found.</td></tr>
              ) : (
                filteredFees.map((fee) => {
                  const due = fee.totalFee - fee.paidFee;
                  return (
                    <motion.tr key={fee.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-muted/30">
                      <td className="px-6 py-4 font-medium text-foreground">{fee.student?.studentId}</td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">{fee.student?.firstName} {fee.student?.lastName}</p>
                        <p className="text-xs text-muted-foreground">{fee.student?.course?.courseName}</p>
                      </td>
                      <td className="px-6 py-4">₹{fee.totalFee.toLocaleString()}</td>
                      <td className="px-6 py-4 text-green-500 font-medium">₹{fee.paidFee.toLocaleString()}</td>
                      <td className="px-6 py-4 text-red-500 font-medium">₹{due.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          fee.status === 'Paid' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                          fee.status === 'Partial' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                          'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}>
                          {fee.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {fee.status !== 'Paid' && (
                          <button 
                            onClick={() => openPaymentModal(fee)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg transition-colors text-xs font-medium"
                          >
                            <MdPayment size={16} /> Pay
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && selectedFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-border"
          >
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Add Payment for {selectedFee.student?.firstName}</h2>
              <div className="mb-6 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground flex justify-between mb-1">Total Fee: <span className="font-semibold text-foreground">₹{selectedFee.totalFee}</span></p>
                <p className="text-sm text-muted-foreground flex justify-between mb-1">Paid So Far: <span className="font-semibold text-green-500">₹{selectedFee.paidFee}</span></p>
                <p className="text-sm text-muted-foreground flex justify-between border-t border-border mt-2 pt-2">Remaining Due: <span className="font-bold text-red-500">₹{selectedFee.totalFee - selectedFee.paidFee}</span></p>
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Amount to Pay *</label>
                  <input 
                    type="number" 
                    required 
                    min="1" 
                    max={selectedFee.totalFee - selectedFee.paidFee} 
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Payment Mode *</label>
                  <select 
                    value={paymentData.paymentMode}
                    onChange={(e) => setPaymentData({...paymentData, paymentMode: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option>Bank Transfer</option>
                    <option>Cash</option>
                    <option>UPI</option>
                    <option>Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Transaction ID (Optional)</label>
                  <input 
                    type="text" 
                    value={paymentData.transactionId}
                    onChange={(e) => setPaymentData({...paymentData, transactionId: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg border border-border hover:bg-muted font-medium">Cancel</button>
                  <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 font-medium flex items-center gap-2">
                    <MdAttachMoney /> Submit Payment
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Fees;
