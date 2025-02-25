import os
os.environ["KRUTRIM_CLOUD_API_KEY"] = "Erze2f0K0kKxdJO3ZGaLXanD"
model_name = "Meta-Llama-3-8B-Instruct"

from krutrim_cloud import KrutrimCloud
from dotenv import load_dotenv
import json
import os

load_dotenv()

client = KrutrimCloud()

# model_name = "Meta-Llama-3.1-70B-Instruct"

saved_info_path = "data/saved.json"
with open(saved_info_path, 'r') as saved_file:
    saved = json.load(saved_file)

prompt_template = """
Given the following content:

{}

Generate 5 multiple-choice questions in this format:

[
    {{
        "question": "the question",
        "options": {{1: "option 1", 2: "option 2", 3: "option 3", 4: "option 4"}},
        "correct option": <number representing the correct option>
    }},
    ...
]

Return only a list of dictionaries as shown, with no additional explanation.
"""

messages = [
    {"role": "system", "content": "You are a skilled quiz generator specializing in multiple-choice quizzes with four options."}
]

# Initialize variables for accumulating text and tracking time
accumulated_text = ""
current_time = 0.0
segment_start = 0

# Dictionary to hold the output structure
output_data = {}
video_name = "example_video.mp4"  # Example video name, can be dynamic if needed
output_data[video_name] = {}

# Iterate over the segments in the JSON data
for segment in saved[video_name]["segments"]:
    segment_text = segment["text"]
    segment_end_time = segment["end"] / 60  # Convert end time to minutes

    # Accumulate the text for the current segment
    accumulated_text += segment_text + " "

    # Check if the current segment's end time exceeds the next 4-minute mark
    if segment_end_time > current_time + 4.0:
        # Format the accumulated text into the prompt
        prompt = prompt_template.format(accumulated_text)

        # Add the prompt to the messages
        messages.append({"role": "user", "content": prompt})

        # Call the model to generate the questions
        try:
            response = client.chat.completions.create(model=model_name, messages=messages)
            txt_output_data = response.choices[0].message.content
            print(f"Output: \n{txt_output_data}")

            # Use eval to parse the output string into a list of dictionaries
            questions = eval(txt_output_data)

            for i, q in enumerate(questions):
                questions[i]

            # Save the questions under the corresponding timestamp in the output data
            output_data[video_name][f"{current_time:.2f}"] = questions

            # Save the current state of the output data to a file
            output_path = os.path.join("./output", f"{video_name}_questions.json")
            with open(output_path, 'w') as output_file:
                json.dump(output_data, output_file, indent=4)

        except Exception as exc:
            print(f"Exception: {exc}")

        # Update the time without resetting the accumulated text
        current_time += 4.0

# If there's any remaining text after the last segment, prompt the model one more time
if accumulated_text:
    prompt = prompt_template.format(accumulated_text)
    messages.append({"role": "user", "content": prompt})

    try:
        response = client.chat.completions.create(model=model_name, messages=messages)
        txt_output_data = response.choices[0].message.content
        print(f"Output: \n{txt_output_data}")


        txt_output_data = txt_output_data[txt_output_data.find('['):txt_output_data.find(']') + 1]
        # Use eval to parse the output string into a list of dictionaries
        questions = eval(txt_output_data)

        # Save the questions under the corresponding timestamp in the output data
        output_data[video_name][f"{current_time:.2f}"] = questions

        # Save the final state of the output data to a file
        output_path = os.path.join("./output", f"{video_name}_questions.json")
        with open(output_path, 'w') as output_file:
            json.dump(output_data, output_file, indent=4)

    except Exception as exc:
        print(f"Exception: {exc}")

