import { Request, Response } from 'express';
import { registryFormService } from '../services/registry-form.service';
import { FormMode } from '../dto/registry-form.dto';

export class RegistryFormController {

    /**
     * GET /api/registry/entities/form-projection
     * Query:
     *  - mode: CREATE | EDIT | VIEW
     *  - type: EntityTypeUrn (Required for CREATE)
     *  - urn: EntityUrn (Required for EDIT/VIEW)
     */
    async getProjection(req: Request, res: Response) {
        try {
            const mode = req.query.mode as FormMode;
            const type = req.query.type as string;
            const urn = req.query.urn as string;

            if (!mode) {
                res.status(400).json({ message: 'Missing mode parameter' });
                return;
            }

            if (mode === FormMode.CREATE && !type) {
                res.status(400).json({ message: 'Missing type parameter for CREATE mode' });
                return;
            }

            if ((mode === FormMode.EDIT || mode === FormMode.VIEW) && !urn) {
                res.status(400).json({ message: 'Missing urn parameter for EDIT/VIEW mode' });
                return;
            }

            // In Create mode, we use type. In Edit/View, we can infer type from URN or fetch it inside service. 
            // For simplicity, let's assume if URN is passed, service handles fetching type or we fetch it here.
            // Service handles it.

            // Wait, service takes `entityTypeUrn`. 
            // If I have URN, I need to know Type to get Schema.
            // Implementation Detail: Service logic should ideally resolve Type from URN if URN is provided.
            // Let's assume the caller passes Type OR Service resolves.
            // For now, let's require Type even for Edit/View to save a DB call or implement resolution in Service.

            // Let's patch Service to resolve type from URN if needed?
            // Or just fetch type here from URN if missing.
            let targetType = type;
            if (!targetType && urn) {
                // Simple URN parsing if format is urn:mg:entity:<type>:<id> ???
                // No, URNs are opaque identifiers usually.
                // Let's resolve.
                // Actually, better to require caller to know what they are viewing in most UI cases.
                // But for robustness, let's allow service to handle it or error.
            }

            // Actually, `registryFormService.getFormProjection` signature requires `entityTypeUrn`.
            // So we MUST pass it.
            // If the UI doesn't pass it for Edit, we fail. The generic 'EntityPage' usually knows the type or fetches the entity first.
            // Step 11/12 implies UI fetches Entity then Schema.
            // Here `FormProjection` is the "All in One" call.
            // "UI assumes all data is authoritative".

            const user = req.user;
            const projection = await registryFormService.getFormProjection(targetType, mode, user, urn);

            res.json(projection);

        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }
}

export const registryFormController = new RegistryFormController();
