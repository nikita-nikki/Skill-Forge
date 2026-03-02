import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AdminDashboard from '../components/dashboards/AdminDashboard';
import LearnerDashboard from '../components/dashboards/LearnerDashboard';
import MentorDashboard from '../components/dashboards/MentorDashboard';

const Dashboard = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [role, setRole] = useState(null);

    // Get the query param e.g. ?tab=enrolled
    const queryParams = new URLSearchParams(location.search);
    const tab = queryParams.get('tab');

    useEffect(() => {
        const storedRole = localStorage.getItem('userRole');
        if (!storedRole) {
            navigate('/login');
        } else {
            setRole(storedRole);
        }
    }, [navigate, location]);

    const renderDashboardContent = () => {
        switch (role) {
            case 'admin':
                return <AdminDashboard tab={tab} />;
            case 'learner':
                return <LearnerDashboard tab={tab} />;
            case 'mentor':
                return <MentorDashboard tab={tab} />; // Mentors don't explicitly rely on tabs in this design
            default:
                return (
                    <div className="flex justify-center items-center h-48">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {renderDashboardContent()}
            </main>
        </div>
    );
};

export default Dashboard;
