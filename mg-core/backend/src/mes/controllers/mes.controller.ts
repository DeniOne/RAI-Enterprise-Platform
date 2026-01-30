import { Request, Response } from 'express';
import { productionOrderService } from '../services/production-order.service';
import { qualityService } from '../services/quality.service';
import { defectService } from '../services/defect.service';
import { CreateProductionOrderDto, CreateQualityCheckDto, CreateDefectDto } from '../dto/mes.dto';
import { mesService } from '../services/mes.service';

export class MesController {

    async createProductionOrder(req: Request, res: Response) {
        try {
            const user = req.user as any;
            const dto = req.body as CreateProductionOrderDto;
            const order = await productionOrderService.create(dto, user.id);
            res.status(201).json(order);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    async getProductionOrders(req: Request, res: Response) {
        try {
            const orders = await productionOrderService.getAll();
            res.json(orders);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    async getProductionOrder(req: Request, res: Response) {
        try {
            const order = await productionOrderService.getOne(req.params.id);
            if (!order) return res.status(404).json({ message: 'Order not found' });
            res.json(order);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    async createQualityCheck(req: Request, res: Response) {
        try {
            const user = req.user as any;
            const dto = req.body as CreateQualityCheckDto;
            const check = await qualityService.registerCheck(dto, user.id);
            res.status(201).json(check);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    async createDefect(req: Request, res: Response) {
        try {
            const user = req.user as any;
            const dto = req.body as CreateDefectDto;
            const defect = await defectService.registerDefect(dto, user.id);
            res.status(201).json(defect);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    // ==========================================
    // MOTIVATIONAL ORGANISM ENDPOINTS (Sprint 5-8)
    // ==========================================

    /**
     * GET /api/mes/my-shift
     * Get current employee's shift progress
     */
    async getMyShift(req: Request, res: Response) {
        try {
            const user = req.user as any;
            const shiftProgress = await mesService.getMyShiftProgress(user.id);
            res.json(shiftProgress);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * GET /api/mes/earnings-forecast
     * Calculate earnings forecast based on current shift metrics
     */
    async getMyEarningsForecast(req: Request, res: Response) {
        try {
            const user = req.user as any;
            const forecast = await mesService.getEarningsForecast(user.id);
            res.json(forecast);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }
}

export const mesController = new MesController();
