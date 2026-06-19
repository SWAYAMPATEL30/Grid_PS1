"""
SQLAlchemy ORM models for ParkSight violations table.
Uses GeoAlchemy2 for PostGIS Geography column.
"""
from sqlalchemy import (
    Column, String, Float, Double, Integer, Boolean,
    DateTime, Text, ARRAY, Index
)
from sqlalchemy.dialects.postgresql import ARRAY as PG_ARRAY
from geoalchemy2 import Geography
from app.database import Base


class Violation(Base):
    __tablename__ = "violations"

    id = Column(String, primary_key=True)
    latitude = Column(Double, nullable=False)
    longitude = Column(Double, nullable=False)
    geom = Column(Geography(geometry_type="POINT", srid=4326), nullable=True)
    location = Column(Text, nullable=True)
    vehicle_number = Column(String, nullable=True)
    vehicle_type = Column(String, nullable=True)
    violation_types = Column(PG_ARRAY(Text), nullable=True)
    offence_codes = Column(PG_ARRAY(Integer), nullable=True)
    created_datetime = Column(DateTime(timezone=True), nullable=True)
    closed_datetime = Column(DateTime(timezone=True), nullable=True)
    action_taken_timestamp = Column(DateTime(timezone=True), nullable=True)
    device_id = Column(String, nullable=True)
    created_by_id = Column(String, nullable=True)
    center_code = Column(Integer, nullable=True)
    police_station = Column(String, nullable=True)
    data_sent_to_scita = Column(Boolean, nullable=True)
    junction_name = Column(String, nullable=True)
    data_sent_to_scita_timestamp = Column(DateTime(timezone=True), nullable=True)
    updated_vehicle_number = Column(String, nullable=True)
    updated_vehicle_type = Column(String, nullable=True)
    validation_status = Column(String, nullable=True)
    validation_timestamp = Column(DateTime(timezone=True), nullable=True)
    # Derived columns
    hour_of_day = Column(Integer, nullable=True)
    day_of_week = Column(Integer, nullable=True)
    is_junction = Column(Boolean, nullable=True, default=False)
    resolution_lag_mins = Column(Float, nullable=True)
    severity_weight = Column(Float, nullable=True, default=1.0)

    __table_args__ = (
        Index("idx_violations_created", "created_datetime"),
        Index("idx_violations_station", "police_station"),
        Index("idx_violations_vehicle", "vehicle_number"),
    )
