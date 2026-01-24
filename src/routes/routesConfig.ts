import { UserRoutes } from "../modules/user/user.route";
import { TermsRoutes } from "../modules/settings/Terms/Terms.route";
import { AboutRoutes } from "../modules/settings/About/About.route";
import { PrivacyRoutes } from "../modules/settings/privacy/Privacy.route";
import { NotificationRoutes } from "../modules/notifications/notification.route";
import { ReportRoutes } from "../modules/report/report.route";

import {
  AppInstruction,
  htmlRoute,
} from "../modules/settings/privacy/Privacy.controller";
import { AdminRoutes } from "../modules/admin/admin.route";
import { HealthDetailsRoutes } from "../modules/health_details/health_details.routes";
import { MealRoutes } from "../modules/meal/meal.routes";
import { WorkoutRoutes } from "../modules/workout_details/workout_details.routes";
import { PlanRoutes } from "../modules/plan/plan.routes";
import { WorkoutPlanRoutes } from "../modules/workout_plan/workout_plan.routes";
import { SubscriptionRoutes } from "../modules/subscription/subscription.routes";
import { StreakRoutes } from "../modules/streak/streak.routes";
import { ProgressRoutes } from "../modules/progress/progress.routes";
import { FaqRoutes } from "../modules/faq/FAQ.router";
import { AiMealRoutes } from "../modules/ai_response_process/meal/meal.routes";

// import { PaymentRoute } from "../modules/unused_payments/payment.route";

export const routesConfig = [
  { path: "auth", handler: UserRoutes },
  { path: "health", handler: HealthDetailsRoutes },
  { path: "meal", handler: MealRoutes },
  { path: "workout", handler: WorkoutRoutes },
  { path: "plan", handler: PlanRoutes },
  { path: "workout-plan", handler: WorkoutPlanRoutes },
  { path: "subscription", handler: SubscriptionRoutes },
  { path: "streak", handler: StreakRoutes },
  { path: "progress", handler: ProgressRoutes },
  { path: "faq", handler: FaqRoutes },
  { path: "ai-meal", handler: AiMealRoutes },

  { path: "terms", handler: TermsRoutes },
  { path: "about", handler: AboutRoutes },
  { path: "privacy", handler: PrivacyRoutes },
  { path: "notification", handler: NotificationRoutes },

  // { path: "/api/v1/payment", handler: PaymentRoute },

  { path: "report", handler: ReportRoutes },
  { path: "admin", handler: AdminRoutes },

  //------>publishing app <--------------
  { path: "/privacy-policy-page", handler: htmlRoute },
  { path: "/app-instruction", handler: AppInstruction },
];
