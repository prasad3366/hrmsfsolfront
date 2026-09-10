import React, { useEffect, useState } from 'react';
import { Calendar, Plus, Trash2 } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '../../components/ui/components';
import CreateHolidayModal from '../../components/holidays/CreateHolidayModal';
import { useAuth } from '../../context/AuthContext';
import { useHolidays } from '../../hooks/useHolidays';
import { canManageHolidays } from './holidays-roles';
import { getHolidayViewState } from './holiday-state';

const Holidays = () => {
  const { user } = useAuth();
  const canManage = Boolean(user && canManageHolidays(user.role));
  const {
    holidays,
    myHolidays,
    isLoading,
    isSubmitting,
    error,
    success,
    fetchHolidaysByYear,
    fetchMyHolidays,
    createHoliday,
    deleteHoliday,
  } = useHolidays();
  const [isCreateHolidayOpen, setIsCreateHolidayOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const displayedHolidays = canManage ? holidays : myHolidays;
  const viewState = getHolidayViewState(isLoading, error, displayedHolidays);

  useEffect(() => {
    if (canManage) {
      fetchHolidaysByYear(currentYear);
    } else {
      fetchMyHolidays();
    }
  }, [canManage, currentYear, fetchHolidaysByYear, fetchMyHolidays]);

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Holidays</h1>

      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {success && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>}
          <p className="text-slate-500 text-sm">
            {canManage ? 'Manage company holidays' : 'View your company holidays'}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setIsCreateHolidayOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus size={16} className="mr-2" />
            Add Holiday
          </Button>
        )}
      </div>

      <Card className="border shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="text-base">{currentYear} Holidays</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {viewState === 'loading' ? (
            <p className="text-sm text-slate-500 text-center py-8">Loading holidays...</p>
          ) : viewState === 'error' ? (
            <p className="text-sm text-rose-600 text-center py-8">Unable to load holidays.</p>
          ) : viewState === 'ready' ? (
            <div className="space-y-4">
              {displayedHolidays.map((holiday) => (
                <div key={holiday.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-slate-900 mb-3">{holiday.name}</h4>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar size={14} className="text-slate-600" />
                        <span className="text-slate-600 font-medium">{new Date(holiday.date).toLocaleDateString('en-GB')}</span>
                      </div>
                      {holiday.location && <span className="text-xs text-blue-600 font-medium">{holiday.location}</span>}
                    </div>
                  </div>
                  {canManage && (
                    <button
                      onClick={() => deleteHoliday(holiday.id).catch(() => undefined)}
                      disabled={isSubmitting}
                      className="ml-4 p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                      title="Delete holiday"
                    >
                      <Trash2 size={18} strokeWidth={1.5} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-8">No holidays available</p>
          )}
        </CardContent>
      </Card>

      {canManage && (
        <CreateHolidayModal
          isOpen={isCreateHolidayOpen}
          onClose={() => setIsCreateHolidayOpen(false)}
          onSubmit={async (holiday) => {
            await createHoliday(holiday);
          }}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};

export default Holidays;