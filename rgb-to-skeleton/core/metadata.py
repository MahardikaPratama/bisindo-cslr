"""
Metadata Parsing Module

This module provides utility functions for extracting structured metadata
(e.g., Person ID, Sentence ID, Repetition ID) from raw file paths.
"""

from pathlib import Path
from config import PERSON_MAP, SENTENCE_MAP

def parse_video_id(file_path: Path) -> str:
    """
    Parses the given file path to extract standard metadata and generate a consistent Video ID.

    The expected structure relies on the parent folder name for the sentence,
    and the file name for the person and repetition info.
    Example Input:
        data/raw/AKU_NILAI_JELEK/ACHMAD_AKU NILAI JELEK_01.mp4
    Example Output:
        P1_S03_R1

    Args:
        file_path (Path): The absolute or relative path to the video file.

    Returns:
        str: A standardized string representing the Video ID.
             If parsing fails partially or completely, it falls back to the original stem.
    """
    stem = file_path.stem
    parent_folder = file_path.parent.name
    
    # If the file is already in standard format (e.g., P1_S01_R1 or P6_S01_MJ)
    # just return it.
    import re
    if re.match(r"^P\d_S\d{2}_(R\d|MJ|MN)$", stem):
        return stem
    
    parts = stem.split('_')
    
    person_code = "P0"
    sentence_code = "S00"
    repetition_code = "R0"
    
    if len(parts) >= 1:
        person_name = parts[0].upper()
        person_code = PERSON_MAP.get(person_name, "P0")
        
    folder_upper = parent_folder.upper()
    if folder_upper in SENTENCE_MAP:
        sentence_code = SENTENCE_MAP[folder_upper]
        
    if len(parts) >= 2:
        last_part = parts[-1].upper()
        if last_part in ["MJ", "MN"]:
            repetition_code = last_part
        else:
            digits = ''.join(filter(str.isdigit, last_part))
            if digits:
                repetition_code = f"R{int(digits)}"
            
    if person_code != "P0" and sentence_code != "S00":
        return f"{person_code}_{sentence_code}_{repetition_code}"
        
    return stem
