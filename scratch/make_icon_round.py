import os
from PIL import Image, ImageDraw

input_path = r"c:\Users\juann\proyecto-turnos-quiropraxia\frontend\src\app\icon.png"
output_path = r"c:\Users\juann\proyecto-turnos-quiropraxia\frontend\src\app\icon.png"

img = Image.open(input_path).convert("RGBA")
# Make a circular mask
mask = Image.new("L", img.size, 0)
draw = ImageDraw.Draw(mask)
draw.ellipse((0, 0, img.size[0], img.size[1]), fill=255)

# Create an output image that has transparency outside the circle
output = Image.new("RGBA", img.size)
output.paste(img, (0, 0), mask=mask)

output.save(output_path)
print("Done!")
