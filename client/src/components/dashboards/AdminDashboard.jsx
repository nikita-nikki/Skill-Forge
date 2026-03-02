import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Users, BookOpen, BarChart3, UserCheck } from 'lucide-react';

const AdminDashboard = ({ tab }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const activeTab = tab || 'students';

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError('');
            try {
                if (activeTab === 'students') {
                    const response = await api.get('/users/students');
                    setData(response.data.data || []);
                } else if (activeTab === 'mentors') {
                    const response = await api.get('/users/mentors');
                    setData(response.data.data || []);
                } else if (activeTab === 'tracks') {
                    const response = await api.get('/tracks');
                    setData(response.data.data || []);
                } else if (activeTab === 'performance') {
                    const response = await api.get('/analytics/students');
                    setData(response.data.data || []);
                } else if (activeTab === 'applications') {
                    const response = await api.get('/users/applications');
                    setData(response.data.data || []);
                }
            } catch (err) {
                setError('Failed to fetch admin data.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [activeTab]);

    const handleAction = async (userId, action) => {
        try {
            await api.post(`/users/applications/${userId}/${action}`);
            setData(prev => prev.filter(app => app._id !== userId));
            alert(`Application ${action}ed successfully!`);
        } catch (err) {
            alert(err.response?.data?.message || 'Action failed');
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

    const renderStudentsOrMentors = () => (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center gap-2">
                <Users className="text-secondary shrink-0" />
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 capitalize">{activeTab} Directory</h2>
            </div>
            <div className="divide-y divide-slate-100">
                {data.length === 0 ? (
                    <p className="p-6 text-slate-500 text-center">No {activeTab} found.</p>
                ) : (
                    data.map(user => (
                        <div key={user._id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="h-10 w-10 shrink-0 rounded-full bg-primary/40 flex items-center justify-center text-teal-800 font-bold">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold text-slate-800 truncate">{user.name}</p>
                                    <p className="text-sm text-slate-500 truncate">{user.email}</p>
                                </div>
                            </div>
                            <span className="shrink-0 ml-4 px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full border border-green-200">
                                Active
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    const renderTracks = () => (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center gap-2">
                <BookOpen className="text-primary shrink-0" />
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">All Published Tracks</h2>
            </div>
            <div className="divide-y divide-slate-100">
                {data.length === 0 ? (
                    <p className="p-6 text-slate-500 text-center">No tracks found.</p>
                ) : (
                    data.map(track => (
                        <div key={track._id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 hover:bg-slate-50 transition-colors">
                            <div className="min-w-0">
                                <p className="font-semibold text-slate-800 text-base mb-1">{track.title}</p>
                                <p className="text-sm text-slate-500 line-clamp-2">{track.description}</p>
                                <p className="text-xs text-slate-400 mt-2 font-medium">By {track.track_owner?.name || track.createdBy?.name || 'Unknown'}</p>
                            </div>
                            <span className="shrink-0 self-start px-3 py-1 bg-primary/20 text-teal-800 text-xs font-semibold rounded-full border border-primary/40 capitalize">
                                {track.difficulty || 'Beginner'}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    const renderPerformance = () => (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center gap-2">
                <BarChart3 className="text-tertiary shrink-0" />
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">Student Performance</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="p-4 font-semibold text-slate-600 text-sm">Student</th>
                            <th className="p-4 font-semibold text-slate-600 text-sm text-center">Evaluated Tasks</th>
                            <th className="p-4 font-semibold text-slate-600 text-sm text-center">Average Score</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {data.length === 0 ? (
                            <tr><td colSpan="3" className="p-6 text-slate-500 text-center">No performance data found.</td></tr>
                        ) : (
                            data.map(stat => (
                                <tr key={stat._id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4">
                                        <p className="font-medium text-slate-800">{stat.studentInfo?.name || 'Unknown'}</p>
                                        <p className="text-xs text-slate-500">{stat.studentInfo?.email}</p>
                                    </td>
                                    <td className="p-4 text-center font-medium text-slate-700">{stat.evaluatedTasks}</td>
                                    <td className="p-4 text-center">
                                        <span className="font-bold text-slate-800">{stat.averageScore}</span>
                                        <span className="text-slate-400 text-xs ml-1">/ 10</span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderApplications = () => (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center gap-2">
                <UserCheck className="text-secondary shrink-0" />
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">Pending Mentor Applications</h2>
            </div>
            <div className="divide-y divide-slate-100">
                {data.length === 0 ? (
                    <p className="p-6 text-slate-500 text-center">No pending applications found.</p>
                ) : (
                    data.map(app => (
                        <div key={app._id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="h-10 w-10 shrink-0 rounded-full bg-secondary/20 flex items-center justify-center text-secondary-dark font-bold">
                                    {app.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold text-slate-800 truncate">{app.name}</p>
                                    <p className="text-sm text-slate-500 truncate">{app.email}</p>
                                </div>
                            </div>
                            <div className="flex gap-3 shrink-0">
                                <button
                                    onClick={() => handleAction(app._id, 'approve')}
                                    className="flex-1 sm:flex-none px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-md transition-colors shadow-sm"
                                >
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleAction(app._id, 'reject')}
                                    className="flex-1 sm:flex-none px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-md transition-colors shadow-sm"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto">
            {activeTab === 'students' || activeTab === 'mentors' ? renderStudentsOrMentors() : null}
            {activeTab === 'tracks' ? renderTracks() : null}
            {activeTab === 'performance' ? renderPerformance() : null}
            {activeTab === 'applications' ? renderApplications() : null}
        </div>
    );
};

export default AdminDashboard;
