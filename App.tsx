/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import EditPageWrapper from './pages/EditPageWrapper';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/edit" element={<EditPageWrapper />} />
        <Route path="/edit/:sessionId" element={<EditPageWrapper />} />
      </Routes>
    </Router>
  );
};

export default App;