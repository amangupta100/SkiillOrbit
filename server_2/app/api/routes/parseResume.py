from fastapi import APIRouter, UploadFile, File, HTTPException
from io import BytesIO
from pdfminer.high_level import extract_text as extract_pdf_text
from docx import Document
import logging

router = APIRouter(prefix="/api/v1", tags=["Resume Parser"])

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def extract_text_from_pdf(file: UploadFile) -> str:
    try:
        file_content = await file.read()
        text = extract_pdf_text(BytesIO(file_content))
        return text
    except Exception as e:
        logger.error(f"PDF extraction error: {str(e)}")
        raise HTTPException(
            status_code=400, 
            detail=f"PDF processing failed. The file might be corrupted or not a valid PDF."
        )

async def extract_text_from_docx(file: UploadFile) -> str:
    try:
        file_content = await file.read()
        doc = Document(BytesIO(file_content))
        return "\n".join([paragraph.text for paragraph in doc.paragraphs])
    except Exception as e:
        logger.error(f"DOCX extraction error: {str(e)}")
        raise HTTPException(
            status_code=400, 
            detail=f"DOCX processing failed. The file might be corrupted or not a valid DOCX."
        )

@router.post("/getResumeData")
async def get_resume_data(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    file_extension = file.filename.split('.')[-1].lower() if '.' in file.filename else ''
    
    try:
        # Determine file type and process accordingly
        if file_extension == "pdf":
            text = await extract_text_from_pdf(file)
        elif file_extension == "docx":
            text = await extract_text_from_docx(file)
        else:
            raise HTTPException(
                status_code=400, 
                detail="Unsupported file type. Please upload PDF or DOCX"
            )
        
        return {
            "success": True,
            "data": text,
            "message": "Text extracted successfully",
            "filename": file.filename,
            "file_type": file_extension
        }
        
    except HTTPException:
        raise  # Re-raise already handled exceptions
    except Exception as e:
        logger.error(f"Unexpected error processing file: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="An unexpected error occurred while processing the file"
        )