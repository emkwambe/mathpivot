import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { formatDate, formatCurrency } from '@/lib/utils';

type EquipmentStatus = 'available' | 'assigned' | 'maintenance' | 'retired';
type EquipmentCondition = 'new' | 'good' | 'fair' | 'poor';

const STATUS_COLORS: Record<EquipmentStatus, 'success' | 'info' | 'warning' | 'danger'> = {
  available: 'success',
  assigned: 'info',
  maintenance: 'warning',
  retired: 'danger',
};

const CONDITION_COLORS: Record<EquipmentCondition, 'success' | 'info' | 'warning' | 'danger'> = {
  new: 'success',
  good: 'success',
  fair: 'warning',
  poor: 'danger',
};

export default async function AdminEquipmentPage() {
  await requireRole('admin');
  const supabase = await createClient();

  // Get equipment types
  const { data: equipmentTypes } = await supabase
    .from('equipment_types')
    .select('*')
    .order('name');

  // Get inventory with type info
  const { data: inventory } = await supabase
    .from('equipment_inventory')
    .select(`
      *,
      equipment_type:equipment_types(id, name, category, is_kit)
    `)
    .order('created_at', { ascending: false });

  // Get active assignments
  const { data: assignments } = await supabase
    .from('equipment_assignments')
    .select(`
      *,
      equipment:equipment_inventory(
        id,
        serial_number,
        equipment_type:equipment_types(name)
      ),
      student:users_profile!equipment_assignments_student_user_id_fkey(id, full_name)
    `)
    .is('returned_at', null)
    .order('assigned_at', { ascending: false });

  // Calculate stats
  const totalItems = inventory?.length || 0;
  const availableItems = inventory?.filter(i => i.status === 'available').length || 0;
  const assignedItems = inventory?.filter(i => i.status === 'assigned').length || 0;
  const maintenanceItems = inventory?.filter(i => i.status === 'maintenance').length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Equipment Management</h1>
          <p className="text-slate-600">Manage equipment inventory and assignments</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-slate-600">Total Items</p>
              <p className="text-3xl font-bold text-slate-900">{totalItems}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-slate-600">Available</p>
              <p className="text-3xl font-bold text-emerald-600">{availableItems}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-slate-600">Assigned</p>
              <p className="text-3xl font-bold text-blue-600">{assignedItems}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-slate-600">Maintenance</p>
              <p className="text-3xl font-bold text-amber-600">{maintenanceItems}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Equipment Types */}
      <Card>
        <CardHeader>
          <CardTitle>Equipment Types ({equipmentTypes?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {equipmentTypes && equipmentTypes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {equipmentTypes.map((type) => {
                const typeInventory = inventory?.filter(i => i.equipment_type_id === type.id) || [];
                const availableCount = typeInventory.filter(i => i.status === 'available').length;

                return (
                  <div
                    key={type.id}
                    className="p-4 border border-slate-200 rounded-xl"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-900 truncate">{type.name}</h4>
                          {type.is_kit && (
                            <Badge variant="info">Kit</Badge>
                          )}
                        </div>
                        {type.category && (
                          <p className="text-sm text-slate-500 capitalize">{type.category}</p>
                        )}
                        {type.manufacturer && (
                          <p className="text-xs text-slate-400">{type.manufacturer} {type.model_number}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-900">{typeInventory.length}</p>
                        <p className="text-xs text-emerald-600">{availableCount} available</p>
                      </div>
                    </div>
                    {type.purchase_price_cents && (
                      <p className="text-sm text-slate-600 mt-2">
                        Value: {formatCurrency(type.purchase_price_cents)}
                        {type.deposit_cents && ` • Deposit: ${formatCurrency(type.deposit_cents)}`}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-slate-500 py-8">No equipment types defined yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Active Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Active Assignments ({assignments?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {assignments && assignments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-slate-500 border-b border-slate-200">
                    <th className="pb-3 font-medium">Equipment</th>
                    <th className="pb-3 font-medium">Student</th>
                    <th className="pb-3 font-medium">Assigned</th>
                    <th className="pb-3 font-medium">Due Date</th>
                    <th className="pb-3 font-medium">Deposit</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {assignments.map((assignment) => {
                    const equipment = assignment.equipment as {
                      serial_number: string;
                      equipment_type: { name: string };
                    } | null;
                    const student = assignment.student as { full_name: string } | null;
                    const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date();

                    return (
                      <tr key={assignment.id} className="border-b border-slate-100">
                        <td className="py-3">
                          <p className="font-medium text-slate-900">{equipment?.equipment_type?.name}</p>
                          <p className="text-xs text-slate-500">{equipment?.serial_number}</p>
                        </td>
                        <td className="py-3 text-slate-700">{student?.full_name}</td>
                        <td className="py-3 text-slate-600">{formatDate(assignment.assigned_at)}</td>
                        <td className="py-3">
                          {assignment.due_date ? (
                            <span className={isOverdue ? 'text-red-600 font-medium' : 'text-slate-600'}>
                              {formatDate(assignment.due_date)}
                              {isOverdue && ' (Overdue)'}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3">
                          <Badge variant={assignment.deposit_collected ? 'success' : 'warning'}>
                            {assignment.deposit_collected ? 'Collected' : 'Pending'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-slate-500 py-8">No active equipment assignments.</p>
          )}
        </CardContent>
      </Card>

      {/* Inventory List */}
      <Card>
        <CardHeader>
          <CardTitle>Full Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          {inventory && inventory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-slate-500 border-b border-slate-200">
                    <th className="pb-3 font-medium">Item</th>
                    <th className="pb-3 font-medium">Serial/Asset</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Condition</th>
                    <th className="pb-3 font-medium">Location</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {inventory.map((item) => {
                    const equipType = item.equipment_type as { name: string; category: string } | null;

                    return (
                      <tr key={item.id} className="border-b border-slate-100">
                        <td className="py-3">
                          <p className="font-medium text-slate-900">{equipType?.name}</p>
                          {equipType?.category && (
                            <p className="text-xs text-slate-500 capitalize">{equipType.category}</p>
                          )}
                        </td>
                        <td className="py-3">
                          <p className="text-slate-700">{item.serial_number || '-'}</p>
                          {item.asset_tag && (
                            <p className="text-xs text-slate-500">{item.asset_tag}</p>
                          )}
                        </td>
                        <td className="py-3">
                          <Badge variant={STATUS_COLORS[item.status as EquipmentStatus]}>
                            {item.status}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <Badge variant={CONDITION_COLORS[item.condition as EquipmentCondition]}>
                            {item.condition}
                          </Badge>
                        </td>
                        <td className="py-3 text-slate-600">{item.current_location || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Equipment Yet</h3>
              <p className="text-slate-500">Add equipment types and inventory items to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
