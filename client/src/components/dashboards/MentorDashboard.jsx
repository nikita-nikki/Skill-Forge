import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { BookOpen, BarChart3, ChevronRight, Plus } from 'lucide-react';

const MentorDashboard = ({ tab }) => {
    const navigate = useNavigate();
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [newTrack, setNewTrack] = useState({
        title: '',
        description: '',
        difficulty: 'beginner'
    });

    const activeTab = tab || 'my-tracks';

    useEffect(() => {
        const fetchMyTracks = async () => {
            setLoading(true);
            try {
                const response = await api.get('/tracks/my');
                setTracks(response.data.data || []);
            } catch (err) {
                setError('Failed to fetch your tracks.');
            } finally {
                setLoading(false);
            }
        };

        if (activeTab === 'my-tracks' || activeTab === 'performance') {
            fetchMyTracks();
        } else {
            setLoading(false);
        }
    }, [activeTab]);

    const handleCreateTrack = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/tracks', { ...newTrack, isPublished: true });
            alert('Track created successfully!');
            setNewTrack({ title: '', description: '', difficulty: 'beginner' });
            navigate('/dashboard?tab=my-tracks');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create track.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
        );
    }

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
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 bg-secondary hover:bg-secondary/90 text-white font-bold rounded-lg transition-colors shadow-lg text-base"
                    >
                        {submitting ? 'Creating...' : 'Publish Track'}
                    </button>
                </form>
            </div>
        );
    }

    if (activeTab === 'performance') {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center gap-2">
                    <BarChart3 className="text-secondary shrink-0" />
                    <h2 className="text-lg sm:text-xl font-bold text-slate-800">Track Performance</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[400px]">
                        <thead className="bg-slate-50 text-slate-500 font-semibold">
                            <tr>
                                <th className="px-5 py-4">Track Name</th>
                                <th className="px-5 py-4">Status</th>
                                <th className="px-5 py-4 hidden sm:table-cell">Created On</th>
                                <th className="px-5 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {tracks.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-5 py-12 text-center text-slate-500 italic">No tracks created yet.</td>
                                </tr>
                            ) : (
                                tracks.map((track) => (
                                    <tr key={track._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-5 py-4 font-bold text-slate-800">{track.title}</td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold border ${track.isPublished ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                {track.isPublished ? 'Published' : 'Draft'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-slate-500 hidden sm:table-cell">{new Date(track.createdAt).toLocaleDateString()}</td>
                                        <td className="px-5 py-4 text-center">
                                            <button
                                                onClick={() => navigate(`/track/${track._id}`)}
                                                className="text-primary hover:text-teal-700 font-semibold flex items-center gap-1 mx-auto whitespace-nowrap"
                                            >
                                                Preview <ChevronRight size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    // My Tracks (default)
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
                        <p>No tracks available right now. Click "Create New" to get started.</p>
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

                                <button
                                    onClick={() => navigate(`/track/${track._id}`)}
                                    className="mt-auto w-full bg-slate-50 hover:bg-primary/30 text-slate-700 hover:text-teal-900 border border-slate-200 py-2.5 rounded-lg font-medium transition-all flex justify-center items-center gap-2 text-sm"
                                >
                                    Preview Track <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MentorDashboard;
