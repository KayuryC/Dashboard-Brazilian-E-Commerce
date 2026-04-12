from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = BACKEND_ROOT.parent
RAW_DATA_DIR = PROJECT_ROOT / "data" / "raw"
