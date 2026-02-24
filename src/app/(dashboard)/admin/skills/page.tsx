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
      code: formData.get('code') as string,
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || null,
      category: formData.get('category') as string,
      course_track: formData.get('courseTrack') as string,
      order_index: parseInt(formData.get('orderIndex') as string, 10) || 0,
    });

  revalidatePath('/admin/skills');
}

async function deleteSkillAction(formData: FormData) {
  'use server';

  const { getCurrentUser } = await import('@/lib/auth');
  const { createClient } = await import('@/lib/supabase/server');

  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return;

  const skillId = formData.get('skillId') as string;
  const supabase = await createClient();

  await supabase
    .from('skills')
    .delete()
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
    .order('course_track')
    .order('category')
    .order('order_index');

  // Group skills by course track then category
  type Skill = NonNullable<typeof skills>[number];
  const skillsByTrack: Record<string, Record<string, Skill[]>> = {};
  for (const skill of skills || []) {
    const track = skill.course_track;
    if (!skillsByTrack[track]) {
      skillsByTrack[track] = {};
    }
    const cat = skill.category || 'Uncategorized';
    if (!skillsByTrack[track][cat]) {
      skillsByTrack[track][cat] = [];
    }
    skillsByTrack[track][cat].push(skill);
  }

  // Get unique categories and tracks for the dropdowns
  const categories = [...new Set(skills?.map((s) => s.category).filter(Boolean) || [])].sort();
  const courseTracks = ['math_1', 'math_2', 'math_3', 'pre_calc', 'ap_calc_ab', 'ap_calc_bc', 'ap_stats',
    'actuarial', 'data_science', 'robotics', 'competition_math', 'epidemiology', 'financial_math'];

  const trackLabels: Record<string, string> = {
    math_1: 'Math 1', math_2: 'Math 2', math_3: 'Math 3',
    pre_calc: 'Pre-Calculus', ap_calc_ab: 'AP Calc AB', ap_calc_bc: 'AP Calc BC',
    ap_stats: 'AP Statistics', actuarial: 'Actuarial', data_science: 'Data Science',
    robotics: 'Robotics', competition_math: 'Competition Math',
    epidemiology: 'Epidemiology', financial_math: 'Financial Math',
  };

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
                  Skill Code *
                </label>
                <input
                  type="text"
                  name="code"
                  required
                  placeholder="e.g., M1-EQ-05"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Skill Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g., Quadratic Formula"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Course Track *
                </label>
                <select
                  name="courseTrack"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {courseTracks.map((track) => (
                    <option key={track} value={track}>
                      {trackLabels[track] || track}
                    </option>
                  ))}
                </select>
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
                  placeholder="e.g., Equations"
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
                  Order Index
                </label>
                <input
                  type="number"
                  name="orderIndex"
                  min="0"
                  defaultValue="0"
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

      {/* Skills List - grouped by course track */}
      {Object.keys(skillsByTrack).length > 0 ? (
        Object.entries(skillsByTrack).map(([track, categories]) => (
          <div key={track} className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">
              {trackLabels[track] || track}
            </h2>
            {Object.entries(categories).map(([category, categorySkills]) => (
              <Card key={`${track}-${category}`}>
                <CardHeader>
                  <CardTitle className="text-base">{category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categorySkills?.map((skill) => (
                      <div
                        key={skill.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-white border-slate-200"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900">{skill.name}</p>
                            <Badge variant="secondary">{skill.code}</Badge>
                          </div>
                          {skill.description && (
                            <p className="text-sm text-slate-500 mt-1 truncate max-w-lg">
                              {skill.description}
                            </p>
                          )}
                        </div>
                        <form action={deleteSkillAction}>
                          <input type="hidden" name="skillId" value={skill.id} />
                          <button
                            type="submit"
                            className="px-3 py-1 text-sm rounded-lg transition-colors text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
