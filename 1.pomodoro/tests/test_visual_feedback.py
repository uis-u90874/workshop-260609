import importlib.util
from pathlib import Path
import unittest


APP_PATH = Path(__file__).resolve().parents[1] / "app.py"
spec = importlib.util.spec_from_file_location("pomodoro_app", APP_PATH)
if spec is None or spec.loader is None:
    raise ImportError("Failed to load app.py for tests")
app = importlib.util.module_from_spec(spec)
spec.loader.exec_module(app)


class VisualFeedbackTests(unittest.TestCase):
    def test_interpolate_color_endpoints_and_midpoint(self):
        self.assertEqual(app.interpolate_color(0.0), "#3b82f6")
        self.assertEqual(app.interpolate_color(0.5), "#facc15")
        self.assertEqual(app.interpolate_color(1.0), "#ef4444")

    def test_interpolate_color_clamps_out_of_range(self):
        self.assertEqual(app.interpolate_color(-1.0), "#3b82f6")
        self.assertEqual(app.interpolate_color(2.0), "#ef4444")

    def test_render_html_contains_visual_features(self):
        html = app.render_html(1200, 300)
        self.assertIn("aria-label=\"円形プログレスバー\"", html)
        self.assertIn("canvas id=\"bg\"", html)
        self.assertIn("視覚効果の体感ログ（測定用）", html)
        self.assertIn("const FULL_FOCUS = 1200;", html)
        self.assertIn("const FULL_BREAK = 300;", html)


if __name__ == "__main__":
    unittest.main()
