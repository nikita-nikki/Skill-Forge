import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { BookOpen, UserCircle, Star, ArrowRight, CheckCircle, BarChart3, XCircle } from 'lucide-react';

const LearnerDashboard = ({ tab }) => {
    const navigate = useNavigate();
    const [tracks, setTracks] = useState([]);
    const [enrolledIds, setEnrolledIds] = useState(new Set());
    const [performance, setPerformance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [togglingId, setTogglingId] = useState(null);

    const activeTab = tab || 'all';

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError('');
            try {
                if (activeTab === 'all') {
                    const [tracksRes, enrolledRes] = await Promise.all([
                        api.get('/tracks'),
                        api.get('/tracks/enrolled')
                    ]);
                    setTracks(tracksRes.data.data || []);
                    const ids = new Set((enrolledRes.data.data || []).map(t => t._id));
                    setEnrolledIds(ids);
                } else if (activeTab === 'enrolled') {
                    const response = await api.get('/tracks/enrolled');
                    setTracks(response.data.data || []);
                    const ids = new Set((response.data.data || []).map(t => t._id));
                    setEnrolledIds(ids);
                } else if (activeTab === 'performance') {
                    const response = await api.get('/analytics/my-performance');
                    setPerformance(response.data.data);
                }
            } catch (err) {
                setError('Failed to fetch data. Ensure you are logged in.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [activeTab]);

    const toggleEnrollment = async (trackId) => {
        setTogglingId(trackId);
        try {
            if (enrolledIds.has(trackId)) {
                await api.delete(`/tracks/${trackId}/enroll`);
                setEnrolledIds(prev => {
                    const next = new Set(prev);
                    next.delete(trackId);
                    return next;
                });
                if (activeTab === 'enrolled') {
                    setTracks(prev => prev.filter(t => t._id !== trackId));
                }
            } else {
                await api.post(`/tracks/${trackId}/enroll`);
                setEnrolledIds(prev => new Set(prev).add(trackId));
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Operation failed');
        } finally {
            setTogglingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mb-8 p-4 bg-secondary/10 text-red-600 rounded-lg border border-secondary/30 flex justify-center">
                {error}
            </div>
        );
    }

    const renderApplyForMentor = () => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const status = user.mentorApplicationStatus || 'none';

        const handleApply = async () => {
            try {
                await api.post('/users/apply-mentor');
                alert('Application submitted successfully!');
                user.mentorApplicationStatus = 'pending';
                localStorage.setItem('user', JSON.stringify(user));
                window.location.reload();
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to submit application');
            }
        };

        if (status === 'approved') return null;

        return (
            <div className="mt-10 bg-primary/10 border border-primary/30 p-6 sm:p-8 rounded-xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Become a Mentor</h3>
                        <p className="text-slate-600 max-w-xl text-sm sm:text-base">Share your knowledge with others and help them grow. Apply today to start creating your own tracks.</p>
                        {status === 'pending' && (
                            <p className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full border border-yellow-200">
                                <Star size={12} className="fill-current" /> Application Pending Approval
                            </p>
                        )}
                        {status === 'rejected' && (
                            <p className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full border border-red-200">
                                <XCircle size={12} /> Application Rejected
                            </p>
                        )}
                    </div>
                    {(status === 'none' || status === 'rejected') && (
                        <button
                            onClick={handleApply}
                            className="w-full sm:w-auto whitespace-nowrap bg-secondary hover:bg-secondary/90 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all"
                        >
                            Apply Now
                        </button>
                    )}
                </div>
            </div>
        );
    };

    if (activeTab === 'performance') {
        const overall = performance?.overall;
        const trackWise = performance?.trackWise || [];

        return (
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-100">
                <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2"><BarChart3 /> My Performance</h2>

                {performance ? (
                    <>
                        {/* Overall Summary */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-10">
                            <div className="p-5 bg-primary/20 rounded-lg text-center border border-primary/40">
                                <p className="text-slate-600 text-sm font-semibold mb-1">Total Submissions</p>
                                <p className="text-3xl font-bold text-slate-800">{overall.totalSubmissions}</p>
                            </div>
                            <div className="p-5 bg-tertiary/20 rounded-lg text-center border border-tertiary/40">
                                <p className="text-slate-600 text-sm font-semibold mb-1">Evaluated Tasks</p>
                                <p className="text-3xl font-bold text-slate-800">{overall.totalEvaluated}</p>
                            </div>
                            <div className="p-5 bg-secondary/20 rounded-lg text-center border border-secondary/40">
                                <p className="text-slate-600 text-sm font-semibold mb-1">Avg Points</p>
                                <p className="text-3xl font-bold text-slate-800">{overall.averageScore}</p>
                            </div>
                        </div>

                        {/* Track-wise Breakdown */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-2">Track-wise Performance</h3>
                            {trackWise.length === 0 ? (
                                <p className="text-slate-500 italic">No evaluated tasks yet. Once your submissions are graded by a mentor, they will appear here track-wise.</p>
                            ) : (
                                trackWise.map((track) => (
                                    <div key={track._id} className="border border-slate-100 rounded-xl overflow-hidden">
                                        <div className="bg-slate-50 px-5 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-b border-slate-100">
                                            <h4 className="font-bold text-slate-800">{track.trackTitle}</h4>
                                            <div className="bg-secondary/20 text-secondary-dark px-3 py-1 rounded-full text-sm font-semibold self-start sm:self-auto">
                                                Avg Pts: {track.avgScore.toFixed(1)}
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm min-w-[380px]">
                                                <thead className="bg-slate-50/50 text-slate-500 font-medium">
                                                    <tr>
                                                        <th className="px-5 py-3">Task / Question</th>
                                                        <th className="px-5 py-3">Score</th>
                                                        <th className="px-5 py-3 hidden sm:table-cell">Evaluated On</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {track.tasks.map((task, idx) => {
                                                        const maxScore = task.taskRubric
                                                            ? (task.taskRubric.clarity || 0) + (task.taskRubric.correctness || 0) + (task.taskRubric.examples || 0)
                                                            : 15;
                                                        const scoreRatio = task.score / maxScore;
                                                        return (
                                                            <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                                                                <td className="px-5 py-4 text-slate-700 font-medium">{task.taskQuestion}</td>
                                                                <td className="px-5 py-4">
                                                                    <span className={`px-2 py-1 rounded font-bold ${scoreRatio >= 0.8 ? 'text-green-600' : scoreRatio >= 0.5 ? 'text-blue-600' : 'text-orange-600'}`}>
                                                                        {task.score} / {maxScore}
                                                                    </span>
                                                                </td>
                                                                <td className="px-5 py-4 text-slate-500 hidden sm:table-cell">
                                                                    {new Date(task.evaluatedAt).toLocaleDateString()}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                ) : (
                    <p className="text-slate-500">No performance data available yet.</p>
                )}
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6 border-b border-slate-200 pb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                    {activeTab === 'enrolled' ? 'My Enrolled Tracks' : 'All Published Tracks'}
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                    {activeTab === 'enrolled' ? 'Tracks you are currently learning.' : 'Discover new tracks to enroll in.'}
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {tracks.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-slate-500">
                        <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                        <p>No tracks available right now.</p>
                    </div>
                ) : (
                    tracks.map((track) => {
                        const isEnrolled = enrolledIds.has(track._id);
                        const isToggling = togglingId === track._id;
                        return (
                            <div key={track._id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col">
                                <div onClick={() => navigate(`/track/${track._id}`)} className="cursor-pointer">
                                    <div className="w-full h-40 bg-primary/20 flex items-center justify-center">
                                        <BookOpen size={48} className="text-primary/60" />
                                    </div>
                                </div>

                                <div className="p-5 flex flex-col flex-grow">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="inline-block px-3 py-1 bg-tertiary/20 text-red-800 text-xs font-semibold rounded-full border border-tertiary/40 capitalize">
                                            {track.difficulty || 'Beginner'}
                                        </span>
                                        {isEnrolled && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full border border-green-200 font-semibold">
                                                <CheckCircle size={11} /> Enrolled
                                            </span>
                                        )}
                                    </div>

                                    <h3 onClick={() => navigate(`/track/${track._id}`)} className="text-lg font-bold text-slate-800 mb-2 line-clamp-2 cursor-pointer hover:text-secondary transition-colors">{track.title}</h3>
                                    <p className="text-slate-600 text-sm mb-4 line-clamp-3 flex-grow">{track.description}</p>

                                    <div className="mt-auto">
                                        <div className="flex items-center gap-2 mb-4 text-sm text-slate-500">
                                            <UserCircle size={16} className="shrink-0" />
                                            <span className="truncate">By Mentor {track.track_owner?.name || track.createdBy?.name || 'Unknown'}</span>
                                        </div>

                                        <button
                                            onClick={() => toggleEnrollment(track._id)}
                                            disabled={isToggling}
                                            className={`w-full group flex justify-center items-center gap-2 font-medium py-2.5 px-4 rounded-md transition-all text-sm ${isEnrolled
                                                ? 'bg-primary/30 text-teal-900 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-primary/40'
                                                : 'bg-slate-50 hover:bg-primary text-slate-700 hover:text-teal-900 border border-slate-200 hover:border-primary'
                                                }`}
                                        >
                                            {isToggling ? (
                                                <span>Processing...</span>
                                            ) : isEnrolled ? (
                                                <>
                                                    <div className="group-hover:hidden flex items-center gap-2">
                                                        <CheckCircle size={16} /> Enrolled
                                                    </div>
                                                    <div className="hidden group-hover:flex items-center gap-2">
                                                        <XCircle size={16} /> Unenroll
                                                    </div>
                                                </>
                                            ) : (
                                                <>Enroll Now <ArrowRight size={16} /></>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
            {activeTab !== 'performance' && renderApplyForMentor()}
        </div>
    );
};

export default LearnerDashboard;
