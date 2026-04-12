from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = BACKEND_ROOT.parent
BACKEND_DATA_DIR = BACKEND_ROOT / "data" / "raw"
SHARED_DATA_DIR = PROJECT_ROOT / "data" / "raw"


def resolve_raw_data_dir() -> Path:
    if BACKEND_DATA_DIR.exists():
        return BACKEND_DATA_DIR
    if SHARED_DATA_DIR.exists():
        return SHARED_DATA_DIR
    return BACKEND_DATA_DIR


RAW_DATA_DIR = resolve_raw_data_dir()
