import os
os.environ["KRUTRIM_CLOUD_API_KEY"] = "Erze2f0K0kKxdJO3ZGaLXanD"
model_name = "Meta-Llama-3-8B-Instruct"

# app.py

from flask import Flask, request, jsonify
from krutrim_cloud import KrutrimCloud
from flask_cors import CORS
import os
import json
import tempfile
import moviepy.editor as mp
import whisper

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Directory to save uploaded videos and question data
UPLOAD_FOLDER = 'uploaded_videos'
OUTPUT_FOLDER = 'output'
DATA_FOLDER = 'data'
QUESTIONS_FILE_PATH = os.path.join(DATA_FOLDER, 'questions.json')

# Create necessary folders if they don't exist
for folder in [UPLOAD_FOLDER, OUTPUT_FOLDER, DATA_FOLDER]:
    if not os.path.exists(folder):
        os.makedirs(folder)

# Configurations for Flask
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # Limit file size to 100MB

# Krutrim Cloud configuration
client = KrutrimCloud()
model_name = "Meta-Llama-3-8B-Instruct"

def transcribe_video(video_title, video_bytes):
    try:
        os.makedirs('data', exist_ok=True)

        saved_info_path = "data/saved.json"
        if os.path.exists(saved_info_path):
            with open(saved_info_path, 'r') as saved_file:
                saved_info = json.load(saved_file)
        else:
            saved_info = {}

        if video_title in saved_info:
            result = saved_info[video_title]
            print("Transcription found in saved data.")
            return result

        with tempfile.TemporaryDirectory() as temp_dir:
            temp_video_path = os.path.join(temp_dir, "temp_video.mp4")
            with open(temp_video_path, 'wb') as f:
                f.write(video_bytes)

            temp_audio_path = os.path.join(temp_dir, "temp_audio.mp3")
            video = mp.VideoFileClip(temp_video_path)
            audio = video.audio
            audio.write_audiofile(temp_audio_path)
            video.close()

            model = whisper.load_model("base")
            print("Transcribing...")
            result = model.transcribe(temp_audio_path)
            print("Transcription complete.")

            saved_info[video_title] = result

            with open(saved_info_path, 'w') as json_file:
                json.dump(saved_info, json_file, indent=4)

            return result
            
    except Exception as e:
        print(f"Error during transcription: {str(e)}")
        return None

# Endpoint for uploading videos
@app.route('/upload', methods=['POST'])
def upload_video():
    if 'video' not in request.files:
        return jsonify({'error': 'No video file provided'}), 400

    file = request.files['video']

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    # Save the file
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    file.save(file_path)

    # Return a response
    return jsonify({'message': 'Video uploaded successfully', 'file_path': file_path}), 200

# Helper function to generate questions
def generate_questions(video_title, prompt_template):
    saved_info_path = os.path.join(DATA_FOLDER, 'saved.json')

    # Load the saved video data
    try:
        with open(saved_info_path, 'r') as saved_file:
            saved = json.load(saved_file)
    except FileNotFoundError:
        saved = {}

    # If the specified video is not found in the saved data, perform transcription
    if video_title not in saved:
        # Fetch the video file path
        video_file_path = os.path.join(app.config['UPLOAD_FOLDER'], video_title)
        if not os.path.exists(video_file_path):
            return None, {'error': 'Video file not found'}, 404

        # Read the video bytes
        with open(video_file_path, 'rb') as video_file:
            video_bytes = video_file.read()

        # Transcribe the video
        transcription_result = transcribe_video(video_title, video_bytes)
        if transcription_result is None:
            return None, {'error': 'Failed to transcribe the video'}, 500

        saved[video_title] = transcription_result
        # Save the updated transcription data to saved.json
        with open(saved_info_path, 'w') as saved_file:
            json.dump(saved, saved_file, indent=4)

    # Initialize variables for accumulating text and tracking time
    accumulated_text = ""
    current_time = 0.0
    output_data = {video_title: {}}

    # Iterate over the segments in the JSON data
    for segment in saved[video_title]["segments"]:
        segment_text = segment["text"]
        segment_end_time = segment["end"] / 60  # Convert end time to minutes

        # Accumulate the text for the current segment
        accumulated_text += segment_text + " "

        # Check if the current segment's end time exceeds the next 4-minute mark
        if segment_end_time > current_time + 4.0:
            prompt = prompt_template.format(accumulated_text)

            # Generate the questions using the Krutrim Cloud API
            try:
                messages = [
                    {"role": "system", "content": "You are a skilled quiz generator."},
                    {"role": "user", "content": prompt}
                ]
                response = client.chat.completions.create(model=model_name, messages=messages)
                response_text = response.choices[0].message.content

                questions = eval(response_text[response_text.find('['): response_text.find(']') + 1])

                # Save the questions under the corresponding timestamp
                output_data[video_title][f"{current_time + 4:.2f}"] = questions

            except Exception as e:
                print(e)
                return None, {'error': f'Failed to generate questions: {str(e)}'}, 500

            # Update the time without resetting the accumulated text
            current_time += 4.0

    # Load existing questions.json data, if available
    all_questions = {}
    if os.path.exists(QUESTIONS_FILE_PATH):
        with open(QUESTIONS_FILE_PATH, 'r') as questions_file:
            all_questions = json.load(questions_file)

    # Update with new questions data
    all_questions.update(output_data)

    # Save the updated questions.json
    with open(QUESTIONS_FILE_PATH, 'w') as questions_file:
        json.dump(all_questions, questions_file, indent=4)

    return output_data[video_title], None, 200

# Endpoint to generate 1-mark questions based on the uploaded video
@app.route('/generate1marker', methods=['POST'])
def generate_1_marker_questions():
    data = request.get_json()
    if not data or 'video_title' not in data:
        return jsonify({'error': 'Video title is required'}), 400

    video_title = data['video_title']
    prompt_template = """Given the following content:

    {}

    Generate 5 multiple-choice questions in this format:

    [
        {{
            "question": "the question",
            "options": {{1: "option 1", 2: "option 2", 3: "option 3", 4: "option 4"}},
            "correct option": 2
        }},
        ...
    ]

    Return only a list of dictionaries as shown, with no additional explanation.
    You must ensure that JSON formatting is followed and all answers are surrounded with double quotes.
    Curly brackets and commas must also be used fittingly.
    """
    
    questions, error_response, status_code = generate_questions(video_title, prompt_template)
    
    if error_response:
        return jsonify(error_response), status_code

    return jsonify({'message': '1-mark questions generated successfully', 'questions': questions}), 200

# Endpoint to generate 2-mark questions based on the uploaded video
@app.route('/generate2marker', methods=['POST'])
def generate_2_marker_questions():
    data = request.get_json()
    if not data or 'video_title' not in data:
        return jsonify({'error': 'Video title is required'}), 400

    video_title = data['video_title']
    prompt_template = """Given the following content:
    {}

    Generate 5 hard or difficult multiple-choice questions in this format:

    [
        {{
            "question": "the question",
            "options": {{1: "option 1", 2: "option 2", 3: "option 3", 4: "option 4"}},
            "correct option": <randomly chosen integer representing the correct answer>
        }},
        ...
    ]

    Return only a list of dictionaries as shown, with no additional explanation.
    You must ensure that JSON formatting is followed and all answers are surrounded with double quotes.
    Curly brackets and commas must also be used fittingly.
    """

    questions, error_response, status_code = generate_questions(video_title, prompt_template)
    
    if error_response:
        return jsonify(error_response), status_code

    return jsonify({'message': '2-mark questions generated successfully', 'questions': questions}), 200

# Endpoint to generate 4-mark questions based on the uploaded video
@app.route('/generate4marker', methods=['POST'])
def generate_4_marker_questions():
    data = request.get_json()
    if not data or 'video_title' not in data:
        return jsonify({'error': 'Video title is required'}), 400

    video_title = data['video_title']
    prompt_template = """Given the following content:
    {}

    Generate 1 very detailed question arched over the content in this format worth 4 marks which are broad and spread over multiple concepts:

    [
        {{
            "question": "the question",
            "correct answer": "relevant answer with a word limit of 250-350 words to the question context from the given content."
        }},
        ...
    ]

    Return only a list of dictionary as shown, with no additional explanation.
    You must ensure that JSON formatting is followed and all answers are surrounded with double quotes.
    Curly brackets and commas must also be used fittingly.
    """

    questions, error_response, status_code = generate_questions(video_title, prompt_template)
    
    if error_response:
        return jsonify(error_response), status_code

    return jsonify({'message': '4-mark questions generated successfully', 'questions': questions}), 200

# Endpoint to generate industry-specific questions (currently empty)
@app.route('/generateindustry', methods=['POST'])
def generate_industry_questions():
    return jsonify({'message': 'Industry-specific question generation not implemented yet.'}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
