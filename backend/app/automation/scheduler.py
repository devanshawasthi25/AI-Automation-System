
from apscheduler.schedulers.background import BackgroundScheduler
from app.automation.workflows import daily_workflow

scheduler = BackgroundScheduler()

def start_scheduler():
    scheduler.add_job(daily_workflow,'interval',hours=24)
    scheduler.start()
