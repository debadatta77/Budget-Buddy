import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Vault from '../models/Vault.js';
import Budget from '../models/Budget.js';
import EmiCard from '../models/EmiCard.js';
import Feedback from '../models/Feedback.js';
import Testimonial from '../models/Testimonial.js';
import { hashPassword, verifyPassword, generateToken } from '../services/authService.js';

export const DEFAULT_ADMIN_CREDENTIALS = {
  email: 'admin@budgetbuddy.app',
  password: 'AdminMaster2026!#',
  name: 'Executive Platform Admin'
};

/**
 * Ensures a dedicated Admin user exists in MongoDB Atlas
 */
export const initAdminSeed = async () => {
  try {
    const existing = await User.findOne({ email: DEFAULT_ADMIN_CREDENTIALS.email });
    if (!existing) {
      const hashedPassword = await hashPassword(DEFAULT_ADMIN_CREDENTIALS.password);
      await User.create({
        name: DEFAULT_ADMIN_CREDENTIALS.name,
        email: DEFAULT_ADMIN_CREDENTIALS.email,
        password: hashedPassword,
        role: 'admin',
        planTier: 'Enterprise Admin',
        currency: 'INR (₹)'
      });
      console.log('🛡️ Default Admin Account Initialized in MongoDB Atlas:', DEFAULT_ADMIN_CREDENTIALS.email);
    } else if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
    }
  } catch (err) {
    console.warn('⚠️ Admin seed check notice:', err.message);
  }
};

/**
 * Admin Login
 * POST /api/v1/admin/login
 */
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if matching default admin or database admin user
    let user = await User.findOne({ email: cleanEmail }).select('+password');

    // Auto-create default admin if logging in for the first time
    if (!user && cleanEmail === DEFAULT_ADMIN_CREDENTIALS.email) {
      const hashedPassword = await hashPassword(DEFAULT_ADMIN_CREDENTIALS.password);
      user = await User.create({
        name: DEFAULT_ADMIN_CREDENTIALS.name,
        email: DEFAULT_ADMIN_CREDENTIALS.email,
        password: hashedPassword,
        role: 'admin',
        planTier: 'Enterprise Admin',
        currency: 'INR (₹)'
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrative credentials'
      });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Account is not authorized as an administrator'
      });
    }

    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrative credentials'
      });
    }

    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: 'admin'
    });

    return res.status(200).json({
      success: true,
      message: 'Admin authorization granted',
      token,
      admin: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        planTier: user.planTier
      }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during admin authentication',
      error: err.message
    });
  }
};

/**
 * Platform Executive Overview
 * GET /api/v1/admin/overview
 */
export const getAdminOverview = async (req, res) => {
  try {
    const [
      totalUsers,
      totalTransactions,
      inflowAgg,
      outflowAgg,
      vaultAgg,
      emiAgg,
      recentTxs
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      Transaction.countDocuments(),
      Transaction.aggregate([
        { $match: { type: 'income' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { type: 'expense' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Vault.aggregate([
        { $group: { _id: null, total: { $sum: '$current' } } }
      ]),
      EmiCard.aggregate([
        { $group: { _id: null, total: { $sum: '$monthlyAmount' } } }
      ]),
      Transaction.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .populate('userId', 'name email')
    ]);

    const totalInflow = inflowAgg[0]?.total || 0;
    const totalOutflow = outflowAgg[0]?.total || 0;
    const totalVolume = totalInflow + totalOutflow;
    const netPlatformSurplus = totalInflow - totalOutflow;
    const totalVaultReserves = vaultAgg[0]?.total || 0;
    const totalEmiObligations = emiAgg[0]?.total || 0;

    // Last 6 months cashflow trend
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const monthlyAgg = await Transaction.aggregate([
      { $match: { date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      }
    ]);

    const monthMap = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleString('en-US', { month: 'short' });
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      monthMap[key] = { month: label, income: 0, expense: 0 };
    }

    monthlyAgg.forEach(item => {
      const key = `${item._id.year}-${item._id.month}`;
      if (monthMap[key]) {
        if (item._id.type === 'income') {
          monthMap[key].income += item.total;
        } else if (item._id.type === 'expense') {
          monthMap[key].expense += item.total;
        }
      }
    });

    const monthlyTrend = Object.values(monthMap);

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        totalUsers,
        totalTransactions,
        totalVolume,
        totalInflow,
        totalOutflow,
        netPlatformSurplus,
        totalVaultReserves,
        totalEmiObligations,
        monthlyTrend,
        recentActivity: recentTxs.map(t => ({
          id: t._id,
          userName: t.userId?.name || 'Customer',
          userEmail: t.userId?.email || '',
          title: t.title,
          category: t.category,
          amount: t.amount,
          type: t.type,
          date: t.date?.toISOString().split('T')[0] || t.createdAt?.toISOString().split('T')[0]
        }))
      }
    });
  } catch (err) {
    console.error('Admin overview error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to aggregate platform telemetry',
      error: err.message
    });
  }
};

/**
 * Platform Spending by Category Breakdown
 * GET /api/v1/admin/spending-breakdown
 */
export const getAdminSpendingBreakdown = async (req, res) => {
  try {
    const categoryAgg = await Transaction.aggregate([
      { $match: { type: 'expense' } },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    const grandTotalExpense = categoryAgg.reduce((sum, c) => sum + c.totalAmount, 0);

    const categories = categoryAgg.map(c => ({
      name: c._id || 'Uncategorized',
      totalAmount: c.totalAmount,
      transactionCount: c.transactionCount,
      percentage: grandTotalExpense > 0 ? Number(((c.totalAmount / grandTotalExpense) * 100).toFixed(1)) : 0
    }));

    return res.status(200).json({
      success: true,
      grandTotalExpense,
      categories
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to compile spending breakdown',
      error: err.message
    });
  }
};

/**
 * Users Ledger & Segment Intelligence
 * GET /api/v1/admin/users
 */
export const getAdminUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } })
      .select('-password')
      .sort({ createdAt: -1 });

    const userStats = await Promise.all(
      users.map(async (u) => {
        const [txs, vault, budget] = await Promise.all([
          Transaction.find({ userId: u._id }),
          Vault.findOne({ userId: u._id }),
          Budget.findOne({ userId: u._id })
        ]);

        const totalInflow = txs
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + (t.amount || 0), 0) || (budget?.monthlyIncome || 0);

        const totalOutflow = txs
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + (t.amount || 0), 0);

        const netBalance = totalInflow - totalOutflow;
        const vaultReserves = vault?.current || 0;
        const txCount = txs.length;

        // Customer segmentation logic
        let segment = 'Standard Member';
        let segmentBadge = 'bg-gray-100 text-gray-800 border-gray-200';

        if (totalOutflow >= 20000 || totalInflow >= 60000) {
          segment = 'VIP High-Roller';
          segmentBadge = 'bg-purple-50 text-purple-700 border-purple-200 font-bold';
        } else if (vaultReserves >= 30000) {
          segment = 'Super Saver';
          segmentBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold';
        } else if (txCount >= 5) {
          segment = 'Active Transactor';
          segmentBadge = 'bg-blue-50 text-[#088fff] border-blue-200 font-bold';
        } else if (txCount <= 2) {
          segment = 'New Member';
          segmentBadge = 'bg-amber-50 text-amber-700 border-amber-200';
        }

        return {
          id: u._id,
          name: u.name,
          email: u.email,
          region: u.region || 'Global',
          currency: u.currency || 'INR (₹)',
          planTier: u.planTier || 'Pro Member',
          joinedDate: u.createdAt?.toISOString().split('T')[0] || 'Recent',
          totalInflow,
          totalOutflow,
          netBalance,
          vaultReserves,
          txCount,
          segment,
          segmentBadge
        };
      })
    );

    return res.status(200).json({
      success: true,
      totalUsers: userStats.length,
      users: userStats
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve users telemetry',
      error: err.message
    });
  }
};

/**
 * Top Customers & Leaders
 * GET /api/v1/admin/top-customers
 */
export const getAdminTopCustomers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } }).select('name email currency');

    const customerMetrics = await Promise.all(
      users.map(async (u) => {
        const [txs, vault] = await Promise.all([
          Transaction.find({ userId: u._id }),
          Vault.findOne({ userId: u._id })
        ]);

        const totalExpense = txs
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + (t.amount || 0), 0);

        const totalIncome = txs
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + (t.amount || 0), 0);

        return {
          id: u._id,
          name: u.name,
          email: u.email,
          currency: u.currency,
          totalExpense,
          totalIncome,
          vaultSavings: vault?.current || 0,
          txCount: txs.length
        };
      })
    );

    const topSpenders = [...customerMetrics].sort((a, b) => b.totalExpense - a.totalExpense).slice(0, 5);
    const topEarners = [...customerMetrics].sort((a, b) => b.totalIncome - a.totalIncome).slice(0, 5);
    const topSavers = [...customerMetrics].sort((a, b) => b.vaultSavings - a.vaultSavings).slice(0, 5);

    return res.status(200).json({
      success: true,
      topSpenders,
      topEarners,
      topSavers
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to compute top customer metrics',
      error: err.message
    });
  }
};

/**
 * Real-time Platform Live Feed (Latest 25 transactions)
 * GET /api/v1/admin/live-feed
 */
export const getAdminLiveFeed = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(25)
      .populate('userId', 'name email currency');

    const feed = transactions.map(t => ({
      id: t._id,
      title: t.title,
      category: t.category,
      amount: t.amount,
      type: t.type,
      date: t.date?.toISOString().split('T')[0] || t.createdAt?.toISOString().split('T')[0],
      createdAt: t.createdAt,
      user: {
        id: t.userId?._id,
        name: t.userId?.name || 'Anonymous User',
        email: t.userId?.email || '',
        currency: t.userId?.currency || 'INR (₹)'
      }
    }));

    return res.status(200).json({
      success: true,
      count: feed.length,
      feed
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve live platform feed',
      error: err.message
    });
  }
};

/**
 * Platform Feedback Response Sheet & Customer Inquiries
 * GET /api/v1/admin/feedback-sheet
 */
export const getAdminFeedbackSheet = async (req, res) => {
  try {
    // Only return real feedback submitted by users in production
    const feedbackItems = await Feedback.find().sort({ createdAt: -1 });

    // Also fetch public user testimonials for combined feedback intelligence
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });

    const totalCount = feedbackItems.length;
    const newCount = feedbackItems.filter(f => f.status === 'New').length;
    const reviewedCount = feedbackItems.filter(f => f.status === 'Reviewed').length;
    const resolvedCount = feedbackItems.filter(f => f.status === 'Resolved').length;
    const complaintCount = feedbackItems.filter(f => f.type === 'complaint' || (f.subject && f.subject.toLowerCase().includes('complaint'))).length;

    const sheetRows = feedbackItems.map((item, index) => ({
      rowNumber: index + 1,
      id: item._id,
      timestamp: item.createdAt?.toISOString().replace('T', ' ').substring(0, 19) || 'Recent',
      name: item.name,
      email: item.email,
      phone: item.phone || 'N/A',
      subject: item.subject,
      message: item.message,
      rating: item.rating || 5,
      status: item.status || 'New',
      source: item.source || 'Web Form',
      ticketId: item.ticketId || (item.type === 'complaint' ? `CMP-${item._id.toString().slice(-5).toUpperCase()}` : `INQ-${item._id.toString().slice(-5).toUpperCase()}`),
      type: item.type || (item.subject?.toLowerCase().includes('complaint') ? 'complaint' : 'inquiry'),
      severity: item.severity || (item.type === 'complaint' ? 'High' : 'Medium'),
      complaintCategory: item.complaintCategory || '',
      isSample: !!item.isSample
    }));

    return res.status(200).json({
      success: true,
      stats: {
        totalCount,
        newCount,
        reviewedCount,
        resolvedCount,
        complaintCount,
        totalTestimonials: testimonials.length
      },
      sheetRows,
      testimonials: testimonials.map(t => ({
        id: t._id,
        author: t.author,
        role: t.role,
        company: t.company,
        quote: t.quote,
        rating: t.rating,
        date: t.createdAt?.toISOString().split('T')[0]
      }))
    });
  } catch (err) {
    console.error('Feedback sheet error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve feedback sheet responses',
      error: err.message
    });
  }
};

/**
 * Update Feedback Resolution Status
 * PATCH /api/v1/admin/feedback-sheet/:id
 */
export const updateAdminFeedbackStatus = async (req, res) => {
  try {
    const { id } = req.params;
    let { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    if (status === 'Under Review') status = 'Reviewed';
    if (status === 'Pending') status = 'New';
    if (status === 'Closed') status = 'Resolved';

    if (!['New', 'Reviewed', 'Resolved', 'Under Review', 'Pending', 'Closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be New, Reviewed, or Resolved.'
      });
    }

    const updated = await Feedback.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Feedback entry not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Feedback status updated to ${status}`,
      data: updated
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update feedback status',
      error: err.message
    });
  }
};

/**
 * Delete Feedback Entry
 * DELETE /api/v1/admin/feedback-sheet/:id
 */
export const deleteAdminFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Feedback.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Feedback entry not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Feedback entry removed'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete feedback entry',
      error: err.message
    });
  }
};

/**
 * Public Endpoint to Record Feedback / Contact Inquiry / Complaint
 * POST /api/v1/admin/feedback-public
 */
export const createFeedbackPublic = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      subject,
      message,
      rating,
      source,
      type,
      severity,
      complaintCategory
    } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required fields'
      });
    }

    const isComplaint =
      type === 'complaint' ||
      (subject && subject.toLowerCase().includes('complaint')) ||
      (complaintCategory && complaintCategory.trim().length > 0);

    const resolvedType = isComplaint ? 'complaint' : (type || 'inquiry');
    const ticketPrefix = isComplaint ? 'CMP' : 'INQ';
    const randomTicketNum = Math.floor(10000 + Math.random() * 90000);
    const generatedTicketId = req.body.ticketId || `${ticketPrefix}-${randomTicketNum}`;

    const item = await Feedback.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: (phone || '').trim(),
      subject: (subject || (isComplaint ? 'Customer Dispute / Grievance' : 'General Inquiry')).trim(),
      message: message.trim(),
      rating: rating ? Math.min(5, Math.max(1, Number(rating))) : 5,
      source: source || (isComplaint ? 'Direct Grievance Desk' : 'Contact Modal / Web'),
      ticketId: generatedTicketId,
      type: resolvedType,
      severity: severity || (isComplaint ? 'High' : 'Medium'),
      complaintCategory: (complaintCategory || '').trim(),
      isSample: false
    });

    return res.status(201).json({
      success: true,
      message: isComplaint
        ? `Complaint successfully filed under Reference #${generatedTicketId}`
        : 'Feedback successfully registered in platform response ledger',
      ticketId: generatedTicketId,
      data: item
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to record feedback entry',
      error: err.message
    });
  }
};

/**
 * Purge Sample / Test Feedback entries from Sheet
 * DELETE /api/v1/admin/feedback-sheet-purge-samples
 */
export const purgeSampleFeedback = async (req, res) => {
  try {
    const sampleEmails = [
      'debadattaparida96@gmail.com',
      'priya.sharma@fintechlab.io',
      'rahul.v@techcorp.in',
      'test@admin.io'
    ];

    const result = await Feedback.deleteMany({
      $or: [
        { isSample: true },
        { email: { $in: sampleEmails } },
        { name: 'Admin Tester' }
      ]
    });

    return res.status(200).json({
      success: true,
      message: `Successfully purged ${result.deletedCount} sample/test records from response sheet`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to purge test feedback entries',
      error: err.message
    });
  }
};
