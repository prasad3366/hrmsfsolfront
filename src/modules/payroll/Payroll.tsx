import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Table, TableHeader, TableRow, TableHead, TableCell } from '../../components/ui/components';
import { Download, CreditCard, DollarSign, TrendingUp, Calendar, Plus } from 'lucide-react';
import { usePayroll } from '../../hooks/usePayroll';
import { useAuth } from '../../context/AuthContext';
import { RunPayrollModal } from '../../components/payroll/RunPayrollModal';
import { AssignSalaryModal } from '../../components/payroll/AssignSalaryModal';
import { AddPayrollAdjustmentModal } from '../../components/payroll/AddPayrollAdjustmentModal';
import { Payroll as PayrollType } from '../../services/api';
import ApiService from '../../services/api';

const Payroll = () => {
  const { user } = useAuth();
  const { payrolls, loading, error, fetchPayroll } = usePayroll();
  const [isRunPayrollOpen, setIsRunPayrollOpen] = useState(false);
  const [isAssignSalaryOpen, setIsAssignSalaryOpen] = useState(false);
  const [isAddAdjustmentOpen, setIsAddAdjustmentOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollType | null>(null);

  useEffect(() => {
    // Fetch payroll data for current user or all employees (depending on role)
    if (user?.id) {
      fetchPayroll(parseInt(user.id)).catch(err => console.error('Failed to fetch payroll:', err));
    }
  }, [user?.id]);

  const handleAddAdjustment = (payroll: PayrollType) => {
    setSelectedPayroll(payroll);
    setIsAddAdjustmentOpen(true);
  };

  const handleDownloadPayslip = async (payrollId: number) => {
    try {
      await ApiService.downloadPayslip(payrollId);
    } catch (err) {
      alert('Failed to download payslip: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const currentPayroll = payrolls.length > 0 ? payrolls[0] : null;

  if (error) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-semibold">Error loading payroll</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payroll</h1>
          <p className="text-slate-500 text-sm">Salary details and payslips</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setIsRunPayrollOpen(true)}>
            <Plus size={16} /> Run Payroll
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setIsAssignSalaryOpen(true)}>
            <Plus size={16} /> Assign Salary
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Digital Salary Card */}
        <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden h-full min-h-[220px] flex flex-col justify-between">
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl -ml-10 -mb-10"></div>
                
                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <p className="text-slate-400 text-xs uppercase tracking-widest">Net Salary</p>
                        <h2 className="text-3xl font-bold mt-1">
                          ${currentPayroll?.netSalary?.toLocaleString() || '0.00'}
                        </h2>
                    </div>
                    <CreditCard className="text-slate-400" />
                </div>

                <div className="relative z-10">
                    {loading ? (
                      <p className="text-slate-400 text-sm">Loading...</p>
                    ) : (
                      <>
                        <div className="flex justify-between text-sm mb-1 text-slate-300">
                            <span>Month</span>
                            <span>{currentPayroll?.month}/{currentPayroll?.year || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-300">
                            <span>Present Days</span>
                            <span>{currentPayroll?.presentDays || '0'} / {currentPayroll?.workingDays || '22'}</span>
                        </div>
                      </>
                    )}
                </div>
            </div>
        </div>

        {/* Stats */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card hoverEffect className="flex flex-col justify-center">
                <CardContent className="text-center">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                        <DollarSign size={20} />
                    </div>
                    <p className="text-xs text-slate-500">Basic Pay</p>
                    <p className="text-lg font-bold text-slate-900">${currentPayroll?.basic?.toLocaleString() || '0'}</p>
                </CardContent>
            </Card>
            <Card hoverEffect className="flex flex-col justify-center">
                <CardContent className="text-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                        <TrendingUp size={20} />
                    </div>
                    <p className="text-xs text-slate-500">Gross Salary</p>
                    <p className="text-lg font-bold text-slate-900">${currentPayroll?.grossSalary?.toLocaleString() || '0'}</p>
                </CardContent>
            </Card>
            <Card hoverEffect className="flex flex-col justify-center">
                <CardContent className="text-center">
                    <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
                        <Calendar size={20} />
                    </div>
                    <p className="text-xs text-slate-500">Deductions</p>
                    <p className="text-lg font-bold text-slate-900">-${currentPayroll?.deductions?.toLocaleString() || '0'}</p>
                </CardContent>
            </Card>
        </div>
      </div>

      {currentPayroll && (
        <Card hoverEffect>
          <CardHeader><CardTitle className="text-base">Payroll Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between p-3 bg-slate-50 rounded">
                <span className="text-slate-600">HRA</span>
                <span className="font-semibold">${currentPayroll.hra?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded">
                <span className="text-slate-600">PF</span>
                <span className="font-semibold">-${currentPayroll.pf?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded">
                <span className="text-slate-600">PT</span>
                <span className="font-semibold">-${currentPayroll.pt?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded">
                <span className="text-slate-600">Health Insurance</span>
                <span className="font-semibold">${currentPayroll.healthInsurance?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded">
                <span className="text-slate-600">LOP Days</span>
                <span className="font-semibold">{currentPayroll.lopDays}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded">
                <span className="text-slate-600">Working Days</span>
                <span className="font-semibold">{currentPayroll.workingDays} / {currentPayroll.presentDays} Present</span>
              </div>
            </div>

            {currentPayroll.others && currentPayroll.others.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-semibold text-slate-900 mb-3">Additional Adjustments</h4>
                <div className="space-y-2">
                  {currentPayroll.others.map((adj) => (
                    <div key={adj.id} className="flex justify-between items-center p-2 bg-slate-50 rounded text-sm">
                      <span className={adj.type === 'ALLOWANCE' ? 'text-emerald-600' : 'text-rose-600'}>
                        {adj.name}
                      </span>
                      <span className="font-semibold">
                        {adj.type === 'ALLOWANCE' ? '+' : '-'}${adj.amount?.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t">
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => handleAddAdjustment(currentPayroll)}
              >
                <Plus size={14} /> Add Adjustment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      <Card hoverEffect>
        <CardHeader><CardTitle className="text-base">Payroll History</CardTitle></CardHeader>
        <CardContent className="p-0">
            {payrolls.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                {loading ? 'Loading payroll history...' : 'No payroll records found'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead>Working Days</TableHead>
                        <TableHead>Present</TableHead>
                        <TableHead>Earnings</TableHead>
                        <TableHead>Deductions</TableHead>
                        <TableHead>Net Pay</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <tbody>
                    {payrolls.map(p => (
                        <TableRow key={p.id}>
                            <TableCell className="font-medium text-slate-900">{p.month}/{p.year}</TableCell>
                            <TableCell className="text-xs text-slate-500">{p.workingDays}</TableCell>
                            <TableCell className="text-xs text-slate-500">{p.presentDays}</TableCell>
                            <TableCell className="text-emerald-600 font-medium">+ ${p.grossSalary.toLocaleString()}</TableCell>
                            <TableCell className="text-rose-600 font-medium">- ${p.deductions.toLocaleString()}</TableCell>
                            <TableCell className="font-bold">${p.netSalary.toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  className="text-blue-600 hover:bg-blue-50"
                                  onClick={() => handleAddAdjustment(p)}
                                >
                                  + Adjust
                                </Button>
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  className="text-blue-600 hover:bg-blue-50 ml-2"
                                  onClick={() => handleDownloadPayslip(p.id)}
                                >
                                  <Download size={14} /> Download Payslip
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </tbody>
              </Table>
            )}
        </CardContent>
      </Card>

      {/* Modals */}
      <RunPayrollModal
        isOpen={isRunPayrollOpen}
        onClose={() => setIsRunPayrollOpen(false)}
        onSuccess={() => {
          if (user?.id) {
            fetchPayroll(parseInt(user.id));
          }
        }}
      />

      <AssignSalaryModal
        isOpen={isAssignSalaryOpen}
        onClose={() => setIsAssignSalaryOpen(false)}
      />

      {selectedPayroll && (
        <AddPayrollAdjustmentModal
          isOpen={isAddAdjustmentOpen}
          onClose={() => setIsAddAdjustmentOpen(false)}
          payrollId={selectedPayroll.id}
          onSuccess={() => {
            if (user?.id) {
              fetchPayroll(parseInt(user.id));
            }
          }}
        />
      )}
    </div>
  );
};

export default Payroll;