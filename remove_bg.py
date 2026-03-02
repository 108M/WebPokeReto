from PIL import Image
import os

def remove_white_bg(input_path, output_path):
    img = Image.open(input_path)
    frames = []
    
    # Check if the image has multiple frames
    try:
        while True:
            # Convert to RGBA
            frame = img.convert("RGBA")
            data = frame.getdata()
            new_data = []
            for item in data:
                # White or very close to white threshold
                if item[0] > 240 and item[1] > 240 and item[2] > 240:
                    new_data.append((255, 255, 255, 0))
                else:
                    new_data.append(item)
            frame.putdata(new_data)
            frames.append(frame)
            img.seek(img.tell() + 1)
    except EOFError:
        pass

    if frames:
        # Save as completely new GIF with transparency
        frames[0].save(
            output_path,
            format='GIF',
            append_images=frames[1:],
            save_all=True,
            disposal=2,
            transparency=0,
            loop=0,
            duration=img.info.get('duration', 100)
        )

if __name__ == '__main__':
    os.makedirs('public/gifs', exist_ok=True)
    for player in ['markel', 'raul', 'xavi']:
        input_file = f'assets/gifs/{player}.gif'
        output_file = f'public/gifs/{player}_transparent.gif'
        try:
            if os.path.exists(input_file):
                remove_white_bg(input_file, output_file)
                print(f'Successfully processed {player}.gif')
            else:
                print(f'File {input_file} not found')
        except Exception as e:
            print(f'Error processing {player}.gif: {e}')
