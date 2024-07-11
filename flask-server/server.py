from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import numpy as np
import cv2
from scipy.spatial import KDTree
import io
import matplotlib.pyplot as plt
from matplotlib.figure import Figure
from matplotlib.backends.backend_agg import FigureCanvasAgg as FigureCanvas

app = Flask(__name__)
CORS(app)

# Initialize variables for reference and sample spectra
reference_spectrum = None
reference_colors = None
tree = None

def load_image(path):
    image = cv2.imread(path)
    if image is None:
        raise ValueError(f"Unable to load image from path: {path}")
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    return image_rgb

def extract_spectrum(image_rgb):
    height, width, _ = image_rgb.shape
    wavelengths = np.linspace(400, 700, width)  # Approximate visible spectrum range in nm
    spectrum = []

    for x in range(width):
        avg_color = np.mean(image_rgb[:, x, :], axis=0)
        spectrum.append((wavelengths[x], avg_color))

    return spectrum

def initialize_reference_spectrum(path):
    global reference_spectrum, reference_colors, tree
    reference_image_rgb = load_image(path)
    reference_spectrum = extract_spectrum(reference_image_rgb)
    reference_colors = [color for wl, color in reference_spectrum]
    tree = KDTree(reference_colors)

@app.route('/capture_reference', methods=['POST'])
def capture_reference():
    file = request.files['image']
    file.save('captured_reference.png')
    initialize_reference_spectrum('captured_reference.png')
    return jsonify({'message': 'Reference spectrum captured and initialized.'})

@app.route('/analyze_sample', methods=['POST'])
def analyze_sample():
    if request.method == 'POST':
        try:
            file = request.files['image']
            file.save('sample_image.png')  # Save the uploaded image

            # Load the saved image for processing
            sample_image_rgb = load_image('sample_image.png')

            # Process sample image to get wavelengths and intensities
            sample_wavelengths, sample_intensities = get_RGB_and_intensity(sample_image_rgb)

            reference_wavelengths, reference_intensities = get_RGB_and_intensity(load_image('captured_reference.png'))

            min_length = min(len(reference_intensities), len(sample_intensities))
            absorbance = []

            for i in range(min_length):
                if sample_intensities[i] == 0 or reference_intensities[i] == 0:
                    absorbance.append(0)
                else:
                    absorbance.append(np.log10(reference_intensities[i] / sample_intensities[i]))

            # Plot absorbance vs wavelength
            fig = Figure()
            canvas = FigureCanvas(fig)
            ax = fig.add_subplot(111)
            ax.plot(reference_wavelengths[:min_length], absorbance, linestyle='-', linewidth=0.5)
            ax.set_xlabel('Wavelength (nm)')
            ax.set_ylabel('Absorbance')
            ax.set_title('Absorbance vs Wavelength')
            ax.grid(True)

            # Generate PNG image data
            output = io.BytesIO()
            canvas.print_png(output)
            output.seek(0)

            # Return the PNG image data as response
            return send_file(output, mimetype='image/png')

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    else:
        return jsonify({'error': 'Method not allowed'}), 405

def get_wavelength_from_color(r, g, b):
    distance, index = tree.query([r, g, b])
    wavelength = reference_spectrum[index][0]
    return wavelength

def get_RGB_and_intensity(image_rgb):
    height, width, _ = image_rgb.shape
    wavelengths = []
    intensities = []

    for x in range(width):
        avg_color = np.mean(image_rgb[:, x, :], axis=0)
        r, g, b = avg_color
        wavelength = get_wavelength_from_color(r, g, b)
        intensity = 0.2126 * r + 0.7152 * g + 0.0722 * b
        wavelengths.append(wavelength)
        intensities.append(intensity)

    return wavelengths, intensities

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
