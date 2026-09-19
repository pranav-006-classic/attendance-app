import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  History, 
  Edit3, 
  Download, 
  FileSpreadsheet, 
  FileText,
  Calendar,
  Layers,
  Sparkles,
  AlertTriangle,
  X,
  ChevronRight,
  Eye
} from 'lucide-react';
import { 
  AttendanceRecord, 
  AttendanceStatus, 
  Subject, 
  UserProfile,
  ClassroomSettings 
} from '../types';

interface AttendanceTableProps {
  records: AttendanceRecord[];
  subjects: Subject[];
  students: UserProfile[];
  currentUser: UserProfile;
  settings: ClassroomSettings;
  onOpenHistory: (record: AttendanceRecord) => void;
  onOpenEdit: (record: AttendanceRecord) => void;
  onRaiseDispute?: (record: AttendanceRecord) => void;
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  records,
  subjects,
  students,
  currentUser,
  settings,
  onOpenHistory,
  onOpenEdit,
  onRaiseDispute,
}) => {
  // Tabs: "Records" | "Summary" | "Requests" (Requests handled on parent or sub-tab)
  const [activeTab, setActiveTab] = useState<'records' | 'summary'>('records');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState<'date' | 'period' | 'studentName' | 'subjectName' | 'status' | 'updatedAt'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Selected row checkboxes
  const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(new Set());

  // Handle Sort
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filtered & Sorted Records
  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      // If student role, double guarantee they only see their own
      if (currentUser.role === 'student' && rec.studentId !== currentUser.id) {
        return false;
      }

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = rec.studentName.toLowerCase().includes(q);
        const matchesRoll = (rec.rollNumber || '').toLowerCase().includes(q);
        const matchesSubject = rec.subjectName.toLowerCase().includes(q);
        if (!matchesName && !matchesRoll && !matchesSubject) return false;
      }

      // Subject filter
      if (selectedSubject !== 'all' && rec.subjectId !== selectedSubject) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && rec.status !== selectedStatus) {
        return false;
      }

      // Period filter
      if (selectedPeriod !== 'all' && rec.period !== Number(selectedPeriod)) {
        return false;
      }

      // Student filter
      if (selectedStudent !== 'all' && rec.studentId !== selectedStudent) {
        return false;
      }

      // Date range filter
      if (startDate && rec.date < startDate) return false;
      if (endDate && rec.date > endDate) return false;

      return true;
    }).sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') {
        cmp = a.date.localeCompare(b.date);
        if (cmp === 0) cmp = (a.period || 0) - (b.period || 0);
      } else if (sortField === 'period') {
        cmp = (a.period || 0) - (b.period || 0);
        if (cmp === 0) cmp = a.date.localeCompare(b.date);
      } else if (sortField === 'studentName') {
        cmp = a.studentName.localeCompare(b.studentName);
      } else if (sortField === 'subjectName') {
        cmp = a.subjectName.localeCompare(b.subjectName);
      } else if (sortField === 'status') {
        cmp = a.status.localeCompare(b.status);
      } else if (sortField === 'updatedAt') {
        cmp = (a.updatedAt || '').localeCompare(b.updatedAt || '');
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [records, currentUser, searchQuery, selectedSubject, selectedStatus, selectedPeriod, selectedStudent, startDate, endDate, sortField, sortDirection]);

  // Aggregate Student Summaries
  const studentSummaries = useMemo(() => {
    const map = new Map<string, {
      student: UserProfile;
      total: number;
      present: number;
      absent: number;
      leave: number;
      percentage: number;
      bySubject: Record<string, { present: number; total: number; percentage: number }>;
    }>();

    // Prepare list of students depending on role
    const activeStudentList = currentUser.role === 'student' 
      ? students.filter(s => s.id === currentUser.id)
      : students;

    activeStudentList.forEach(st => {
      map.set(st.id, {
        student: st,
        total: 0,
        present: 0,
        absent: 0,
        leave: 0,
        percentage: 100,
        bySubject: {},
      });
    });

    records.forEach(rec => {
      // If student role, only process their records
      if (currentUser.role === 'student' && rec.studentId !== currentUser.id) return;

      let entry = map.get(rec.studentId);
      if (!entry) {
        const st = students.find(s => s.id === rec.studentId) || {
          id: rec.studentId,
          name: rec.studentName,
          email: '',
          role: 'student' as const,
          rollNumber: rec.rollNumber
        };
        entry = {
          student: st,
          total: 0,
          present: 0,
          absent: 0,
          leave: 0,
          percentage: 100,
          bySubject: {},
        };
        map.set(rec.studentId, entry);
      }

      entry.total++;
      if (rec.status === 'present') entry.present++;
      else if (rec.status === 'absent') entry.absent++;
      else if (rec.status === 'leave') entry.leave++;

      // by subject
      if (!entry.bySubject[rec.subjectId]) {
        entry.bySubject[rec.subjectId] = { present: 0, total: 0, percentage: 0 };
      }
      entry.bySubject[rec.subjectId].total++;
      if (rec.status === 'present' || rec.status === 'leave') {
        entry.bySubject[rec.subjectId].present++;
      }
    });

    // Compute percentages
    map.forEach(entry => {
      // Leave counts toward approved attendance in typical academic governance
      const attended = entry.present + entry.leave;
      entry.percentage = entry.total > 0 ? Math.round((attended / entry.total) * 1000) / 10 : 100;
      
      Object.keys(entry.bySubject).forEach(subId => {
        const subStat = entry.bySubject[subId];
        subStat.percentage = subStat.total > 0 ? Math.round((subStat.present / subStat.total) * 1000) / 10 : 100;
      });
    });

    return Array.from(map.values()).sort((a, b) => a.percentage - b.percentage);
  }, [records, students, currentUser]);

  // Select all toggles
  const handleToggleSelectAll = () => {
    if (selectedRecordIds.size === filteredRecords.length) {
      setSelectedRecordIds(new Set());
    } else {
      setSelectedRecordIds(new Set(filteredRecords.map(r => r.id)));
    }
  };

  const handleToggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRecordIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Status Badge Component
  const renderStatusBadge = (status: AttendanceStatus) => {
    if (status === 'present') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
          Present
        </span>
      );
    }
    if (status === 'absent') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
          Absent
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
        Leave (OD)
      </span>
    );
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Date', 'Period', 'Student Roll', 'Student Name', 'Subject', 'Status', 'Marked By', 'Last Edited'];
    const rows = filteredRecords.map(r => [
      r.date,
      r.period,
      r.rollNumber || '',
      `"${r.studentName}"`,
      `"${r.subjectName}"`,
      r.status.toUpperCase(),
      `"${r.markedByName || ''}"`,
      `"${r.updatedAt || r.createdAt}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AttendEase_Attendance_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print PDF
  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="attendance_table_container" className="space-y-4">

      {/* Spreadsheet Control Header */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/80 p-4 shadow-xs">
        {/* Top bar: Tabs + Export */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-700/60">
          {/* Navigation Tabs (Records vs Summary) */}
          <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl w-fit">
            <button
              id="tab_table_records"
              type="button"
              onClick={() => setActiveTab('records')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'records'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Session Records ({filteredRecords.length})
            </button>
            <button
              id="tab_table_summary"
              type="button"
              onClick={() => setActiveTab('summary')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'summary'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Student Summary ({studentSummaries.length})
            </button>
          </div>

          {/* Export and Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              id="btn_export_csv"
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-200 transition-colors"
              title="Export filtered records to CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400" />
              Export CSV
            </button>
            <button
              id="btn_print_report"
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-200 transition-colors"
              title="Printable Monthly Report / Save as PDF"
            >
              <FileText className="w-3.5 h-3.5 mr-1.5 text-indigo-600 dark:text-indigo-400" />
              Print / PDF
            </button>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="pt-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              id="input_table_search"
              type="text"
              placeholder="Search student, roll number, or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Subject Dropdown */}
            <select
              id="filter_subject_dropdown"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="py-2 px-3 text-xs font-medium rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 focus:outline-none"
            >
              <option value="all">All Subjects</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.code}</option>
              ))}
            </select>

            {/* Status Dropdown */}
            <select
              id="filter_status_dropdown"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="py-2 px-3 text-xs font-medium rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="leave">Leave (OD)</option>
            </select>

            {/* Period Dropdown Filter */}
            <select
              id="filter_period_dropdown"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="py-2 px-3 text-xs font-medium rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 focus:outline-none"
            >
              <option value="all">All Periods</option>
              {Array.from({ length: settings.periodsPerDay || 7 }).map((_, i) => (
                <option key={i + 1} value={String(i + 1)}>
                  Period {i + 1}
                </option>
              ))}
            </select>

            {/* Toggle advanced filter panel button */}
            <button
              id="btn_toggle_filter_panel"
              type="button"
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                isFilterPanelOpen || startDate || endDate || selectedStudent !== 'all'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                  : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Date & Student Filters</span>
            </button>
          </div>
        </div>

        {/* Collapsible Date & Student Filter Drawer */}
        {isFilterPanelOpen && (
          <div className="mt-3 p-3 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl border border-neutral-200/80 dark:border-neutral-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-500 mb-1">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-neutral-500 mb-1">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Filter by Student</label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
              >
                <option value="all">All Classroom Students</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.rollNumber})</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* VIEW: Records Spreadsheet Table */}
      {activeTab === 'records' && (
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/80 overflow-hidden shadow-xs">
          
          {/* Batch selected banner */}
          {selectedRecordIds.size > 0 && (
            <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/60 border-b border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200">
              <span className="font-semibold">
                {selectedRecordIds.size} records selected
              </span>
              <button
                onClick={() => setSelectedRecordIds(new Set())}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Deselect All
              </button>
            </div>
          )}

          {/* Desktop Spreadsheet Table View */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700/80 text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-900/80 sticky top-0 z-10">
                <tr>
                  <th scope="col" className="w-10 px-3 py-3 text-center">
                    <input
                      id="checkbox_select_all"
                      type="checkbox"
                      checked={selectedRecordIds.size > 0 && selectedRecordIds.size === filteredRecords.length}
                      onChange={handleToggleSelectAll}
                      className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th scope="col" className="w-12 px-2 py-3 text-neutral-400 font-mono">
                    #
                  </th>
                  <th 
                    scope="col" 
                    onClick={() => handleSort('date')} 
                    className="px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer hover:text-indigo-600"
                  >
                    <div className="flex items-center gap-1">
                      <span>Date</span>
                      <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    onClick={() => handleSort('period')} 
                    className="px-3 py-3 font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer hover:text-indigo-600 text-center"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Period</span>
                      <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    onClick={() => handleSort('studentName')} 
                    className="px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer hover:text-indigo-600"
                  >
                    <div className="flex items-center gap-1">
                      <span>Student Name</span>
                      <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    onClick={() => handleSort('subjectName')} 
                    className="px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer hover:text-indigo-600"
                  >
                    <div className="flex items-center gap-1">
                      <span>Subject</span>
                      <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    onClick={() => handleSort('status')} 
                    className="px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer hover:text-indigo-600"
                  >
                    <div className="flex items-center gap-1">
                      <span>Status</span>
                      <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-300 hidden md:table-cell">
                    Marked By
                  </th>
                  <th 
                    scope="col" 
                    onClick={() => handleSort('updatedAt')} 
                    className="px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-300 hidden lg:table-cell cursor-pointer hover:text-indigo-600"
                  >
                    <div className="flex items-center gap-1">
                      <span>Last Edited</span>
                      <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold text-neutral-700 dark:text-neutral-300">
                    Actions / Trail
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700/60 bg-white dark:bg-neutral-800">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-neutral-500">
                      <p className="text-sm font-medium">No matching attendance records found.</p>
                      <p className="text-xs text-neutral-400 mt-1">Try resetting your search query or filters.</p>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record, index) => {
                    const isSelected = selectedRecordIds.has(record.id);
                    const canEdit = currentUser.role === 'teacher' || currentUser.role === 'cr';

                    return (
                      <tr
                        key={record.id}
                        id={`row_record_${record.id}`}
                        onClick={() => onOpenHistory(record)}
                        className={`hover:bg-neutral-50 dark:hover:bg-neutral-750 transition-colors cursor-pointer group ${
                          isSelected ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : index % 2 === 1 ? 'bg-neutral-50/40 dark:bg-neutral-850/40' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="px-3 py-3 text-center" onClick={(e) => handleToggleRow(record.id, e)}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>

                        {/* Row # */}
                        <td className="px-2 py-3 font-mono text-neutral-400 text-[11px]">
                          {index + 1}
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 whitespace-nowrap font-medium text-neutral-900 dark:text-white">
                          {record.date}
                        </td>

                        {/* Period */}
                        <td className="px-3 py-3 whitespace-nowrap text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold text-[11px] bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
                            P{record.period}
                          </span>
                        </td>

                        {/* Student */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-[10px] flex items-center justify-center">
                              {record.studentName.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-neutral-900 dark:text-white">
                                {record.studentName}
                              </div>
                              <div className="text-[11px] font-mono text-neutral-400">
                                {record.rollNumber}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Subject */}
                        <td className="px-4 py-3 whitespace-nowrap text-neutral-700 dark:text-neutral-300">
                          {record.subjectName}
                        </td>

                        {/* Status Badge */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {renderStatusBadge(record.status)}
                        </td>

                        {/* Marked By */}
                        <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell text-neutral-500 dark:text-neutral-400">
                          <div>{record.markedByName}</div>
                          <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-neutral-100 dark:bg-neutral-700">
                            {record.markedByRole}
                          </span>
                        </td>

                        {/* Last Edited */}
                        <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell text-neutral-500 dark:text-neutral-400 text-[11px]">
                          {record.updatedAt ? new Date(record.updatedAt).toLocaleDateString() : 'Original'}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            {/* View History Drawer Button */}
                            <button
                              id={`btn_history_${record.id}`}
                              type="button"
                              onClick={() => onOpenHistory(record)}
                              className="p-1.5 rounded-lg text-neutral-500 hover:text-indigo-600 dark:text-neutral-400 dark:hover:text-indigo-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                              title="View full audit trail"
                            >
                              <History className="w-4 h-4" />
                            </button>

                            {/* Edit Button for Teacher / CR */}
                            {canEdit && (
                              <button
                                id={`btn_edit_${record.id}`}
                                type="button"
                                onClick={() => onOpenEdit(record)}
                                className="p-1.5 rounded-lg text-neutral-500 hover:text-emerald-600 dark:text-neutral-400 dark:hover:text-emerald-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                                title="Edit record"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}

                            {/* Dispute Button for Student if Absent */}
                            {currentUser.role === 'student' && record.status === 'absent' && onRaiseDispute && (
                              <button
                                id={`btn_dispute_${record.id}`}
                                type="button"
                                onClick={() => onRaiseDispute(record)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 transition-colors"
                              >
                                I was present
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer stats */}
          <div className="p-3 bg-neutral-50 dark:bg-neutral-900/80 border-t border-neutral-200 dark:border-neutral-700/80 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>Showing {filteredRecords.length} records</span>
            <span>Click any row to inspect its immutable history trail</span>
          </div>
        </div>
      )}

      {/* VIEW: Classroom Summary Table */}
      {activeTab === 'summary' && (
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700/80 text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-900/80 sticky top-0">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-300">
                    Student
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-300 text-center">
                    Total Classes
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-emerald-700 dark:text-emerald-400 text-center">
                    Attended (P+OD)
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-rose-700 dark:text-rose-400 text-center">
                    Missed (A)
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-300 text-center">
                    Overall %
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-300">
                    Status / Alert
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700/60">
                {studentSummaries.map((item) => {
                  const isBelow = item.percentage < (settings.minimumAttendancePercentage || 75);
                  return (
                    <tr 
                      key={item.student.id} 
                      className={`hover:bg-neutral-50 dark:hover:bg-neutral-750 transition-colors ${
                        isBelow ? 'bg-rose-50/30 dark:bg-rose-950/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs ${
                            isBelow ? 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200'
                          }`}>
                            {item.student.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-neutral-900 dark:text-white">
                              {item.student.name}
                            </div>
                            <div className="text-[11px] font-mono text-neutral-400">
                              {item.student.rollNumber}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-center font-semibold text-neutral-800 dark:text-neutral-200">
                        {item.total}
                      </td>

                      <td className="px-4 py-3.5 text-center font-bold text-emerald-600 dark:text-emerald-400">
                        {item.present + item.leave}
                      </td>

                      <td className="px-4 py-3.5 text-center font-bold text-rose-600 dark:text-rose-400">
                        {item.absent}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                          isBelow 
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' 
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}>
                          {item.percentage}%
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        {isBelow ? (
                          <span className="inline-flex items-center text-xs font-semibold text-rose-600 dark:text-rose-400">
                            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                            Defaulter (&lt; {settings.minimumAttendancePercentage}%)
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-400">In Good Standing</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
