import { Request, Response } from "express";
import {
  createPromocodeService,
  deleteManyPromocodesService,
  deletePromocodeService,
  getAllPromocodesService,
  getPromocodeByIdService,
  updatePromocodeService,
  validatePromocodeService,
} from "./promocode.service";
import { PromocodeModel, UserPromocodeModel } from "./promocode.model";
import ApiError from "../../errors/ApiError";
import { JwtPayloadWithUser } from "../../middlewares/userVerification";
import sendResponse from "../../utils/sendResponse";

// ─────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────
export const createPromocode = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, discountedPrice } = req.body;

    if (!name || !discountedPrice) {
      res.status(400).json({
        success: false,
        message: "name and discountedPrice are required",
      });
      return;
    }

    const promocode = await createPromocodeService({
      name,
      discountedPrice,
    });

    res.status(201).json({
      success: true,
      message: "Promocode created successfully",
      data: promocode,
    });
  } catch (error: any) {
    const isConflict = error.message?.includes("already exists");
    res.status(isConflict ? 409 : 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// ─────────────────────────────────────────────────────────────
// GET ALL
// ─────────────────────────────────────────────────────────────
export const getAllPromocodes = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { search, page, limit } = req.query;

    const result = await getAllPromocodesService({
      search: search as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// ─────────────────────────────────────────────────────────────
// GET BY ID
// ─────────────────────────────────────────────────────────────
export const getPromocodeById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const promocode = await getPromocodeByIdService(id);

    res.status(200).json({
      success: true,
      data: promocode,
    });
  } catch (error: any) {
    const isNotFound = error.message?.includes("not found");
    res.status(isNotFound ? 404 : 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// ─────────────────────────────────────────────────────────────
// VALIDATE (public — used when applying a code at checkout)
// ─────────────────────────────────────────────────────────────
export const validatePromocode = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name } = req.body;

    if (!name) {
      res.status(400).json({
        success: false,
        message: "Promocode name is required",
      });
      return;
    }

    const result = await validatePromocodeService(name);

    if (!result.valid) {
      res.status(404).json({
        success: false,
        message: "Invalid or expired promocode",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Promocode is valid",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// ─────────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────────
export const updatePromocode = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, discountedPrice } = req.body;

    if (!name && !discountedPrice) {
      res.status(400).json({
        success: false,
        message:
          "Provide at least one field to update (name or discountedPrice)",
      });
      return;
    }

    const updated = await updatePromocodeService(id, {
      ...(name && { name }),
      ...(discountedPrice && { discountedPrice }),
    });

    res.status(200).json({
      success: true,
      message: "Promocode updated successfully",
      data: updated,
    });
  } catch (error: any) {
    const isNotFound = error.message?.includes("not found");
    const isConflict = error.message?.includes("already exists");
    res.status(isNotFound ? 404 : isConflict ? 409 : 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE ONE
// ─────────────────────────────────────────────────────────────
export const deletePromocode = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    await deletePromocodeService(id);

    res.status(200).json({
      success: true,
      message: "Promocode deleted successfully",
    });
  } catch (error: any) {
    const isNotFound = error.message?.includes("not found");
    res.status(isNotFound ? 404 : 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE MANY
// ─────────────────────────────────────────────────────────────
export const deleteManyPromocodes = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({
        success: false,
        message: "ids must be a non-empty array",
      });
      return;
    }

    const deletedCount = await deleteManyPromocodesService(ids);

    res.status(200).json({
      success: true,
      message: `${deletedCount} promocode(s) deleted successfully`,
      deletedCount,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const addPromocode = async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayloadWithUser;
    const userId = user.id;
    const { planId } = req.params;
    const { promocode } = req.body;

    const isValid = await PromocodeModel.findOne({ name: promocode });

    if (!isValid) {
      return sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Promocode is not valid",
        data: null,
      });
    }

    const isExist = await UserPromocodeModel.findOne({
      promocodeId: isValid._id,
      planId,
      userId,
    });

    if (isExist) {
      return sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Promocode is already added for this plan",
        data: null,
      });
    }

    const addToUserPromocode = await UserPromocodeModel.create({
      promocodeId: isValid._id,
      planId,
      userId,
    });

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Promocode added to this plan",
      data: addToUserPromocode,
    });
  } catch (err) {
    console.log(err);
  }
};
