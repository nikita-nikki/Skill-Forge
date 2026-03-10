import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { BookOpen, ChevronDown, ChevronRight, Send, CheckCircle, AlertCircle, UserCircle, ArrowLeft, FileText, Code, Award, X } from 'lucide-react';

const TrackDetail = () => {
    const { trackId } = useParams();
    const navigate = useNavigate();

    const [track, setTrack] = useState(null);
    const [modules, setModules] = useState([]);
    const [expandedModule, setExpandedModule] = useState(null);
    const [tasks, setTasks] = useState({});
    const [loadingTasks, setLoadingTasks] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [enrollment, setEnrollment] = useState({ isEnrolled: false, progressPercentage: 0, status: null });
    const [enrolling, setEnrolling] = useState(false);

    const [activeTask, setActiveTask] = useState(null);
    const [answer, setAnswer] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState(null);

    // Mentor Creation State
    const [showModuleForm, setShowModuleForm] = useState(false);
    const [newModule, setNewModule] = useState({ title: '', description: '', order: '' });
    const [submittingModule, setSubmittingModule] = useState(false);

    const [addingTaskToModule, setAddingTaskToModule] = useState(null);
    const [newTask, setNewTask] = useState({
        question: '',
        taskType: 'text',
        maxAttempts: 3,
        rubric: { clarity: 5, correctness: 5, examples: 5 },
        order: ''
    });
    const [submittingTask, setSubmittingTask] = useState(false);

    // Inline Order Editing State
    const [editingModuleOrder, setEditingModuleOrder] = useState(null);
    const [editModuleOrderValue, setEditModuleOrderValue] = useState('');

    const [editingTaskOrder, setEditingTaskOrder] = useState(null);
    const [editTaskOrderValue, setEditTaskOrderValue] = useState('');

    useEffect(() => {
        const fetchTrackData = async () => {
            try {
                const tracksRes = await api.get('/tracks');
                const allTracks = tracksRes.data.data || [];
                let found = allTracks.find(t => t._id === trackId);

                // If not found in published tracks, check mentor's own tracks (drafts)
                if (!found && localStorage.getItem('userRole') === 'mentor') {
                    try {
                        const myTracksRes = await api.get('/tracks/my');
                        const myTracks = myTracksRes.data.data || [];
                        found = myTracks.find(t => t._id === trackId);
                    } catch (e) {
                        // silently handle if '/tracks/my' fails
                    }
                }

                setTrack(found || null);

                const modulesRes = await api.get(`/tracks/${trackId}/modules`);
                setModules(modulesRes.data.data || []);

                try {
                    const enrollRes = await api.get(`/tracks/${trackId}/enrollment-status`);
                    setEnrollment(enrollRes.data.data);
                } catch (e) {
                    // Not enrolled or not a learner — keep defaults
                }
            } catch (err) {
                setError('Failed to load track details.');
            } finally {
                setLoading(false);
            }
        };
        fetchTrackData();
    }, [trackId]);

    const toggleModule = async (moduleId) => {
        if (expandedModule === moduleId) {
            setExpandedModule(null);
            return;
        }
        setExpandedModule(moduleId);

        if (!tasks[moduleId]) {
            setLoadingTasks(prev => ({ ...prev, [moduleId]: true }));
            try {
                const res = await api.get(`/modules/${moduleId}/tasks`);
                setTasks(prev => ({ ...prev, [moduleId]: res.data.data || [] }));
            } catch {
                setTasks(prev => ({ ...prev, [moduleId]: [] }));
            } finally {
                setLoadingTasks(prev => ({ ...prev, [moduleId]: false }));
            }
        }
    };

    const handleEnroll = async () => {
        setEnrolling(true);
        try {
            await api.post(`/tracks/${trackId}/enroll`);
            setEnrollment({ isEnrolled: true, progressPercentage: 0, status: 'active' });
        } catch (err) {
            alert(err.response?.data?.message || 'Enrollment failed.');
        } finally {
            setEnrolling(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!answer.trim() || !activeTask) return;
        setSubmitting(true);
        setSubmitResult(null);
        try {
            await api.post(`/tasks/${activeTask._id}/submit`, { answer });
            setSubmitResult({ success: true, message: 'Submission successful!' });
            setAnswer('');
        } catch (err) {
            setSubmitResult({ success: false, message: err.response?.data?.message || 'Submission failed.' });
        } finally {
            setSubmitting(false);
        }
    };

    const userRole = localStorage.getItem('userRole');
    const isMentor = userRole === 'mentor';

    const handleCreateModule = async (e) => {
        e.preventDefault();
        if (!newModule.title.trim()) return;
        setSubmittingModule(true);
        try {
            const moduleOrder = newModule.order ? parseInt(newModule.order) : modules.length + 1;
            const res = await api.post(`/tracks/${trackId}/modules`, {
                ...newModule,
                order: moduleOrder,
                isPublished: true
            });
            const updatedModules = [...modules, res.data.data].sort((a, b) => a.order - b.order);
            setModules(updatedModules);
            setNewModule({ title: '', description: '', order: '' });
            setShowModuleForm(false);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create module.');
        } finally {
            setSubmittingModule(false);
        }
    };

    const handleCreateTask = async (e, moduleId) => {
        e.preventDefault();
        if (!newTask.question.trim()) return;
        setSubmittingTask(true);
        try {
            const taskOrder = newTask.order ? parseInt(newTask.order) : (tasks[moduleId] || []).length + 1;
            const res = await api.post(`/modules/${moduleId}/tasks`, {
                ...newTask,
                order: taskOrder,
                isPublished: true
            });
            setTasks(prev => {
                const moduleTasks = [...(prev[moduleId] || []), res.data.data].sort((a, b) => a.order - b.order);
                return { ...prev, [moduleId]: moduleTasks };
            });
            setNewTask({ question: '', taskType: 'text', maxAttempts: 3, rubric: { clarity: 5, correctness: 5, examples: 5 }, order: '' });
            setAddingTaskToModule(null);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create task.');
        } finally {
            setSubmittingTask(false);
        }
    };

    const handleUpdateModuleOrder = async (moduleId) => {
        try {
            const newOrder = parseInt(editModuleOrderValue);
            if (isNaN(newOrder) || newOrder < 1) return setEditingModuleOrder(null);

            await api.patch(`/modules/${moduleId}`, { order: newOrder });

            setModules(prev =>
                prev.map(m => m._id === moduleId ? { ...m, order: newOrder } : m)
                    .sort((a, b) => a.order - b.order)
            );
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update module order.');
        } finally {
            setEditingModuleOrder(null);
        }
    };

    const handleUpdateTaskOrder = async (moduleId, taskId) => {
        try {
            const newOrder = parseInt(editTaskOrderValue);
            if (isNaN(newOrder) || newOrder < 1) return setEditingTaskOrder(null);

            await api.patch(`/tasks/${taskId}`, { order: newOrder });

            setTasks(prev => {
                const updatedTasks = (prev[moduleId] || []).map(t =>
                    t._id === taskId ? { ...t, order: newOrder } : t
                ).sort((a, b) => a.order - b.order);
                return { ...prev, [moduleId]: updatedTasks };
            });
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update task order.');
        } finally {
            setEditingTaskOrder(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
                {/* Back button */}
                <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-secondary mb-6 text-sm font-medium transition-colors py-2">
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>

                {error && (
                    <div className="mb-6 p-4 bg-secondary/10 text-red-600 rounded-lg border border-secondary/30 text-sm">{error}</div>
                )}

                {/* Track Header */}
                {track && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 sm:p-8 mb-8">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                    <span className="inline-block px-3 py-1 bg-tertiary/20 text-red-800 text-xs font-semibold rounded-full border border-tertiary/40">
                                        {track.difficulty || 'Beginner'}
                                    </span>
                                    {!isMentor && (
                                        enrollment.isEnrolled ? (
                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full border border-green-200">
                                                <CheckCircle size={12} /> Enrolled
                                            </span>
                                        ) : (
                                            <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full border border-slate-200">
                                                Not Enrolled
                                            </span>
                                        )
                                    )}
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3">{track.title}</h1>
                                <p className="text-slate-600 leading-relaxed text-sm sm:text-base">{track.description}</p>
                                <div className="flex items-center gap-2 mt-4 text-sm text-slate-500">
                                    <UserCircle size={16} className="shrink-0" />
                                    <span>By Mentor {track.track_owner?.name || track.createdBy?.name || 'Unknown'}</span>
                                </div>

                                {/* Enrollment Actions / Progress */}
                                {!isMentor && (
                                    <div className="mt-6">
                                        {enrollment.isEnrolled ? (
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                        <Award size={16} className="text-primary" /> Progress
                                                    </span>
                                                    <span className="text-sm font-bold text-slate-800">{enrollment.progressPercentage}%</span>
                                                </div>
                                                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-500"
                                                        style={{ width: `${enrollment.progressPercentage}%`, background: 'linear-gradient(90deg, #BADFDB, #6dbb9e)' }}
                                                    />
                                                </div>
                                                <p className="text-xs text-slate-500 mt-2 capitalize">Status: {enrollment.status}</p>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={handleEnroll}
                                                disabled={enrolling}
                                                className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-white font-semibold py-3 px-6 rounded-md transition-all text-sm w-full sm:w-auto"
                                            >
                                                <BookOpen size={16} />
                                                {enrolling ? 'Enrolling...' : 'Enroll in this Track'}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                            <BookOpen size={44} className="text-primary/40 hidden sm:block shrink-0 ml-4" />
                        </div>
                    </div>
                )}

                {/* Modules Accordion */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Course Modules</h2>

                    {modules.length === 0 ? (
                        <div className="bg-white rounded-xl p-8 text-center border border-slate-100 shadow-sm">
                            <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                            <p className="text-slate-500">No modules available for this track yet.</p>
                        </div>
                    ) : (
                        modules.map((mod, idx) => (
                            <div key={mod._id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                                {/* Module Header */}
                                <button
                                    onClick={() => toggleModule(mod._id)}
                                    className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left gap-3"
                                >
                                    <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                                        {isMentor && editingModuleOrder === mod._id ? (
                                            <input
                                                type="number"
                                                min="1"
                                                autoFocus
                                                value={editModuleOrderValue}
                                                onChange={(e) => setEditModuleOrderValue(e.target.value)}
                                                onBlur={() => handleUpdateModuleOrder(mod._id)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleUpdateModuleOrder(mod._id)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="shrink-0 h-8 w-12 text-center rounded bg-white text-teal-800 text-sm font-bold border-2 border-primary focus:outline-none"
                                            />
                                        ) : (
                                            <span
                                                onClick={(e) => {
                                                    if (isMentor) {
                                                        e.stopPropagation();
                                                        setEditingModuleOrder(mod._id);
                                                        setEditModuleOrderValue(mod.order || idx + 1);
                                                    }
                                                }}
                                                title={isMentor ? "Click to edit order" : ""}
                                                className={`flex shrink-0 items-center justify-center h-8 w-8 rounded-full ${isMentor ? 'cursor-text hover:bg-primary/50' : ''} bg-primary/30 text-teal-800 text-sm font-bold transition-colors`}
                                            >
                                                {mod.order || idx + 1}
                                            </span>
                                        )}
                                        <div className="min-w-0">
                                            <h3 className="text-base sm:text-lg font-semibold text-slate-800">{mod.title}</h3>
                                            {mod.description && (
                                                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{mod.description}</p>
                                            )}
                                        </div>
                                    </div>
                                    {expandedModule === mod._id ? (
                                        <ChevronDown size={20} className="text-slate-400 shrink-0" />
                                    ) : (
                                        <ChevronRight size={20} className="text-slate-400 shrink-0" />
                                    )}
                                </button>

                                {/* Tasks List */}
                                {expandedModule === mod._id && (
                                    <div className="border-t border-slate-100 bg-slate-50/50">
                                        {loadingTasks[mod._id] ? (
                                            <div className="flex justify-center py-6">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                            </div>
                                        ) : (tasks[mod._id] || []).length === 0 ? (
                                            <p className="p-5 text-slate-500 text-sm text-center">No tasks in this module yet.</p>
                                        ) : (
                                            <div className="divide-y divide-slate-100">
                                                {(tasks[mod._id] || []).map((task, tIdx) => (
                                                    <div key={task._id} className="p-4 sm:p-5">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                                                <div className="mt-1 shrink-0">
                                                                    {task.taskType === 'code' ? (
                                                                        <Code size={16} className="text-purple-500" />
                                                                    ) : (
                                                                        <FileText size={16} className="text-blue-500" />
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        {isMentor && editingTaskOrder === task._id ? (
                                                                            <input
                                                                                type="number"
                                                                                min="1"
                                                                                autoFocus
                                                                                value={editTaskOrderValue}
                                                                                onChange={(e) => setEditTaskOrderValue(e.target.value)}
                                                                                onBlur={() => handleUpdateTaskOrder(mod._id, task._id)}
                                                                                onKeyDown={(e) => e.key === 'Enter' && handleUpdateTaskOrder(mod._id, task._id)}
                                                                                className="h-6 w-12 text-center rounded bg-slate-100 text-slate-800 text-sm font-bold border-2 border-primary focus:outline-none"
                                                                            />
                                                                        ) : (
                                                                            <p
                                                                                onClick={() => {
                                                                                    if (isMentor) {
                                                                                        setEditingTaskOrder(task._id);
                                                                                        setEditTaskOrderValue(task.order || tIdx + 1);
                                                                                    }
                                                                                }}
                                                                                title={isMentor ? "Click to edit order" : ""}
                                                                                className={`font-medium text-slate-800 text-sm ${isMentor ? 'cursor-text hover:text-primary transition-colors hover:bg-slate-100 px-1 rounded' : ''}`}
                                                                            >
                                                                                Task {task.order || tIdx + 1}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-slate-600 mt-1 text-sm leading-relaxed">{task.question}</p>
                                                                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
                                                                        <span className="capitalize">Type: {task.taskType}</span>
                                                                        <span>Max attempts: {task.maxAttempts}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {!isMentor && (
                                                                <button
                                                                    onClick={() => {
                                                                        setActiveTask(activeTask?._id === task._id ? null : task);
                                                                        setAnswer('');
                                                                        setSubmitResult(null);
                                                                    }}
                                                                    className={`shrink-0 px-3 py-2 rounded-md text-xs font-medium transition-all whitespace-nowrap ${activeTask?._id === task._id
                                                                        ? 'bg-secondary text-white'
                                                                        : 'bg-primary/20 text-teal-800 hover:bg-primary/40'
                                                                        }`}
                                                                >
                                                                    {activeTask?._id === task._id ? <X size={14} /> : 'Answer'}
                                                                </button>
                                                            )}
                                                        </div>

                                                        {/* Submission Form */}
                                                        {activeTask?._id === task._id && (
                                                            <div className="mt-4 p-4 bg-white rounded-lg border border-slate-200">
                                                                <form onSubmit={handleSubmit} className="space-y-3">
                                                                    <label className="block text-sm font-medium text-slate-700">Your Answer</label>
                                                                    <textarea
                                                                        value={answer}
                                                                        onChange={(e) => setAnswer(e.target.value)}
                                                                        rows={task.taskType === 'code' ? 8 : 4}
                                                                        className={`w-full px-4 py-3 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm resize-y ${task.taskType === 'code' ? 'font-mono bg-slate-900 text-green-400' : ''}`}
                                                                        placeholder={task.taskType === 'code' ? '// Write your code here...' : 'Type your answer here...'}
                                                                        required
                                                                    />
                                                                    <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
                                                                        <button
                                                                            type="submit"
                                                                            disabled={submitting}
                                                                            className="flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-white font-semibold py-2.5 px-5 rounded-md transition-all text-sm w-full sm:w-auto"
                                                                        >
                                                                            <Send size={14} />
                                                                            {submitting ? 'Submitting...' : 'Submit'}
                                                                        </button>
                                                                        {submitResult && (
                                                                            <div className={`flex items-center gap-2 text-sm font-medium ${submitResult.success ? 'text-green-600' : 'text-red-600'}`}>
                                                                                {submitResult.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                                                                {submitResult.message}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </form>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {/* Add Task Button & Form */}
                                        {isMentor && expandedModule === mod._id && (
                                            <div className="p-4 sm:p-5 border-t border-slate-200">
                                                {addingTaskToModule === mod._id ? (
                                                    <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                                                        <form onSubmit={(e) => handleCreateTask(e, mod._id)} className="space-y-4">
                                                            <h4 className="font-semibold text-slate-800 text-sm border-b pb-2">Create New Task</h4>
                                                            <div>
                                                                <label className="block text-xs font-semibold text-slate-700 mb-1">Question/Problem Statement</label>
                                                                <textarea
                                                                    value={newTask.question}
                                                                    onChange={e => setNewTask({ ...newTask, question: e.target.value })}
                                                                    required className="w-full text-sm border rounded-md p-2" rows="3"
                                                                />
                                                            </div>
                                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                                <div>
                                                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Task Type</label>
                                                                    <select value={newTask.taskType} onChange={e => setNewTask({ ...newTask, taskType: e.target.value })} className="w-full text-sm border rounded-md p-2">
                                                                        <option value="text">Text Response</option>
                                                                        <option value="code">Code Implementation</option>
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Max Attempts</label>
                                                                    <input type="number" min="1" value={newTask.maxAttempts} onChange={e => setNewTask({ ...newTask, maxAttempts: parseInt(e.target.value) })} className="w-full text-sm border rounded-md p-2" />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Order Index (Optional)</label>
                                                                    <input type="number" min="1" value={newTask.order} onChange={e => setNewTask({ ...newTask, order: e.target.value })} className="w-full text-sm border rounded-md p-2" placeholder={`Default: ${(tasks[mod._id] || []).length + 1}`} />
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-3 gap-4 bg-slate-50 p-3 rounded border">
                                                                <div>
                                                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Clarity Score</label>
                                                                    <input type="number" min="0" value={newTask.rubric.clarity} onChange={e => setNewTask({ ...newTask, rubric: { ...newTask.rubric, clarity: parseInt(e.target.value) } })} className="w-full text-sm border rounded-md p-1.5" />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Correctness</label>
                                                                    <input type="number" min="0" value={newTask.rubric.correctness} onChange={e => setNewTask({ ...newTask, rubric: { ...newTask.rubric, correctness: parseInt(e.target.value) } })} className="w-full text-sm border rounded-md p-1.5" />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Examples</label>
                                                                    <input type="number" min="0" value={newTask.rubric.examples} onChange={e => setNewTask({ ...newTask, rubric: { ...newTask.rubric, examples: parseInt(e.target.value) } })} className="w-full text-sm border rounded-md p-1.5" />
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3 pt-2">
                                                                <button type="submit" disabled={submittingTask} className="bg-secondary hover:bg-secondary/90 text-white text-xs font-semibold py-2 px-4 rounded transition-colors">
                                                                    {submittingTask ? 'Saving Component...' : 'Save Task'}
                                                                </button>
                                                                <button type="button" onClick={() => setAddingTaskToModule(null)} className="text-slate-500 hover:text-slate-700 text-xs font-medium">Cancel</button>
                                                            </div>
                                                        </form>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setAddingTaskToModule(mod._id)} className="flex items-center gap-2 text-secondary hover:text-secondary/80 text-sm font-semibold transition-colors bg-secondary/10 px-4 py-2 rounded-md">
                                                        <BookOpen size={16} /> Add Task to Module
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}

                    {/* Add Module Button & Form */}
                    {isMentor && (
                        <div className="mt-6">
                            {showModuleForm ? (
                                <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <form onSubmit={handleCreateModule} className="space-y-4">
                                        <h3 className="font-bold text-slate-800 border-b pb-3 mb-4">Create New Module</h3>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Module Title</label>
                                            <input
                                                value={newModule.title}
                                                onChange={e => setNewModule({ ...newModule, title: e.target.value })}
                                                required className="w-full border rounded-md p-2.5 text-sm"
                                                placeholder="e.g. Introduction to HTML"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Description (Optional)</label>
                                            <textarea
                                                value={newModule.description}
                                                onChange={e => setNewModule({ ...newModule, description: e.target.value })}
                                                className="w-full border rounded-md p-2.5 text-sm" rows="2"
                                                placeholder="Brief overview of what this module covers"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Order Index (Optional)</label>
                                            <input
                                                type="number" min="1"
                                                value={newModule.order}
                                                onChange={e => setNewModule({ ...newModule, order: e.target.value })}
                                                className="w-full border rounded-md p-2.5 text-sm"
                                                placeholder={`Default: ${modules.length + 1}`}
                                            />
                                        </div>
                                        <div className="flex items-center gap-3 pt-2">
                                            <button type="submit" disabled={submittingModule} className="bg-primary hover:bg-primary/90 text-teal-900 font-bold py-2 px-5 rounded-md transition-colors text-sm">
                                                {submittingModule ? 'Adding Module...' : 'Save Module'}
                                            </button>
                                            <button type="button" onClick={() => setShowModuleForm(false)} className="text-slate-500 hover:text-slate-700 text-sm font-medium">Cancel</button>
                                        </div>
                                    </form>
                                </div>
                            ) : (
                                <button onClick={() => setShowModuleForm(true)} className="flex items-center gap-2 border-2 border-dashed border-slate-300 hover:border-primary/50 text-slate-500 hover:text-primary transition-all w-full p-4 rounded-xl justify-center font-semibold text-sm">
                                    <BookOpen size={18} /> Add New Module to Track
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default TrackDetail;
