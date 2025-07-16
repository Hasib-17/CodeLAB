from tabulate import tabulate
import numpy as np
import matplotlib.pyplot as plt
from flask import Flask, request, jsonify
import sys
import io
import base64
import tempfile
import os
import matplotlib
matplotlib.use('Agg')  # ✅ Use Agg backend to avoid GUI issues

app = Flask(__name__)


@app.route('/run', methods=['POST'])
def run_code():
    data = request.json
    code = data.get('code', '')

    try:
        # Redirect stdout to capture print statements
        old_stdout = sys.stdout
        sys.stdout = mystdout = io.StringIO()

        # Run the user code in a limited locals dictionary
        # WARNING: This is unsafe in production!
        local_vars = {}
        exec(code, {"np": np, "plt": plt, "tabulate": tabulate}, local_vars)

        # Get all printed output
        output_text = mystdout.getvalue()

        # Restore stdout
        sys.stdout = old_stdout

        # Check if a plot was created and convert it to base64
        img_b64 = None
        fig = plt.gcf()
        if fig.axes:
            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                plt.savefig(tmp.name)
                tmp.seek(0)
                img_b64 = base64.b64encode(tmp.read()).decode()
            plt.close(fig)
        else:
            plt.close(fig)

        return jsonify({
            "output": output_text or "Code executed with no output",
            "plot": img_b64
        })

    except Exception as e:
        sys.stdout = old_stdout  # make sure to restore stdout even on error
        return jsonify({"error": str(e)})


if __name__ == '__main__':
    app.run(debug=True, port=5000)
