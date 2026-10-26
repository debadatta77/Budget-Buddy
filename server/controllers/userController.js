import User from '../models/User.js';

/**
 * Fetch authenticated user profile
 * GET /api/v1/user/profile
 */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        planTier: user.planTier,
        region: user.region,
        accountUid: user.accountUid,
        linkedAccounts: user.linkedAccounts
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Update user profile
 * PUT /api/v1/user/profile
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, email, currency, region } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name.trim();
    if (email && email.trim()) {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== user.email) {
        const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
        if (existing) {
          return res.status(400).json({ success: false, message: 'Email is already in use by another account' });
        }
        user.email = normalizedEmail;
      }
    }
    if (currency) user.currency = currency;
    if (region) user.region = region;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        planTier: user.planTier,
        region: user.region,
        accountUid: user.accountUid,
        linkedAccounts: user.linkedAccounts
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Link new bank account
 * POST /api/v1/user/bank-accounts
 */
export const linkBankAccount = async (req, res) => {
  try {
    const { bankName, accountType, numberMasked } = req.body;
    if (!bankName || !accountType || !numberMasked) {
      return res.status(400).json({
        success: false,
        message: 'bankName, accountType, and numberMasked are required'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.linkedAccounts.push({
      bankName: bankName.trim(),
      accountType: accountType.trim(),
      numberMasked: numberMasked.trim(),
      status: 'VERIFIED'
    });

    await user.save();

    return res.status(201).json({
      success: true,
      message: 'Bank account linked successfully',
      data: user.linkedAccounts
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
