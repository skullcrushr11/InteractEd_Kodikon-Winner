import React, { useState, useRef, useEffect } from 'react';

function WatchVideos() {
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [isVideoUploaded, setIsVideoUploaded] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [isQuizVisible, setIsQuizVisible] = useState(false);
  const [quizData, setQuizData] = useState({});
  const [currentTimestamp, setCurrentTimestamp] = useState(null);
  const [selectedQuizType, setSelectedQuizType] = useState('1marker');
  const [answerFeedback, setAnswerFeedback] = useState({});
  const [quizzesByType, setQuizzesByType] = useState({
    '1marker': {},
    '2marker': {},
    '4marker': {}
  });

  const videoRef = useRef(null);

  useEffect(() => {
    if (isVideoUploaded && videoRef.current) {
      const video = videoRef.current;

      const handleTimeUpdate = () => {
        const currentTime = video.currentTime / 60;
        const roundedTime = currentTime.toFixed(2);

        const hasQuizAtTimestamp = 
          quizzesByType['1marker'][roundedTime] ||
          quizzesByType['2marker'][roundedTime] ||
          quizzesByType['4marker'][roundedTime];

        if (hasQuizAtTimestamp) {
          setCurrentTimestamp(roundedTime);
          setIsQuizVisible(true);
          video.pause();
          updateCurrentQuiz(roundedTime, selectedQuizType);
        }
      };

      video.addEventListener('timeupdate', handleTimeUpdate);
      return () => video.removeEventListener('timeupdate', handleTimeUpdate);
    }
  }, [isVideoUploaded, quizzesByType, selectedQuizType]);

  const updateCurrentQuiz = (timestamp, quizType) => {
    const quiz = quizzesByType[quizType][timestamp];
    setCurrentQuiz(quiz);
    setSelectedAnswers({});
    setAnswerFeedback({});
    setScore(null);
  };

  const videoUploaded = async (file) => {
    const formData = new FormData();
    formData.append('video', file);

    try {
      const uploadResponse = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) throw new Error('Upload failed');
      const uploadData = await uploadResponse.json();
      
      setVideoUrl(URL.createObjectURL(file));
      setIsVideoUploaded(true);

      // Fetch all types of questions
      const quizTypes = ['1marker', '2marker', '4marker'];
      const endpoints = {
        '1marker': 'generate1marker',
        '2marker': 'generate2marker',
        '4marker': 'generate4marker'
      };

      const newQuizzesByType = {};

      for (const quizType of quizTypes) {
        const response = await fetch(`http://localhost:5000/${endpoints[quizType]}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ video_title: file.name })
        });
        
        const data = await response.json();
        newQuizzesByType[quizType] = data.questions;
      }

      setQuizzesByType(newQuizzesByType);

    } catch (error) {
      console.error('Error:', error);
      setIsVideoUploaded(false);
      setUploadedVideo(null);
      setVideoUrl('');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedVideo(file);
      setIsVideoUploaded(false);
      videoUploaded(file);
    }
  };

  const handleQuizTypeChange = (e) => {
    const newType = e.target.value;
    setSelectedQuizType(newType);
    if (currentTimestamp) {
      updateCurrentQuiz(currentTimestamp, newType);
    }
  };

  const handleAnswerChange = (questionIndex, optionIndex) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex
    }));
  };

  const handleSubmitQuiz = () => {
    let correctCount = 0;
    const newAnswerFeedback = {};

    if (selectedQuizType === '4marker') {
      // Handle 4-marker questions differently as they don't have multiple choice
      setIsQuizVisible(false);
      setSelectedAnswers({});
      videoRef.current.play();
      return;
    }

    currentQuiz.forEach((question, index) => {
      const isCorrect = selectedAnswers[index] === question["correct option"];
      newAnswerFeedback[index] = isCorrect;
      if (isCorrect) correctCount += 1;
    });

    setAnswerFeedback(newAnswerFeedback);
    setScore(correctCount);
    
    // Don't hide quiz immediately for MCQs so users can see which answers were correct
    setTimeout(() => {
      setIsQuizVisible(false);
      setSelectedAnswers({});
      videoRef.current.play();
    }, 3000);
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Upload a Video:</h2>
      <input type="file" accept="video/*" onChange={handleFileChange} className="mb-4" />

      {isVideoUploaded && videoUrl && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold mb-2">Uploaded Video:</h2>
            <video
              src={videoUrl}
              controls
              width="100%"
              height="auto"
              ref={videoRef}
              className="rounded-lg"
            />
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Quiz Section</h2>
            
            {isQuizVisible && (
              <div className="mb-4">
                <select 
                  value={selectedQuizType}
                  onChange={handleQuizTypeChange}
                  className="w-full p-2 border rounded mb-4"
                >
                  <option value="1marker">1 Mark Questions</option>
                  <option value="2marker">2 Mark Questions</option>
                  <option value="4marker">4 Mark Questions</option>
                </select>

                {currentQuiz && (
                  <form className="space-y-4">
                    {currentQuiz.map((question, index) => (
                      <div key={index} className="border p-4 rounded">
                        <p className="font-medium mb-2">{question.question}</p>
                        
                        {selectedQuizType !== '4marker' ? (
                          // MCQ questions (1-marker and 2-marker)
                          Object.entries(question.options).map(([optionIndex, optionText]) => (
                            <div key={optionIndex} className={`p-2 rounded ${
                              answerFeedback[index] !== undefined && 
                              parseInt(optionIndex) === question["correct option"] 
                                ? 'bg-green-100' 
                                : answerFeedback[index] === false && 
                                  selectedAnswers[index] === parseInt(optionIndex) 
                                    ? 'bg-red-100' 
                                    : ''
                            }`}>
                              <label className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name={`question-${index}`}
                                  value={optionIndex}
                                  checked={selectedAnswers[index] === parseInt(optionIndex)}
                                  onChange={() => handleAnswerChange(index, parseInt(optionIndex))}
                                  className="form-radio"
                                />
                                <span>{optionText}</span>
                              </label>
                            </div>
                          ))
                        ) : (
                          // 4-marker questions
                          <div className="mt-2">
                            <p className="text-gray-700">Correct Answer:</p>
                            <p className="mt-1">{question["correct answer"]}</p>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    <button 
                      type="button" 
                      onClick={handleSubmitQuiz}
                      className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                    >
                      Submit
                    </button>
                  </form>
                )}

                {score !== null && selectedQuizType !== '4marker' && (
                  <div className="mt-4 p-3 bg-gray-100 rounded">
                    <p className="text-center font-bold">
                      Your score: {score} out of {currentQuiz.length}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default WatchVideos;