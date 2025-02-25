// src/components/Quizzes.js

import React, { useState } from 'react';

function Quizzes() {
  const [subject, setSubject] = useState('');
  const [unit, setUnit] = useState('');
  const quizzes = [
    { id: 1, subject: 'Math', unit: 'Algebra', title: 'Algebra Quiz 1' },
    { id: 2, subject: 'Science', unit: 'Physics', title: 'Physics Quiz 1' },
    // Add more quiz entries as needed
  ];

  const filteredQuizzes = quizzes.filter(quiz => 
    (subject ? quiz.subject === subject : true) && 
    (unit ? quiz.unit === unit : true)
  );

  return (
    <div>
      <h1>Quizzes</h1>
      <label>
        Subject:
        <select value={subject} onChange={(e) => setSubject(e.target.value)}>
          <option value="">Select a subject</option>
          <option value="Math">Math</option>
          <option value="Science">Science</option>
        </select>
      </label>
      <label>
        Unit:
        <select value={unit} onChange={(e) => setUnit(e.target.value)}>
          <option value="">Select a unit</option>
          <option value="Algebra">Algebra</option>
          <option value="Physics">Physics</option>
        </select>
      </label>

      <h2>Available Quizzes:</h2>
      <ul>
        {filteredQuizzes.length > 0 ? (
          filteredQuizzes.map(quiz => <li key={quiz.id}>{quiz.title}</li>)
        ) : (
          <li>No quizzes available for the selected options.</li>
        )}
      </ul>
    </div>
  );
}

export default Quizzes;
