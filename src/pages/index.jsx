import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import CreateEvent from "./CreateEvent";

import EventDetails from "./EventDetails";

import ManualRegistration from "./ManualRegistration";

import ManageOrganizers from "./ManageOrganizers";

import CheckIn from "./CheckIn";

import ParticipantRegistration from "./ParticipantRegistration";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    CreateEvent: CreateEvent,
    
    EventDetails: EventDetails,
    
    ManualRegistration: ManualRegistration,
    
    ManageOrganizers: ManageOrganizers,
    
    CheckIn: CheckIn,
    
    ParticipantRegistration: ParticipantRegistration,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/CreateEvent" element={<CreateEvent />} />
                
                <Route path="/EventDetails" element={<EventDetails />} />
                
                <Route path="/ManualRegistration" element={<ManualRegistration />} />
                
                <Route path="/ManageOrganizers" element={<ManageOrganizers />} />
                
                <Route path="/CheckIn" element={<CheckIn />} />
                
                <Route path="/ParticipantRegistration" element={<ParticipantRegistration />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}