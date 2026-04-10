import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { formatDate } from '@/lib/utils';

export default async function StudentEquipmentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get equipment assigned to this student
  const { data: assignments } = await supabase
    .from('equipment_assignments')
    .select(`
      *,
      equipment:equipment_inventory(
        id,
        serial_number,
        condition,
        equipment_type:equipment_types(name, description, category)
      )
    `)
    .eq('student_user_id', user.id)
    .is('returned_at', null)
    .order('assigned_at', { ascending: false });

  // Get past equipment (returned)
  const { data: pastAssignments } = await supabase
    .from('equipment_assignments')
    .select(`
      *,
      equipment:equipment_inventory(
        id,
        serial_number,
        equipment_type:equipment_types(name, description, category)
      )
    `)
    .eq('student_user_id', user.id)
    .not('returned_at', 'is', null)
    .order('returned_at', { ascending: false })
    .limit(10);

  const activeCount = assignments?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Equipment</h1>
        <p className="text-slate-600">View equipment assigned to you for programs and classes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-slate-600">Currently Assigned</p>
                <p className="text-2xl font-bold text-slate-900">{activeCount} items</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-slate-600">Previously Returned</p>
                <p className="text-2xl font-bold text-slate-900">{pastAssignments?.length || 0} items</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Equipment */}
      <Card>
        <CardHeader>
          <CardTitle>Current Equipment</CardTitle>
        </CardHeader>
        <CardContent>
          {assignments && assignments.length > 0 ? (
            <div className="space-y-4">
              {assignments.map((assignment) => {
                const equipment = assignment.equipment as {
                  id: string;
                  serial_number: string;
                  condition: string;
                  equipment_type: { name: string; description: string; category: string };
                } | null;

                if (!equipment) return null;

                return (
                  <div
                    key={assignment.id}
                    className="p-4 border border-slate-200 rounded-xl"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900">{equipment.equipment_type?.name}</h4>
                          <p className="text-sm text-slate-500">Serial: {equipment.serial_number}</p>
                          {equipment.equipment_type?.description && (
                            <p className="text-sm text-slate-600 mt-1">{equipment.equipment_type.description}</p>
                          )}
                          <p className="text-xs text-slate-400 mt-2">
                            Assigned: {formatDate(assignment.assigned_at)}
                            {assignment.due_date && ` • Due: ${formatDate(assignment.due_date)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={equipment.condition === 'good' ? 'success' : 'warning'}>
                          {equipment.condition}
                        </Badge>
                        {equipment.equipment_type?.category && (
                          <Badge variant="secondary">{equipment.equipment_type.category}</Badge>
                        )}
                      </div>
                    </div>

                    {assignment.due_date && (
                      <div className="mt-3 p-2 bg-amber-50 rounded-lg">
                        <p className="text-sm text-amber-700">
                          <span className="font-medium">Return by:</span> {formatDate(assignment.due_date)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Equipment Assigned</h3>
              <p className="text-slate-500">Equipment will appear here when assigned for programs or classes.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Equipment */}
      {pastAssignments && pastAssignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Previously Returned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pastAssignments.map((assignment) => {
                const equipment = assignment.equipment as {
                  id: string;
                  serial_number: string;
                  equipment_type: { name: string; category: string };
                } | null;

                if (!equipment) return null;

                return (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-3 border border-slate-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center">
                        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-slate-700">{equipment.equipment_type?.name}</p>
                        <p className="text-xs text-slate-500">Returned: {formatDate(assignment.returned_at)}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Returned</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-slate-900 mb-1">Equipment Care Guidelines</h4>
              <ul className="text-sm text-slate-600 list-disc list-inside space-y-1">
                <li>Handle all equipment with care</li>
                <li>Return items by the due date</li>
                <li>Report any damage immediately</li>
                <li>Keep equipment in a safe, dry place</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
