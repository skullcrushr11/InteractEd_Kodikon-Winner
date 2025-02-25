import moviepy.editor as mp
import whisper
import tempfile
import json
import os
import io

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
        raise Exception(f"Error processing video: {str(e)}")

if __name__ == "__main__":
    video_path = r"C:\Users\gpshr\Desktop\example_video.mp4"

    with open(video_path, "rb") as video_file:
        video_bytes = video_file.read()
        transcription = transcribe_video(os.path.basename(video_path), video_bytes)
        print("Transcription Result:\n", transcription["text"])
