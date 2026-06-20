"""
SQLAlchemy ORM models for ParkSight violations table.
Uses GeoAlchemy2 for PostGIS Geography column.
"""
from sqlalchemy import (
    Column, String, Float, Double, Integer, Boolean,
    DateTime, Text, ARRAY, Index
)
from sqlalchemy.dialects.postgresql import ARRAY as PG_ARRAY

from app.database import Base


class Violation(Base):
    __tablename__ = "violations"

    id = Column(String, primary_key=True)
    latitude = Column(Double, nullable=False)
    longitude = Column(Double, nullable=False)
    
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


class User(Base):
    __tablename__ = 'users'
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False) # ADMIN, ANALYST, VERIFIER, POLICE_OFFICER, TOW_OPERATOR, CITIZEN, VEHICLE_OWNER
    full_name = Column(String, nullable=False)
    police_station = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), nullable=True)

class OfficerSession(Base):
    __tablename__ = 'officer_sessions'
    id = Column(String, primary_key=True)
    officer_id = Column(String, index=True, nullable=False)
    clock_in = Column(DateTime(timezone=True), nullable=False)
    clock_out = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)

class OfficerLocation(Base):
    __tablename__ = 'officer_locations'
    id = Column(String, primary_key=True)
    officer_id = Column(String, index=True, nullable=False)
    latitude = Column(Double, nullable=False)
    longitude = Column(Double, nullable=False)
    
    timestamp = Column(DateTime(timezone=True), nullable=False)

class CitizenReport(Base):
    __tablename__ = 'citizen_reports'
    id = Column(String, primary_key=True)
    citizen_id = Column(String, index=True, nullable=False)
    photo_url = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    latitude = Column(Double, nullable=False)
    longitude = Column(Double, nullable=False)
    
    status = Column(String, default='pending') # pending, verified, rejected, assigned, resolved
    verifier_id = Column(String, nullable=True)
    assigned_officer_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

class TowAssignment(Base):
    __tablename__ = 'tow_assignments'
    id = Column(String, primary_key=True)
    violation_id = Column(String, index=True, nullable=False)
    operator_id = Column(String, index=True, nullable=False)
    status = Column(String, default='assigned') # assigned, in_progress, completed
    assigned_at = Column(DateTime(timezone=True), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

class Notification(Base):
    __tablename__ = 'notifications'
    id = Column(String, primary_key=True)
    recipient_id = Column(String, index=True, nullable=True)
    vehicle_number = Column(String, index=True, nullable=True)
    type = Column(String, nullable=False) # SMS, EMAIL, IN_APP
    message = Column(Text, nullable=False)
    status = Column(String, default='sent')
    sent_at = Column(DateTime(timezone=True), nullable=False)

class SpeedZone(Base):
    __tablename__ = 'speed_zones'
    id = Column(String, primary_key=True)
    zone_name = Column(String, nullable=False)
    latitude = Column(Double, nullable=False)
    longitude = Column(Double, nullable=False)
    
    radius_m = Column(Float, nullable=False)
    speed_limit_kmh = Column(Integer, nullable=False)

class VehicleRegistry(Base):
    __tablename__ = 'vehicle_registry'
    vehicle_number = Column(String, primary_key=True)
    owner_name = Column(String, nullable=False)
    owner_phone = Column(String, nullable=False)
    owner_email = Column(String, nullable=True)
