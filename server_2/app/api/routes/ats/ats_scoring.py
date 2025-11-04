# ats_scoring_v4.py
"""
Optimized ATS scoring backend (v4)
- Generic title extraction (scans entire resume; no hardcoded tech list)
- Robust experience extraction (multiple ranges, merge overlaps, include numeric durations)
- Batch processing with ThreadPoolExecutor + asyncio.to_thread pattern
- LRU caching for extracted resume text
- SpaCy semantic similarity + fuzzy matching
- Returns structured scores compatible with frontend expectations
"""

import os
import re
import base64
import hashlib
import time
import datetime
from io import BytesIO
from functools import lru_cache
from concurrent.futures import ThreadPoolExecutor
import asyncio
from typing import List, Dict, Optional, Tuple

import nest_asyncio
nest_asyncio.apply()

from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from docx import Document
import PyPDF2
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from fuzzywuzzy import fuzz
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np
import spacy

# ------------------------------------------
# CONFIG
# ------------------------------------------
SPACY_MODEL_NAME = os.getenv("SPACY_MODEL", "en_core_web_md")
MAX_WORKERS = int(os.getenv("ATS_MAX_WORKERS", "4"))
FAST_MODE = os.getenv("ATS_FAST_MODE", "false").lower() in ("1", "true", "yes")
RESUME_TEXT_CACHE_SIZE = int(os.getenv("RESUME_TEXT_CACHE_SIZE", "1024"))

# ------------------------------------------
# APP INIT
# ------------------------------------------
app = FastAPI(title="ATS Scoring v4 - Title & Experience Optimized")
router = APIRouter()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # narrow this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------
# NLP / LIB SETUP
# ------------------------------------------
nltk.download("stopwords", quiet=True)
nltk.download("wordnet", quiet=True)
nltk.download("omw-1.4", quiet=True)
stop_words = set(stopwords.words("english"))
lemmatizer = WordNetLemmatizer()

try:
    nlp = spacy.load(SPACY_MODEL_NAME, disable=[])  # keep components for similarity
except OSError:
    os.system(f"python -m spacy download {SPACY_MODEL_NAME}")
    nlp = spacy.load(SPACY_MODEL_NAME)

# ------------------------------------------
# Pydantic Models
# ------------------------------------------
class JobDetails(BaseModel):
    job_title: str
    job_description: str
    requirements: List[str] = []
    required_skills: List[str] = []
    optional_skills: List[str] = []
    required_education: str = ""
    required_experience: str = ""

class BatchResume(BaseModel):
    id: str
    base64_data: str
    file_type: str  # 'pdf' or 'docx'

class BatchInput(BaseModel):
    resumes: List[BatchResume]
    job_details: JobDetails
    opporType: Optional[str] = None

# ------------------------------------------
# TEXT EXTRACTION + LRU CACHING
# ------------------------------------------
def _md5(s: str) -> str:
    return hashlib.md5(s.encode("utf-8")).hexdigest()

@lru_cache(maxsize=RESUME_TEXT_CACHE_SIZE)
def _extract_text_from_pdf_bytes_hash(hash_key: str, pdf_bytes: bytes) -> str:
    """Helper cached function for PDF extraction. Args are hash_key + bytes (hash_key used to make signature unique)."""
    reader = PyPDF2.PdfReader(BytesIO(pdf_bytes))
    texts = []
    for page in reader.pages:
        try:
            txt = page.extract_text()
            if txt:
                texts.append(txt)
        except Exception:
            continue
    return "\n".join(texts)

def extract_text_from_pdf(base64_data: str) -> str:
    pdf_bytes = base64.b64decode(base64_data)
    key = _md5(base64.b64encode(pdf_bytes).hex())
    return _extract_text_from_pdf_bytes_hash(key, pdf_bytes)

@lru_cache(maxsize=RESUME_TEXT_CACHE_SIZE)
def _extract_text_from_docx_hash(hash_key: str, doc_bytes: bytes) -> str:
    doc = Document(BytesIO(doc_bytes))
    return "\n".join([p.text for p in doc.paragraphs])

def extract_text_from_docx(base64_data: str) -> str:
    doc_bytes = base64.b64decode(base64_data)
    key = _md5(base64.b64encode(doc_bytes).hex())
    return _extract_text_from_docx_hash(key, doc_bytes)

def strip_html(text: str) -> str:
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"&[a-zA-Z0-9#]+;", " ", text)
    return text

# ------------------------------------------
# PREPROCESSING
# ------------------------------------------
def preprocess_text_for_nlp(text: str) -> str:
    text = strip_html(text)
    text = re.sub(r"http\S+|www\S+|https\S+", "", text)
    text = re.sub(r"[^\w\s]", " ", text).lower()
    # Use spaCy for lemmatization and stopword removal
    doc = nlp(text)
    tokens = [token.lemma_ for token in doc if not token.is_stop and not token.is_punct and len(token.text) > 2]
    return " ".join(tokens)

# ------------------------------------------
# TITLE EXTRACTION (generic, scans entire resume)
# ------------------------------------------
def extract_title_from_resume(resume_text: str) -> Optional[str]:
    """
    Generic title extractor:
    - scans entire resume text
    - finds phrases containing role keywords (developer, engineer, analyst, etc.)
    - returns highest-priority candidate (prefers earlier lines)
    """
    text = re.sub(r"[^a-zA-Z0-9\s\-\(\)\./]", " ", resume_text.lower())
    lines = [l.strip() for l in text.split("\n") if l.strip()]

    role_keywords = [
        "developer", "engineer", "architect", "analyst", "manager",
        "consultant", "scientist", "specialist", "designer", "programmer",
        "administrator", "tester", "lead", "intern", "director", "officer"
    ]

    title_candidates = []
    for line_idx, line in enumerate(lines):
        for role in role_keywords:
            # capture up to 4 words before and after the role keyword
            pattern = rf"((?:\w+[\s\-]{{0,2}}){{0,4}}{role}(?:[\s\-/]?\w+){{0,4}})"
            match = re.search(pattern, line)
            if match:
                phrase = match.group(1).strip()
                # earlier lines get slightly higher priority
                priority = max(1.0, 5.0 - (line_idx / 10.0))
                title_candidates.append((phrase, priority))

    if not title_candidates:
        return None

    # pick candidate with highest priority (closest to top of doc)
    best_match = sorted(title_candidates, key=lambda x: -x[1])[0][0]
    return best_match.title()

# ------------------------------------------
# EXPERIENCE EXTRACTION (multi-range, merge overlaps)
# ------------------------------------------
def extract_total_experience_years(resume_text: str) -> float:
    """
    Extracts total *real work* experience (years) at companies from resume_text by:
    - Searching for professional section keywords/phrases (strict; no standalone 'experience').
    - Extracting & filtering blocks: Discard if contains 'project'/'education'/etc.; require ORG entity (company).
    - Parsing date ranges/durations only from valid blocks.
    - Merging overlaps, summing months, capping at 40 years.
    """
    text_lower = resume_text.lower()
    lines = [line.strip() for line in resume_text.split('\n') if line.strip()]
    
    # Strict professional keywords (phrases only; excludes broad 'experience')
    exp_keywords = [
        'work experience', 'professional experience', 'employment history', 
        'work history', 'job experience', 'internship experience', 'professional role'
    ]
    
    # Find starting indices
    exp_starts = []
    for i, line in enumerate(lines):
        line_lower = line.lower()
        if any(re.search(r'\b' + re.escape(kw) + r'\b', line_lower) for kw in exp_keywords):
            exp_starts.append(i)
    
    # Collect potential blocks
    potential_blocks = []
    if exp_starts:
        section_enders = ['education', 'skills', 'summary', 'achievement', 'certification', 'projects'] + exp_keywords
        for start_idx in exp_starts:
            block = []
            for j in range(start_idx, len(lines)):
                if j > start_idx and any(re.search(r'\b' + re.escape(kw) + r'\b', lines[j].lower()) for kw in section_enders):
                    break
                block.append(lines[j])
            if block:
                potential_blocks.append('\n'.join(block))
    else:
        potential_blocks = [resume_text]  # Fallback for durations
    
    # Filter blocks: Discard non-pro (e.g., contains 'project'); require ORG (company)
    valid_blocks = []
    exclude_words = ['project', 'education', 'achievement', 'summary', 'skills']
    doc = nlp(resume_text)  # Use SpaCy for ORG detection
    for block in potential_blocks:
        block_lower = block.lower()
        if any(word in block_lower for word in exclude_words):
            continue  # Skip projects/education/etc.
        # Check for ORG (company name)
        block_doc = nlp(block)
        orgs = [ent.text for ent in block_doc.ents if ent.label_ == 'ORG']
        if orgs:  # At least one company
            valid_blocks.append(block)
    
    exp_blocks = valid_blocks or [resume_text]  # Fallback if none valid
    
    # Parse from valid blocks (rest same as before)
    total_months = 0.0
    all_ranges = []
    date_pattern = r"(\d{1,2}/\d{4}|[a-z]{3,9}\s?\d{2,4})\s*[–\-\s]\s*(present|current|\d{1,2}/\d{4}|[a-z]{3,9}\s?\d{2,4})"
    
    def parse_date(ds: str) -> Optional[datetime.date]:
        months = {"jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
                  "jul": 7, "aug": 8, "sep": 9, "sept": 9, "oct": 10, "nov": 11, "dec": 12}
        m = re.search(r"(\d{1,2})/(\d{4})", ds)
        if m:
            mon = int(m.group(1)) % 12 + 1 if int(m.group(1)) > 12 else int(m.group(1))
            yr = int(m.group(2))
            return datetime.date(yr, mon, 1)
        m = re.search(r"([a-z]{3,9})\s*(\d{2,4})", ds)
        if m:
            mon = months.get(m.group(1)[:3], 1)
            yr = int(m.group(2))
            if yr < 100: yr += 2000
            return datetime.date(yr, mon, 1)
        return None
    
    for block in exp_blocks:
        block_lower = block.lower()
        if len(exp_blocks) > 1 or any(kw in block_lower for kw in exp_keywords):
            for start_str, end_str in re.findall(date_pattern, block):
                try:
                    start = parse_date(start_str)
                    end = parse_date(end_str) if end_str.lower() not in ["present", "current"] else datetime.date(2025, 10, 22)
                    if start and end and end > start:
                        all_ranges.append((start, end))
                except Exception:
                    continue
        
        duration_pattern = r"(\d+(?:\.\d+)?)\s*(year|years|yr|yrs|month|months|mo|mos)\b"
        for num_str, unit in re.findall(duration_pattern, block_lower):
            try:
                num = float(num_str)
                multiplier = 0.5 if len(exp_blocks) > 1 else 1.0
                if any(u in unit for u in ["year", "yr"]):
                    total_months += num * 12 * multiplier
                elif any(u in unit for u in ["month", "mo"]):
                    total_months += num * multiplier
            except Exception:
                continue
    
    # Merge & sum (same as before)
    if all_ranges:
        all_ranges.sort(key=lambda x: x[0])
        merged = [all_ranges[0]]
        for current in all_ranges[1:]:
            last = merged[-1]
            if current[0] <= last[1]:
                merged[-1] = (last[0], max(last[1], current[1]))
            else:
                merged.append(current)
        for s, e in merged:
            months = (e.year - s.year) * 12 + (e.month - s.month)
            total_months += max(0, months)
    
    total_months = min(total_months, 40 * 12)
    return round(total_months / 12.0, 1)

# ------------------------------------------
# HELPER MATCHERS
# ------------------------------------------
def fuzzy_skill_match(skill: str, processed_text: str, raw_text_lower: str, threshold=75) -> bool:
    s = skill.lower()
    try:
        fuzzy_match = fuzz.token_sort_ratio(s, processed_text) >= threshold or fuzz.partial_ratio(s, processed_text) >= threshold
    except Exception:
        fuzzy_match = False
    direct_match = re.search(r"\b" + re.escape(s) + r"\b", raw_text_lower) is not None
    return fuzzy_match or direct_match

def extract_entities_and_keywords(text: str) -> Tuple[List[str], List[str]]:
    doc = nlp(text)
    entities = [ent.text.lower() for ent in doc.ents if ent.label_ in ["ORG", "PRODUCT", "PERSON", "NORP", "GPE"]]
    if len(text.split()) < 10:
        return entities, []
    try:
        vectorizer = TfidfVectorizer(max_features=10, stop_words="english", ngram_range=(1, 2))
        tfidf_matrix = vectorizer.fit_transform([text])
        feature_names = vectorizer.get_feature_names_out()
        top_idx = np.argsort(tfidf_matrix.toarray()[0])[-5:][::-1]
        top_keywords = [feature_names[i] for i in top_idx if i < len(feature_names)]
    except Exception:
        top_keywords = []
    return entities, top_keywords

def match_education(resume_text: str, required_education: str) -> bool:
    if not required_education:
        return True
    try:
        doc_req = nlp(required_education.lower())
        doc_resume = nlp(resume_text.lower())
        if doc_req.similarity(doc_resume) > 0.65:
            return True
    except Exception:
        pass
    req_words = set(preprocess_text_for_nlp(required_education).split())
    resume_words = set(preprocess_text_for_nlp(resume_text).split())
    if any(word in resume_words for word in req_words):
        return True
    return False

# ------------------------------------------
# SCORING CORE
# ------------------------------------------
def compute_score(resume_text: str, jd: JobDetails, job_doc, processed_job_text: str, opporType: Optional[str] = None):
    processed_resume = preprocess_text_for_nlp(resume_text)
    raw_resume_lower = resume_text.lower()

    # default weights (job)
    WEIGHTS = {
        "title": 5.0,
        "similarity": 10.0,
        "requirements": 5.0,
        "required_skills": 15.0,
        "optional_skills": 5.0,
        "experience": 50.0,
        "education": 5.0,
        "keywords": 5.0,
    }

    # override for internships
    if opporType and isinstance(opporType, str) and opporType.lower() == "internship":
        WEIGHTS.update({
            "similarity": 15.0,
            "required_skills": 50.0,
            "optional_skills": 10.0,
            "experience": 0.0,
            "education": 0.0,
            "keywords": 20.0,
        })

    # Title
    resume_title = extract_title_from_resume(resume_text) or ""
    title_match = False
    title_score = 0.0
    if resume_title:
        try:
            title_match = fuzz.ratio(jd.job_title.lower(), resume_title.lower()) >= 70
            title_score = WEIGHTS["title"] if title_match else 0.0
        except Exception:
            title_match = False
            title_score = 0.0

    # Semantic similarity
    if FAST_MODE:
        overall_similarity = fuzz.partial_ratio(processed_resume, processed_job_text) / 100.0
    else:
        try:
            doc_resume = nlp(processed_resume)
            overall_similarity = doc_resume.similarity(job_doc)
        except Exception:
            overall_similarity = fuzz.partial_ratio(processed_resume, processed_job_text) / 100.0
    overall_score = overall_similarity * WEIGHTS["similarity"]

    # Requirements match
    requirements_matched = [r for r in jd.requirements if fuzzy_skill_match(r, processed_resume, raw_resume_lower, 85)]
    requirements_score = (len(requirements_matched) / len(jd.requirements) if jd.requirements else 0.0) * WEIGHTS["requirements"]

    # Required / Optional skills
    resume_entities, _ = extract_entities_and_keywords(resume_text)
    resume_entities_lower = [e.lower() for e in resume_entities]

    required_matched = [s for s in jd.required_skills if fuzzy_skill_match(s, processed_resume, raw_resume_lower) or s.lower() in resume_entities_lower]
    optional_matched = [s for s in jd.optional_skills if fuzzy_skill_match(s, processed_resume, raw_resume_lower) or s.lower() in resume_entities_lower]

    required_score = (len(required_matched) / len(jd.required_skills) if jd.required_skills else 0.0) * WEIGHTS["required_skills"]
    optional_score = (len(optional_matched) / len(jd.optional_skills) if jd.optional_skills else 0.0) * WEIGHTS["optional_skills"]

    # Experience
    resume_exp = extract_total_experience_years(resume_text)
    exp_status = f"Resume: {resume_exp:.1f} years"
    req_exp_match_score = 0.0
    if jd.required_experience:
        exp_num = re.search(r"(\d+(\.\d+)?)", jd.required_experience)
        req_years = float(exp_num.group(1)) if exp_num else 0.0
        exp_match_ratio = min(1.0, resume_exp / max(req_years, 0.1)) if req_years > 0 else 0.0
        req_exp_match_score = exp_match_ratio * WEIGHTS["experience"]
        exp_status += f" (Required: {req_years})"

    # Education
    edu_match = match_education(resume_text, jd.required_education)
    edu_score = WEIGHTS["education"] if edu_match else 0.0

    # Keywords
    _, job_keywords = extract_entities_and_keywords(processed_job_text)
    matched_keywords = [kw for kw in job_keywords if fuzzy_skill_match(kw, processed_resume, raw_resume_lower, 70)]
    keyword_score = (len(matched_keywords) / len(job_keywords) if job_keywords else 0.0) * WEIGHTS["keywords"]

    # Total
    total_score = min(100.0, title_score + overall_score + requirements_score + required_score +
                      optional_score + req_exp_match_score + edu_score + keyword_score)

    details = {
        "title": round(title_score, 2),
        "similarity": round(overall_score, 2),
        "requirements": round(requirements_score, 2),
        "required_skills": round(required_score, 2),
        "optional_skills": round(optional_score, 2),
        "experience": round(req_exp_match_score, 2),
        "education": round(edu_score, 2),
        "keywords": round(keyword_score, 2),
    }

    return total_score, details, required_matched, optional_matched, matched_keywords, exp_status, edu_match, title_match

# ------------------------------------------
# SINGLE RESUME SCORER (sync)
# ------------------------------------------
def score_resume_sync(resume: BatchResume, jd: JobDetails, job_doc, processed_job_text: str, opporType: Optional[str]):
    start = time.perf_counter()
    try:
        if resume.file_type.lower() == "pdf":
            text = extract_text_from_pdf(resume.base64_data)
        elif resume.file_type.lower() == "docx":
            text = extract_text_from_docx(resume.base64_data)
        else:
            raise ValueError("Unsupported file type")

        if not text.strip():
            raise ValueError("No text extracted from resume")

        score, details, matched_req, matched_opt, keywords, exp_status, edu_match, title_match = compute_score(
            resume_text=text,
            jd=jd,
            job_doc=job_doc,
            processed_job_text=processed_job_text,
            opporType=opporType
        )

        elapsed = time.perf_counter() - start
        return {
            "score": round(score, 2),
            "details": details,
            "matched_required": matched_req,
            "matched_optional": matched_opt,
            "extracted_keywords": keywords,
            "experience_match": exp_status,
            "education_match": bool(edu_match),
            "title_match": bool(title_match),
            "timing_s": round(elapsed, 3)
        }

    except Exception as e:
        elapsed = time.perf_counter() - start
        return {"score": 0, "error": str(e), "timing_s": round(elapsed, 3)}

# ------------------------------------------
# BATCH ENDPOINT (async wrapper + parallel scoring)
# ------------------------------------------
@router.post("/api/v1/score_resumes")
@router.post("/score_resumes")
async def score_resumes_endpoint(batch_input: BatchInput):
    if not batch_input.resumes:
        return {"success": False, "scores": {}, "error": "No resumes provided"}

    jd = batch_input.job_details
    oppor_type = batch_input.opporType

    # Precompute job doc once
    job_text = strip_html(jd.job_description or "") + " " + " ".join(jd.requirements or [])
    processed_job = preprocess_text_for_nlp(job_text)
    try:
        job_doc = nlp(processed_job)
    except Exception:
        job_doc = None

    results = {}
    loop = asyncio.get_running_loop()

    # Use ThreadPoolExecutor to run CPU-bound scoring concurrently
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        async def run_score(resume: BatchResume):
            return await loop.run_in_executor(executor, score_resume_sync, resume, jd, job_doc, processed_job, oppor_type)

        tasks = [run_score(r) for r in batch_input.resumes]
        completed = await asyncio.gather(*tasks, return_exceptions=True)

    for resume, result in zip(batch_input.resumes, completed):
        if isinstance(result, Exception):
            results[resume.id] = {"score": 0, "error": str(result)}
        else:
            results[resume.id] = result

    return {"success": True, "scores": results}
