import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import { UserModel } from "../user/user.model";
import { SubscriptionModel } from "../subscription/subscription.model";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { PlanModel } from "../plan/plan.model";
import { HealthDetailsModel } from "../health_details/health_details.model";

export const getStats = catchAsync(async (req: Request, res: Response) => {
  const totalCustomers = await UserModel.countDocuments({ role: "user" });

  const activeSubscription = await SubscriptionModel.countDocuments();

  const monthlyRevenue = await SubscriptionModel.aggregate([
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        total: { $sum: "$pricePaid" },
      },
    },
    {
      $sort: {
        "_id.year": 1,
        "_id.month": 1,
      },
    },
  ]);

  // Calculate conversion rate
  const conversionRate =
    totalCustomers > 0
      ? ((activeSubscription / totalCustomers) * 100).toFixed(2)
      : "0.00";

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Dashboard stats retrieved successfully",
    data: {
      totalCustomers,
      activeSubscription,
      conversionRate: `${conversionRate}%`,
      monthlyRevenue: monthlyRevenue.map((item) => ({
        month: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
        total: item.total,
      })),
    },
  });
});

export const getSubscriptionStats = catchAsync(
  async (req: Request, res: Response) => {
    // Total active subscriptions
    const totalActiveSubscriptions = await SubscriptionModel.countDocuments({
      status: "active",
    });

    // Get all active plans
    const plans = await PlanModel.find({
      isActive: true,
    }).lean();

    // Get subscription counts grouped by plan
    const subscriptionCounts = await SubscriptionModel.aggregate([
      {
        $match: {
          status: "active",
        },
      },
      {
        $group: {
          _id: "$planId",
          totalSubscriptions: { $sum: 1 },
        },
      },
    ]);

    // Convert aggregation result to map
    const subscriptionMap = new Map();

    subscriptionCounts.forEach((item) => {
      subscriptionMap.set(item._id.toString(), item.totalSubscriptions);
    });

    // Merge all plans with subscription stats
    const subscriptionsByPlan = plans.map((plan) => {
      const totalSubscriptions = subscriptionMap.get(plan._id.toString()) || 0;

      const percentage =
        totalActiveSubscriptions > 0
          ? Number(
              ((totalSubscriptions / totalActiveSubscriptions) * 100).toFixed(
                2,
              ),
            )
          : 0;

      return {
        planId: plan._id,
        planName: plan.name,
        planSlug: plan.slug,
        totalSubscriptions,
        percentage,
      };
    });

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Subscription stats retrieved successfully",
      data: {
        totalActiveSubscriptions,
        subscriptionsByPlan,
      },
    });
  },
);

export const getBloodGroupStats = catchAsync(
  async (req: Request, res: Response) => {
    // Aggregate blood group counts
    const bloodGroupStats = await HealthDetailsModel.aggregate([
      {
        $group: {
          _id: "$bloodGroup",
          totalUsers: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          bloodGroup: "$_id",
          totalUsers: 1,
        },
      },
      {
        $sort: {
          totalUsers: -1,
        },
      },
    ]);

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Blood group stats retrieved successfully",
      data: bloodGroupStats,
    });
  },
);

export const getRecentSubscriptions = catchAsync(
  async (req: Request, res: Response) => {
    const recentSubscriptions = await SubscriptionModel.aggregate([
      {
        $match: {
          status: "active",
        },
      },

      // Latest subscriptions first
      {
        $sort: {
          createdAt: -1,
        },
      },

      // Only latest 5
      {
        $limit: 5,
      },

      // Join user data
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },

      {
        $unwind: "$user",
      },

      // Join plan data
      {
        $lookup: {
          from: "plans",
          localField: "planId",
          foreignField: "_id",
          as: "plan",
        },
      },

      {
        $unwind: "$plan",
      },

      // Final response shape
      {
        $project: {
          _id: 0,
          name: {
            $concat: ["$user.firstName", " ", "$user.lastName"],
          },
          email: "$user.email",
          planName: "$plan.name",
          billingCycle: 1,
          subscribedAt: "$createdAt",
        },
      },
    ]);

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Recent subscriptions retrieved successfully",
      data: recentSubscriptions,
    });
  },
);

export const getRechartStats = async (req: Request, res: Response) => {
  try {
    const currentDate = new Date();
    const monthsData = [];

    // Get last 12 months of data
    for (let i = 11; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setMonth(currentDate.getMonth() - i);

      const monthStart = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        1,
      );
      const monthEnd = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );

      // Get revenue from active subscriptions in this month
      const subscriptions = await SubscriptionModel.find({
        status: "active",
        createdAt: { $lte: monthEnd },
        $or: [
          { endDate: { $gte: monthStart } },
          { endDate: { $exists: false } },
        ],
      });

      const monthlyRevenue = subscriptions.reduce(
        (sum, sub) => sum + sub.pricePaid,
        0,
      );

      // Get new users registered this month
      const newUsers = await UserModel.countDocuments({
        createdAt: {
          $gte: monthStart,
          $lte: monthEnd,
        },
        isDeleted: false,
      });

      const monthName = targetDate.toLocaleString("default", {
        month: "short",
      });

      monthsData.push({
        month: monthName,
        revenue: monthlyRevenue,
        users: newUsers,
      });
    }

    res.status(200).json({
      success: true,
      data: monthsData,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch stats",
      error: error.message,
    });
  }
};

export const getAllSubscriptions = async (req: Request, res: Response) => {
  try {
    const subscriptions = await SubscriptionModel.aggregate([
      // Join user data
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },

      // Convert user array to object
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Join plan data
      {
        $lookup: {
          from: "plans",
          localField: "planId",
          foreignField: "_id",
          as: "plan",
        },
      },

      // Convert plan array to object
      {
        $unwind: {
          path: "$plan",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Final response
      {
        $project: {
          _id: 1,

          userName: {
            $concat: [
              { $ifNull: ["$user.firstName", ""] },
              " ",
              { $ifNull: ["$user.lastName", ""] },
            ],
          },

          email: "$user.email",

          phone: "$user.contactNumber",

          planName: "$plan.name",

          endDate: 1,

          pricePaid: {
            $concat: [{ $toString: "$pricePaid" }, " ", "$currency"],
          },

          status: 1,

          billingCycle: 1,

          startDate: 1,

          autoRenew: 1,

          paymentProvider: 1,

          createdAt: 1,
        },
      },

      // Latest subscriptions first
      {
        $sort: {
          createdAt: -1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "Subscription list fetched successfully",
      data: subscriptions,
    });
  } catch (error: any) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch subscription list",
      error: error.message,
    });
  }
};
