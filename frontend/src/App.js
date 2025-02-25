import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Sidebar, Menu, MenuItem } from 'react-pro-sidebar';
import { FaBars, FaHome, FaFilePdf, FaVideo, FaQuestion } from 'react-icons/fa';  
import Home from './components/Home';
import UploadPDF from './components/UploadPDF';
import WatchVideos from './components/WatchVideos';
import Quizzes from './components/Quizzes';
import './App.css';

function App() {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <Router>
      <div style={{ width: "100%", position: 'relative', display: 'flex' }}>
        <Sidebar
          collapsed={isCollapsed}
          rootStyles={{
            position: 'absolute', // Sidebar overlays content
            zIndex: 1000, // Ensures sidebar overlays content
            transition: 'width 0.3s ease',
            width: isCollapsed ? '80px' : '200px',
            height: '100vh',
            backgroundColor: '#ffffff',
            //boxShadow: '2px 0 8px rgba(0, 0, 0, 0.2)',
          }}
        >
          <Menu
            menuItemStyles={{
              button: ({ level, active, disabled }) => ({
                color: disabled ? '#f5d9ff' : active ? '#ffffff' : 'var(--text-light)',
                backgroundColor: active ? 'var(--primary-color)' : undefined,
                '&:hover': {
                  backgroundColor: '#D3D3D3',
                  color: '#ffffff',
                },
                fontSize: level === 0 ? '16px' : '14px',
                padding: '10px 20px',
              }),
              icon: {
                color: '#1e88e5',
                fontSize: '1.2em',
              },
            }}
          >
            {/* Menu Toggle Icon */}
            <MenuItem 
              onClick={toggleSidebar} 
              icon={<FaBars />} 
              style={{ color: '#000000' }} 
            >
              {isCollapsed ? null : 'Menu'}
            </MenuItem>

            {/* Menu Items as Buttons */}
            <MenuItemButton icon={<FaHome />} path="/Home" label="Home" />
            <MenuItemButton icon={<FaFilePdf />} path="/UploadPDF" label="Upload PDF" />
            <MenuItemButton icon={<FaVideo />} path="/WatchVideos" label="Watch Videos" />
            <MenuItemButton icon={<FaQuestion />} path="/Quizzes" label="Quizzes" />
          </Menu>
        </Sidebar>

        <div style={{ marginLeft: isCollapsed ? '100px' : '100px', padding: '20px', width: '100%' }}> 
          <Routes>
            <Route path="/Home" element={<Home />} />
            <Route path="/UploadPDF" element={<UploadPDF />} />
            <Route path="/WatchVideos" element={<WatchVideos />} />
            <Route path="/Quizzes" element={<Quizzes />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

function MenuItemButton({ icon, path, label }) {
  const navigate = useNavigate();

  return (
    <MenuItem
      icon={icon}
      onClick={() => navigate(path)} 
      style={{
        cursor: 'pointer',
        color: 'inherit', 
        textDecoration: 'none', 
      }}
    >
      {label}
    </MenuItem>
  );
}

export default App;
