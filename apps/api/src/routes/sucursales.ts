import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validateTenant } from '../middleware/validateTenant';
import { requireTenantBillingActive } from '../middleware/tenantBilling';
import { requireRole } from '../middleware/requireRole';
import { attachTenantCapabilities, requireTenantModule } from '../middleware/tenantCapabilities';
import { assignUserToSucursal, createSucursal, deleteSucursal, listSucursales, updateSucursal } from '../controllers/sucursales';

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(validateTenant);
router.use(requireTenantBillingActive);
router.use(attachTenantCapabilities);

router.get('/', requireTenantModule('sucursales'), requireRole('owner', 'manager', 'technician'), listSucursales);
router.post('/', requireTenantModule('sucursales'), requireRole('owner', 'manager'), createSucursal);
router.put('/:id', requireTenantModule('sucursales'), requireRole('owner', 'manager'), updateSucursal);
router.delete('/:id', requireTenantModule('sucursales'), requireRole('owner'), deleteSucursal);
router.put('/:id/users', requireTenantModule('sucursales'), requireRole('owner', 'manager'), assignUserToSucursal);

export default router;
