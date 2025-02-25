// src/components/UploadPDF.js

import React from 'react';

function UploadPDF() {
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log("Uploaded file:", file.name);
      // You can add code here to handle the file upload (e.g., send it to your Flask backend)
    }
  };

  return (
    <div>
      <h1>Upload PDF</h1>
      <input type="file" accept="application/pdf" onChange={handleFileUpload} />
    </div>
  );
}

export default UploadPDF;
