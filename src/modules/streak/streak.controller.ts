// ==================== streak.controller.ts ====================
import { Request, Response } from "express";
import * as streakService from "./streak.service";
import mongoose from "mongoose";

/**
 * Get user's current streak information
 */
export const getUserStreakController = async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.userId);

    const streak = await streakService.getUserStreak(userId);

    res.status(200).json({
      success: true,
      data: streak,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to get user streak",
      error: error.message,
    });
  }
};

/**
 * Get weekly streak status
 */
export const getWeeklyStatusController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.userId);

    const weeklyStatus = await streakService.getWeeklyStreakStatus(userId);

    res.status(200).json({
      success: true,
      data: weeklyStatus,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to get weekly streak status",
      error: error.message,
    });
  }
};

/**
 * Manually trigger streak check for a user (with optional date)
 */
export const checkTodayStreakController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.userId);

    // Allow passing custom date for testing
    const date = req.body.date ? new Date(req.body.date) : new Date();

    await streakService.updateUserStreak(userId, date);

    const streak = await streakService.getUserStreak(userId);

    res.status(200).json({
      success: true,
      message: `Streak updated successfully for ${date.toDateString()}`,
      data: streak,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to update streak",
      error: error.message,
    });
  }
};

/**
 * Admin endpoint: Run nightly check for all users
 */
export const runNightlyCheckController = async (
  req: Request,
  res: Response
) => {
  try {
    await streakService.runNightlyStreakCheck();

    res.status(200).json({
      success: true,
      message: "Nightly streak check completed",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to run nightly check",
      error: error.message,
    });
  }
};

/**
 * TEST ONLY: Create sample meals and workouts for testing
 */
export const createTestDataController = async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.userId);
    const { days = 7, allCompleted = true } = req.body;

    const result = await streakService.createTestData(
      userId,
      days,
      allCompleted
    );

    res.status(200).json({
      success: true,
      message: "Test data created successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to create test data",
      error: error.message,
    });
  }
};

/**
 * TEST ONLY: Calculate streak for multiple past days
 */
export const calculatePastStreakController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.userId);
    const { days = 7 } = req.body;

    const result = await streakService.calculatePastStreak(userId, days);

    res.status(200).json({
      success: true,
      message: `Calculated streak for past ${days} days`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to calculate past streak",
      error: error.message,
    });
  }
};

/**
 * TEST ONLY: Reset user streak
 */
export const resetStreakController = async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.userId);

    await streakService.resetUserStreak(userId);

    res.status(200).json({
      success: true,
      message: "Streak reset successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to reset streak",
      error: error.message,
    });
  }
};
