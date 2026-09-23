import React, { useState, useMemo } from 'react';
import { 
  UserProfile, 
  Subject, 
  ClassroomSettings 
} from '../types';
import { 
  Sparkles, 
  Upload, 
  FileText, 
  Users, 
  BookOpen, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Crown, 
  ShieldCheck, 
  Search, 
  GraduationCap, 
  RefreshCw, 
  Check, 
  X, 
  Sliders, 
  Save, 
  FileSpreadsheet,
  Layers,
  ArrowRight,
  School,
  ArrowUpDown
} from 'lucide-react';
import { 
  batchUpsertStudents, 
  saveUserProfile, 
  deleteUserProfile, 
  saveSubject, 
  deleteSubject, 
  batchUpsertSubjects,
  updateClassroomDetails,
  resetClassroomToCleanSlate,
  compareStudentsByRoster,
  sortStudentsByRoster,
  fetchSubjects,
  DEMO_SUBJECTS
} from '../services/attendanceService';

interface ClassroomManagerScreenProps {
  currentUser: UserProfile;
  students: UserProfile[];
  subjects: Subject[];
  settings: ClassroomSettings;
  onRefreshData: () => void;
  onNavigateToMarking?: () => void;
}

interface ParsedStudentDraft {
  order?: number;
  rosterIndex?: number;
  name: string;
  rollNumber: string;
  email: string;
  phone?: string;
  section?: string;
  isCR?: boolean;
}

interface ParsedSubjectDraft {
  code: string;
  name: string;
  facultyName?: string;
  credits?: number;
}

export const ClassroomManagerScreen: React.FC<ClassroomManagerScreenProps> = ({
  currentUser,
  students,
  subjects,
  settings,
  onRefreshData,
  onNavigateToMarking,
}) => {
  const isTeacher = currentUser.role === 'teacher';
  const isCR = currentUser.role === 'cr' || currentUser.isCR;

  const [activeTab, setActiveTab] = useState<'roster_import' | 'students' | 'subjects'>(
    isTeacher ? 'roster_import' : 'subjects'
  );

  // Search in students
  const [studentSearch, setStudentSearch] = useState('');

  // Toast / notification banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick Roll & Name Generator State (Tab 1)
  const [creatorMode, setCreatorMode] = useState<'quick_generator' | 'ai_document'>('quick_generator');
  const [generatorStartingRoll, setGeneratorStartingRoll] = useState('21CS01');
  const [generatorNamesText, setGeneratorNamesText] = useState('');

  // In-App Deletion & Reset Confirmation Modal States (replaces window.confirm)
  const [studentToDelete, setStudentToDelete] = useState<UserProfile | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // ----------------------------------------------------
  // TAB 1: AI ROSTER IMPORT STATE
  // ----------------------------------------------------
  const [rosterRawText, setRosterRawText] = useState('');
  const [targetDepartment, setTargetDepartment] = useState(settings.department || 'Computer Science & Engineering');
  const [targetSection, setTargetSection] = useState(settings.classroomName?.includes('Section B') ? 'B' : 'A');
  const [targetClassroomName, setTargetClassroomName] = useState(settings.classroomName || 'LH-302, Dept. of Computer Science');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);
  const [uploadedMimeType, setUploadedMimeType] = useState<string | null>(null);
  const [isParsingAI, setIsParsingAI] = useState(false);

  // Extracted preview ready for user verification and alteration
  const [draftStudents, setDraftStudents] = useState<ParsedStudentDraft[] | null>(null);
  const [draftSubjects, setDraftSubjects] = useState<ParsedSubjectDraft[] | null>(null);
  const [isApplyingRoster, setIsApplyingRoster] = useState(false);

  // ----------------------------------------------------
  // TAB 2: SINGLE STUDENT EDIT / ADD MODAL
  // ----------------------------------------------------
  const [editingStudent, setEditingStudent] = useState<UserProfile | null>(null);
  const [isNewStudentModalOpen, setIsNewStudentModalOpen] = useState(false);
  const [studentFormData, setStudentFormData] = useState({
    name: '',
    rollNumber: '',
    email: '',
    phone: '',
    role: 'student' as 'student' | 'cr',
    isCR: false,
    section: 'A',
    department: settings.department || 'Computer Science & Engineering',
  });
  const [isSavingStudent, setIsSavingStudent] = useState(false);

  // ----------------------------------------------------
  // TAB 3: SUBJECT EDIT / ADD MODAL
  // ----------------------------------------------------
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [isNewSubjectModalOpen, setIsNewSubjectModalOpen] = useState(false);
  const [subjectFormData, setSubjectFormData] = useState({
    code: '',
    name: '',
    teacherName: currentUser.name || 'Prof. Ananya Sharma',
    credits: 4,
    periodsPerWeek: 4,
    roomNumber: 'LH-302',
    color: '#13523B',
    syllabus: '',
  });
  const [isSavingSubject, setIsSavingSubject] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setErrorMessage(null);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setToastMessage(null);
  };

  // ----------------------------------------------------
  // File Upload Handler for AI Roster
  // ----------------------------------------------------
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const mime = file.type || 'text/plain';
    setUploadedMimeType(mime);

    // If text or CSV, read as text directly
    if (file.type.includes('text') || file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setRosterRawText(text);
      };
      reader.readAsText(file);
    } else {
      // If image or document, read as base64 data URL
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setUploadedBase64(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // Load sample roster for rapid test
  const handleLoadSampleRoster = () => {
    const sample = `Roll No,Student Name,Email,Section,Role
CS2601,Aarav Mehta,aarav.mehta@university.edu,A,Student
CS2602,Ananya Iyer,ananya.iyer@university.edu,A,CR
CS2603,Dev Patel,dev.patel@university.edu,A,Student
CS2604,Diya Nambiar,diya.nambiar@university.edu,A,Student
CS2605,Ishaan Gupta,ishaan.gupta@university.edu,A,Student
CS2606,Kavya Nair,kavya.nair@university.edu,A,Student
CS2607,Manish Rao,manish.rao@university.edu,A,Student
CS2608,Neha Deshmukh,neha.d@university.edu,A,Student
CS2609,Omkar Joshi,omkar.j@university.edu,A,Student
CS2610,Pooja Reddy,pooja.r@university.edu,A,Student
CS2611,Pranav Saxena,pranav.s@university.edu,A,Student
CS2612,Rhea Sen,rhea.sen@university.edu,A,Student
CS2613,Rohan Verma,rohan.v@university.edu,A,CR
CS2614,Samar Singh,samar.s@university.edu,A,Student
CS2615,Sneha Kulkarni,sneha.k@university.edu,A,Student
CS2616,Tanvi Bhat,tanvi.b@university.edu,A,Student
CS2617,Varun Nair,varun.n@university.edu,A,Student
CS2618,Yashwardhan Roy,yash.roy@university.edu,A,Student
CS2619,Zoya Khan,zoya.k@university.edu,A,Student
CS2620,Aditya Chawla,aditya.c@university.edu,A,Student

Subjects:
CS401 - Distributed Systems (Prof. Ananya Sharma, 4 Credits)
CS404 - Operating Systems & Kernel Architecture (Dr. V. Sharma, 4 Credits)
CS406 - Database Engineering & Cloud Data Stores (Prof. Ananya Sharma, 3 Credits)
CS408 - Artificial Intelligence & Neural Networks (Dr. S. Roy, 4 Credits)
`;
    setRosterRawText(sample);
    setUploadedFileName('sample_class_roster.csv');
  };

  // Generate students using starting roll number and names list
  const handleGenerateFromNamesAndRoll = () => {
    if (!generatorNamesText.trim()) {
      showError('Please enter or paste student names into the names text box.');
      return;
    }

    const lines = generatorNamesText
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length === 0) {
      showError('No student names found in the input.');
      return;
    }

    const cleanStart = (generatorStartingRoll.trim() || '21CS01').toUpperCase();
    const match = cleanStart.match(/^(.*?)(\d+)$/);

    let prefix = '21CS';
    let startNum = 1;
    let padLength = 2;

    if (match) {
      prefix = match[1];
      startNum = parseInt(match[2], 10);
      padLength = match[2].length;
    }

    const generated: ParsedStudentDraft[] = [];

    lines.forEach((line, idx) => {
      let studentRoll = '';
      let studentName = '';

      // Check if line is purely an ID / roll number (e.g. "131" or "21CS131")
      if (/^[A-Z0-9_-]{1,20}$/i.test(line)) {
        studentRoll = line.toUpperCase();
        studentName = `Student ${studentRoll}`;
      } else {
        // Pattern 1: Roll at beginning e.g. "131 Rahul Sharma", "131. Rahul Sharma", "131) Rahul Sharma", "21CS01 - Rahul Sharma"
        const rollStartMatch = line.match(/^([A-Z0-9_-]{1,15})[\s,:\-–\.\)\/]+(.+)$/i);
        // Pattern 2: Name at beginning, roll at end e.g. "Rahul Sharma 21CS01", "John Doe (131)", "John Doe - 131"
        const rollEndMatch = line.match(/^(.+?)[\s,:\-–\.\(\[\/]+([A-Z0-9_-]{1,15})[\)\]]?$/i);

        if (rollStartMatch && /\d/.test(rollStartMatch[1])) {
          studentRoll = rollStartMatch[1].toUpperCase();
          studentName = rollStartMatch[2].trim();
        } else if (rollEndMatch && /\d/.test(rollEndMatch[2])) {
          studentName = rollEndMatch[1].trim();
          studentRoll = rollEndMatch[2].toUpperCase();
        } else {
          const currentNum = startNum + idx;
          studentRoll = `${prefix}${String(currentNum).padStart(padLength, '0')}`;
          studentName = line.replace(/^\d+[\.\)\s\-]+/, '').trim();
          if (!studentName) {
            studentName = `Student ${studentRoll}`;
          }
        }
      }

      generated.push({
        order: idx + 1,
        rosterIndex: idx + 1,
        name: studentName,
        rollNumber: studentRoll,
        email: `${studentRoll.toLowerCase()}@university.edu`,
        section: targetSection,
        isCR: false,
      });
    });

    setDraftStudents(generated);
    showToast(`Generated draft roster for ${generated.length} students (ordered #1 to #${generated.length}). Inspect below and click "Confirm & Create Classroom".`);
  };

  // Trigger AI Roster Parsing
  const handleAnalyzeWithAI = async () => {
    if (!rosterRawText.trim() && !uploadedBase64) {
      showError('Please upload a roster file or paste student names into the text box.');
      return;
    }

    setIsParsingAI(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/ai/parse-roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: rosterRawText,
          imageBase64: uploadedBase64,
          mimeType: uploadedMimeType,
          defaultDepartment: targetDepartment,
          defaultSection: targetSection,
        }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.message || 'AI failed to parse student roster.');
      }

      const { data } = resData;

      if (data.classroomName) {
        setTargetClassroomName(data.classroomName);
      }
      if (data.department) {
        setTargetDepartment(data.department);
      }

      if (Array.isArray(data.students) && data.students.length > 0) {
        const mappedStudents: ParsedStudentDraft[] = data.students.map((s: any, idx: number) => ({
          ...s,
          order: typeof s.order === 'number' ? s.order : idx + 1,
          rosterIndex: typeof s.rosterIndex === 'number' ? s.rosterIndex : idx + 1,
        }));
        setDraftStudents(mappedStudents);
        const subCount = Array.isArray(data.subjects) ? data.subjects.length : 0;
        const sourceLabel = resData.source?.startsWith('gemini') ? 'AI' : 'Smart Roster Engine';
        showToast(`Successfully extracted ${data.students.length} students${subCount > 0 ? ` and ${subCount} course subjects` : ''} via ${sourceLabel}. You can inspect and edit below.`);
      } else {
        throw new Error('No students detected in the input text. Please format as "RollNo, Name" or upload a clear roster.');
      }

      if (Array.isArray(data.subjects) && data.subjects.length > 0) {
        setDraftSubjects(data.subjects);
      }
    } catch (err: any) {
      showError(err.message || 'Failed to analyze roster with AI.');
    } finally {
      setIsParsingAI(false);
    }
  };

  // Alter details in draft table
  const handleUpdateDraftStudent = (index: number, field: keyof ParsedStudentDraft, value: any) => {
    if (!draftStudents) return;
    const updated = [...draftStudents];
    updated[index] = { ...updated[index], [field]: value };
    setDraftStudents(updated);
  };

  const handleRemoveDraftStudent = (index: number) => {
    if (!draftStudents) return;
    const updated = draftStudents.filter((_, i) => i !== index);
    setDraftStudents(updated);
  };

  const handleAddDraftRow = () => {
    const nextNum = (draftStudents?.length || 0) + 1;
    const newStudent: ParsedStudentDraft = {
      order: nextNum,
      rosterIndex: nextNum,
      rollNumber: `CS26${String(nextNum).padStart(2, '0')}`,
      name: '',
      email: '',
      section: targetSection,
      isCR: false,
    };
    setDraftStudents([...(draftStudents || []), newStudent]);
  };

  // Sort draft students by Roll Number in ascending natural order
  const handleSortDraftByRoll = () => {
    if (!draftStudents || draftStudents.length === 0) return;
    const sorted = [...draftStudents].sort((a, b) => {
      const rollA = (a.rollNumber || '').trim();
      const rollB = (b.rollNumber || '').trim();
      return rollA.localeCompare(rollB, undefined, { numeric: true, sensitivity: 'base' }) || (a.name || '').localeCompare(b.name || '');
    }).map((s, idx) => ({ ...s, order: idx + 1, rosterIndex: idx + 1 }));
    setDraftStudents(sorted);
    showToast('Draft roster sorted sequentially by roll number.');
  };

  // Apply AI parsed roster to Firestore & live app
  const handleApplyRosterToLive = async () => {
    if (!draftStudents || draftStudents.length === 0) return;

    setIsApplyingRoster(true);
    setErrorMessage(null);

    try {
      // 1. Batch save students with replaceExisting: true so previous old students are cleanly replaced
      await batchUpsertStudents(draftStudents, {
        department: targetDepartment,
        section: targetSection,
        year: '4th Year',
        replaceExisting: true,
      });

      // 2. Update classroom settings
      await updateClassroomDetails({
        classroomName: targetClassroomName,
        department: targetDepartment,
        section: targetSection,
      });

      // 3. Ensure curriculum subjects exist so attendance can be marked immediately
      if (draftSubjects && draftSubjects.length > 0) {
        const newSubjects: Subject[] = draftSubjects.map((s, idx) => ({
          id: `sub_${s.code.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          code: s.code,
          name: s.name,
          teacherName: s.facultyName || currentUser.name || 'Faculty In-Charge',
          periodsPerWeek: 4,
          color: ['#13523B', '#0F4A34', '#1E40AF', '#B45309', '#047857'][idx % 5],
          roomNumber: targetClassroomName.split(',')[0] || 'LH-302',
          credits: s.credits || 4,
        }));
        await batchUpsertSubjects(newSubjects);
      } else {
        const existingSubs = await fetchSubjects();
        if (existingSubs.length === 0) {
          await batchUpsertSubjects(DEMO_SUBJECTS);
        }
      }

      showToast(`Classroom "${targetClassroomName}" created with ${draftStudents.length} students! Ready for attendance marking.`);
      setDraftStudents(null);
      setDraftSubjects(null);
      setRosterRawText('');
      setUploadedFileName(null);
      onRefreshData();
      setActiveTab('students');
    } catch (err: any) {
      showError(err.message || 'Failed to save classroom roster.');
    } finally {
      setIsApplyingRoster(false);
    }
  };

  // ----------------------------------------------------
  // Single Student Actions (Tab 2)
  // ----------------------------------------------------
  const handleOpenEditStudent = (student: UserProfile) => {
    setEditingStudent(student);
    setStudentFormData({
      name: student.name,
      rollNumber: student.rollNumber || '',
      email: student.email,
      phone: student.phone || '',
      role: student.isCR ? 'cr' : 'student',
      isCR: Boolean(student.isCR),
      section: student.section || 'A',
      department: student.department || settings.department || 'Computer Science & Engineering',
    });
  };

  const handleOpenAddStudent = () => {
    setIsNewStudentModalOpen(true);
    setStudentFormData({
      name: '',
      rollNumber: `CS26${String(students.length + 1).padStart(2, '0')}`,
      email: '',
      phone: '',
      role: 'student',
      isCR: false,
      section: targetSection,
      department: settings.department || 'Computer Science & Engineering',
    });
  };

  const handleSaveStudentForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentFormData.name.trim() || !studentFormData.rollNumber.trim()) {
      showError('Student Name and Register/Roll Number are required.');
      return;
    }

    setIsSavingStudent(true);
    try {
      const isCR = studentFormData.role === 'cr' || studentFormData.isCR;
      const targetId = editingStudent ? editingStudent.id : `stud_${studentFormData.rollNumber.replace(/[^A-Z0-9]/gi, '_')}`;

      const highestOrder = students.reduce((max, s) => Math.max(max, typeof s.order === 'number' ? s.order : 0), 0);

      const userProfile: UserProfile = {
        id: targetId,
        uid: editingStudent ? editingStudent.uid : targetId,
        name: studentFormData.name.trim(),
        rollNumber: studentFormData.rollNumber.trim().toUpperCase(),
        order: editingStudent?.order ?? (highestOrder + 1),
        rosterIndex: editingStudent?.rosterIndex ?? (highestOrder + 1),
        email: studentFormData.email.trim() || `${studentFormData.rollNumber.toLowerCase()}@university.edu`,
        phone: studentFormData.phone.trim(),
        role: isCR ? 'cr' : 'student',
        status: 'active',
        isCR,
        section: studentFormData.section,
        department: studentFormData.department,
        year: '4th Year',
      };

      await saveUserProfile(userProfile);
      showToast(editingStudent ? `Updated details for ${userProfile.name}.` : `Enrolled new student ${userProfile.name}.`);
      setEditingStudent(null);
      setIsNewStudentModalOpen(false);
      onRefreshData();
    } catch (err: any) {
      showError(err.message || 'Failed to save student profile.');
    } finally {
      setIsSavingStudent(false);
    }
  };

  const handleToggleCR = async (student: UserProfile) => {
    try {
      const newCRStatus = !student.isCR;
      const updated: UserProfile = {
        ...student,
        isCR: newCRStatus,
        role: newCRStatus ? 'cr' : 'student',
      };
      await saveUserProfile(updated);
      showToast(`${student.name} is now ${newCRStatus ? 'designated as Class Representative (CR)' : 'reverted to Student'}.`);
      onRefreshData();
    } catch (err: any) {
      showError('Failed to update CR designation: ' + err.message);
    }
  };

  const handleConfirmDeleteStudent = async () => {
    if (!studentToDelete) return;
    try {
      await deleteUserProfile(studentToDelete.id);
      showToast(`${studentToDelete.name} (${studentToDelete.rollNumber || 'Student'}) removed from classroom roster.`);
      setStudentToDelete(null);
      onRefreshData();
    } catch (err: any) {
      showError('Failed to remove student: ' + err.message);
    }
  };

  // ----------------------------------------------------
  // Subject Actions (Tab 3) - Manipulate subject details
  // ----------------------------------------------------
  const handleOpenEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setSubjectFormData({
      code: subject.code,
      name: subject.name,
      teacherName: subject.teacherName || '',
      credits: subject.credits || 4,
      periodsPerWeek: subject.periodsPerWeek || 4,
      roomNumber: subject.roomNumber || 'LH-302',
      color: subject.color || '#13523B',
      syllabus: subject.syllabus || '',
    });
  };

  const handleOpenAddSubject = () => {
    setIsNewSubjectModalOpen(true);
    setSubjectFormData({
      code: `CS40${subjects.length + 1}`,
      name: '',
      teacherName: currentUser.name || 'Prof. Ananya Sharma',
      credits: 4,
      periodsPerWeek: 4,
      roomNumber: 'LH-302',
      color: ['#13523B', '#0F4A34', '#1E40AF', '#B45309', '#047857'][subjects.length % 5],
      syllabus: '',
    });
  };

  const handleSaveSubjectForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectFormData.code.trim() || !subjectFormData.name.trim()) {
      showError('Subject Code and Subject Name are required.');
      return;
    }

    setIsSavingSubject(true);
    try {
      const targetId = editingSubject ? editingSubject.id : `sub_${subjectFormData.code.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

      const subjectObj: Subject = {
        id: targetId,
        code: subjectFormData.code.trim().toUpperCase(),
        name: subjectFormData.name.trim(),
        teacherName: subjectFormData.teacherName.trim(),
        credits: Number(subjectFormData.credits),
        periodsPerWeek: Number(subjectFormData.periodsPerWeek),
        roomNumber: subjectFormData.roomNumber.trim(),
        color: subjectFormData.color,
        syllabus: subjectFormData.syllabus.trim(),
      };

      await saveSubject(subjectObj);
      showToast(editingSubject ? `Subject ${subjectObj.code} updated.` : `New course ${subjectObj.code} added to curriculum.`);
      setEditingSubject(null);
      setIsNewSubjectModalOpen(false);
      onRefreshData();
    } catch (err: any) {
      showError(err.message || 'Failed to save subject details.');
    } finally {
      setIsSavingSubject(false);
    }
  };

  const handleConfirmDeleteSubject = async () => {
    if (!subjectToDelete) return;
    try {
      await deleteSubject(subjectToDelete.id);
      showToast(`Subject "${subjectToDelete.name}" (${subjectToDelete.code}) deleted from curriculum.`);
      setSubjectToDelete(null);
      onRefreshData();
    } catch (err: any) {
      showError('Failed to delete subject: ' + err.message);
    }
  };

  const handleResetClassroomToZero = async () => {
    setIsResetting(true);
    try {
      const res = await resetClassroomToCleanSlate();
      showToast(`Classroom reset to zero: Purged ${res.deletedUsers} students and ${res.deletedSubjects} subjects.`);
      setIsResetModalOpen(false);
      setDraftStudents(null);
      setDraftSubjects(null);
      setGeneratorNamesText('');
      setRosterRawText('');
      onRefreshData();
    } catch (err: any) {
      showError('Failed to reset classroom: ' + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  // Preset curriculum loader
  const handleLoadCurriculumPreset = async (presetType: 'cse' | 'it' | 'ece') => {
    let presetSubjects: Subject[] = [];

    if (presetType === 'cse') {
      presetSubjects = [
        {
          id: 'sub_cs401',
          code: 'CS401',
          name: 'Distributed Systems & Cloud Architecture',
          teacherName: 'Prof. Ananya Sharma',
          credits: 4,
          periodsPerWeek: 4,
          color: '#13523B',
          roomNumber: 'LH-302',
          syllabus: 'Consensus, RPC, microservices, CAP theorem, and distributed storage.',
        },
        {
          id: 'sub_cs404',
          code: 'CS404',
          name: 'Operating Systems & System Kernels',
          teacherName: 'Dr. V. Sharma',
          credits: 4,
          periodsPerWeek: 4,
          color: '#0F4A34',
          roomNumber: 'LH-302',
          syllabus: 'Process scheduling, virtual memory, concurrency, file systems.',
        },
        {
          id: 'sub_cs406',
          code: 'CS406',
          name: 'Database Engineering & NoSQL Systems',
          teacherName: 'Prof. Ananya Sharma',
          credits: 4,
          periodsPerWeek: 4,
          color: '#1E40AF',
          roomNumber: 'LH-302',
          syllabus: 'Indexing, query optimization, ACID transactions, distributed databases.',
        },
        {
          id: 'sub_cs408',
          code: 'CS408',
          name: 'Computer Networks & Protocols',
          teacherName: 'Dr. Rajesh Nair',
          credits: 3,
          periodsPerWeek: 3,
          color: '#7C2D12',
          roomNumber: 'Lab 204',
          syllabus: 'TCP/IP socket programming, routing protocols, TLS/HTTPS security.',
        },
        {
          id: 'sub_cs410',
          code: 'CS410',
          name: 'Artificial Intelligence & Machine Learning',
          teacherName: 'Dr. S. Roy',
          credits: 4,
          periodsPerWeek: 4,
          color: '#065F46',
          roomNumber: 'LH-302',
          syllabus: 'Search heuristics, neural networks, supervised learning, transformers.',
        },
      ];
    } else if (presetType === 'it') {
      presetSubjects = [
        {
          id: 'sub_it301',
          code: 'IT301',
          name: 'Full-Stack Web Technologies',
          teacherName: 'Prof. Ananya Sharma',
          credits: 4,
          periodsPerWeek: 4,
          color: '#13523B',
          roomNumber: 'Web Lab 1',
          syllabus: 'TypeScript, React, Node.js, REST APIs, and container deployment.',
        },
        {
          id: 'sub_it302',
          code: 'IT302',
          name: 'Information Security & Cryptography',
          teacherName: 'Dr. V. Sharma',
          credits: 4,
          periodsPerWeek: 4,
          color: '#0F4A34',
          roomNumber: 'LH-301',
          syllabus: 'Public-key cryptography, hashing, authentication, penetration testing.',
        },
        {
          id: 'sub_it303',
          code: 'IT303',
          name: 'Cloud Computing & DevOps',
          teacherName: 'Prof. S. Verma',
          credits: 3,
          periodsPerWeek: 3,
          color: '#1E40AF',
          roomNumber: 'Cloud Lab',
          syllabus: 'Docker, Kubernetes, CI/CD pipelines, serverless architectures.',
        },
      ];
    }

    try {
      await batchUpsertSubjects(presetSubjects);
      showToast(`Loaded ${presetSubjects.length} standard real-life courses into class curriculum.`);
      onRefreshData();
    } catch (err: any) {
      showError('Failed to load curriculum preset: ' + err.message);
    }
  };

  const filteredStudents = useMemo(() => {
    return students
      .filter(s => 
        s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        (s.rollNumber || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
        (s.email || '').toLowerCase().includes(studentSearch.toLowerCase())
      )
      .sort(compareStudentsByRoster);
  }, [students, studentSearch]);

  return (
    <div id="classroom_manager_container" className="max-w-6xl mx-auto space-y-6 pb-20">
      
      {/* Toast & Error Alerts */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-600 hover:underline text-[11px] font-bold">
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-xl text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-600 hover:underline text-[11px] font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Classroom Hero & Header */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-[#E6E3D8] dark:border-[#28332E] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#13523B]/10 dark:bg-emerald-950/60 text-[#13523B] dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-serif text-neutral-900 dark:text-white">
                {settings.classroomName || 'Classroom Administration'}
              </h1>
              <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                <span>{settings.department || 'Computer Science & Engineering'}</span>
                <span>•</span>
                <span>{settings.semester || 'Semester VII'}</span>
                <span>•</span>
                <span className="font-mono text-[#13523B] dark:text-emerald-400 font-semibold">{settings.classCode || 'CS2026-FALL'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats & Action */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900/80 border border-[#E6E3D8] dark:border-[#28332E] text-center">
            <div className="text-xs text-neutral-400">Total Enrolled</div>
            <div className="text-base font-bold font-serif text-neutral-900 dark:text-white">{students.length} Students</div>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900/80 border border-[#E6E3D8] dark:border-[#28332E] text-center">
            <div className="text-xs text-neutral-400">Active Courses</div>
            <div className="text-base font-bold font-serif text-neutral-900 dark:text-white">{subjects.length} Subjects</div>
          </div>

          {isTeacher && (
            <button
              id="btn_reset_classroom_zero"
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/80 text-rose-700 dark:text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Reset classroom to zero (remove all students and subjects to start basic)"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>Reset to Zero</span>
            </button>
          )}

          {onNavigateToMarking && (
            <button
              onClick={onNavigateToMarking}
              className="px-4 py-2.5 rounded-xl bg-[#13523B] text-white text-xs font-bold hover:bg-[#0E422F] transition-all flex items-center gap-1.5 shadow-sm shadow-[#13523B]/20 cursor-pointer"
            >
              <span>Take Attendance</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center border-b border-[#E6E3D8] dark:border-[#28332E] gap-2">
        {isTeacher && (
          <button
            id="tab_ai_roster_import"
            type="button"
            onClick={() => setActiveTab('roster_import')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'roster_import'
                ? 'border-[#13523B] text-[#13523B] dark:text-emerald-400 dark:border-emerald-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4 text-[#13523B] dark:text-emerald-400" />
            <span>Quick Student Creator & Setup</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-mono font-semibold">
              Roll & Names
            </span>
          </button>
        )}

        <button
          id="tab_enrolled_students"
          type="button"
          onClick={() => setActiveTab('students')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'students'
              ? 'border-[#13523B] text-[#13523B] dark:text-emerald-400 dark:border-emerald-400'
              : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Class Roster ({students.length})</span>
        </button>

        <button
          id="tab_curriculum_subjects"
          type="button"
          onClick={() => setActiveTab('subjects')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'subjects'
              ? 'border-[#13523B] text-[#13523B] dark:text-emerald-400 dark:border-emerald-400'
              : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Curriculum & Subject Details ({subjects.length})</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-mono">
            Customizable
          </span>
        </button>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* TAB 1: QUICK STUDENT CREATOR & ROSTER BUILDER */}
      {/* ---------------------------------------------------------------- */}
      {activeTab === 'roster_import' && isTeacher && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-[#E6E3D8] dark:border-[#28332E] p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-700/60">
              <div>
                <h2 className="text-base font-bold font-serif text-neutral-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[#13523B] dark:text-emerald-400" />
                  <span>Classroom Student Setup (Start from Zero)</span>
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Build your classroom from scratch. Generate students directly from roll numbers and a list of names, or upload an attendance sheet/CSV.
                </p>
              </div>

              {/* Mode Switcher */}
              <div className="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setCreatorMode('quick_generator')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    creatorMode === 'quick_generator'
                      ? 'bg-white dark:bg-neutral-800 text-[#13523B] dark:text-emerald-400 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
                  }`}
                >
                  Roll & Names Generator
                </button>
                <button
                  type="button"
                  onClick={() => setCreatorMode('ai_document')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    creatorMode === 'ai_document'
                      ? 'bg-white dark:bg-neutral-800 text-[#13523B] dark:text-emerald-400 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
                  }`}
                >
                  AI Document / Photo
                </button>
              </div>
            </div>

            {/* Class Metadata Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Classroom / Hall Title
                </label>
                <input
                  type="text"
                  value={targetClassroomName}
                  onChange={(e) => setTargetClassroomName(e.target.value)}
                  placeholder="e.g. LH-302, Dept. of Computer Science"
                  className="w-full text-xs p-2.5 rounded-xl border border-[#E6E3D8] dark:border-[#28332E] bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={targetDepartment}
                  onChange={(e) => setTargetDepartment(e.target.value)}
                  placeholder="e.g. Computer Science & Engineering"
                  className="w-full text-xs p-2.5 rounded-xl border border-[#E6E3D8] dark:border-[#28332E] bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Section
                </label>
                <input
                  type="text"
                  value={targetSection}
                  onChange={(e) => setTargetSection(e.target.value)}
                  placeholder="e.g. Section A"
                  className="w-full text-xs p-2.5 rounded-xl border border-[#E6E3D8] dark:border-[#28332E] bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white"
                />
              </div>
            </div>

            {/* SUBMODE 1: Quick Generator with Starting Roll & Names */}
            {creatorMode === 'quick_generator' && (
              <div className="p-5 bg-neutral-50 dark:bg-neutral-900/60 rounded-2xl border border-[#E6E3D8] dark:border-[#28332E] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#13523B] dark:text-emerald-400" />
                      <span>Create Students using Names & Roll Numbers</span>
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Specify the starting roll number and enter student names below. The generator will assign sequential roll numbers automatically.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setGeneratorStartingRoll('21CS01');
                      setGeneratorNamesText(`Parthiban CS\nRavi Teja\nJoevanni Bennat\nChristo Frankinsten\nHarikrishna\nSurendharan`);
                    }}
                    className="text-xs text-[#13523B] dark:text-emerald-400 font-semibold hover:underline cursor-pointer self-start sm:self-auto"
                  >
                    Load Sample Names
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Starting Roll / Register Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={generatorStartingRoll}
                      onChange={(e) => setGeneratorStartingRoll(e.target.value.toUpperCase())}
                      placeholder="e.g. 21CS01 or 101"
                      className="w-full text-xs font-mono font-bold p-2.5 rounded-xl border border-[#E6E3D8] dark:border-[#28332E] bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                    />
                    <span className="text-[11px] text-neutral-400 mt-1 block">
                      Sequential roll number will be generated for each student name.
                    </span>
                  </div>

                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                        Student Names (One name per line) <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] text-neutral-400 font-mono">
                        {generatorNamesText.split(/\r?\n/).filter(l => l.trim().length > 0).length} names entered
                      </span>
                    </div>
                    <textarea
                      rows={6}
                      value={generatorNamesText}
                      onChange={(e) => setGeneratorNamesText(e.target.value)}
                      placeholder={`Type or paste names here:\nParthiban CS\nRavi Teja\nJoevanni Bennat\nChristo Frankinsten\nHarikrishna\nSurendharan`}
                      className="w-full text-xs p-3 rounded-xl border border-[#E6E3D8] dark:border-[#28332E] bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 font-medium leading-relaxed"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    {generatorNamesText.split(/\r?\n/).filter(l => l.trim().length > 0).length > 0 ? (
                      <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                        ✓ {generatorNamesText.split(/\r?\n/).filter(l => l.trim().length > 0).length} names ready to be generated.
                      </span>
                    ) : (
                      <span>Enter student names above to generate the roster.</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateFromNamesAndRoll}
                    className="px-5 py-2.5 rounded-xl bg-[#13523B] text-white text-xs font-bold hover:bg-[#0E422F] transition-all flex items-center gap-2 shadow-sm shadow-[#13523B]/20 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Generate Student Drafts</span>
                  </button>
                </div>
              </div>
            )}

            {/* SUBMODE 2: AI Document / Photo Upload */}
            {creatorMode === 'ai_document' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Left: Drag & Drop File Upload */}
                  <div className="flex flex-col">
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Upload Document or Photo (CSV, TXT, Excel, PNG/JPG)
                    </label>
                    <label className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#E6E3D8] dark:border-[#28332E] rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 hover:bg-neutral-100/60 dark:hover:bg-neutral-900 transition-colors cursor-pointer text-center min-h-[160px]">
                      <Upload className="w-8 h-8 text-[#13523B] dark:text-emerald-400 mb-2" />
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                        {uploadedFileName ? uploadedFileName : 'Click to select or drop roster file'}
                      </span>
                      <span className="text-[11px] text-neutral-400 mt-1">
                        Accepts text lists, CSV attendance rosters, and photos of paper attendance sheets
                      </span>
                      <input
                        type="file"
                        accept=".csv,.txt,.xlsx,.xls,image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Right: Direct Raw Text Paste */}
                  <div className="flex flex-col">
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Or Paste Raw List / Formatted Text
                    </label>
                    <textarea
                      rows={7}
                      value={rosterRawText}
                      onChange={(e) => setRosterRawText(e.target.value)}
                      placeholder={`Paste text here from college portal, WhatsApp, or Excel...\nExample:\n21CS101 - Rahul Verma\n21CS102 - Sneha Kulkarni (CR)\n21CS103 - Aarav Mehta\n...`}
                      className="w-full flex-1 text-xs font-mono p-3 rounded-2xl border border-[#E6E3D8] dark:border-[#28332E] bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-[#13523B]"
                    />
                  </div>
                </div>

                {/* AI Action Trigger */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    Analyzed on secure server via Gemini 3.8 Flash
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleLoadSampleRoster}
                      className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                    >
                      Load Sample Text
                    </button>

                    <button
                      type="button"
                      onClick={handleAnalyzeWithAI}
                      disabled={isParsingAI || (!rosterRawText && !uploadedBase64)}
                      className="px-6 py-2 rounded-xl bg-[#13523B] text-white text-xs font-bold hover:bg-[#0E422F] transition-all flex items-center gap-2 shadow-md shadow-[#13523B]/20 cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>{isParsingAI ? 'AI Extracting Roster Details...' : 'Analyze with Gemini AI'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* AI Extracted Review & Alteration Table */}
          {draftStudents && (
            <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-[#E6E3D8] dark:border-[#28332E] p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-700/60">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      Extracted Blueprint
                    </span>
                    <h3 className="text-base font-bold font-serif text-neutral-900 dark:text-white">
                      Review & Alter Details ({draftStudents.length} Students)
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    You can modify any student name, register number, or CR badge directly before saving.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSortDraftByRoll}
                    className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Sort draft students sequentially by roll number"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Sort by Roll #</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddDraftRow}
                    className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Student</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleApplyRosterToLive}
                    disabled={isApplyingRoster}
                    className="px-5 py-2 rounded-xl bg-[#13523B] text-white text-xs font-bold hover:bg-[#0E422F] transition-all flex items-center gap-2 shadow-md shadow-[#13523B]/20 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isApplyingRoster ? 'Saving Classroom...' : 'Confirm & Create Classroom'}</span>
                  </button>
                </div>
              </div>

              {/* Editable Table */}
              <div className="overflow-x-auto max-h-96 border border-[#E6E3D8] dark:border-[#28332E] rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F6F4EB] dark:bg-[#151B18] text-neutral-600 dark:text-neutral-400 font-mono sticky top-0 z-10">
                    <tr>
                      <th className="p-2.5 w-12 text-center">#</th>
                      <th className="p-2.5 w-36">Register / Roll No</th>
                      <th className="p-2.5">Student Full Name</th>
                      <th className="p-2.5">University Email</th>
                      <th className="p-2.5 w-24 text-center">Class Rep (CR)</th>
                      <th className="p-2.5 w-16 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6E3D8] dark:divide-[#28332E]">
                    {draftStudents.map((stu, idx) => (
                      <tr key={idx} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-900/50">
                        <td className="p-2 text-center text-neutral-400 font-mono">{idx + 1}</td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={stu.rollNumber}
                            onChange={(e) => handleUpdateDraftStudent(idx, 'rollNumber', e.target.value.toUpperCase())}
                            className="w-full text-xs font-mono font-bold p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={stu.name}
                            onChange={(e) => handleUpdateDraftStudent(idx, 'name', e.target.value)}
                            className="w-full text-xs font-medium p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="email"
                            value={stu.email}
                            onChange={(e) => handleUpdateDraftStudent(idx, 'email', e.target.value)}
                            className="w-full text-xs p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleUpdateDraftStudent(idx, 'isCR', !stu.isCR)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              stu.isCR
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-bold'
                                : 'text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                            }`}
                            title="Toggle Class Representative"
                          >
                            <Crown className="w-4 h-4" />
                          </button>
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveDraftStudent(idx)}
                            className="p-1 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bottom Confirm Action */}
              <div className="pt-2 flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleApplyRosterToLive}
                  disabled={isApplyingRoster}
                  className="px-6 py-2.5 rounded-xl bg-[#13523B] text-white text-xs font-bold hover:bg-[#0E422F] transition-all flex items-center gap-2 shadow-md shadow-[#13523B]/20 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isApplyingRoster ? 'Finalizing...' : 'Save & Deploy Classroom to Live Attendance'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* TAB 2: ENROLLED STUDENTS ROSTER */}
      {/* ---------------------------------------------------------------- */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          {students.length === 0 ? (
            <div className="text-center py-14 px-4 bg-white dark:bg-neutral-800 rounded-2xl border border-dashed border-[#E6E3D8] dark:border-[#28332E]">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-[#13523B] dark:text-emerald-400 mx-auto flex items-center justify-center mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold font-serif text-neutral-900 dark:text-white">Classroom Roster Starts at Zero (0 Students)</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto mt-1 mb-5">
                The classroom has no enrolled students yet. Generate students using their roll numbers and names in seconds, or enroll students individually.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('roster_import')}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-[#13523B] text-white hover:bg-[#0E422F] flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Students with Roll & Names</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenAddStudent}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-[#E6E3D8] dark:border-[#28332E] text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-900 cursor-pointer"
                >
                  <span>Enroll Single Student</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Roster Controls */}
              <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-[#E6E3D8] dark:border-[#28332E] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search students by name, register number, or email..."
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-[#E6E3D8] dark:border-[#28332E] bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-500 font-mono">
                    Showing {filteredStudents.length} of {students.length} students
                  </span>

                  {isTeacher && (
                    <button
                      type="button"
                      onClick={handleOpenAddStudent}
                      className="px-4 py-2.5 rounded-xl bg-[#13523B] text-white text-xs font-bold hover:bg-[#0E422F] transition-all flex items-center gap-1.5 shadow-sm shadow-[#13523B]/20 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Student</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Students List Table */}
              <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-[#E6E3D8] dark:border-[#28332E] overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#F6F4EB] dark:bg-[#151B18] text-neutral-600 dark:text-neutral-400 font-mono border-b border-[#E6E3D8] dark:border-[#28332E]">
                      <tr>
                        <th className="p-3 w-12 text-center">#</th>
                        <th className="p-3">Register / Roll No</th>
                        <th className="p-3">Full Name</th>
                        <th className="p-3">Role & Authority</th>
                        <th className="p-3">Email Contact</th>
                        <th className="p-3">Section</th>
                        {isTeacher && <th className="p-3 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6E3D8] dark:divide-[#28332E]">
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-neutral-400">
                            No students found matching your search.
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((stu: UserProfile, idx: number) => (
                          <tr key={stu.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-900/50 transition-colors">
                            <td className="p-3 text-center text-neutral-400 font-mono">{idx + 1}</td>
                            <td className="p-3">
                              <span className="font-mono font-bold text-neutral-900 dark:text-white px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-700/60">
                                {stu.rollNumber || 'NO ROLL'}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                <span>{stu.name}</span>
                                {stu.isCR && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                                    <Crown className="w-3 h-3 text-purple-600" />
                                    <span>CR</span>
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <span className={`text-[11px] font-semibold capitalize ${
                                stu.isCR ? 'text-purple-700 dark:text-purple-400' : 'text-neutral-500'
                              }`}>
                                {stu.isCR ? 'Class Representative (CR)' : 'Student'}
                              </span>
                            </td>
                            <td className="p-3 text-neutral-500 dark:text-neutral-400 font-mono text-[11px]">
                              {stu.email}
                            </td>
                            <td className="p-3 font-mono text-neutral-600 dark:text-neutral-300">
                              {stu.section || 'A'}
                            </td>
                            {isTeacher && (
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleCR(stu)}
                                    className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                      stu.isCR
                                        ? 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-950/80 dark:text-purple-300'
                                        : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                                    }`}
                                    title={stu.isCR ? 'Demote from CR' : 'Promote to CR'}
                                  >
                                    <Crown className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditStudent(stu)}
                                    className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                                    title="Edit Student Details"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setStudentToDelete(stu)}
                                    className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                    title="Remove from Roster"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* TAB 3: SUBJECT & CURRICULUM MANAGER */}
      {/* ---------------------------------------------------------------- */}
      {activeTab === 'subjects' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-[#E6E3D8] dark:border-[#28332E] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold font-serif text-neutral-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#13523B] dark:text-emerald-400" />
                <span>Manage Course & Subject Details</span>
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Teacher and CR can manipulate all subject names, course codes, instructors, and credit allocations to match your actual university schedule.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Presets dropdown / button */}
              <button
                type="button"
                onClick={() => handleLoadCurriculumPreset('cse')}
                className="px-3 py-2 rounded-xl border border-[#E6E3D8] dark:border-[#28332E] text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
              >
                Reset to Standard CS Courses
              </button>

              <button
                type="button"
                onClick={handleOpenAddSubject}
                className="px-4 py-2 rounded-xl bg-[#13523B] text-white text-xs font-bold hover:bg-[#0E422F] transition-all flex items-center gap-1.5 shadow-sm shadow-[#13523B]/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Custom Subject</span>
              </button>
            </div>
          </div>

          {/* Subjects Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((sub) => (
              <div
                key={sub.id}
                className="bg-white dark:bg-neutral-800 rounded-2xl border border-[#E6E3D8] dark:border-[#28332E] p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#13523B]/50 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span 
                      className="px-2.5 py-1 rounded-lg text-xs font-bold font-mono text-white"
                      style={{ backgroundColor: sub.color || '#13523B' }}
                    >
                      {sub.code}
                    </span>

                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-700/60 text-neutral-600 dark:text-neutral-300">
                      {sub.credits || 4} Credits • {sub.periodsPerWeek || 4} hrs/wk
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white font-serif leading-snug">
                    {sub.name}
                  </h3>

                  <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400 space-y-1">
                    <div>Faculty: <strong className="text-neutral-800 dark:text-neutral-200">{sub.teacherName}</strong></div>
                    <div>Classroom: <span className="font-mono">{sub.roomNumber || 'LH-302'}</span></div>
                  </div>

                  {sub.syllabus && (
                    <p className="mt-2 text-[11px] text-neutral-400 line-clamp-2">
                      {sub.syllabus}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: sub.color || '#13523B' }} 
                    />
                    <span className="text-[10px] font-mono text-neutral-400">Color Tag</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditSubject(sub)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-700/60 hover:bg-neutral-200 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Details</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSubjectToDelete(sub)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Delete Subject"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Zero State for Subjects */}
          {subjects.length === 0 && (
            <div className="text-center py-12 px-4 bg-white dark:bg-neutral-800 rounded-2xl border border-dashed border-[#E6E3D8] dark:border-[#28332E]">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-[#13523B] dark:text-emerald-400 mx-auto flex items-center justify-center mb-3">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold font-serif text-neutral-900 dark:text-white">Curriculum Starts at Zero (0 Subjects)</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto mt-1 mb-5">
                The classroom curriculum is clean. You can add individual course subjects or load standard university courses anytime.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleOpenAddSubject}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-[#13523B] text-white hover:bg-[#0E422F] flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Subject</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadCurriculumPreset('cse')}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-[#E6E3D8] dark:border-[#28332E] text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-900 cursor-pointer"
                >
                  <span>Load 4 Standard Courses</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* MODAL: ADD / EDIT SINGLE STUDENT */}
      {/* ---------------------------------------------------------------- */}
      {(editingStudent || isNewStudentModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1A221E] rounded-2xl border border-[#E6E3D8] dark:border-[#28332E] shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E6E3D8] dark:border-[#28332E] flex items-center justify-between bg-[#F6F4EB] dark:bg-[#151B18]">
              <h3 className="text-sm font-bold font-serif text-neutral-900 dark:text-white">
                {editingStudent ? 'Edit Student Details' : 'Enroll New Student'}
              </h3>
              <button
                onClick={() => { setEditingStudent(null); setIsNewStudentModalOpen(false); }}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentForm} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={studentFormData.name}
                  onChange={(e) => setStudentFormData({ ...studentFormData, name: e.target.value })}
                  placeholder="e.g. Rahul Verma"
                  className="w-full p-2.5 rounded-xl border border-[#E6E3D8] dark:border-[#28332E] bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Roll / Register No <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={studentFormData.rollNumber}
                    onChange={(e) => setStudentFormData({ ...studentFormData, rollNumber: e.target.value.toUpperCase() })}
                    placeholder="e.g. 21CS101"
                    className="w-full p-2.5 rounded-xl border border-[#E6E3D8] dark:border-[#28332E] bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    value={studentFormData.section}
                    onChange={(e) => setStudentFormData({ ...studentFormData, section: e.target.value })}
                    placeholder="e.g. A"
                    className="w-full p-2.5 rounded-xl border border-[#E6E3D8] dark:border-[#28332E] bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  University Email
                </label>
                <input
                  type="email"
                  value={studentFormData.email}
                  onChange={(e) => setStudentFormData({ ...studentFormData, email: e.target.value })}
                  placeholder="e.g. rahul.v@university.edu"
                  className="w-full p-2.5 rounded-xl border border-[#E6E3D8] dark:border-[#28332E] bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={studentFormData.phone}
                  onChange={(e) => setStudentFormData({ ...studentFormData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full p-2.5 rounded-xl border border-[#E6E3D8] dark:border-[#28332E] bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_cr_checkbox"
                  checked={studentFormData.isCR}
                  onChange={(e) => setStudentFormData({ ...studentFormData, isCR: e.target.checked, role: e.target.checked ? 'cr' : 'student' })}
                  className="w-4 h-4 rounded-md accent-[#13523B]"
                />
                <label htmlFor="is_cr_checkbox" className="font-semibold text-neutral-800 dark:text-neutral-200">
                  Designate as Class Representative (CR)
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-neutral-100 dark:border-neutral-700">
                <button
                  type="button"
                  onClick={() => { setEditingStudent(null); setIsNewStudentModalOpen(false); }}
                  className="px-4 py-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingStudent}
                  className="px-5 py-2 rounded-xl bg-[#13523B] text-white font-bold hover:bg-[#0E422F] transition-all cursor-pointer"
                >
                  {isSavingStudent ? 'Saving...' : 'Save Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* MODAL: ADD / EDIT SUBJECT (Customizable by Teacher and CR) */}
      {/* ---------------------------------------------------------------- */}
      {(editingSubject || isNewSubjectModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1A221E] rounded-2xl border border-[#E6E3D8] dark:border-[#28332E] shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E6E3D8] dark:border-[#28332E] flex items-center justify-between bg-[#F6F4EB] dark:bg-[#151B18]">
              <h3 className="text-sm font-bold font-serif text-neutral-900 dark:text-white">
                {editingSubject ? 'Manipulate Subject Details' : 'Add New Subject'}
              </h3>
              <button
                onClick={() => { setEditingSubject(null); setIsNewSubjectModalOpen(false); }}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSubjectForm} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Course Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={subjectFormData.code}
                    onChange={(e) => setSubjectFormData({ ...subjectFormData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. CS401"
                    className="w-full p-2.5 rounded-xl border border-[#E6E3D8] dark:border-[#28332E] bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Subject Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={subjectFormData.name}
                    onChange={(e) => setSubjectFormData({ ...subjectFormData, name: e.target.value })}
                    placeholder="e.g. Distributed Systems"
                    className="w-full p-2.5 rounded-xl border border-[#E6E3D8] dark:border-[#28332E] bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Faculty In-Charge / Teacher Name
                </label>
                <input
                  type="text"
                  value={subjectFormData.teacherName}
                  onChange={(e) => setSubjectFormData({ ...subjectFormData, teacherName: e.target.value })}
                  placeholder="e.g. Prof. Ananya Sharma"
                  className="w-full p-2.5 rounded-xl border border-[#E6E3D8] dark:border-[#28332E] bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Credits
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={subjectFormData.credits}
                    onChange={(e) => setSubjectFormData({ ...subjectFormData, credits: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-[#E6E3D8] dark:border-[#28332E] bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Hours / Week
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={subjectFormData.periodsPerWeek}
                    onChange={(e) => setSubjectFormData({ ...subjectFormData, periodsPerWeek: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-[#E6E3D8] dark:border-[#28332E] bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Room / Lab
                  </label>
                  <input
                    type="text"
                    value={subjectFormData.roomNumber}
                    onChange={(e) => setSubjectFormData({ ...subjectFormData, roomNumber: e.target.value })}
                    placeholder="LH-302"
                    className="w-full p-2.5 rounded-xl border border-[#E6E3D8] dark:border-[#28332E] bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Color Tag
                </label>
                <div className="flex items-center gap-2">
                  {['#13523B', '#0F4A34', '#1E40AF', '#B45309', '#7C2D12', '#4C1D95', '#047857'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSubjectFormData({ ...subjectFormData, color: c })}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        subjectFormData.color === c ? 'scale-110 ring-2 ring-offset-2 ring-neutral-400' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Course Description / Syllabus Highlights
                </label>
                <textarea
                  rows={2}
                  value={subjectFormData.syllabus}
                  onChange={(e) => setSubjectFormData({ ...subjectFormData, syllabus: e.target.value })}
                  placeholder="Key topics, lab components, or textbook references..."
                  className="w-full p-2.5 rounded-xl border border-[#E6E3D8] dark:border-[#28332E] bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-neutral-100 dark:border-neutral-700">
                <button
                  type="button"
                  onClick={() => { setEditingSubject(null); setIsNewSubjectModalOpen(false); }}
                  className="px-4 py-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSubject}
                  className="px-5 py-2 rounded-xl bg-[#13523B] text-white font-bold hover:bg-[#0E422F] transition-all cursor-pointer"
                >
                  {isSavingSubject ? 'Saving...' : 'Save Subject Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* MODAL: CONFIRM REMOVE STUDENT */}
      {/* ---------------------------------------------------------------- */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1A221E] rounded-2xl border border-[#E6E3D8] dark:border-[#28332E] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold font-serif text-neutral-900 dark:text-white">
                Remove Student from Roster?
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 leading-relaxed">
                Are you sure you want to remove <strong className="text-neutral-900 dark:text-white">{studentToDelete.name}</strong> (<span className="font-mono">{studentToDelete.rollNumber || 'No Roll'}</span>) from this classroom?
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteStudent}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* MODAL: CONFIRM DELETE SUBJECT */}
      {/* ---------------------------------------------------------------- */}
      {subjectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1A221E] rounded-2xl border border-[#E6E3D8] dark:border-[#28332E] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold font-serif text-neutral-900 dark:text-white">
                Delete Course from Curriculum?
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 leading-relaxed">
                Are you sure you want to delete <strong className="text-neutral-900 dark:text-white">{subjectToDelete.name}</strong> (<span className="font-mono">{subjectToDelete.code}</span>)?
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSubjectToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSubject}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* MODAL: RESET CLASSROOM TO ZERO */}
      {/* ---------------------------------------------------------------- */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/65 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1A221E] rounded-2xl border border-rose-200 dark:border-rose-900/60 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold font-serif text-neutral-900 dark:text-white">
                Reset Classroom to Zero (Clean Slate)?
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                This will completely remove all enrolled student roster profiles, all course subjects, past attendance logs, and student requests.
              </p>
              <div className="p-3 bg-neutral-50 dark:bg-neutral-900/80 rounded-xl border border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-500 dark:text-neutral-400">
                ✓ Teacher profile (<span className="font-semibold text-neutral-800 dark:text-neutral-200">{currentUser.name}</span>) and classroom settings will be preserved.<br/>
                ✓ Students and subjects will start from zero so you can build your custom class from scratch.
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                disabled={isResetting}
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleResetClassroomToZero}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isResetting ? 'Purging Classroom Data...' : 'Reset Classroom to Zero'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
