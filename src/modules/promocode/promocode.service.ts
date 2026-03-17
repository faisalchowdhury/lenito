import { FilterQuery } from "mongoose";
import { IPromocode } from "./promocode.interface";
import { PromocodeModel } from "./promocode.model";

// ─────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────
export const createPromocodeService = async (
  data: Pick<IPromocode, "name" | "discountedPrice">,
): Promise<IPromocode> => {
  const existing = await PromocodeModel.findOne({
    name: data.name.trim().toUpperCase(),
  });

  if (existing) {
    throw new Error("Promocode with this name already exists");
  }

  const promocode = await PromocodeModel.create({
    ...data,
    name: data.name.trim().toUpperCase(),
  });

  return promocode;
};

// ─────────────────────────────────────────────────────────────
// GET ALL (with optional search & pagination)
// ─────────────────────────────────────────────────────────────
export const getAllPromocodesService = async (query: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{
  data: IPromocode[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  const { search = "", page = 1, limit = 10 } = query;

  const filter: FilterQuery<IPromocode> = search
    ? { name: { $regex: search.trim(), $options: "i" } }
    : {};

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    PromocodeModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    PromocodeModel.countDocuments(filter),
  ]);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

// ─────────────────────────────────────────────────────────────
// GET BY ID
// ─────────────────────────────────────────────────────────────
export const getPromocodeByIdService = async (
  id: string,
): Promise<IPromocode> => {
  const promocode = await PromocodeModel.findById(id);

  if (!promocode) {
    throw new Error("Promocode not found");
  }

  return promocode;
};

// ─────────────────────────────────────────────────────────────
// VALIDATE (check if a code is usable — for end users)
// ─────────────────────────────────────────────────────────────
export const validatePromocodeService = async (
  name: string,
): Promise<{ valid: boolean; discountedPrice: string }> => {
  const promocode = await PromocodeModel.findOne({
    name: name.trim().toUpperCase(),
  });

  if (!promocode) {
    return { valid: false, discountedPrice: "0" };
  }

  return { valid: true, discountedPrice: promocode.discountedPrice };
};

// ─────────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────────
export const updatePromocodeService = async (
  id: string,
  data: Partial<Pick<IPromocode, "name" | "discountedPrice">>,
): Promise<IPromocode> => {
  if (data.name) {
    const duplicate = await PromocodeModel.findOne({
      name: data.name.trim().toUpperCase(),
      _id: { $ne: id },
    });

    if (duplicate) {
      throw new Error("Another promocode with this name already exists");
    }

    data.name = data.name.trim().toUpperCase();
  }

  const updated = await PromocodeModel.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true },
  );

  if (!updated) {
    throw new Error("Promocode not found");
  }

  return updated;
};

// ─────────────────────────────────────────────────────────────
// DELETE ONE
// ─────────────────────────────────────────────────────────────
export const deletePromocodeService = async (id: string): Promise<void> => {
  const deleted = await PromocodeModel.findByIdAndDelete(id);

  if (!deleted) {
    throw new Error("Promocode not found");
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE MANY
// ─────────────────────────────────────────────────────────────
export const deleteManyPromocodesService = async (
  ids: string[],
): Promise<number> => {
  const result = await PromocodeModel.deleteMany({ _id: { $in: ids } });
  return result.deletedCount ?? 0;
};
