
from sqlalchemy.orm import declarative_base
from sqlalchemy import Column,Integer,String

Base = declarative_base()

class Workflow(Base):
    __tablename__="workflows"

    id = Column(Integer,primary_key=True)
    name = Column(String)
    status = Column(String)
