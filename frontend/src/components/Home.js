// src/components/Home.js

import React from 'react';
import './Home.css';

function Home() {
  return (
    <div className="home-container">
      <header className="home-header">
        <h1>Welcome to InteractEd</h1>
        <p className="home-subtitle">Your interactive learning hub</p>
      </header>

      <section className="home-description">
        <p>
          InteractEd is designed to make learning more engaging by integrating quizzes and questions into your study material.
          Whether you're reading notes or watching a video, our platform ensures you're actively engaging with the content.
        </p>
      </section>

      <section className="home-features">
        <div className="feature-card">
          <h2>Upload PDF</h2>
          <p>
            Upload your notes as PDFs, and let InteractEd prompt you with quizzes to test your understanding. 
            Choose when you want the quizzes: periodically, on demand, or at the end of the document.
          </p>
        </div>

        <div className="feature-card">
          <h2>Upload Video</h2>
          <p>
            Add your video files and play them while answering interactive questions that appear on the side. 
            This feature helps reinforce understanding while you watch.
          </p>
        </div>

        <div className="feature-card">
          <h2>Quizzes & Results</h2>
          <p>
            Access past quiz results here. Revisit specific questions or topics from previous sessions, 
            whether they were from your PDFs or video content.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Home;
