from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, date
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Helper to clean MongoDB documents
def clean_doc(doc):
    """Remove MongoDB _id field from document"""
    if doc and '_id' in doc:
        del doc['_id']
    return doc

def clean_docs(docs):
    """Remove MongoDB _id field from list of documents"""
    return [clean_doc(doc) for doc in docs]

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== ENUMS ==============
class Priority(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class DayType(str, Enum):
    WEEKDAY = "weekday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"

# ============== MODELS ==============

class RoutineTask(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    time_label: str
    title: str
    icon: str = "checkbox-outline"
    is_critical: bool = False
    order: int = 0

class DailyProgress(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str  # YYYY-MM-DD format
    completed_routine_task_ids: List[str] = []
    day_type: DayType
    total_xp_earned: int = 0
    is_day_complete: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class OneOffTask(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    notes: Optional[str] = None
    due_date: Optional[str] = None  # YYYY-MM-DD format
    priority: Priority = Priority.MEDIUM
    is_completed: bool = False
    completed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    current_streak: int = 0
    longest_streak: int = 0
    total_xp: int = 0
    level: int = 1
    badges: List[str] = []
    last_active_date: Optional[str] = None  # YYYY-MM-DD
    weekly_completed_days: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class WeeklySummary(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    week_start_date: str  # YYYY-MM-DD
    total_tasks_completed: int = 0
    total_xp_earned: int = 0
    days_completed: int = 0
    streak_at_week_end: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ============== REQUEST/RESPONSE MODELS ==============

class CreateRoutineTaskRequest(BaseModel):
    time_label: str
    title: str
    icon: str = "checkbox-outline"
    is_critical: bool = False
    order: int = 0

class UpdateRoutineTaskRequest(BaseModel):
    time_label: Optional[str] = None
    title: Optional[str] = None
    icon: Optional[str] = None
    is_critical: Optional[bool] = None
    order: Optional[int] = None

class CreateOneOffTaskRequest(BaseModel):
    title: str
    notes: Optional[str] = None
    due_date: Optional[str] = None
    priority: Priority = Priority.MEDIUM

class UpdateOneOffTaskRequest(BaseModel):
    title: Optional[str] = None
    notes: Optional[str] = None
    due_date: Optional[str] = None
    priority: Optional[Priority] = None

class ToggleRoutineTaskRequest(BaseModel):
    task_id: str
    date: str  # YYYY-MM-DD

class CompleteOneOffTaskRequest(BaseModel):
    task_id: str

# ============== HELPER FUNCTIONS ==============

def get_day_type(date_str: str) -> DayType:
    """Get the day type from a date string"""
    d = datetime.strptime(date_str, "%Y-%m-%d")
    weekday = d.weekday()
    if weekday == 5:
        return DayType.SATURDAY
    elif weekday == 6:
        return DayType.SUNDAY
    else:
        return DayType.WEEKDAY

def calculate_level(xp: int) -> int:
    """Calculate level based on XP"""
    # Level formula: each level requires more XP
    # Level 1: 0-99 XP, Level 2: 100-299 XP, Level 3: 300-599 XP, etc.
    if xp < 100:
        return 1
    elif xp < 300:
        return 2
    elif xp < 600:
        return 3
    elif xp < 1000:
        return 4
    elif xp < 1500:
        return 5
    elif xp < 2100:
        return 6
    elif xp < 2800:
        return 7
    elif xp < 3600:
        return 8
    elif xp < 4500:
        return 9
    else:
        return 10 + (xp - 4500) // 1000

def get_level_title(level: int) -> str:
    """Get motivational level title"""
    titles = {
        1: "Rookie",
        2: "Apprentice",
        3: "Rising Star",
        4: "Focused Warrior",
        5: "Champion",
        6: "Master",
        7: "Legend",
        8: "Elite",
        9: "Unstoppable",
        10: "Grandmaster"
    }
    if level > 10:
        return f"Grandmaster Level {level - 9}"
    return titles.get(level, "Rookie")

def check_and_award_badges(profile: dict, days_completed: int) -> List[str]:
    """Check and award badges based on achievements"""
    new_badges = []
    current_badges = profile.get('badges', [])
    
    # Streak-based badges
    streak = profile.get('current_streak', 0)
    
    if streak >= 7 and 'week_streak' not in current_badges:
        new_badges.append('week_streak')  # Consistency Rookie
    if streak >= 14 and 'two_week_streak' not in current_badges:
        new_badges.append('two_week_streak')  # Building Momentum
    if streak >= 30 and 'month_streak' not in current_badges:
        new_badges.append('month_streak')  # Unstoppable
    
    # XP-based badges
    xp = profile.get('total_xp', 0)
    if xp >= 500 and 'xp_500' not in current_badges:
        new_badges.append('xp_500')
    if xp >= 1000 and 'xp_1000' not in current_badges:
        new_badges.append('xp_1000')
    if xp >= 5000 and 'xp_5000' not in current_badges:
        new_badges.append('xp_5000')
    
    # Weekly completion badges
    if days_completed >= 5 and 'perfect_week' not in current_badges:
        new_badges.append('perfect_week')
    
    return new_badges

# Default weekday routine tasks
DEFAULT_WEEKDAY_ROUTINE = [
    {"time_label": "7:30 AM", "title": "Wake up", "icon": "sunny-outline", "order": 1},
    {"time_label": "Morning", "title": "Apply to 30-45 job applications (session 1)", "icon": "document-text-outline", "order": 2},
    {"time_label": "Morning", "title": "Cold shower + skincare routine", "icon": "water-outline", "order": 3},
    {"time_label": "Morning", "title": "Do mala", "icon": "infinite-outline", "order": 4},
    {"time_label": "Morning", "title": "Drink protein shake", "icon": "nutrition-outline", "order": 5},
    {"time_label": "Mid-morning", "title": "Study for 2 hours", "icon": "book-outline", "order": 6},
    {"time_label": "Afternoon", "title": "Apply to 30-45 job applications (session 2)", "icon": "document-text-outline", "order": 7},
    {"time_label": "Afternoon", "title": "Have Greek yogurt", "icon": "cafe-outline", "order": 8},
    {"time_label": "Afternoon", "title": "Study for 2-3 hours", "icon": "book-outline", "order": 9},
    {"time_label": "Evening", "title": "Apply to 30-45 job applications (session 3)", "icon": "document-text-outline", "order": 10},
    {"time_label": "Evening", "title": "Go to gym", "icon": "fitness-outline", "order": 11},
    {"time_label": "Post-gym", "title": "Hot shower + skincare routine", "icon": "water-outline", "order": 12},
    {"time_label": "Throughout day", "title": "Drink 2L water", "icon": "water-outline", "order": 13},
    {"time_label": "After dinner", "title": "TAKE TABLETS", "icon": "medkit-outline", "is_critical": True, "order": 14},
    {"time_label": "Evening", "title": "Final application session (30-45 apps)", "icon": "document-text-outline", "order": 15},
    {"time_label": "11:30 PM", "title": "Sleep", "icon": "moon-outline", "order": 16},
]

# Motivational quotes
MOTIVATIONAL_QUOTES = [
    {"text": "The only way to do great work is to love what you do.", "author": "Steve Jobs"},
    {"text": "It does not matter how slowly you go as long as you do not stop.", "author": "Confucius"},
    {"text": "Success is not final, failure is not fatal: it is the courage to continue that counts.", "author": "Winston Churchill"},
    {"text": "The future belongs to those who believe in the beauty of their dreams.", "author": "Eleanor Roosevelt"},
    {"text": "Believe you can and you're halfway there.", "author": "Theodore Roosevelt"},
    {"text": "The only limit to our realization of tomorrow is our doubts of today.", "author": "Franklin D. Roosevelt"},
    {"text": "Do what you can, with what you have, where you are.", "author": "Theodore Roosevelt"},
    {"text": "The journey of a thousand miles begins with one step.", "author": "Lao Tzu"},
    {"text": "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", "author": "Aristotle"},
    {"text": "The harder you work for something, the greater you'll feel when you achieve it.", "author": "Unknown"},
    {"text": "Don't watch the clock; do what it does. Keep going.", "author": "Sam Levenson"},
    {"text": "Success usually comes to those who are too busy to be looking for it.", "author": "Henry David Thoreau"},
    {"text": "The only person you are destined to become is the person you decide to be.", "author": "Ralph Waldo Emerson"},
    {"text": "Everything you've ever wanted is on the other side of fear.", "author": "George Addair"},
    {"text": "You are never too old to set another goal or to dream a new dream.", "author": "C.S. Lewis"},
]

# ============== API ROUTES ==============

@api_router.get("/")
async def root():
    return {"message": "DailyFire Task Scheduler API", "version": "1.0.0"}

# ============== USER PROFILE ROUTES ==============

@api_router.get("/profile")
async def get_profile():
    """Get or create user profile"""
    profile = await db.user_profile.find_one({})
    if not profile:
        # Create default profile
        new_profile = UserProfile()
        await db.user_profile.insert_one(new_profile.model_dump())
        profile = new_profile.model_dump()
    else:
        profile = clean_doc(profile)
    
    # Add level title
    profile['level_title'] = get_level_title(profile.get('level', 1))
    return profile

@api_router.put("/profile/update-streak")
async def update_streak(date_str: str):
    """Update user streak based on activity"""
    profile = await db.user_profile.find_one({})
    if not profile:
        profile = UserProfile().model_dump()
        await db.user_profile.insert_one(profile)
        profile = await db.user_profile.find_one({})
    
    profile = clean_doc(profile)
    
    last_active = profile.get('last_active_date')
    current_streak = profile.get('current_streak', 0)
    longest_streak = profile.get('longest_streak', 0)
    
    if last_active:
        last_date = datetime.strptime(last_active, "%Y-%m-%d").date()
        current_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        diff = (current_date - last_date).days
        
        if diff == 1:
            # Consecutive day - increase streak
            current_streak += 1
        elif diff > 1:
            # Missed days - reset streak
            current_streak = 1
        # diff == 0 means same day, streak stays same
    else:
        current_streak = 1
    
    if current_streak > longest_streak:
        longest_streak = current_streak
    
    await db.user_profile.update_one(
        {"id": profile['id']},
        {"$set": {
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "last_active_date": date_str
        }}
    )
    
    updated_profile = await db.user_profile.find_one({"id": profile['id']})
    updated_profile = clean_doc(updated_profile)
    updated_profile['level_title'] = get_level_title(updated_profile.get('level', 1))
    return updated_profile

@api_router.put("/profile/add-xp")
async def add_xp(xp_amount: int):
    """Add XP to user profile"""
    profile = await db.user_profile.find_one({})
    if not profile:
        profile = UserProfile().model_dump()
        await db.user_profile.insert_one(profile)
        profile = await db.user_profile.find_one({})
    
    profile = clean_doc(profile)
    
    new_xp = profile.get('total_xp', 0) + xp_amount
    new_level = calculate_level(new_xp)
    
    # Check for new badges
    new_badges = check_and_award_badges(profile, profile.get('weekly_completed_days', 0))
    current_badges = profile.get('badges', [])
    
    await db.user_profile.update_one(
        {"id": profile['id']},
        {"$set": {
            "total_xp": new_xp,
            "level": new_level,
            "badges": current_badges + new_badges
        }}
    )
    
    updated_profile = await db.user_profile.find_one({"id": profile['id']})
    updated_profile = clean_doc(updated_profile)
    updated_profile['level_title'] = get_level_title(updated_profile.get('level', 1))
    updated_profile['new_badges'] = new_badges
    return updated_profile

# ============== ROUTINE TASKS ROUTES ==============

@api_router.get("/routine-tasks")
async def get_routine_tasks():
    """Get all routine tasks"""
    tasks = await db.routine_tasks.find({}).sort("order", 1).to_list(100)
    
    # If no tasks exist, create default ones
    if not tasks:
        for task_data in DEFAULT_WEEKDAY_ROUTINE:
            task = RoutineTask(**task_data)
            await db.routine_tasks.insert_one(task.model_dump())
        tasks = await db.routine_tasks.find({}).sort("order", 1).to_list(100)
    
    return clean_docs(tasks)

@api_router.post("/routine-tasks")
async def create_routine_task(request: CreateRoutineTaskRequest):
    """Create a new routine task"""
    task = RoutineTask(**request.model_dump())
    await db.routine_tasks.insert_one(task.model_dump())
    return task

@api_router.put("/routine-tasks/{task_id}")
async def update_routine_task(task_id: str, request: UpdateRoutineTaskRequest):
    """Update a routine task"""
    update_data = {k: v for k, v in request.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.routine_tasks.update_one(
        {"id": task_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = await db.routine_tasks.find_one({"id": task_id})
    return clean_doc(task)

@api_router.delete("/routine-tasks/{task_id}")
async def delete_routine_task(task_id: str):
    """Delete a routine task"""
    result = await db.routine_tasks.delete_one({"id": task_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted successfully"}

# ============== DAILY PROGRESS ROUTES ==============

@api_router.get("/daily-progress/{date_str}")
async def get_daily_progress(date_str: str):
    """Get progress for a specific date"""
    progress = await db.daily_progress.find_one({"date": date_str})
    if not progress:
        day_type = get_day_type(date_str)
        progress = DailyProgress(date=date_str, day_type=day_type).model_dump()
    else:
        progress = clean_doc(progress)
    return progress

@api_router.post("/daily-progress/toggle-task")
async def toggle_routine_task(request: ToggleRoutineTaskRequest):
    """Toggle a routine task completion for a specific date"""
    progress = await db.daily_progress.find_one({"date": request.date})
    
    if not progress:
        day_type = get_day_type(request.date)
        progress = DailyProgress(date=request.date, day_type=day_type).model_dump()
        await db.daily_progress.insert_one(progress)
    else:
        progress = clean_doc(progress)
    
    completed_ids = progress.get('completed_routine_task_ids', [])
    xp_change = 0
    
    if request.task_id in completed_ids:
        # Uncomplete the task
        completed_ids.remove(request.task_id)
        xp_change = -10
    else:
        # Complete the task
        completed_ids.append(request.task_id)
        xp_change = 10
    
    # Check if all tasks are complete
    all_tasks = await db.routine_tasks.find({}).to_list(100)
    is_day_complete = len(completed_ids) == len(all_tasks) and len(all_tasks) > 0
    
    # Bonus XP for completing all tasks
    if is_day_complete and not progress.get('is_day_complete', False):
        xp_change += 50  # Bonus for full day completion
    
    total_xp = progress.get('total_xp_earned', 0) + xp_change
    if total_xp < 0:
        total_xp = 0
    
    await db.daily_progress.update_one(
        {"date": request.date},
        {"$set": {
            "completed_routine_task_ids": completed_ids,
            "total_xp_earned": total_xp,
            "is_day_complete": is_day_complete
        }}
    )
    
    # Update user profile XP
    if xp_change != 0:
        await add_xp(xp_change)
    
    # Update streak if completing first task of the day
    if len(completed_ids) == 1:
        await update_streak(request.date)
    
    updated_progress = await db.daily_progress.find_one({"date": request.date})
    return {
        "progress": clean_doc(updated_progress),
        "xp_change": xp_change,
        "is_day_complete": is_day_complete
    }

# ============== ONE-OFF TASKS ROUTES ==============

@api_router.get("/tasks")
async def get_one_off_tasks(include_completed: bool = False):
    """Get all one-off tasks"""
    query = {} if include_completed else {"is_completed": False}
    tasks = await db.one_off_tasks.find(query).to_list(100)
    
    # Clean the documents
    tasks = clean_docs(tasks)
    
    # Sort by priority (high first) and due date
    priority_order = {"high": 0, "medium": 1, "low": 2}
    
    def sort_key(task):
        priority_val = priority_order.get(task.get('priority', 'medium'), 1)
        due_date = task.get('due_date') or '9999-12-31'
        return (priority_val, due_date)
    
    tasks.sort(key=sort_key)
    return tasks

@api_router.post("/tasks")
async def create_one_off_task(request: CreateOneOffTaskRequest):
    """Create a new one-off task"""
    task = OneOffTask(**request.model_dump())
    await db.one_off_tasks.insert_one(task.model_dump())
    return task

@api_router.put("/tasks/{task_id}")
async def update_one_off_task(task_id: str, request: UpdateOneOffTaskRequest):
    """Update a one-off task"""
    update_data = {k: v for k, v in request.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.one_off_tasks.update_one(
        {"id": task_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = await db.one_off_tasks.find_one({"id": task_id})
    return clean_doc(task)

@api_router.post("/tasks/{task_id}/complete")
async def complete_one_off_task(task_id: str):
    """Mark a one-off task as completed"""
    task = await db.one_off_tasks.find_one({"id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    await db.one_off_tasks.update_one(
        {"id": task_id},
        {"$set": {
            "is_completed": True,
            "completed_at": datetime.utcnow()
        }}
    )
    
    # Award XP based on priority
    xp_by_priority = {"high": 25, "medium": 15, "low": 10}
    xp_amount = xp_by_priority.get(task.get('priority', 'medium'), 15)
    await add_xp(xp_amount)
    
    return {"message": "Task completed!", "xp_earned": xp_amount}

@api_router.delete("/tasks/{task_id}")
async def delete_one_off_task(task_id: str):
    """Delete a one-off task"""
    result = await db.one_off_tasks.delete_one({"id": task_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted successfully"}

# ============== QUOTES ROUTE ==============

@api_router.get("/quote-of-day")
async def get_quote_of_day():
    """Get a motivational quote based on the day"""
    today = date.today()
    # Use day of year to get consistent quote for the day
    day_of_year = today.timetuple().tm_yday
    quote_index = day_of_year % len(MOTIVATIONAL_QUOTES)
    return MOTIVATIONAL_QUOTES[quote_index]

# ============== BADGES INFO ROUTE ==============

@api_router.get("/badges-info")
async def get_badges_info():
    """Get information about all available badges"""
    badges = {
        "week_streak": {
            "id": "week_streak",
            "name": "Consistency Rookie",
            "description": "Complete a 7-day streak",
            "icon": "medal-outline",
            "color": "#CD7F32"  # Bronze
        },
        "two_week_streak": {
            "id": "two_week_streak",
            "name": "Building Momentum",
            "description": "Complete a 14-day streak",
            "icon": "medal-outline",
            "color": "#C0C0C0"  # Silver
        },
        "month_streak": {
            "id": "month_streak",
            "name": "Unstoppable",
            "description": "Complete a 30-day streak",
            "icon": "trophy-outline",
            "color": "#FFD700"  # Gold
        },
        "xp_500": {
            "id": "xp_500",
            "name": "XP Hunter",
            "description": "Earn 500 XP",
            "icon": "star-outline",
            "color": "#9370DB"  # Purple
        },
        "xp_1000": {
            "id": "xp_1000",
            "name": "XP Master",
            "description": "Earn 1000 XP",
            "icon": "star",
            "color": "#4169E1"  # Royal Blue
        },
        "xp_5000": {
            "id": "xp_5000",
            "name": "XP Legend",
            "description": "Earn 5000 XP",
            "icon": "star",
            "color": "#FFD700"  # Gold
        },
        "perfect_week": {
            "id": "perfect_week",
            "name": "Perfect Week",
            "description": "Complete all 5 weekdays",
            "icon": "checkmark-done-circle-outline",
            "color": "#32CD32"  # Lime Green
        }
    }
    return badges

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
