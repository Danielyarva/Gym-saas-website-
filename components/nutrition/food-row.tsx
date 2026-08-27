'use client';

import { ArrowDown, ArrowUp, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { NutritionFoodDetail } from '@/types';

interface FoodRowProps {
  food: NutritionFoodDetail;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function FoodRow({ food, isFirst, isLast, onMoveUp, onMoveDown, onEdit, onDelete }: FoodRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {food.name} <span className="font-normal text-muted-foreground">· {food.quantity}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {food.calories} kcal · {food.proteinG}g P · {food.carbsG}g C · {food.fatG}g F · {food.fiberG}g fiber
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="icon" disabled={isFirst} onClick={onMoveUp} aria-label="Move food up">
          <ArrowUp />
        </Button>
        <Button variant="ghost" size="icon" disabled={isLast} onClick={onMoveDown} aria-label="Move food down">
          <ArrowDown />
        </Button>
        <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edit food">
          <Pencil />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Remove food">
          <Trash2 />
        </Button>
      </div>
    </div>
  );
}
