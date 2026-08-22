
import sys

def fix_file(input_path, output_path):
    with open(input_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    bad_string = "const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || \"LDCEXODOO\";"
    
    # Split the content by the bad string. 
    # Since the bad string was inserted between every character, 
    # the original characters should be the segments between the bad strings.
    segments = content.split(bad_string)
    
    original_content = "".join(segments)
    
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(original_content)

fix_file("src/app/profile/page.tsx", "src/app/profile/page.fixed.tsx")

