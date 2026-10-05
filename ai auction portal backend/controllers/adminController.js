const User = require("../models/User");
const Vehicle = require("../models/Vehicle");
const Auction = require("../models/Auction");
const Report = require("../models/Report");

exports.getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalVehicles = await Vehicle.countDocuments();
    const totalAuctions = await Auction.countDocuments();
    const pendingVerifications = await Vehicle.countDocuments({ verificationStatus: "pending" });
    const fraudReports = await Report.countDocuments({ status: "pending" });

    const totalRevenueResult = await Auction.aggregate([
      { $match: { paymentStatus: { $in: ["completed", "escrow"] } } },
      { $group: { _id: null, total: { $sum: "$currentPrice" } } }
    ]);
    const totalRevenue = totalRevenueResult[0]?.total || 0;

    const avgConfidence = await Vehicle.aggregate([
      { $group: { _id: null, avgConf: { $avg: "$confidenceScore" } } }
    ]);
    const aiAccuracyPercent = Math.round((avgConfidence[0]?.avgConf || 94.0) * 10) / 10;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentAuctionsCount = await Auction.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    const prevPeriodAuctionsCount = await Auction.countDocuments({ createdAt: { $lt: thirtyDaysAgo } });
    const growthRate = prevPeriodAuctionsCount > 0 
      ? `${Math.round(((recentAuctionsCount - prevPeriodAuctionsCount) / prevPeriodAuctionsCount) * 100)}%` 
      : `${recentAuctionsCount > 0 ? `+${recentAuctionsCount * 100}%` : "0%"}`;

    res.json({
      totalUsers,
      totalVehicles,
      totalAuctions,
      totalRevenue,
      pendingVerifications,
      fraudReports,
      aiAccuracyPercent,
      monthlyAuctionsGrowth: growthRate
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch admin stats", details: err.message });
  }
};

exports.getReports = async (req, res) => {
  try {
    const reports = await Report.find().populate("reporterId targetVehicleId targetUserId").sort({ createdAt: -1 });
    res.json({ reports });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reports", details: err.message });
  }
};

exports.verifyVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { status } = req.body; // 'verified' or 'flagged'

    const vehicle = await Vehicle.findByIdAndUpdate(vehicleId, { verificationStatus: status }, { new: true });
    res.json({ success: true, vehicle });
  } catch (err) {
    res.status(500).json({ error: "Failed to verify vehicle", details: err.message });
  }
};
