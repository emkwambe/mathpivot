import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';
import { revalidatePath } from 'next/cache';

async function createSkillAction(formData: FormData) {
  'use server';

  const { getCurrentUser } = await import('@/lib/auth');
  const { createClient } = await import('@/lib/supabase/server');

  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return;

  const supabase = await createClient();

  await supabase
    .from('skills')
    .insert({
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || null,
      category: formData.get('category') as string,
      subcategory: (formData.get('subcategory') as string) || null,
      min_grade: parseInt(formData.get('minGrade') as string, 10),
      max_grade: parseInt(formData.get('maxGrade') as string, 10),
      standard_code: (formData.get('standardCode') as string) || null,
      is_active: true,
    });

  revalidatePath('/admin/skills');
}

async function toggleSkillAction(skillId: string, isActive: boolean) {
  'use server';

  const { getCurrentUser } = await import('@/lib/auth');
  const { createClient } = await import('@/lib/supabase/server');

  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return;

  const supabase = await createClient();

  await supabase
    .from('skills')
    .update({ is_active: isActive })
    .eq('id', skillId);

  revalidatePath('/admin/skills');
}

export default async function AdminSkillsPage() {
  await requireRole('admin');
  const supabase = await createClient();

  // Get all skills
  const { data: skills } = await supabase
    .from('skills')
    .select('*')
    .order('category')
    .order('subcategory')
    .order('name');

  // Group skills by category
  type Skill = NonNullable<typeof skills>[number];
  const skillsByCategory: Record<string, Skill[]> = {};
  for (const skill of skills || []) {
    const key = skill.category;
    if (!skillsByCategory[key]) {
      skillsByCategory[key] = [];
    }
    skillsByCategory[key].push(skill);
  }

  // Get unique categories for the dropdown
  const categories = [...new Set(skills?.map((s) => s.category) || [])].sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Skills Management</h1>
          <p className="text-slate-600">Create and manage skills for mastery tracking</p>
        </div>
        <div className="text-sm text-slate-500">
          {skills?.length || 0} skills total
        </div>
      </div>

      {/* Add Skill Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Skill</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createSkillAction} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Skill Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g., Quadratic Equations"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Category *
                </label>
                <input
                  type="text"
                  name="category"
                  required
                  list="categories"
                  placeholder="e.g., Algebra"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <datalist id="categories">
                  {categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Subcategory
                </label>
                <input
                  type="text"
                  name="subcategory"
                  placeholder="e.g., Equations"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Standard Code
                </label>
                <input
                  type="text"
                  name="standardCode"
                  placeholder="e.g., NC.M1.A-REI.4"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Min Grade *
                </label>
                <input
                  type="number"
                  name="minGrade"
                  required
                  min="1"
                  max="12"
                  defaultValue="9"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Max Grade *
                </label>
                <input
                  type="number"
                  name="maxGrade"
                  required
                  min="1"
                  max="12"
                  defaultValue="12"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  placeholder="Brief description of what this skill covers..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                />
              </div>
            </div>

            <Button type="submit">Add Skill</Button>
          </form>
        </CardContent>
      </Card>

      {/* Skills List */}
      {Object.keys(skillsByCategory).length > 0 ? (
        Object.entries(skillsByCategory).map(([category, categorySkills]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle>{category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categorySkills?.map((skill) => (
                  <div
                    key={skill.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      skill.is_active
                        ? 'bg-white border-slate-200'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">{skill.name}</p>
                        {skill.subcategory && (
                          <Badge variant="secondary">{skill.subcategory}</Badge>
                        )}
                        {skill.standard_code && (
                          <Badge variant="info">{skill.standard_code}</Badge>
                        )}
                        {!skill.is_active && (
                          <Badge variant="warning">Inactive</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                        <span>
                          Grades {skill.min_grade}-{skill.max_grade}
                        </span>
                        {skill.description && (
                          <span className="truncate max-w-md">
                            {skill.description}
                          </span>
                        )}
                      </div>
                    </div>
                    <form
                      action={toggleSkillAction.bind(null, skill.id, !skill.is_active)}
                    >
                      <button
                        type="submit"
                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                          skill.is_active
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {skill.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-slate-500 py-8">
              No skills have been created yet. Add your first skill above.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
