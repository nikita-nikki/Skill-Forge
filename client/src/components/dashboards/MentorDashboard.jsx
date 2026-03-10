import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import {
    BookOpen, BarChart3, ChevronRight, Plus,
    ClipboardCheck, RefreshCw, Play, AlertCircle,
    CheckCircle2, Clock, Loader2, XCircle
} from 'lucide-react';

/* ─── helpers ──────────────────────────────────────────────── */
const STATUS_CONFIG = {
    pending: { label: 'Pending', icon: Clock, cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    processing: { label: 'Processing', icon: Loader2, cls: 'bg-blue-100 text-blue-700 border-blue-200' },
    evaluated: { label: 'Evaluated', icon: CheckCircle2, cls: 'bg-green-100 text-green-700 border-green-200' },
    failed: { label: 'Failed', icon: XCircle, cls: 'bg-red-100 text-red-700 border-red-200' },
};

const StatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border ${cfg.cls}`}>
            <Icon size={11} className={status === 'processing' ? 'animate-spin' : ''} />
            {cfg.label}
        </span>
    );
};

/* ─── main component ────────────────────────────────────────── */
const MentorDashboard = ({ tab }) => {
    const navigate = useNavigate();
    const activeTab = tab || 'my-tracks';

    /* shared state */
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    /* new-track form state */
    const [newTrack, setNewTrack] = useState({
        title: '', description: '', difficulty: 'beginner'
    });

    /* evaluations tab state */
    const [selectedTrackId, setSelectedTrackId] = useState('');
    const [submissions, setSubmissions] = useState([]);
    const [evalLoading, setEvalLoading] = useState(false);
    const [evalError, setEvalError] = useState('');
    const [actionLoading, setActionLoading] = useState({}); // { [submissionId]: bool }
    const [toast, setToast] = useState(null);

    /* performance tab state */
    const [performanceData, setPerformanceData] = useState({});
    const [performanceLoading, setPerformanceLoading] = useState(false);

    /* ── fetch mentor tracks ── */
    const fetchMyTracks = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get('/tracks/my');
            const data = response.data.data || [];
            setTracks(data);
            // auto-select first track in evaluations tab
            if (activeTab === 'evaluations' && data.length > 0 && !selectedTrackId) {
                setSelectedTrackId(data[0]._id);
            }
        } catch {
            setError('Failed to fetch your tracks.');
        } finally {
            setLoading(false);
        }
    }, [activeTab, selectedTrackId]);

    useEffect(() => {
        if (['my-tracks', 'performance', 'evaluations'].includes(activeTab)) {
            fetchMyTracks();
        } else {
            setLoading(false);
        }
    }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

    /* ── fetch submissions for selected track ── */
    const fetchSubmissions = useCallback(async (trackId) => {
        if (!trackId) return;
        setEvalLoading(true);
        setEvalError('');
        try {
            const res = await api.get(`/tasks/track/${trackId}`);
            setSubmissions(res.data.data || []);
        } catch (err) {
            setEvalError(err.response?.data?.message || 'Failed to load submissions.');
        } finally {
            setEvalLoading(false);
        }
    }, []);

    /* ── silent background refresh (no spinner) for polling ── */
    const fetchSubmissionsSilent = useCallback(async (trackId) => {
        if (!trackId) return;
        try {
            const res = await api.get(`/tasks/track/${trackId}`);
            setSubmissions(res.data.data || []);
        } catch {
            // silent — don't override error state during polling
        }
    }, []);

    /* ── auto-poll every 5s while any submission is 'processing' ── */
    useEffect(() => {
        const hasProcessing = submissions.some(s => s.status === 'processing');
        if (!hasProcessing || !selectedTrackId) return;

        const interval = setInterval(() => {
            fetchSubmissionsSilent(selectedTrackId);
        }, 5000);

        return () => clearInterval(interval);
    }, [submissions, selectedTrackId, fetchSubmissionsSilent]);

    useEffect(() => {
        if (activeTab === 'evaluations' && selectedTrackId) {
            fetchSubmissions(selectedTrackId);
        }
    }, [activeTab, selectedTrackId, fetchSubmissions]);

    /* ── fetch performance analytics ── */
    const fetchPerformanceData = useCallback(async () => {
        if (tracks.length === 0) return;
        setPerformanceLoading(true);
        try {
            const promises = tracks.map(track =>
                api.get(`/analytics/tracks/${track._id}/analytics`)
                    .then(res => ({ trackId: track._id, data: res.data.data }))
                    .catch(err => ({ trackId: track._id, error: true }))
            );
            const results = await Promise.all(promises);
            const perfMap = {};
            results.forEach(res => {
                if (!res.error && res.data) {
                    perfMap[res.trackId] = res.data;
                }
            });
            setPerformanceData(perfMap);
        } catch (err) {
            console.error("Failed to fetch performance analytics");
        } finally {
            setPerformanceLoading(false);
        }
    }, [tracks]);

    useEffect(() => {
        if (activeTab === 'performance' && tracks.length > 0) {
            fetchPerformanceData();
        }
    }, [activeTab, tracks, fetchPerformanceData]);

    /* ── show toast ── */
    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    /* ── evaluate a pending submission ── */
    const handleEvaluate = async (submissionId) => {
        setActionLoading(prev => ({ ...prev, [submissionId]: true }));
        try {
            await api.post(`/submissions/${submissionId}/evaluate`);
            showToast('Evaluation queued successfully!');
            // optimistic update
            setSubmissions(prev =>
                prev.map(s => s._id === submissionId ? { ...s, status: 'processing' } : s)
            );
        } catch (err) {
            showToast(err.response?.data?.message || 'Evaluation failed.', 'error');
        } finally {
            setActionLoading(prev => ({ ...prev, [submissionId]: false }));
        }
    };

    /* ── retry a failed submission ── */
    const handleRetry = async (submissionId) => {
        setActionLoading(prev => ({ ...prev, [submissionId]: true }));
        try {
            await api.post(`/submissions/${submissionId}/evaluation`);
            showToast('Retry queued successfully!');
            setSubmissions(prev =>
                prev.map(s => s._id === submissionId ? { ...s, status: 'processing' } : s)
            );
        } catch (err) {
            showToast(err.response?.data?.message || 'Retry failed.', 'error');
        } finally {
            setActionLoading(prev => ({ ...prev, [submissionId]: false }));
        }
    };

    /* ── create track ── */
    const handleCreateTrack = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/tracks', { ...newTrack, isPublished: false });
            showToast('Track draft created. You can publish it from My Tracks.');
            setNewTrack({ title: '', description: '', difficulty: 'beginner' });
            navigate('/dashboard?tab=my-tracks');
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to create track.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    /* ── toggle track publish status ── */
    const handleTogglePublish = async (trackId, currentStatus) => {
        try {
            await api.patch(`/tracks/toggle/publish/${trackId}`);
            showToast(`Track ${currentStatus ? 'unpublished' : 'published'} successfully.`);
            setTracks(prev => prev.map(t => t._id === trackId ? { ...t, isPublished: !t.isPublished } : t));
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to update track status.', 'error');
        }
    };

    /* ── loading spinner ── */
    if (loading) {
        return (
            <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
        );
    }

    /* ════════════════════════════════════════════════════════════
       TAB: NEW TRACK
    ════════════════════════════════════════════════════════════ */
    if (activeTab === 'new-track') {
        return (
            <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-100">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <BookOpen /> Create New Track
                </h2>
                <form onSubmit={handleCreateTrack} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Track Title</label>
                        <input
                            type="text"
                            value={newTrack.title}
                            onChange={(e) => setNewTrack({ ...newTrack, title: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-base"
                            placeholder="e.g. Master React.js"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                        <textarea
                            value={newTrack.description}
                            onChange={(e) => setNewTrack({ ...newTrack, description: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none h-32 resize-none text-base"
                            placeholder="What will students learn in this track?"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Difficulty</label>
                        <select
                            value={newTrack.difficulty}
                            onChange={(e) => setNewTrack({ ...newTrack, difficulty: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-base"
                        >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                        </select>
                    </div>
                    <div className="flex gap-4 pt-2">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 py-3 bg-secondary hover:bg-secondary/90 text-white font-bold rounded-lg transition-colors shadow-lg text-base"
                        >
                            {submitting ? 'Saving...' : 'Save Track Draft'}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    /* ════════════════════════════════════════════════════════════
       TAB: PERFORMANCE
    ════════════════════════════════════════════════════════════ */
    if (activeTab === 'performance') {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center gap-2">
                    <BarChart3 className="text-secondary shrink-0" />
                    <h2 className="text-lg sm:text-xl font-bold text-slate-800">Track Performance</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[600px]">
                        <thead className="bg-slate-50 text-slate-500 font-semibold">
                            <tr>
                                <th className="px-5 py-4">Track Name</th>
                                <th className="px-5 py-4 text-center">Avg Score</th>
                                <th className="px-5 py-4">Most Difficult Task</th>
                                <th className="px-5 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {tracks.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-5 py-12 text-center text-slate-500 italic">No tracks created yet.</td>
                                </tr>
                            ) : performanceLoading ? (
                                <tr>
                                    <td colSpan="4" className="px-5 py-12 text-center">
                                        <div className="flex justify-center items-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                tracks.map((track) => {
                                    const perf = performanceData[track._id];
                                    return (
                                        <tr key={track._id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-5 py-4 font-bold text-slate-800">
                                                <div className="flex items-center gap-2">
                                                    <span className={`h-2 w-2 rounded-full ${track.isPublished ? 'bg-green-500' : 'bg-slate-300'}`} title={track.isPublished ? 'Published' : 'Draft'}></span>
                                                    <span className="line-clamp-1">{track.title}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                {perf && perf.averageScore !== undefined ? (
                                                    <span className={`font-bold ${perf.averageScore >= 12 ? 'text-green-600' : perf.averageScore >= 7.5 ? 'text-blue-600' : 'text-orange-500'}`}>
                                                        {perf.averageScore} <span className="text-slate-400 font-normal text-xs">pts</span>
                                                    </span>
                                                ) : <span className="text-slate-300">—</span>}
                                            </td>
                                            <td className="px-5 py-4 text-slate-600">
                                                {perf && perf.mostDifficultTask ? (
                                                    <p className="line-clamp-2 text-xs bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200">
                                                        {perf.mostDifficultTask}
                                                    </p>
                                                ) : <span className="text-slate-300 italic text-xs">Insufficient data</span>}
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <button
                                                    onClick={() => navigate(`/track/${track._id}`)}
                                                    className="text-primary hover:text-teal-700 font-semibold flex items-center justify-center gap-1 whitespace-nowrap mx-auto"
                                                >
                                                    View Details <ChevronRight size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    /* ════════════════════════════════════════════════════════════
       TAB: EVALUATIONS
    ════════════════════════════════════════════════════════════ */
    if (activeTab === 'evaluations') {
        return (
            <div className="space-y-6">
                {/* Toast */}
                {toast && (
                    <div className={`fixed top-20 right-5 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold transition-all
                        ${toast.type === 'error'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-green-50 text-green-700 border border-green-200'}`}>
                        {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                        {toast.msg}
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <ClipboardCheck className="text-secondary" /> Learner Submissions
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">Review and trigger AI evaluation for your tracks.</p>
                    </div>
                    <button
                        onClick={() => fetchSubmissions(selectedTrackId)}
                        disabled={evalLoading || !selectedTrackId}
                        className="self-start sm:self-auto flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                    >
                        <RefreshCw size={15} className={evalLoading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>

                {/* Track Selector */}
                {tracks.length === 0 ? (
                    <div className="text-center py-16 text-slate-500">
                        <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                        <p>No tracks yet. <button onClick={() => navigate('/dashboard?tab=new-track')} className="text-secondary font-semibold hover:underline">Create one</button> to get started.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-wrap gap-2">
                            {tracks.map(track => (
                                <button
                                    key={track._id}
                                    onClick={() => setSelectedTrackId(track._id)}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all
                                        ${selectedTrackId === track._id
                                            ? 'bg-secondary text-white border-secondary shadow-md'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-secondary/50 hover:text-secondary'}`}
                                >
                                    {track.title}
                                </button>
                            ))}
                        </div>

                        {/* Submissions Table */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                            {evalLoading ? (
                                <div className="flex justify-center items-center py-16">
                                    <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-secondary"></div>
                                </div>
                            ) : evalError ? (
                                <div className="flex items-center justify-center gap-2 py-12 text-red-500 text-sm">
                                    <AlertCircle size={18} /> {evalError}
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm min-w-[640px]">
                                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                                            <tr>
                                                <th className="px-5 py-4">Learner</th>
                                                <th className="px-5 py-4">Task</th>
                                                <th className="px-5 py-4">Status</th>
                                                <th className="px-5 py-4 hidden md:table-cell">Score</th>
                                                <th className="px-5 py-4 hidden lg:table-cell">Submitted</th>
                                                <th className="px-5 py-4 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {submissions.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="px-5 py-14 text-center text-slate-400 italic">
                                                        No submissions yet for this track.
                                                    </td>
                                                </tr>
                                            ) : (
                                                submissions.map(sub => {
                                                    const isActing = !!actionLoading[sub._id];
                                                    const maxScore = sub.task?.rubric
                                                        ? (sub.task.rubric.clarity || 0) + (sub.task.rubric.correctness || 0) + (sub.task.rubric.examples || 0)
                                                        : 15;
                                                    const scoreRatio = sub.evaluation ? (sub.evaluation.score / maxScore) : 0;

                                                    return (
                                                        <tr key={sub._id} className="hover:bg-slate-50/50 transition-colors">
                                                            {/* Learner */}
                                                            <td className="px-5 py-4">
                                                                <p className="font-semibold text-slate-800">{sub.user?.name || '—'}</p>
                                                                <p className="text-xs text-slate-400">{sub.user?.email || ''}</p>
                                                            </td>

                                                            {/* Task */}
                                                            <td className="px-5 py-4 text-slate-600 max-w-[200px]">
                                                                <p className="line-clamp-2 text-sm">{sub.task?.question || '—'}</p>
                                                            </td>

                                                            {/* Status */}
                                                            <td className="px-5 py-4">
                                                                <StatusBadge status={sub.status} />
                                                            </td>

                                                            {/* Score */}
                                                            <td className="px-5 py-4 hidden md:table-cell">
                                                                {sub.evaluation ? (
                                                                    <span className={`font-bold text-base ${scoreRatio >= 0.8 ? 'text-green-600' : scoreRatio >= 0.5 ? 'text-blue-600' : 'text-orange-500'}`}>
                                                                        {sub.evaluation.score}<span className="text-slate-400 font-normal text-xs"> / {maxScore}</span>
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-300 text-sm">—</span>
                                                                )}
                                                            </td>

                                                            {/* Date */}
                                                            <td className="px-5 py-4 text-slate-400 text-xs hidden lg:table-cell">
                                                                {new Date(sub.createdAt).toLocaleDateString()}
                                                            </td>

                                                            {/* Action */}
                                                            <td className="px-5 py-4 text-center">
                                                                {sub.status === 'pending' && (
                                                                    <button
                                                                        onClick={() => handleEvaluate(sub._id)}
                                                                        disabled={isActing}
                                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary/10 hover:bg-secondary text-secondary hover:text-white text-xs font-bold rounded-lg border border-secondary/30 hover:border-secondary transition-all disabled:opacity-50"
                                                                    >
                                                                        {isActing
                                                                            ? <Loader2 size={13} className="animate-spin" />
                                                                            : <Play size={13} />}
                                                                        {isActing ? 'Queuing…' : 'Evaluate'}
                                                                    </button>
                                                                )}
                                                                {sub.status === 'failed' && (
                                                                    <button
                                                                        onClick={() => handleRetry(sub._id)}
                                                                        disabled={isActing}
                                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white text-xs font-bold rounded-lg border border-red-200 hover:border-red-500 transition-all disabled:opacity-50"
                                                                    >
                                                                        {isActing
                                                                            ? <Loader2 size={13} className="animate-spin" />
                                                                            : <RefreshCw size={13} />}
                                                                        {isActing ? 'Retrying…' : 'Retry'}
                                                                    </button>
                                                                )}
                                                                {(sub.status === 'processing' || sub.status === 'evaluated') && (
                                                                    <span className="text-slate-300 text-xs">—</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        );
    }

    /* ════════════════════════════════════════════════════════════
       TAB: MY TRACKS (default)
    ════════════════════════════════════════════════════════════ */
    return (
        <div>
            <div className="mb-6 border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800">My Published Tracks</h2>
                    <p className="text-slate-500 text-sm mt-1">Manage and monitor tracks you have created.</p>
                </div>
                <button
                    onClick={() => navigate('/dashboard?tab=new-track')}
                    className="self-start sm:self-auto flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-white px-5 py-2.5 rounded-lg font-semibold transition-all shadow-md"
                >
                    <Plus size={16} /> Create New
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {tracks.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-slate-500">
                        <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                        <p>No tracks available right now. Click &quot;Create New&quot; to get started.</p>
                    </div>
                ) : (
                    tracks.map((track) => (
                        <div key={track._id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col">
                            <div className="w-full h-36 bg-primary/20 flex items-center justify-center">
                                <BookOpen size={48} className="text-primary/60" />
                            </div>
                            <div className="p-5 flex flex-col flex-grow">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="inline-block px-3 py-1 bg-tertiary/20 text-red-800 text-xs font-semibold rounded-full border border-tertiary/40 capitalize">
                                        {track.difficulty || 'beginner'}
                                    </span>
                                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${track.isPublished ? 'text-green-700 bg-green-100' : 'text-slate-600 bg-slate-100'}`}>
                                        {track.isPublished ? '● Published' : '○ Draft'}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2">{track.title}</h3>
                                <p className="text-slate-600 text-sm mb-4 line-clamp-3 flex-grow">{track.description}</p>

                                <div className="mt-auto flex gap-2">
                                    <button
                                        onClick={() => navigate(`/track/${track._id}`)}
                                        className="flex-1 bg-slate-50 hover:bg-primary/30 text-slate-700 hover:text-teal-900 border border-slate-200 py-2.5 rounded-lg font-medium transition-all flex justify-center items-center gap-2 text-sm"
                                    >
                                        View Details <ChevronRight size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleTogglePublish(track._id, track.isPublished)}
                                        className={`flex-none px-4 py-2.5 text-sm font-bold rounded-lg border transition-all ${track.isPublished ? 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200' : 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'}`}
                                    >
                                        {track.isPublished ? 'Unpublish' : 'Publish'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MentorDashboard;
