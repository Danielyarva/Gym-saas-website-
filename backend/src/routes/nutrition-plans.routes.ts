import { Router } from 'express';
import * as nutritionPlansController from '../controllers/nutrition-plans.controller';
import { requireRole } from '../middleware/require-role';
import { requireClientOwnership } from '../middleware/require-client-ownership';
import { csrfProtection } from '../middleware/csrf';
import { validate } from '../middleware/validate';
import { uuidParamSchema, reorderIdsSchema } from '../schemas/common.schema';
import {
  nutritionPlanIdParamSchema,
  mealIdParamSchema,
  foodIdParamSchema,
  createNutritionPlanSchema,
  updateNutritionPlanSchema,
  createMealSchema,
  updateMealSchema,
  createFoodSchema,
  updateFoodSchema,
} from '../schemas/nutrition-plan.schema';

// mergeParams: true — mounted at '/:id/nutrition-plans' inside clients.routes.ts.
// Coach-only, same shape as workout-plans.routes.ts: requireClientOwnership
// runs on every route right after params validation.
const router = Router({ mergeParams: true });

router.use(requireRole('COACH'));

router.get('/', validate(uuidParamSchema, 'params'), requireClientOwnership, nutritionPlansController.list);
router.post(
  '/',
  csrfProtection,
  validate(uuidParamSchema, 'params'),
  requireClientOwnership,
  validate(createNutritionPlanSchema),
  nutritionPlansController.create,
);

router.get('/:planId', validate(nutritionPlanIdParamSchema, 'params'), requireClientOwnership, nutritionPlansController.getById);
router.patch(
  '/:planId',
  csrfProtection,
  validate(nutritionPlanIdParamSchema, 'params'),
  requireClientOwnership,
  validate(updateNutritionPlanSchema),
  nutritionPlansController.update,
);
router.delete('/:planId', csrfProtection, validate(nutritionPlanIdParamSchema, 'params'), requireClientOwnership, nutritionPlansController.remove);
router.post(
  '/:planId/duplicate',
  csrfProtection,
  validate(nutritionPlanIdParamSchema, 'params'),
  requireClientOwnership,
  nutritionPlansController.duplicate,
);

router.post(
  '/:planId/meals',
  csrfProtection,
  validate(nutritionPlanIdParamSchema, 'params'),
  requireClientOwnership,
  validate(createMealSchema),
  nutritionPlansController.createMeal,
);
router.patch(
  '/:planId/meals/reorder',
  csrfProtection,
  validate(nutritionPlanIdParamSchema, 'params'),
  requireClientOwnership,
  validate(reorderIdsSchema),
  nutritionPlansController.reorderMeals,
);
router.patch(
  '/:planId/meals/:mealId',
  csrfProtection,
  validate(mealIdParamSchema, 'params'),
  requireClientOwnership,
  validate(updateMealSchema),
  nutritionPlansController.updateMeal,
);
router.delete(
  '/:planId/meals/:mealId',
  csrfProtection,
  validate(mealIdParamSchema, 'params'),
  requireClientOwnership,
  nutritionPlansController.deleteMeal,
);

router.post(
  '/:planId/meals/:mealId/foods',
  csrfProtection,
  validate(mealIdParamSchema, 'params'),
  requireClientOwnership,
  validate(createFoodSchema),
  nutritionPlansController.createFood,
);
router.patch(
  '/:planId/meals/:mealId/foods/reorder',
  csrfProtection,
  validate(mealIdParamSchema, 'params'),
  requireClientOwnership,
  validate(reorderIdsSchema),
  nutritionPlansController.reorderFoods,
);
router.patch(
  '/:planId/meals/:mealId/foods/:foodId',
  csrfProtection,
  validate(foodIdParamSchema, 'params'),
  requireClientOwnership,
  validate(updateFoodSchema),
  nutritionPlansController.updateFood,
);
router.delete(
  '/:planId/meals/:mealId/foods/:foodId',
  csrfProtection,
  validate(foodIdParamSchema, 'params'),
  requireClientOwnership,
  nutritionPlansController.deleteFood,
);

export default router;
