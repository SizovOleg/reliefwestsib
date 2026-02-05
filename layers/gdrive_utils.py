"""
Google Drive API utilities for fetching images from public folders.
"""
import requests
from django.conf import settings


def get_gdrive_images(folder_id):
    """
    Get list of image files from a public Google Drive folder.
    Returns list of dicts: [{'url': ..., 'name': ..., 'caption': ...}, ...]
    """
    if not folder_id:
        return []
    
    api_key = getattr(settings, 'GOOGLE_API_KEY', None)
    if not api_key:
        return []
    
    try:
        # Query files in folder
        url = 'https://www.googleapis.com/drive/v3/files'
        params = {
            'q': f"'{folder_id}' in parents and mimeType contains 'image/'",
            'key': api_key,
            'fields': 'files(id,name,mimeType)',
            'pageSize': 100
        }
        
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        
        images = []
        for file in data.get('files', []):
            file_id = file['id']
            # Direct link format for Google Drive
            image_url = f"https://drive.google.com/thumbnail?id={file_id}&sz=w1200"
            images.append({
                'url': image_url,
                'name': file['name'],
                'caption': file['name'].rsplit('.', 1)[0]  # filename without extension
            })
        
        return images
    
    except Exception as e:
        print(f"Google Drive API error: {e}")
        return []
