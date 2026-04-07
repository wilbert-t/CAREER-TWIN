from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.cv_parser import extract_text_from_bytes, UnsupportedFileTypeError
from app.services.cv_structurer import structure_cv
from app.models.profile import UploadResponse

router = APIRouter()

ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx"}


@router.post("/upload-cv", response_model=UploadResponse)
async def upload_cv(file: UploadFile = File(...)):
    filename = file.filename or ""
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    data = await file.read()

    try:
        raw_text = extract_text_from_bytes(data, filename)
    except UnsupportedFileTypeError as e:
        raise HTTPException(status_code=422, detail=str(e))

    structured = structure_cv(raw_text)
    return UploadResponse(raw_text=raw_text, structured=structured)
