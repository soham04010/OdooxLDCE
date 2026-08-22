
import sys

def fix_file(input_path, output_path):
    with open(input_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    bad_string1 = "const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || \"LDCEXODOO\";"
    bad_string2 = "const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || \"dbwymmt1i\";"
    
    segments = content.split(bad_string1)
    content = "".join(segments)
    
    segments = content.split(bad_string2)
    content = "".join(segments)
    
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(content)

fix_file("src/app/profile/page.tsx", "src/app/profile/page.fixed.tsx")

