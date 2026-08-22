import { Request, Response, NextFunction } from "express";
import { ProductsService, addProductSchema } from "./products.service";

export class ProductsController {
  static async preview(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = addProductSchema.parse(req.body);
      const result = await ProductsService.previewProduct(validatedData);
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async addProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = addProductSchema.parse(req.body);
      const result = await ProductsService.addProduct(validatedData);
      
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProducts(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ProductsService.getProducts();
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProductById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ProductsService.getProductById(req.params.id as string);
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ProductsService.deleteProduct(req.params.id as string);
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
