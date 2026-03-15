
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

engine = create_engine("sqlite:///automation.db")

SessionLocal = sessionmaker(bind=engine)
