'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

const createSkillSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional(),
  minGrade: z.coerce.number().min(1).max(12),
  maxGrade: z.coerce.number().min(1).max(12),
  standardCode: z.string().optional(),
});

const updateSkillSchema = createSkillSchema.extend({
  skillId: z.string().uuid(),
  isActive: z.coerce.boolean(),
});

export type SkillActionResult = {
  success: boolean;
  error?: string;
  skillId?: string;
};

export async function createSkill(
  formData: FormData
): Promise<SkillActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return { success: false, error: 'Admin access required' };
  }

  const rawData = {
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    category: formData.get('category'),
    subcategory: formData.get('subcategory') || undefined,
    minGrade: formData.get('minGrade'),
    maxGrade: formData.get('maxGrade'),
    standardCode: formData.get('standardCode') || undefined,
  };

  const result = createSkillSchema.safeParse(rawData);
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  const { name, description, category, subcategory, minGrade, maxGrade, standardCode } = result.data;

  if (maxGrade < minGrade) {
    return { success: false, error: 'Max grade must be >= min grade' };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('skills')
    .insert({
      name,
      description: description || null,
      category,
      subcategory: subcategory || null,
      min_grade: minGrade,
      max_grade: maxGrade,
      standard_code: standardCode || null,
      is_active: true,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Skill error:', error);
    return { success: false, error: 'Failed to create skill' };
  }

  revalidatePath('/admin/skills');

  return { success: true, skillId: data.id };
}

export async function updateSkill(
  formData: FormData
): Promise<SkillActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return { success: false, error: 'Admin access required' };
  }

  const rawData = {
    skillId: formData.get('skillId'),
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    category: formData.get('category'),
    subcategory: formData.get('subcategory') || undefined,
    minGrade: formData.get('minGrade'),
    maxGrade: formData.get('maxGrade'),
    standardCode: formData.get('standardCode') || undefined,
    isActive: formData.get('isActive') === 'true',
  };

  const result = updateSkillSchema.safeParse(rawData);
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  const { skillId, name, description, category, subcategory, minGrade, maxGrade, standardCode, isActive } = result.data;

  if (maxGrade < minGrade) {
    return { success: false, error: 'Max grade must be >= min grade' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('skills')
    .update({
      name,
      description: description || null,
      category,
      subcategory: subcategory || null,
      min_grade: minGrade,
      max_grade: maxGrade,
      standard_code: standardCode || null,
      is_active: isActive,
    })
    .eq('id', skillId);

  if (error) {
    return { success: false, error: 'Failed to update skill' };
  }

  revalidatePath('/admin/skills');

  return { success: true, skillId };
}

export async function deleteSkill(
  skillId: string
): Promise<SkillActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return { success: false, error: 'Admin access required' };
  }

  const supabase = await createClient();

  // Soft delete by setting is_active to false
  const { error } = await supabase
    .from('skills')
    .update({ is_active: false })
    .eq('id', skillId);

  if (error) {
    return { success: false, error: 'Failed to delete skill' };
  }

  revalidatePath('/admin/skills');

  return { success: true };
}

export async function toggleSkillActive(
  skillId: string,
  isActive: boolean
): Promise<SkillActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return { success: false, error: 'Admin access required' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('skills')
    .update({ is_active: isActive })
    .eq('id', skillId);

  if (error) {
    return { success: false, error: 'Failed to update skill' };
  }

  revalidatePath('/admin/skills');

  return { success: true };
}
