import os
import uuid
from fastapi import UploadFile
import shutil

async def save_board_images(files: list[UploadFile]):
    upload_dir = "app/static/assets/board"
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
        
    urls = []
    for file in files:
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # URL format: http://localhost:8000/static/assets/board/filename
        urls.append(f"http://localhost:8000/static/assets/board/{unique_filename}")
        
    return urls
